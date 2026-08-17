import { prisma, isDatabaseUrlConfigured } from "@/lib/prisma"

export const LTE_TRIAL_CLASS_NAME = "EdUHK"
const LEGACY_CLASS_NAME = "Lumina Lab"
const FALLBACK_PASSWORD = "123321"

export const LTE_TRIAL_STUDENTS = ["lteduhk01", "ktotest1", "ktotest2", "ktotest3", "ktotest4"] as const
export const LTE_TRIAL_TEACHERS = ["lteduhk02", "ktotest5", "ktotest6"] as const

const KNOWN_PASSWORD_LOGINS = [
  { username: "lteduhk01", password: FALLBACK_PASSWORD, role: "student" as const },
  { username: "lteduhk02", password: FALLBACK_PASSWORD, role: "teacher" as const },
]

function normalizeUsername(username: string) {
  return username.trim()
}

export function isLteTrialUsername(username: string) {
  const name = normalizeUsername(username).toLowerCase()
  return (
    LTE_TRIAL_STUDENTS.some((item) => item === name) ||
    LTE_TRIAL_TEACHERS.some((item) => item === name)
  )
}

function isKnownPasswordLogin(username: string, password: string) {
  const name = normalizeUsername(username)
  return (
    KNOWN_PASSWORD_LOGINS.find((item) => item.username === name && item.password === password) ??
    null
  )
}

async function findUserInsensitive(username: string) {
  return prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  })
}

async function ensureUser(
  username: string,
  role: "student" | "teacher",
  createPassword: string,
) {
  const existing = await findUserInsensitive(username)
  if (existing) {
    if (existing.role !== role) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { role, noAi: false },
      })
    }
    return existing
  }
  return prisma.user.create({
    data: { username, password: createPassword, role, noAi: false },
  })
}

async function setGrade(userId: string, grade: string) {
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId, grade },
    update: { grade },
  })
}

async function resolveTeacherClass(teacherId: string) {
  const existingEdUhk = await prisma.teacherClass.findUnique({
    where: { teacherId_name: { teacherId, name: LTE_TRIAL_CLASS_NAME } },
  })
  if (existingEdUhk) return existingEdUhk

  const legacy = await prisma.teacherClass.findUnique({
    where: { teacherId_name: { teacherId, name: LEGACY_CLASS_NAME } },
  })
  if (legacy) {
    return prisma.teacherClass.update({
      where: { id: legacy.id },
      data: { name: LTE_TRIAL_CLASS_NAME },
    })
  }

  return prisma.teacherClass.create({
    data: { teacherId, name: LTE_TRIAL_CLASS_NAME },
  })
}

/**
 * EdUHK 试用班：教师 ktotest5 / ktotest6 / lteduhk02 都能看到
 * 学生 ktotest1–4 与 lteduhk01。
 */
export async function ensureLteTrialRoster() {
  if (!isDatabaseUrlConfigured()) return

  const teachers = []
  for (const username of LTE_TRIAL_TEACHERS) {
    const teacher = await ensureUser(username, "teacher", FALLBACK_PASSWORD)
    await setGrade(teacher.id, LTE_TRIAL_CLASS_NAME)
    teachers.push(teacher)
  }

  const students = []
  for (const username of LTE_TRIAL_STUDENTS) {
    const student = await ensureUser(username, "student", FALLBACK_PASSWORD)
    await setGrade(student.id, LTE_TRIAL_CLASS_NAME)
    students.push(student)
  }

  for (const teacher of teachers) {
    const teacherClass = await resolveTeacherClass(teacher.id)
    await prisma.classMember.createMany({
      data: students.map((student) => ({
        classId: teacherClass.id,
        studentId: student.id,
      })),
      skipDuplicates: true,
    })
  }
}

export async function loginLteTrialAccount(username: string, password: string) {
  const known = isKnownPasswordLogin(username, password)
  if (!known) return null

  try {
    await ensureLteTrialRoster()
  } catch (error) {
    console.warn("[lte-trial] roster sync skipped:", error)
  }

  return {
    username: known.username,
    role: known.role,
    noAi: false,
    isCopywriter: false,
  }
}

export async function syncLteTrialRosterAfterLogin(username: string) {
  if (!isLteTrialUsername(username)) return
  try {
    await ensureLteTrialRoster()
  } catch (error) {
    console.warn("[lte-trial] roster sync skipped:", error)
  }
}
