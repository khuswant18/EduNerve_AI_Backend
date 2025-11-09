/*
  Warnings:

  - You are about to drop the column `category` on the `QuizResult` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `QuizResult` table. All the data in the column will be lost.
  - You are about to drop the column `subtopics` on the `QuizResult` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Quiz` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quiz" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "QuizResult" DROP COLUMN "category",
DROP COLUMN "level",
DROP COLUMN "subtopics";
