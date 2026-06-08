-- Teacher class roster tables (run if db:push is not used)
CREATE TABLE IF NOT EXISTS "teacher_classes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "teacher_classes_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "teacher_classes_teacherId_name_key" ON "teacher_classes"("teacherId", "name");
CREATE INDEX IF NOT EXISTS "teacher_classes_teacherId_idx" ON "teacher_classes"("teacherId");

CREATE TABLE IF NOT EXISTS "class_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "class_members_classId_fkey" FOREIGN KEY ("classId") REFERENCES "teacher_classes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "class_members_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "class_members_classId_studentId_key" ON "class_members"("classId", "studentId");
CREATE INDEX IF NOT EXISTS "class_members_studentId_idx" ON "class_members"("studentId");
