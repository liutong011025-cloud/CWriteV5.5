#!/usr/bin/env tsx
/**
 * WHNO8PS 班级账号 w01–w30
 * 运行: npx tsx scripts/seed-whno8ps-class.ts
 */
import { WHNO8PS_CLASS_NAME, WHNO8PS_PASSWORD, WHNO8PS_STUDENTS, ensureWhno8psRoster } from "../lib/whno8ps-roster"
import { prisma } from "../lib/prisma"

async function main() {
  await ensureWhno8psRoster()
  console.log(`\n班级 ${WHNO8PS_CLASS_NAME} 已就绪`)
  for (const username of WHNO8PS_STUDENTS) {
    console.log(`  ${username}`)
  }
  console.log(`密码均为 ${WHNO8PS_PASSWORD}\n`)
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
