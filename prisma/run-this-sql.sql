-- 在 Prisma 数据库的 SQL 控制台里执行（Prisma Data Platform → 你的库 → Query / Console）
-- 若某个表已存在，会报错 "already exists"，可跳过该段继续执行后面的

-- ========== 1. user_profiles 和 work_reviews ==========
CREATE TABLE IF NOT EXISTS "user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "avatarEmoji" TEXT,
    "birthday" TEXT,
    "email" TEXT,
    "grade" TEXT,
    "gender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "user_profiles_userId_key" ON "user_profiles"("userId");
ALTER TABLE "user_profiles" DROP CONSTRAINT IF EXISTS "user_profiles_userId_fkey";
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "work_reviews" (
    "id" TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    "workInteractionId" TEXT,
    "authorId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "workTitle" TEXT,
    "workContent" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "work_reviews_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "work_reviews_authorId_idx" ON "work_reviews"("authorId");
CREATE INDEX IF NOT EXISTS "work_reviews_reviewerId_idx" ON "work_reviews"("reviewerId");
ALTER TABLE "work_reviews" DROP CONSTRAINT IF EXISTS "work_reviews_authorId_fkey";
ALTER TABLE "work_reviews" ADD CONSTRAINT "work_reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "work_reviews" DROP CONSTRAINT IF EXISTS "work_reviews_reviewerId_fkey";
ALTER TABLE "work_reviews" ADD CONSTRAINT "work_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ========== 2. dramas 和 poetries ==========
CREATE TABLE IF NOT EXISTS "dramas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "summary" TEXT,
    "suggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dramas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "dramas_interactionId_key" ON "dramas"("interactionId");
CREATE INDEX IF NOT EXISTS "dramas_userId_idx" ON "dramas"("userId");
ALTER TABLE "dramas" DROP CONSTRAINT IF EXISTS "dramas_userId_fkey";
ALTER TABLE "dramas" ADD CONSTRAINT "dramas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dramas" DROP CONSTRAINT IF EXISTS "dramas_interactionId_fkey";
ALTER TABLE "dramas" ADD CONSTRAINT "dramas_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "poetries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionId" TEXT,
    "form" TEXT,
    "topic" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "lines" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "poetries_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "poetries_interactionId_key" ON "poetries"("interactionId");
CREATE INDEX IF NOT EXISTS "poetries_userId_idx" ON "poetries"("userId");
ALTER TABLE "poetries" DROP CONSTRAINT IF EXISTS "poetries_userId_fkey";
ALTER TABLE "poetries" ADD CONSTRAINT "poetries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "poetries" DROP CONSTRAINT IF EXISTS "poetries_interactionId_fkey";
ALTER TABLE "poetries" ADD CONSTRAINT "poetries_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
