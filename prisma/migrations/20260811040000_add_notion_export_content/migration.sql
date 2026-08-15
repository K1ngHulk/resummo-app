-- Additive persistence for structured Notion export imports.
ALTER TABLE "Topic"
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourcePath" TEXT,
  ADD COLUMN "sourceSnapshotHash" TEXT;

ALTER TABLE "Article"
  ADD COLUMN "contentJson" JSONB,
  ADD COLUMN "plainText" TEXT,
  ADD COLUMN "sourceType" TEXT,
  ADD COLUMN "sourceId" TEXT,
  ADD COLUMN "sourcePath" TEXT,
  ADD COLUMN "sourceUrl" TEXT,
  ADD COLUMN "sourceImportedAt" TIMESTAMP(3),
  ADD COLUMN "sourceLastEditedAt" TIMESTAMP(3),
  ADD COLUMN "sourceSnapshotHash" TEXT,
  ADD COLUMN "editorialApprovedAt" TIMESTAMP(3),
  ADD COLUMN "editorialApprovedByUserId" TEXT,
  ADD COLUMN "editorialApprovedSnapshotHash" TEXT;

CREATE UNIQUE INDEX "Topic_sourceType_sourceId_key" ON "Topic"("sourceType", "sourceId");
CREATE UNIQUE INDEX "Article_sourceType_sourceId_key" ON "Article"("sourceType", "sourceId");
