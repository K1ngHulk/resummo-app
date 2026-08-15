import fs from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../server/lib/prisma.js'
import {
  buildNotionExportPreview,
  importNotionExportBuffer,
  validateNotionExportPersistence,
} from '../server/lib/notionExportImportService.js'
import { getEditorialContentCounts, getLocalDatabaseTarget } from '../server/lib/localEditorialReset.js'

function fail(message) {
  console.error(`[notion-export-local] ERROR: ${message}`)
  process.exitCode = 1
}

function parseArguments(argv) {
  const [mode, archivePath, ...rest] = argv
  if (!['--preview', '--import'].includes(mode) || !archivePath) {
    throw new Error('Uso: node scripts/notion-export-local-cli.mjs --preview|--import <zip> [--replace-editorial]')
  }
  return {
    mode,
    archivePath: path.resolve(archivePath),
    replaceEditorial: rest.includes('--replace-editorial'),
  }
}

function walkValue(value, visit) {
  if (Array.isArray(value)) {
    for (const item of value) walkValue(item, visit)
    return
  }
  if (!value || typeof value !== 'object') return
  visit(value)
  for (const child of Object.values(value)) walkValue(child, visit)
}

async function auditStoredImport() {
  const [topicStatusGroups, articleStatusGroups, articles, duplicateSlugs, duplicateTopicSlugs] = await Promise.all([
    prisma.topic.groupBy({
      by: ['status'],
      where: { sourceType: 'NOTION_EXPORT' },
      _count: { _all: true },
    }),
    prisma.article.groupBy({
      by: ['status'],
      where: { sourceType: 'NOTION_EXPORT' },
      _count: { _all: true },
    }),
    prisma.article.findMany({
      where: { sourceType: 'NOTION_EXPORT' },
      select: {
        id: true,
        slug: true,
        sourceId: true,
        sourcePath: true,
        plainText: true,
        contentJson: true,
        topicId: true,
      },
    }),
    prisma.$queryRaw`SELECT "slug", COUNT(*)::int AS count FROM "Article" GROUP BY "slug" HAVING COUNT(*) > 1`,
    prisma.$queryRaw`SELECT "slug", COUNT(*)::int AS count FROM "Topic" GROUP BY "slug" HAVING COUNT(*) > 1`,
  ])

  let internalLinks = 0
  let unresolvedInternalLinks = 0
  let markdownFileLinks = 0
  let externalLinks = 0
  let imageReferences = 0

  for (const article of articles) {
    walkValue(article.contentJson, (node) => {
      if (node.type === 'link') {
        if (node.internal) internalLinks += 1
        else if (node.external) externalLinks += 1
        if (node.broken) unresolvedInternalLinks += 1
        if (/\.md(?:$|[?#])/i.test(String(node.href || ''))) markdownFileLinks += 1
      }
      if ((node.type === 'image' || node.type === 'inline_image') && String(node.src || '').startsWith('/content-assets/')) {
        imageReferences += 1
      }
    })
  }

  const persistence = await validateNotionExportPersistence(prisma)
  return {
    ...persistence,
    topicStatusGroups,
    articleStatusGroups,
    nullSourceIds: articles.filter((article) => !article.sourceId).length,
    nullSourcePaths: articles.filter((article) => !article.sourcePath).length,
    emptyPlainTextByRead: articles.filter((article) => !String(article.plainText || '').trim()).length,
    invalidContentJsonByRead: articles.filter((article) => !Array.isArray(article.contentJson?.blocks) || article.contentJson.blocks.length === 0).length,
    duplicateArticleSlugs: duplicateSlugs.length,
    duplicateTopicSlugs: duplicateTopicSlugs.length,
    internalLinks,
    unresolvedInternalLinks,
    markdownFileLinks,
    externalLinks,
    imageReferences,
  }
}

async function main() {
  const args = parseArguments(process.argv.slice(2))
  const target = getLocalDatabaseTarget()
  const archive = await fs.readFile(args.archivePath)
  const before = await getEditorialContentCounts(prisma)
  const previewResult = await buildNotionExportPreview(archive, {
    archiveName: path.basename(args.archivePath),
    client: prisma,
  })

  const previewReport = {
    database: {
      host: target.hostname,
      port: target.port,
      database: target.database,
    },
    archive: {
      path: args.archivePath,
      sizeBytes: archive.length,
      wrapperDepth: previewResult.archive.wrapperDepth,
      entries: previewResult.archive.entries.length,
      ignoredFiles: previewResult.archive.ignoredPaths.length,
      uncompressedBytes: previewResult.archive.archiveStats.uncompressedBytes,
    },
    preview: previewResult.preview,
    before,
  }

  console.log('[notion-export-local] PREVIEW')
  console.log(JSON.stringify(previewReport, null, 2))

  if (previewResult.preview.status !== 'VALID') {
    throw new Error('El preview real es INVALID; no se ejecutará la importación.')
  }

  if (args.mode === '--preview') {
    console.log('[notion-export-local] RESULT: PREVIEW PASS')
    return
  }

  if (!args.replaceEditorial) {
    throw new Error('El import real requiere --replace-editorial para hacer explícita la sustitución del dataset local.')
  }

  const imported = await importNotionExportBuffer(archive, {
    archiveName: path.basename(args.archivePath),
    client: prisma,
    replaceEditorial: true,
  })
  const after = await getEditorialContentCounts(prisma)
  const audit = await auditStoredImport()

  const result = {
    imported,
    after,
    audit,
    usersPreserved: before.users === after.users,
  }

  console.log('[notion-export-local] IMPORT')
  console.log(JSON.stringify(result, null, 2))
  console.log('[notion-export-local] RESULT: IMPORT PASS')
}

main()
  .catch((error) => {
    fail(error?.message || String(error))
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
