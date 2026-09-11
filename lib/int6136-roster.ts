import { prisma, isDatabaseUrlConfigured } from "@/lib/prisma"

export const INT6136_CLASS_NAME = "INT6136E2627"
export const INT6136_PASSWORD = "123321"
export const INT6136_TEACHER = "Nicole"

export const INT6136_STUDENTS = [
  "LEUNGKAMYING",
  "ZHANGPINGAN",
  "ZHAOMING",
  "MENGLINGHONG",
  "BAOMINGHUI",
  "CHENYUPENG",
  "XUXINGHAN",
  "YANGBINGSHU",
  "HESHITING",
  "QIUANRAN",
  "DOUHAN",
  "YANHUI",
] as const

export function compactUsername(username: string) {
  return username.trim().replace(/\s+/g, "").toUpperCase()
}

export function matchInt6136Student(username: string, password: string) {
  if (password.trim() !== INT6136_PASSWORD) return null
  const compact = compactUsername(username)
  return INT6136_STUDENTS.find((item) => item === compact) ?? null
}

async function ensureTeacher() {
  const existing = await prisma.user.findFirst({
    where: { username: { equals: INT6136_TEACHER, mode: "insensitive" } },
  })
  if (existing) {
    if (existing.role !== "teacher") {
      return prisma.user.update({
        where: { id: existing.id },
        data: { role: "teacher", noAi: false },
      })
    }
    return existing
  }
  return prisma.user.create({
    data: {
      username: INT6136_TEACHER,
      password: "yinyin2948",
      role: "teacher",
      noAi: false,
    },
  })
}

export async function ensureInt6136Roster() {
  if (!isDatabaseUrlConfigured()) return

  const teacher = await ensureTeacher()
  const studentIds: string[] = []

  for (const username of INT6136_STUDENTS) {
    const user = await prisma.user.upsert({
      where: { username },
      update: { password: INT6136_PASSWORD, role: "student", noAi: false },
      create: { username, password: INT6136_PASSWORD, role: "student", noAi: false },
    })
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, grade: INT6136_CLASS_NAME },
      update: { grade: INT6136_CLASS_NAME },
    })
    studentIds.push(user.id)
  }

  const teacherClass = await prisma.teacherClass.upsert({
    where: { teacherId_name: { teacherId: teacher.id, name: INT6136_CLASS_NAME } },
    update: {},
    create: { teacherId: teacher.id, name: INT6136_CLASS_NAME },
  })

  await prisma.classMember.createMany({
    data: studentIds.map((studentId) => ({ classId: teacherClass.id, studentId })),
    skipDuplicates: true,
  })
}

export async function loginInt6136Account(username: string, password: string) {
  const matched = matchInt6136Student(username, password)
  if (!matched) return null

  try {
    await ensureInt6136Roster()
  } catch (error) {
    console.warn("[int6136] roster sync skipped:", error)
  }

  return {
    username: matched,
    role: "student" as const,
    noAi: false,
    isCopywriter: false,
  }
}
