#!/usr/bin/env tsx
/**
 * INT6136E2627 班级账号
 * 运行: npx tsx scripts/seed-int6136-class.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CLASS_NAME = "INT6136E2627"
const PASSWORD = "123321"
const TEACHER_CANDIDATES = ["Nicole", "lteduhk02", "jcpst1"]

const STUDENTS = [
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

async function resolveOwnerTeacher() {
  for (const username of TEACHER_CANDIDATES) {
    const teacher = await prisma.user.findFirst({
      where: { role: "teacher", username: { equals: username, mode: "insensitive" } },
    })
    if (teacher) return teacher
  }

  const existing = await prisma.user.findFirst({
    where: { role: "teacher" },
    orderBy: { createdAt: "asc" },
  })
  if (existing) return existing

  return prisma.user.create({
    data: {
      username: "Nicole",
      password: "yinyin2948",
      role: "teacher",
      noAi: false,
    },
  })
}

async function main() {
  const teacher = await resolveOwnerTeacher()
  if (!teacher) {
    throw new Error("No teacher account found. Create a teacher first, then re-run.")
  }

  console.log(`\n班级 ${CLASS_NAME} · 教师 ${teacher.username}\n`)

  const studentIds: string[] = []
  for (const username of STUDENTS) {
    const user = await prisma.user.upsert({
      where: { username },
      update: { password: PASSWORD, role: "student", noAi: false },
      create: { username, password: PASSWORD, role: "student", noAi: false },
    })
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, grade: CLASS_NAME },
      update: { grade: CLASS_NAME },
    })
    studentIds.push(user.id)
    console.log(`  ✅ ${username}`)
  }

  const teacherClass = await prisma.teacherClass.upsert({
    where: { teacherId_name: { teacherId: teacher.id, name: CLASS_NAME } },
    update: {},
    create: { teacherId: teacher.id, name: CLASS_NAME },
  })

  await prisma.classMember.createMany({
    data: studentIds.map((studentId) => ({ classId: teacherClass.id, studentId })),
    skipDuplicates: true,
  })

  const memberCount = await prisma.classMember.count({ where: { classId: teacherClass.id } })
  console.log(`\n完成：${STUDENTS.length} 名学生已写入班级 ${CLASS_NAME}（当前班级 ${memberCount} 人）`)
  console.log(`密码均为 ${PASSWORD}\n`)
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
