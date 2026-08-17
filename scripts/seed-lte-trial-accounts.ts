#!/usr/bin/env tsx
/**
 * EdUHK 试用班
 * 教师：ktotest5、lteduhk02
 * 学生：ktotest1–4、lteduhk01
 * 运行: npx tsx scripts/seed-lte-trial-accounts.ts
 */
import { ensureLteTrialRoster, LTE_TRIAL_CLASS_NAME } from "../lib/lte-trial-roster"

async function main() {
  await ensureLteTrialRoster()
  console.log(`\n试用班 ${LTE_TRIAL_CLASS_NAME} 已就绪`)
  console.log("  教师 ktotest5 / lteduhk02")
  console.log("  学生 ktotest1–4 / lteduhk01")
  console.log("  两位教师登录后台都能看到上述学生的数据\n")
}

main()
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })
  .finally(async () => {
    const { prisma } = await import("../lib/prisma")
    await prisma.$disconnect()
  })
