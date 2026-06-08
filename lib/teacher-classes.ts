import { prisma } from "@/lib/prisma"

export const UNASSIGNED_CLASS_ID = "__unassigned__"
export const UNASSIGNED_CLASS_NAME = "Unassigned"

export interface ClassUserSummary {
  id: string
  username: string
  role: string
  avatarUrl: string | null
  avatarEmoji: string | null
  grade: string | null
  totalWorks: number
  latestActiveAt: string | null
}

export interface TeacherClassGroup {
  id: string
  name: string
  users: ClassUserSummary[]
}

export interface StudentDashboardRow {
  id: string
  username: string
  role: string
  createdAt: Date
  profile: {
    avatarUrl: string | null
    avatarEmoji: string | null
    grade: string | null
  } | null
  _count: {
    stories: number
    reviews: number
    letters: number
    dramas: number
    poetries: number
  }
}

export async function resolveTeacher(username: string) {
  const normalized = username.trim()
  if (!normalized) return null

  let teacher = await prisma.user.findUnique({ where: { username: normalized } })
  if (teacher?.role === "teacher") return teacher

  // Case-insensitive match (e.g. Nicole vs nicole)
  teacher = await prisma.user.findFirst({
    where: {
      role: "teacher",
      username: { equals: normalized, mode: "insensitive" },
    },
  })
  if (teacher) return teacher

  // Legacy hardcoded teacher login — ensure DB row exists
  if (normalized === "Nicole") {
    return prisma.user.upsert({
      where: { username: "Nicole" },
      create: {
        username: "Nicole",
        password: "yinyin2948",
        role: "teacher",
        noAi: false,
      },
      update: { role: "teacher" },
    })
  }

  return null
}

export function toClassUserSummary(
  item: StudentDashboardRow,
  latestActivityMap: Map<string, Date>,
): ClassUserSummary {
  return {
    id: item.id,
    username: item.username,
    role: item.role,
    avatarUrl: item.profile?.avatarUrl ?? null,
    avatarEmoji: item.profile?.avatarEmoji ?? null,
    grade: item.profile?.grade ?? null,
    totalWorks:
      item._count.stories +
      item._count.reviews +
      item._count.letters +
      item._count.dramas +
      item._count.poetries,
    latestActiveAt: latestActivityMap.get(item.id)?.toISOString() ?? null,
  }
}

export async function buildTeacherClassGroups(
  teacherId: string,
  students: StudentDashboardRow[],
  latestActivityMap: Map<string, Date>,
): Promise<TeacherClassGroup[]> {
  const classes = await prisma.teacherClass.findMany({
    where: { teacherId },
    orderBy: { name: "asc" },
    include: {
      members: {
        include: {
          student: {
            select: {
              id: true,
              username: true,
            },
          },
        },
      },
    },
  })

  const studentById = new Map(students.map((s) => [s.id, s]))
  const assignedIds = new Set<string>()
  const groups: TeacherClassGroup[] = []

  for (const cls of classes) {
    const users: ClassUserSummary[] = []
    for (const member of cls.members) {
      const row = studentById.get(member.studentId)
      if (!row) continue
      assignedIds.add(row.id)
      users.push(toClassUserSummary(row, latestActivityMap))
    }
    users.sort((a, b) => a.username.localeCompare(b.username))
    groups.push({ id: cls.id, name: cls.name, users })
  }

  const unassigned = students
    .filter((s) => !assignedIds.has(s.id))
    .map((s) => toClassUserSummary(s, latestActivityMap))
    .sort((a, b) => a.username.localeCompare(b.username))

  if (unassigned.length > 0) {
    groups.push({
      id: UNASSIGNED_CLASS_ID,
      name: UNASSIGNED_CLASS_NAME,
      users: unassigned,
    })
  }

  return groups
}

/** Legacy fallback: group students by profile.grade when teacher roster tables are unavailable. */
export function buildGradeClassGroups(
  students: StudentDashboardRow[],
  latestActivityMap: Map<string, Date>,
): TeacherClassGroup[] {
  const buckets = new Map<string, ClassUserSummary[]>()
  const UNASSIGNED = "Unassigned"

  for (const item of students) {
    const className = item.profile?.grade?.trim() || UNASSIGNED
    const summary = toClassUserSummary(item, latestActivityMap)
    const list = buckets.get(className) ?? []
    list.push(summary)
    buckets.set(className, list)
  }

  const classNames = Array.from(buckets.keys()).sort((a, b) => {
    if (a === UNASSIGNED) return 1
    if (b === UNASSIGNED) return -1
    return a.localeCompare(b)
  })

  return classNames.map((name) => ({
    id: name === UNASSIGNED ? UNASSIGNED_CLASS_ID : name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    users: (buckets.get(name) ?? []).sort((a, b) => a.username.localeCompare(b.username)),
  }))
}

export function isVirtualClassId(classId: string): boolean {
  return classId === UNASSIGNED_CLASS_ID
}

export async function resolveClassGroupsForTeacher(
  teacherUsername: string | null,
  students: StudentDashboardRow[],
  latestActivityMap: Map<string, Date>,
): Promise<TeacherClassGroup[]> {
  if (teacherUsername) {
    const teacher = await resolveTeacher(teacherUsername)
    if (teacher) {
      try {
        return await buildTeacherClassGroups(teacher.id, students, latestActivityMap)
      } catch (error) {
        console.warn("[teacher-classes] TeacherClass query failed, falling back to grade groups:", error)
      }
    }
  }
  return buildGradeClassGroups(students, latestActivityMap)
}

/** Fresh classGroups after roster changes — same logic as dashboard GET. */
export async function fetchDashboardClassGroups(teacherUsername: string): Promise<TeacherClassGroup[]> {
  const [students, interactions] = await Promise.all([
    prisma.user.findMany({
      where: { role: "student" },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            avatarUrl: true,
            avatarEmoji: true,
            grade: true,
          },
        },
        _count: {
          select: {
            stories: true,
            reviews: true,
            letters: true,
            dramas: true,
            poetries: true,
          },
        },
      },
    }),
    prisma.interaction.findMany({
      select: { userId: true, timestamp: true },
      orderBy: { timestamp: "desc" },
    }),
  ])

  const latestActivityMap = new Map<string, Date>()
  for (const interaction of interactions) {
    const previous = latestActivityMap.get(interaction.userId)
    if (!previous || interaction.timestamp > previous) {
      latestActivityMap.set(interaction.userId, interaction.timestamp)
    }
  }

  return resolveClassGroupsForTeacher(teacherUsername, students, latestActivityMap)
}
