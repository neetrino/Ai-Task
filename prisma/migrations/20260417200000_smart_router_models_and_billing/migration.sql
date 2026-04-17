-- CreateEnum
CREATE TYPE "ModelPreset" AS ENUM ('AUTO', 'ECONOMY', 'BALANCED', 'QUALITY', 'PINNED');

-- AlterTable: User token budget
ALTER TABLE "User"
    ADD COLUMN "tokensUsedMonth" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "tokensCapMonth"  INTEGER,
    ADD COLUMN "tokensResetAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable: Project model preset + token budget
ALTER TABLE "Project"
    ADD COLUMN "modelPreset"     "ModelPreset" NOT NULL DEFAULT 'AUTO',
    ADD COLUMN "pinnedModelId"   TEXT,
    ADD COLUMN "tokensCapMonth"  INTEGER,
    ADD COLUMN "tokensUsedMonth" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "tokensResetAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Data migration: existing projects that selected a specific model become PINNED.
UPDATE "Project"
SET "modelPreset"   = 'PINNED',
    "pinnedModelId" = "openaiChatModel"
WHERE "openaiChatModel" IS NOT NULL;

-- AlterTable: Message — track model + profile + cost per assistant turn
ALTER TABLE "Message"
    ADD COLUMN "modelId"        TEXT,
    ADD COLUMN "contextProfile" TEXT,
    ADD COLUMN "tokensUsed"     INTEGER;

-- CreateTable: append-only usage log
CREATE TABLE "TokenUsageEvent" (
    "id"               TEXT NOT NULL,
    "userId"           TEXT NOT NULL,
    "projectId"        TEXT NOT NULL,
    "modelId"          TEXT NOT NULL,
    "contextProfile"   TEXT NOT NULL,
    "promptTokens"     INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenUsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenUsageEvent_userId_createdAt_idx"    ON "TokenUsageEvent"("userId", "createdAt");
CREATE INDEX "TokenUsageEvent_projectId_createdAt_idx" ON "TokenUsageEvent"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "TokenUsageEvent"
    ADD CONSTRAINT "TokenUsageEvent_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TokenUsageEvent"
    ADD CONSTRAINT "TokenUsageEvent_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
