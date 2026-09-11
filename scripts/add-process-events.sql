-- Process-event research log (run if db:push is not used)
-- Isolated tables: missing these must not break login/writing.

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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "process_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "process_events_userId_clientTs_idx" ON "process_events"("userId", "clientTs");
CREATE INDEX IF NOT EXISTS "process_events_sessionId_idx" ON "process_events"("sessionId");
CREATE INDEX IF NOT EXISTS "process_events_workType_eventId_idx" ON "process_events"("workType", "eventId");
CREATE INDEX IF NOT EXISTS "process_events_category_idx" ON "process_events"("category");

CREATE TABLE IF NOT EXISTS "teacher_research_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "exportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_research_settings_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "teacher_research_settings_teacherId_key" ON "teacher_research_settings"("teacherId");
