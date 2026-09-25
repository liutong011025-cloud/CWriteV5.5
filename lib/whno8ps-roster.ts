import { prisma, isDatabaseUrlConfigured } from "@/lib/prisma"

export const WHNO8PS_CLASS_NAME = "WHNO8PS"
export const WHNO8PS_PASSWORD = "123321"
export const WHNO8PS_TEACHER = "Nicole"

export const WHNO8PS_STUDENTS = Array.from({ length: 30 }, (_, index) => {
  const n = String(index + 1).padStart(2, "0")
  return `w${n}`
})

export function matchWhno8psStudent(username: string, password: string) {
  if (password.trim() !== WHNO8PS_PASSWORD) return null
  const name = username.trim().toLowerCase()
  return WHNO8PS_STUDENTS.find((item) => item === name) ?? null
}

async function ensureTeacher() {
  const existing = await prisma.user.findFirst({
    where: { username: { equals: WHNO8PS_TEACHER, mode: "insensitive" } },
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
      username: WHNO8PS_TEACHER,
      password: "yinyin2948",
      role: "teacher",
      noAi: false,
    },
  })
}

export async function ensureWhno8psRoster() {
  if (!isDatabaseUrlConfigured()) return

  const teacher = await ensureTeacher()
  const studentIds: string[] = []

  for (const username of WHNO8PS_STUDENTS) {
    const user = await prisma.user.upsert({
      where: { username },
      update: { password: WHNO8PS_PASSWORD, role: "student", noAi: false },
      create: { username, password: WHNO8PS_PASSWORD, role: "student", noAi: false },
    })
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, grade: WHNO8PS_CLASS_NAME },
      update: { grade: WHNO8PS_CLASS_NAME },
    })
    studentIds.push(user.id)
  }

  const teacherClass = await prisma.teacherClass.upsert({
    where: { teacherId_name: { teacherId: teacher.id, name: WHNO8PS_CLASS_NAME } },
    update: {},
    create: { teacherId: teacher.id, name: WHNO8PS_CLASS_NAME },
  })

  await prisma.classMember.createMany({
    data: studentIds.map((studentId) => ({ classId: teacherClass.id, studentId })),
    skipDuplicates: true,
  })
}

export async function loginWhno8psAccount(username: string, password: string) {
  const matched = matchWhno8psStudent(username, password)
  if (!matched) return null

  try {
    await ensureWhno8psRoster()
  } catch (error) {
    console.warn("[whno8ps] roster sync skipped:", error)
  }

  return {
    username: matched,
    role: "student" as const,
    noAi: false,
    isCopywriter: false,
  }
}
