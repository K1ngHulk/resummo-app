import fs from 'node:fs/promises'
import path from 'node:path'
import { prisma } from '../server/lib/prisma.js'
import {
  buildNotionExportPreview,
  persistNotionExportModel,
  validateNotionExportPersistence,
} from '../server/lib/notionExportImportService.js'
import { findMissingContentAssets, persistContentAssets } from '../server/lib/contentAssetStore.js'
import { getEditorialContentCounts } from '../server/lib/localEditorialReset.js'
import {
  assertExpectedNotionExportStats,
  assertExpectedNotionPersistence,
  expectedNotionCorpus,
} from '../server/lib/notionImportRuntime.js'

const EXPECTED_PROJECT_REF = 'ouzwkynthgogirmzvkoh'
const EXPECTED_BRIDGE_PATH = '/functions/v1/resummo-content-assets'

function parseArgs(argv) {
  const result = { mode: 'preview', file: null, start: 0, limit: 50 }
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--mode') result.mode = String(argv[++index] || '').trim().toLowerCase()
    else if (token === '--file') result.file = argv[++index] || null
    else if (token === '--start') result.start = Number(argv[++index])
    else if (token === '--limit') result.limit = Number(argv[++index])
    else throw new Error(`Argumento no reconocido: ${token}`)
  }
  if (!['preview', 'assets', 'content', 'verify'].includes(result.mode)) {
    throw new Error('Usa --mode preview, --mode assets, --mode content o --mode verify.')
  }
  if (result.mode !== 'verify' && !result.file) throw new Error('Debes indicar --file con el ZIP auditado de Notion.')
  if (!Number.isInteger(result.start) || result.start < 0) throw new Error('--start debe ser un entero mayor o igual a 0.')
  if (!Number.isInteger(result.limit) || result.limit < 1 || result.limit > 100) throw new Error('--limit debe estar entre 1 y 100.')
  return result
}

function assertCloudTarget() {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim()
  const bridgeUrl = String(process.env.RESUMMO_STORAGE_BRIDGE_URL || '').trim()
  const backend = String(process.env.RESUMMO_CONTENT_ASSET_BACKEND || '').trim().toLowerCase()
  if (!databaseUrl || !bridgeUrl || backend !== 'supabase') {
    throw new Error('El importador cloud requiere DATABASE_URL y el backend Supabase de assets configurados explícitamente.')
  }

  const database = new URL(databaseUrl)
  const bridge = new URL(bridgeUrl)
  if (!database.hostname.endsWith('.pooler.supabase.com')) throw new Error('DATABASE_URL no apunta al pooler oficial de Supabase.')
  if (decodeURIComponent(database.username) !== `resummo_app.${EXPECTED_PROJECT_REF}`) {
    throw new Error('DATABASE_URL no usa el rol runtime del proyecto Resummo esperado.')
  }
  if (bridge.hostname !== `${EXPECTED_PROJECT_REF}.supabase.co` || bridge.pathname !== EXPECTED_BRIDGE_PATH) {
    throw new Error('El bridge de Storage no corresponde al proyecto Supabase Resummo esperado.')
  }
}

async function readZip(filePath) {
  const absolute = path.resolve(filePath)
  const stat = await fs.stat(absolute)
  if (!stat.isFile()) throw new Error('La ruta indicada no es un archivo.')
  if (!absolute.toLowerCase().endsWith('.zip')) throw new Error('El archivo debe ser ZIP.')
  return { absolute, buffer: await fs.readFile(absolute) }
}

async function buildAuditedModel(filePath) {
  const { absolute, buffer } = await readZip(filePath)
  const holder = { buffer }
  const { preview, model, archive } = await buildNotionExportPreview(holder, {
    archiveName: path.basename(absolute),
    client: prisma,
  })
  if (preview.status !== 'VALID') throw new Error('El ZIP no superó la validación estructural del importador.')
  assertExpectedNotionExportStats(preview.stats)
  return { absolute, preview, model, archive }
}

async function assertEditorialBootstrapEmpty() {
  const counts = await getEditorialContentCounts(prisma)
  if (counts.topics !== 0 || counts.articles !== 0 || counts.questions !== 0) {
    throw new Error(`El bootstrap cloud exige contenido editorial vacío. Estado actual: topics=${counts.topics}, articles=${counts.articles}, questions=${counts.questions}.`)
  }
  return counts
}

async function runPreview(filePath) {
  const { preview } = await buildAuditedModel(filePath)
  console.log(JSON.stringify({
    mode: 'preview',
    ok: true,
    preview: {
      status: preview.status,
      source: preview.source,
      stats: preview.stats,
      existingContent: preview.existingContent,
      expected: expectedNotionCorpus,
    },
  }, null, 2))
}

async function runAssets(filePath, start, limit) {
  await assertEditorialBootstrapEmpty()
  const { model } = await buildAuditedModel(filePath)
  const end = Math.min(start + limit, model.assets.length)
  if (start >= model.assets.length) throw new Error(`--start ${start} excede los ${model.assets.length} assets del corpus.`)
  const chunk = model.assets.slice(start, end)
  const result = await persistContentAssets(chunk, { releaseData: true })
  console.log(JSON.stringify({
    mode: 'assets',
    ok: true,
    range: { start, endExclusive: end, count: chunk.length, total: model.assets.length },
    assets: {
      uniqueFiles: result.uniqueCount,
      newlyWritten: result.created.length,
      existing: result.existing.length,
    },
  }, null, 2))
}

async function runContent(filePath) {
  const before = await assertEditorialBootstrapEmpty()
  const { model, archive, preview } = await buildAuditedModel(filePath)
  const requiredAssetFiles = model.assets.map((asset) => `${asset.checksum}${asset.extension}`)
  const missing = await findMissingContentAssets(requiredAssetFiles, { concurrency: 16 })
  if (missing.length > 0) throw new Error(`Storage aún está incompleto: faltan ${missing.length} de ${requiredAssetFiles.length} assets.`)

  const persistence = await persistNotionExportModel(prisma, model, { replaceEditorial: false })
  archive.entries.length = 0
  model.assets.length = 0
  model.allAssets.length = 0
  model.articles.length = 0
  model.topics.length = 0

  const validation = await validateNotionExportPersistence(prisma, { assetConcurrency: 16 })
  assertExpectedNotionExportStats(preview.stats)
  assertExpectedNotionPersistence(validation)
  const after = await getEditorialContentCounts(prisma)
  if (after.users !== before.users) throw new Error('La importación cambió la cantidad de usuarios.')

  console.log(JSON.stringify({
    mode: 'content',
    ok: true,
    persistedArticles: persistence.storedArticles.length,
    counts: after,
    validation,
  }, null, 2))
}

async function runVerify() {
  const counts = await getEditorialContentCounts(prisma)
  const validation = await validateNotionExportPersistence(prisma, { assetConcurrency: 16 })
  assertExpectedNotionPersistence(validation)
  if (counts.users !== 3) throw new Error(`Se esperaban 3 usuarios demo y existen ${counts.users}.`)
  console.log(JSON.stringify({ mode: 'verify', ok: true, counts, validation }, null, 2))
}

const args = parseArgs(process.argv.slice(2))
assertCloudTarget()

try {
  if (args.mode === 'preview') await runPreview(args.file)
  else if (args.mode === 'assets') await runAssets(args.file, args.start, args.limit)
  else if (args.mode === 'content') await runContent(args.file)
  else await runVerify()
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    mode: args.mode,
    code: error?.code || 'IMPORT_FAILED',
    message: error?.message || 'La operación falló.',
    details: error?.details || null,
  }, null, 2))
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
