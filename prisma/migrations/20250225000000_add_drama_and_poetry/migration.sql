-- CreateTable
CREATE TABLE "dramas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionId" TEXT,
    "title" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "summary" TEXT,
    "suggestions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dramas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "poetries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionId" TEXT,
    "form" TEXT,
    "topic" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "lines" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "poetries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dramas_interactionId_key" ON "dramas"("interactionId");

-- CreateIndex
CREATE INDEX "dramas_userId_idx" ON "dramas"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "poetries_interactionId_key" ON "poetries"("interactionId");

-- CreateIndex
CREATE INDEX "poetries_userId_idx" ON "poetries"("userId");

-- AddForeignKey
ALTER TABLE "dramas" ADD CONSTRAINT "dramas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dramas" ADD CONSTRAINT "dramas_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poetries" ADD CONSTRAINT "poetries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "poetries" ADD CONSTRAINT "poetries_interactionId_fkey" FOREIGN KEY ("interactionId") REFERENCES "interactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
