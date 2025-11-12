/*
  Warnings:

  - You are about to drop the column `locked` on the `Thread` table. All the data in the column will be lost.
  - You are about to drop the column `sticky` on the `Thread` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Thread_subjectId_sticky_lastPostAt_idx";

-- AlterTable
ALTER TABLE "Thread" DROP COLUMN "locked",
DROP COLUMN "sticky",
ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSticky" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenExpiry" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Thread_subjectId_isSticky_lastPostAt_idx" ON "Thread"("subjectId", "isSticky", "lastPostAt");

-- CreateIndex
CREATE INDEX "User_resetToken_idx" ON "User"("resetToken");

-- CreateIndex
CREATE INDEX "User_verificationToken_idx" ON "User"("verificationToken");
