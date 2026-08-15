-- Align Prisma migrations with the current schema's flashcard persistence.
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FLASHCARD');

ALTER TABLE "Question"
  ADD COLUMN "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE';

CREATE TABLE "UserFlashcardProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "nextReviewDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consecutiveCorrect" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserFlashcardProgress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserFlashcardProgress_userId_questionId_key"
  ON "UserFlashcardProgress"("userId", "questionId");

ALTER TABLE "UserFlashcardProgress"
  ADD CONSTRAINT "UserFlashcardProgress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserFlashcardProgress"
  ADD CONSTRAINT "UserFlashcardProgress_questionId_fkey"
  FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
