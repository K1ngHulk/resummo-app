-- AlterTable
ALTER TABLE "Topic" ADD COLUMN "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill Topics to PUBLISHED if they have PUBLISHED articles or questions
UPDATE "Topic"
SET "status" = 'PUBLISHED'
WHERE id IN (
  SELECT DISTINCT "topicId" FROM "Article" WHERE "status" = 'PUBLISHED'
  UNION
  SELECT DISTINCT "topicId" FROM "Question" WHERE "status" = 'PUBLISHED'
);
