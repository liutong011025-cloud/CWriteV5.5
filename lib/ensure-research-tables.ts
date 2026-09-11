import { prisma } from "@/lib/prisma"

const tableReady: Record<string, Promise<void> | undefined> = {}

function once(key: string, run: () => Promise<void>): Promise<void> {
  const existing = tableReady[key]
  if (existing) return existing
  const pending = run().catch((error) => {
    delete tableReady[key]
    throw error
  })
  tableReady[key] = pending
  return pending
}

async function createProcessEventsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "process_events" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "sessionId" TEXT NOT NULL,
      "workType" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "functionalCode" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "stage" TEXT,
      "phase" TEXT,
      "rawType" TEXT,
      "trigger" TEXT,
      "payload" JSONB,
      "durationMs" INTEGER,
      "clientTs" TIMESTAMP(3) NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "process_events_userId_clientTs_idx" ON "process_events"("userId", "clientTs")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "process_events_sessionId_idx" ON "process_events"("sessionId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "process_events_workType_eventId_idx" ON "process_events"("workType", "eventId")`,
  )
  await prisma.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "process_events_category_idx" ON "process_events"("category")`,
  )
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "process_events"
      ADD CONSTRAINT "process_events_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)
  } catch {
    // Constraint may already exist, or the host may not allow ALTER.
  }
}

async function createTeacherResearchSettingsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "teacher_research_settings" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "teacherId" TEXT NOT NULL,
      "exportEnabled" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "teacher_research_settings_teacherId_key"
    ON "teacher_research_settings"("teacherId")
  `)
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "teacher_research_settings"
      ADD CONSTRAINT "teacher_research_settings_teacherId_fkey"
      FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `)
  } catch {
    // Constraint may already exist, or the host may not allow ALTER.
  }
}

export async function ensureProcessEventsTable() {
  await once("process_events", createProcessEventsTable)
}

export async function ensureTeacherResearchSettingsTable() {
  await once("teacher_research_settings", createTeacherResearchSettingsTable)
}
