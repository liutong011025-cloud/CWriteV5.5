/**
 * 部署时用：若生产库从未做过 baseline，先 resolve 0_init_baseline，再 migrate deploy。
 * 解决 P3005 "The database schema is not empty"。
 */
const { execSync } = require("child_process");
const path = require("path");

async function main() {
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRawUnsafe(
      "SELECT 1 FROM _prisma_migrations WHERE migration_name = $1 LIMIT 1",
      "0_init_baseline"
    );
    if (result && result.length > 0) {
      console.log("Baseline already applied, running migrate deploy...");
    } else {
      console.log("Baseline not found, running: prisma migrate resolve --applied 0_init_baseline");
      execSync("npx prisma migrate resolve --applied 0_init_baseline", {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });
    }
  } catch (e) {
    if (e.code === "P2021" || (e.message && e.message.includes("does not exist"))) {
      console.log("_prisma_migrations missing or baseline not found, running resolve...");
      execSync("npx prisma migrate resolve --applied 0_init_baseline", {
        stdio: "inherit",
        cwd: path.join(__dirname, ".."),
      });
    } else {
      throw e;
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log("Running: prisma migrate deploy");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
