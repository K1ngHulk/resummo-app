import { Prisma } from '@prisma/client'

function idsSql(articleIds) {
  return Prisma.join(articleIds.map((articleId) => Prisma.sql`${articleId}`))
}

export async function approveImportedArticleSnapshots(client, articleIds, approvedByUserId) {
  if (!articleIds.length) return 0
  return client.$executeRaw(Prisma.sql`
    UPDATE "Article"
    SET
      "editorialApprovedAt" = NOW(),
      "editorialApprovedByUserId" = ${approvedByUserId},
      "editorialApprovedSnapshotHash" = "sourceSnapshotHash"
    WHERE "id" IN (${idsSql(articleIds)})
      AND "sourceType" = 'NOTION_EXPORT'
      AND "sourceSnapshotHash" IS NOT NULL
      AND "contentJson" IS NOT NULL
  `)
}

export async function publishArticlesWithCurrentApproval(client, articleIds) {
  if (!articleIds.length) return 0
  return client.$executeRaw(Prisma.sql`
    UPDATE "Article"
    SET "status" = 'PUBLISHED'
    WHERE "id" IN (${idsSql(articleIds)})
      AND (
        "sourceType" <> 'NOTION_EXPORT'
        OR (
          "editorialApprovedAt" IS NOT NULL
          AND "editorialApprovedByUserId" IS NOT NULL
          AND "sourceSnapshotHash" IS NOT NULL
          AND "editorialApprovedSnapshotHash" = "sourceSnapshotHash"
        )
      )
  `)
}
