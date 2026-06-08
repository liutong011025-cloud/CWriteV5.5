#!/usr/bin/env tsx
/**
 * JCPS 班级与教师账号初始化
 * 运行: npx tsx scripts/seed-jcps-class.ts
 *
 * - 将 jcps1–jcps10 归入班级 JCPS（写入 user_profiles.grade）
 * - 创建教师账号 jcpst1–jcpst3（users.role = teacher）
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const JCPS_CLASS = "JCPS"
const JCPS_STUDENTS = Array.from({ length: 10 }, (_, i) => `jcps${i + 1}`)

const JCPS_TEACHERS = [
  { username: "jcpst1", email: "jcpst1@jcps.test", name: "JCPS Teacher 1" },
  { username: "jcpst2", email: "jcpst2@jcps.test", name: "JCPS Teacher 2" },
  { username: "jcpst3", email: "jcpst3@jcps.test", name: "JCPS Teacher 3" },
] as const

const DEFAULT_TEACHER_PASSWORD = "jcps123"

async function assignStudentToClass(username: string, className: string) {
  const user = await prisma.user.findUnique({ where: { username }, include: { profile: true } })
  if (!user) {
    console.warn(`  ⚠ 学生 ${username} 不存在，已跳过`)
    return false
  }

  if (user.profile) {
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { grade: className },
    })
  } else {
    await prisma.userProfile.create({
      data: { userId: user.id, grade: className },
    })
  }

  console.log(`  ✅ ${username} → 班级 ${className}`)
  return true
}

async function createTeacher(
  username: string,
  email: string,
  name: string,
  password: string,
  assignedClass: string,
) {
  const user = await prisma.user.upsert({
    where: { username },
    update: {
      password,
      role: "teacher",
    },
    create: {
      username,
      password,
      role: "teacher",
      noAi: false,
    },
  })

  if (user.profile) {
    await prisma.userProfile.update({
      where: { userId: user.id },
      data: { email, grade: assignedClass },
    })
  } else {
    await prisma.userProfile.create({
      data: { userId: user.id, email, grade: assignedClass },
    })
  }

  console.log(`  ✅ 教师 ${username} (${email}) — 密码: ${password}`)
}

async function main() {
  console.log(`\n📚 设置班级 ${JCPS_CLASS} 学生...\n`)
  let assigned = 0
  for (const username of JCPS_STUDENTS) {
    if (await assignStudentToClass(username, JCPS_CLASS)) assigned++
  }
  console.log(`\n   共 ${assigned}/${JCPS_STUDENTS.length} 名学生已归入 ${JCPS_CLASS}\n`)

  console.log(`👩‍🏫 创建教师账号...\n`)
  for (const t of JCPS_TEACHERS) {
    await createTeacher(t.username, t.email, t.name, DEFAULT_TEACHER_PASSWORD, JCPS_CLASS)
  }

  console.log("\n完成。教师可用 jcpst1 / jcpst2 / jcpst3 登录，默认密码 jcps123\n")
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
