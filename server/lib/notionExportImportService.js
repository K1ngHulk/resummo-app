import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { parseNotionExportZip } from './notionExportZip.js'
import { buildNotionExportModel, toPublicNotionExportPreview } from './notionExportModel.js'
import { createLocalDatabaseBackup, deleteEditorialContent, getEditorialContentCounts, getLocalDatabaseTarget } from './localEditorialReset.js'

const SOURCE_TYPE = 'NOTION_EXPORT'

function validationError(message, code = 'INVALID_NOTION_EXPORT') {
  const error = new Error(message)
  error.statusCode = 400
  error.code = code
  return error
}

function assetDirectory() {
  return process.env.RESUMMO_CONTENT_ASSET_DIR || path.resolve(process.cwd(), '.runtime', 'content-assets')
}

async function existingImportState(client, model) {
  const [counts, topics, articles] = await Promise.all([
    getEditorialContentCounts(client),
    client.topic.findMany({
      where: { sourceType: SOURCE_TYPE, sourceId: { in: model.topics.map((topic) => topic.sourceId) } },
      select: { sourceId: true },
    }),
    client.article.findMany({
      where: { sourceType: SOURCE_TYPE, sourceId: { in: model.articles.map((article) => article.sourceId) } },
      select: { sourceId: true },
    }),
  ])
  return {
    counts,
    matchingTopics: topics.length,
    matchingArticles: articles.length,
    replacementRecommended: counts.topics > 0 || counts.articles > 0 || counts.questions > 0,
  }
}

export async function buildNotionExportPreview(buffer, { archiveName, client }) {
  const archive = parseNotionExportZip(buffer)
  const model = buildNotionExportModel(archive.entries, { archiveName })
  const existingContent = client ? await existingImportState(client, model) : null
  return {
    archive,
    model,
    preview: toPublicNotionExportPreview(model, {
      wrapperDepth: archive.wrapperDepth,
      ignoredPaths: archive.ignoredPaths,
      archiveStats: archive.archiveStats,
      existingContent,
    }),
  }
}

async function persistAssets(model) {
  const directory = assetDirectory()
  await fs.mkdir(directory, { recursive: true })
  const created = []
  const existing = []
  const unique = new Map()
  for (const asset of model.assets) unique.set(`${asset.checksum}${asset.extension}`, asset)

  for (const asset of unique.values()) {
    const fileName = `${asset.checksum}${asset.extension}`
    const destination = path.join(directory, fileName)
    try {
      const current = await fs.readFile(destination)
      const checksum = crypto.createHash('sha256').update(current).digest('hex')
      if (current.length !== asset.sizeBytes || checksum !== asset.checksum) {
        throw validationError('Un asset local existente no coincide con el contenido importado.', 'ASSET_COLLISION')
      }
      existing.push(fileName)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await fs.writeFile(destination, asset.data, { flag: 'wx' })
      created.push(fileName)
    }
  }
  return { directory, created, existing, uniqueCount: unique.size }
}

async function cleanupNewAssets(assetResult) {
  if (!assetResult) return
  await Promise.all(assetResult.created.map(async (fileName) => {
    try { await fs.unlink(path.join(assetResult.directory, fileName)) } catch { /* best effort */ }
  }))
}

async function upsertTopic(transaction, topic) {
  return transaction.topic.upsert({
    where: { sourceType_sourceId: { sourceType: SOURCE_TYPE, sourceId: topic.sourceId } },
    update: {
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      description: topic.description,
      status: 'DRAFT',
      sourcePath: topic.sourcePath,
      sourceSnapshotHash: topic.sourceSnapshotHash,
    },
    create: {
      slug: topic.slug,
      title: topic.title,
      summary: topic.summary,
      description: topic.description,
      status: 'DRAFT',
      sourceType: SOURCE_TYPE,
      sourceId: topic.sourceId,
      sourcePath: topic.sourcePath,
      sourceSnapshotHash: topic.sourceSnapshotHash,
    },
    select: { id: true, sourceId: true },
  })
}

async function upsertArticle(transaction, article, topicId) {
  const importedAt = new Date()
  return transaction.article.upsert({
    where: { sourceType_sourceId: { sourceType: SOURCE_TYPE, sourceId: article.sourceId } },
    update: {
      topicId,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      body: article.body,
      contentJson: article.contentJson,
      plainText: article.plainText,
      readTimeMinutes: article.readTimeMinutes,
      tags: article.tags,
      status: 'DRAFT',
      sourcePath: article.sourcePath,
      sourceImportedAt: importedAt,
      sourceSnapshotHash: article.sourceSnapshotHash,
      editorialApprovedAt: null,
      editorialApprovedByUserId: null,
      editorialApprovedSnapshotHash: null,
    },
    create: {
      topicId,
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      body: article.body,
      contentJson: article.contentJson,
      plainText: article.plainText,
      readTimeMinutes: article.readTimeMinutes,
      tags: article.tags,
      status: 'DRAFT',
      sourceType: SOURCE_TYPE,
      sourceId: article.sourceId,
      sourcePath: article.sourcePath,
      sourceImportedAt: importedAt,
      sourceSnapshotHash: article.sourceSnapshotHash,
    },
    select: { id: true, sourceId: true, slug: true, status: true },
  })
}

async function persistModel(client, model, { replaceEditorial }) {
  return client.$transaction(async (transaction) => {
    let deleted = null
    if (replaceEditorial) deleted = await deleteEditorialContent(transaction)

    const topicIds = new Map()
    for (const topic of model.topics) {
      const stored = await upsertTopic(transaction, topic)
      topicIds.set(stored.sourceId, stored.id)
    }

    const storedArticles = []
    for (const article of model.articles) {
      const topicId = topicIds.get(article.topicSourceId)
      if (!topicId) throw new Error('No se pudo resolver el Topic de un artículo durante la importación.')
      storedArticles.push(await upsertArticle(transaction, article, topicId))
    }

    return { deleted, storedArticles }
  }, { isolationLevel: 'Serializable', maxWait: 20_000, timeout: 120_000 })
}

function collectAssetUrls(blocks, target = []) {
  const visitInline = (nodes) => {
    for (const node of nodes || []) {
      if (node.type === 'inline_image' && node.src?.startsWith('/content-assets/')) target.push(node.src)
      if (node.children) visitInline(node.children)
    }
  }
  for (const block of blocks || []) {
    if (block.type === 'image' && block.src?.startsWith('/content-assets/')) target.push(block.src)
    if (block.children) visitInline(block.children)
    if (block.type === 'table') for (const row of block.rows) for (const cell of row.cells) visitInline(cell.children)
    if (block.type === 'list') for (const item of block.items) collectAssetUrls(item.children, target)
    if (block.blocks) collectAssetUrls(block.blocks, target)
  }
  return target
}

export async function validateNotionExportPersistence(client) {
  const [topics, articles, published, emptyPlainText, duplicates, rows] = await Promise.all([
    client.topic.count({ where: { sourceType: SOURCE_TYPE } }),
    client.article.count({ where: { sourceType: SOURCE_TYPE } }),
    client.article.count({ where: { sourceType: SOURCE_TYPE, status: 'PUBLISHED' } }),
    client.article.count({ where: { sourceType: SOURCE_TYPE, OR: [{ plainText: null }, { plainText: '' }] } }),
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM (SELECT "sourceId" FROM "Article" WHERE "sourceType" = 'NOTION_EXPORT' GROUP BY "sourceId" HAVING COUNT(*) > 1) duplicated`,
    client.article.findMany({ where: { sourceType: SOURCE_TYPE }, select: { contentJson: true, slug: true, topicId: true } }),
  ])
  const emptyContentJson = rows.filter((row) => !row.contentJson || !Array.isArray(row.contentJson.blocks) || row.contentJson.blocks.length === 0).length
  const assetUrls = new Set(rows.flatMap((row) => collectAssetUrls(row.contentJson?.blocks || [])))
  let missingAssetFiles = 0
  for (const url of assetUrls) {
    const fileName = path.basename(url)
    try { await fs.access(path.join(assetDirectory(), fileName)) } catch { missingAssetFiles += 1 }
  }
  return {
    topics,
    articles,
    published,
    emptyPlainText,
    emptyContentJson,
    duplicateSourceIds: Number(duplicates?.[0]?.count || 0),
    articlesWithoutTopic: rows.filter((row) => !row.topicId).length,
    uniqueAssetFilesReferenced: assetUrls.size,
    missingAssetFiles,
  }
}

export async function importNotionExportBuffer(buffer, { archiveName, client, replaceEditorial = false }) {
  if (!client) throw new Error('Prisma client requerido para importar el export de Notion.')
  if (replaceEditorial) getLocalDatabaseTarget()

  const { model, archive } = await buildNotionExportPreview(buffer, { archiveName, client })
  if (model.stats.brokenInternalLinks > 0) throw validationError('El ZIP contiene enlaces internos sin resolver. Corrige la causa antes de importar.', 'BROKEN_INTERNAL_LINKS')
  if (model.stats.missingAssets > 0) throw validationError('El ZIP contiene assets referenciados que no están presentes.', 'MISSING_ASSETS')
  if (model.stats.emptyArticles > 0) throw validationError('El ZIP contiene artículos sin bloques importables después del título. Corrige la fuente antes de importar.', 'EMPTY_ARTICLES')

  const before = await getEditorialContentCounts(client)
  const backup = replaceEditorial ? await createLocalDatabaseBackup() : null
  let assetResult = null
  try {
    assetResult = await persistAssets(model)
    const persistence = await persistModel(client, model, { replaceEditorial })
    const after = await getEditorialContentCounts(client)
    if (after.users !== before.users) throw new Error('La importación alteró la cantidad de usuarios; la operación no es válida.')
    const validation = await validateNotionExportPersistence(client)
    return {
      source: model.root,
      stats: model.stats,
      wrapperDepth: archive.wrapperDepth,
      ignoredFiles: archive.ignoredPaths.length,
      assets: { logical: model.assets.length, uniqueFiles: assetResult.uniqueCount, newlyWritten: assetResult.created.length },
      backup,
      deleted: persistence.deleted,
      validation,
    }
  } catch (error) {
    await cleanupNewAssets(assetResult)
    throw error
  }
}
