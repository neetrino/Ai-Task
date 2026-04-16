-- AlterTable
ALTER TABLE "Project" ADD COLUMN "mainLastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Phase" ADD COLUMN "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Phase_projectId_lastUsedAt_idx" ON "Phase"("projectId", "lastUsedAt");
