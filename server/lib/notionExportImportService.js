import path from 'node:path'
import { parseNotionExportZip } from './notionExportZip.js'
import {
  buildNotionExportAssetManifest,
  buildNotionExportModel,
  toPublicNotionExportPreview,
} from './notionExportModel.js'
import {
  cleanupCreatedContentAssets,
  findMissingContentAssets,
  persistContentAssets,
} from './contentAssetStore.js'
import { createLocalDatabaseBackup, deleteEditorialContent, getEditorialContentCounts, getLocalDatabaseTarget } from './localEditorialReset.js'
import { resolveNotionImportRuntime, waitForImportMemoryBudget } from './notionImportRuntime.js'

const SOURCE_TYPE = 'NOTION_EXPORT'

function validationError(message, code = 'INVALID_NOTION_EXPORT') {
  const error = new Error(message)
  error.statusCode = 400
  error.code = code
  return error
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
  const archive = await parseNotionExportZip(buffer)
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

async function persistModelConstrained(client, model, { environment = process.env } = {}) {
  const runtime = resolveNotionImportRuntime(environment)
  const topicIds = new Map()

  for (const topic of model.topics) {
    await waitForImportMemoryBudget('la persistencia de especialidades', { environment })
    const stored = await upsertTopic(client, topic)
    topicIds.set(stored.sourceId, stored.id)
  }

  const storedArticles = []
  for (let offset = 0; offset < model.articles.length; offset += runtime.articleBatchSize) {
    await waitForImportMemoryBudget('la persistencia de artículos', { environment })
    const batch = model.articles.slice(offset, offset + runtime.articleBatchSize)
    const storedBatch = await client.$transaction(async (transaction) => {
      const results = []
      for (const article of batch) {
        const topicId = topicIds.get(article.topicSourceId)
        if (!topicId) throw new Error('No se pudo resolver el Topic de un artículo durante la importación.')
        results.push(await upsertArticle(transaction, article, topicId))
      }
      return results
    }, { isolationLevel: 'Serializable', maxWait: 20_000, timeout: 60_000 })
    storedArticles.push(...storedBatch)
    await waitForImportMemoryBudget('el cierre del lote de artículos', { environment })
  }

  return { deleted: null, storedArticles }
}

function assertImportableModel(model) {
  if (model.stats.brokenInternalLinks > 0) throw validationError('El ZIP contiene enlaces internos sin resolver. Corrige la causa antes de importar.', 'BROKEN_INTERNAL_LINKS')
  if (model.stats.missingAssets > 0) throw validationError('El ZIP contiene assets referenciados que no están presentes.', 'MISSING_ASSETS')
  if (model.stats.emptyArticles > 0) throw validationError('El ZIP contiene artículos sin bloques importables después del título. Corrige la fuente antes de importar.', 'EMPTY_ARTICLES')
}

function fileNameForAsset(asset) {
  return `${asset.checksum}${asset.extension}`
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
  const [topics, articles, published, emptyPlainText, duplicates] = await Promise.all([
    client.topic.count({ where: { sourceType: SOURCE_TYPE } }),
    client.article.count({ where: { sourceType: SOURCE_TYPE } }),
    client.article.count({ where: { sourceType: SOURCE_TYPE, status: 'PUBLISHED' } }),
    client.article.count({ where: { sourceType: SOURCE_TYPE, OR: [{ plainText: null }, { plainText: '' }] } }),
    client.$queryRaw`SELECT COUNT(*)::int AS count FROM (SELECT "sourceId" FROM "Article" WHERE "sourceType" = 'NOTION_EXPORT' GROUP BY "sourceId" HAVING COUNT(*) > 1) duplicated`,
  ])

  let cursor = null
  let emptyContentJson = 0
  let articlesWithoutTopic = 0
  const assetUrls = new Set()
  const pageSize = 40

  while (true) {
    const rows = await client.article.findMany({
      where: { sourceType: SOURCE_TYPE },
      orderBy: { id: 'asc' },
      take: pageSize,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, contentJson: true, topicId: true },
    })
    if (rows.length === 0) break

    for (const row of rows) {
      if (!row.contentJson || !Array.isArray(row.contentJson.blocks) || row.contentJson.blocks.length === 0) {
        emptyContentJson += 1
      }
      if (!row.topicId) articlesWithoutTopic += 1
      for (const url of collectAssetUrls(row.contentJson?.blocks || [])) assetUrls.add(url)
    }

    cursor = rows.at(-1).id
    if (rows.length < pageSize) break
  }

  const missingAssetFiles = (await findMissingContentAssets([...assetUrls].map((url) => path.basename(url)))).length
  return {
    topics,
    articles,
    published,
    emptyPlainText,
    emptyContentJson,
    duplicateSourceIds: Number(duplicates?.[0]?.count || 0),
    articlesWithoutTopic,
    uniqueAssetFilesReferenced: assetUrls.size,
    missingAssetFiles,
  }
}

export async function importNotionExportConstrainedPhase(input, {
  archiveName,
  client,
  phase,
  environment = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!client) throw new Error('Prisma client requerido para importar el export de Notion.')
  const runtime = resolveNotionImportRuntime(environment)
  if (runtime.profile !== 'constrained') {
    const error = new Error('El modo constrained no está activo para esta instancia.')
    error.statusCode = 409
    error.code = 'IMPORT_PROFILE_MISMATCH'
    throw error
  }

  if (phase === 'assets') {
    await waitForImportMemoryBudget('el inicio de la fase de imágenes', { environment })
    const archive = await parseNotionExportZip(input)
    const { assets, warnings } = buildNotionExportAssetManifest(archive.entries)
    const logicalAssets = assets.length
    archive.entries.length = 0

    const assetResult = await persistContentAssets(assets, {
      environment,
      fetchImpl,
      releaseData: true,
      beforeAsset: () => waitForImportMemoryBudget('la carga de imágenes', { environment }),
      afterAsset: () => waitForImportMemoryBudget('la liberación de imágenes', { environment }),
    })

    return {
      status: 'IN_PROGRESS',
      phase: 'assets',
      nextPhase: 'content',
      runtime: { profile: runtime.profile, maxRssMb: runtime.maxRssMb },
      assets: {
        logical: logicalAssets,
        uniqueFiles: assetResult.uniqueCount,
        newlyWritten: assetResult.created.length,
        existing: assetResult.existing.length,
      },
      warnings: warnings.map((warning) => warning.message),
    }
  }

  if (phase !== 'content') {
    const error = new Error('Fase constrained inválida.')
    error.statusCode = 400
    error.code = 'INVALID_IMPORT_PHASE'
    throw error
  }

  await waitForImportMemoryBudget('el inicio de la fase de contenido', { environment })
  const { model, archive } = await buildNotionExportPreview(input, { archiveName, client })
  assertImportableModel(model)

  const requiredAssetFiles = model.assets.map(fileNameForAsset)
  const missingAssets = await findMissingContentAssets(requiredAssetFiles, { environment, fetchImpl })
  if (missingAssets.length > 0) {
    const error = new Error(`La fase de imágenes aún no está completa (${missingAssets.length} assets pendientes). Reintenta la importación para continuar.`)
    error.statusCode = 409
    error.code = 'IMPORT_ASSET_PHASE_INCOMPLETE'
    throw error
  }

  const source = { ...model.root }
  const stats = { ...model.stats }
  const wrapperDepth = archive.wrapperDepth
  const ignoredFiles = archive.ignoredPaths.length
  const logicalAssets = model.assets.length
  archive.entries.length = 0

  const before = await getEditorialContentCounts(client)
  const persistence = await persistModelConstrained(client, model, { environment })

  model.assets.length = 0
  model.allAssets.length = 0
  model.articles.length = 0
  model.topics.length = 0

  const after = await getEditorialContentCounts(client)
  if (after.users !== before.users) throw new Error('La importación alteró la cantidad de usuarios; la operación no es válida.')
  const validation = await validateNotionExportPersistence(client)

  return {
    status: 'COMPLETE',
    phase: 'content',
    source,
    stats,
    wrapperDepth,
    ignoredFiles,
    assets: { logical: logicalAssets, uniqueFiles: requiredAssetFiles.length, newlyWritten: 0 },
    backup: null,
    deleted: persistence.deleted,
    validation,
    runtime: { profile: runtime.profile, maxRssMb: runtime.maxRssMb, articleBatchSize: runtime.articleBatchSize },
  }
}

export async function importNotionExportBuffer(buffer, { archiveName, client, replaceEditorial = false }) {
  if (!client) throw new Error('Prisma client requerido para importar el export de Notion.')
  if (replaceEditorial) getLocalDatabaseTarget()

  const { model, archive } = await buildNotionExportPreview(buffer, { archiveName, client })
  if (model.stats.brokenInternalLinks > 0) throw validationError('El ZIP contiene enlaces internos sin resolver. Corrige la causa antes de importar.', 'BROKEN_INTERNAL_LINKS')
  if (model.stats.missingAssets > 0) throw validationError('El ZIP contiene assets referenciados que no están presentes.', 'MISSING_ASSETS')
  if (model.stats.emptyArticles > 0) throw validationError('El ZIP contiene artículos sin bloques importables después del título. Corrige la fuente antes de importar.', 'EMPTY_ARTICLES')

  const source = { ...model.root }
  const stats = { ...model.stats }
  const wrapperDepth = archive.wrapperDepth
  const ignoredFiles = archive.ignoredPaths.length
  const logicalAssets = model.assets.length
  archive.entries.length = 0

  const before = await getEditorialContentCounts(client)
  const backup = replaceEditorial ? await createLocalDatabaseBackup() : null
  let assetResult = null
  try {
    assetResult = await persistContentAssets(model.assets, { releaseData: true })
    const persistence = await persistModel(client, model, { replaceEditorial })

    model.assets.length = 0
    model.allAssets.length = 0
    model.articles.length = 0
    model.topics.length = 0

    const after = await getEditorialContentCounts(client)
    if (after.users !== before.users) throw new Error('La importación alteró la cantidad de usuarios; la operación no es válida.')
    const validation = await validateNotionExportPersistence(client)
    return {
      source,
      stats,
      wrapperDepth,
      ignoredFiles,
      assets: { logical: logicalAssets, uniqueFiles: assetResult.uniqueCount, newlyWritten: assetResult.created.length },
      backup,
      deleted: persistence.deleted,
      validation,
    }
  } catch (error) {
    await cleanupCreatedContentAssets(assetResult)
    throw error
  }
}
