/*
  Warnings:

  - The primary key for the `QuizResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `Quiz` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `level` to the `QuizResult` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."QuizResult" DROP CONSTRAINT "QuizResult_userId_fkey";

-- AlterTable
ALTER TABLE "QuizResult" DROP CONSTRAINT "QuizResult_pkey",
ADD COLUMN     "answers" JSONB,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "level" TEXT NOT NULL,
ADD COLUMN     "quizSetId" TEXT,
ADD COLUMN     "subtopics" TEXT[],
ADD COLUMN     "timeTaken" INTEGER DEFAULT 0,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "QuizResult_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "QuizResult_id_seq";

-- DropTable
DROP TABLE "public"."Quiz";

-- CreateTable
CREATE TABLE "QuizSet" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "numberOfQuestions" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "QuizSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quizSetId" TEXT NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizSet_userId_idx" ON "QuizSet"("userId");

-- CreateIndex
CREATE INDEX "QuizSet_createdAt_idx" ON "QuizSet"("createdAt");

-- CreateIndex
CREATE INDEX "QuizQuestion_quizSetId_idx" ON "QuizQuestion"("quizSetId");

-- CreateIndex
CREATE INDEX "QuizResult_userId_idx" ON "QuizResult"("userId");

-- CreateIndex
CREATE INDEX "QuizResult_quizSetId_idx" ON "QuizResult"("quizSetId");

-- AddForeignKey
ALTER TABLE "QuizSet" ADD CONSTRAINT "QuizSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_quizSetId_fkey" FOREIGN KEY ("quizSetId") REFERENCES "QuizSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuizResult" ADD CONSTRAINT "QuizResult_quizSetId_fkey" FOREIGN KEY ("quizSetId") REFERENCES "QuizSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
