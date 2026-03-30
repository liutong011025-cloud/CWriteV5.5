/**
 * 读取 prisma/run-this-sql.sql 并执行（建 user_profiles, work_reviews, dramas, poetries）
 * 用法：先设置 DATABASE_URL，再执行
 *   npm run db:run-sql
 * 或
 *   npx tsx scripts/run-migration-sql.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const sqlPath = path.join(__dirname, "..", "prisma", "run-this-sql.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  // 去掉注释行，按分号拆成多条语句
  const statements = sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ";";
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log(`[OK] ${i + 1}/${statements.length}`);
    } catch (e: any) {
      if (e?.message?.includes("already exists")) {
        console.log(`[SKIP] ${i + 1}/${statements.length} (already exists)`);
      } else {
        console.error(`[FAIL] ${i + 1}/${statements.length}:`, e?.message || e);
        throw e;
      }
    }
  }
  console.log("Done. Tables created.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
