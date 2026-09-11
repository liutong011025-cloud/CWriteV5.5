#!/usr/bin/env tsx
/**
 * INT6136E2627 班级账号
 * 运行: npx tsx scripts/seed-int6136-class.ts
 */
import { INT6136_CLASS_NAME, INT6136_PASSWORD, INT6136_STUDENTS, ensureInt6136Roster } from "../lib/int6136-roster"
import { prisma } from "../lib/prisma"

async function main() {
  await ensureInt6136Roster()
  console.log(`\n班级 ${INT6136_CLASS_NAME} 已就绪`)
  for (const username of INT6136_STUDENTS) {
    console.log(`  ✅ ${username}`)
  }
  console.log(`密码均为 ${INT6136_PASSWORD}\n`)
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
