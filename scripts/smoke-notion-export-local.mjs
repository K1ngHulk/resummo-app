import 'dotenv/config'
import assert from 'node:assert/strict'
import { deflateRawSync } from 'node:zlib'
import { prisma } from '../server/lib/prisma.js'
import { buildNotionExportPreview, importNotionExportBuffer } from '../server/lib/notionExportImportService.js'
import { getLocalDatabaseTarget } from '../server/lib/localEditorialReset.js'

if (process.env.RESUMMO_ISOLATED_SMOKE !== 'true') {
  throw new Error('Set RESUMMO_ISOLATED_SMOKE=true to run this smoke against an isolated local database.')
}
getLocalDatabaseTarget()

let crcTable
function crc32(buffer) {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let index = 0; index < 256; index += 1) {
      let value = index
      for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1)
      crcTable[index] = value >>> 0
    }
  }
  let value = 0xffffffff
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

function u16(value) { const buffer = Buffer.alloc(2); buffer.writeUInt16LE(value); return buffer }
function u32(value) { const buffer = Buffer.alloc(4); buffer.writeUInt32LE(value >>> 0); return buffer }

function makeZip(files) {
  const localParts = []
  const centralParts = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8')
    const compressed = deflateRawSync(data)
    const crc = crc32(data)
    const flags = 0x800
    const local = Buffer.concat([u32(0x04034b50), u16(20), u16(flags), u16(8), u16(0), u16(0), u32(crc), u32(compressed.length), u32(data.length), u16(name.length), u16(0), name])
    localParts.push(local, compressed)
    centralParts.push(Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(flags), u16(8), u16(0), u16(0), u32(crc), u32(compressed.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]))
    offset += local.length + compressed.length
  }
  const central = Buffer.concat(centralParts)
  const eocd = Buffer.concat([u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(offset), u16(0)])
  return Buffer.concat([...localParts, central, eocd])
}

function fixtureZip() {
  const root = '11111111111111111111111111111111'
  const topic = '22222222222222222222222222222222'
  const articleA = '33333333333333333333333333333333'
  const articleB = '44444444444444444444444444444444'
  const rootDir = `RESUMMO MIR ${root}`
  const topicDir = `${rootDir}/Cardiología ${topic}`
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 7)])
  return makeZip([
    { name: `RESUMMO MIR ${root}.md`, data: '# RESUMMO MIR\n\nRaíz.' },
    { name: `${rootDir}/Cardiología ${topic}.md`, data: '# Cardiología\n\nEspecialidad.' },
    { name: `${topicDir}/Arritmias ${articleA}.md`, data: `# Arritmias\n\n## Resumen\n\n**Contenido** de prueba.\n\n<aside>\nDato importante.\n</aside>\n\n| Ritmo | Hallazgo |\n| --- | --- |\n| A | B |\n\n![ECG](assets/ecg.png)\n\n[Ver tratamiento](Tratamiento%20${articleB}.md)` },
    { name: `${topicDir}/Tratamiento ${articleB}.md`, data: '# Tratamiento\n\n## Enfoque\n\nContenido relacionado.' },
    { name: `${topicDir}/assets/ecg.png`, data: png },
  ])
}

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'validation.user@resummo.local' },
    update: {},
    create: { email: 'validation.user@resummo.local', passwordHash: 'synthetic-validation-only', firstName: 'Validation', lastName: 'User', role: 'ADMIN' },
  })
  const legacyTopic = await prisma.topic.create({
    data: { slug: `legacy-${Date.now()}`, title: 'Legacy validation', summary: 'Old', description: 'Old', status: 'PUBLISHED' },
  })
  const legacyArticle = await prisma.article.create({
    data: { topicId: legacyTopic.id, slug: `legacy-article-${Date.now()}`, title: 'Legacy validation', summary: 'Old', body: '## Old\n\nOld', readTimeMinutes: 1, tags: [], status: 'PUBLISHED' },
  })
  await prisma.userArticleProgress.create({ data: { userId: user.id, articleId: legacyArticle.id, status: 'IN_PROGRESS', progressPercent: 50 } })

  const zip = fixtureZip()
  const { preview } = await buildNotionExportPreview(zip, { archiveName: 'validation.zip', client: prisma })
  assert.equal(preview.status, 'VALID')
  assert.equal(preview.stats.topics, 1)
  assert.equal(preview.stats.articles, 2)
  assert.equal(preview.stats.assets, 1)
  assert.equal(preview.stats.internalLinks, 1)
  assert.equal(preview.stats.brokenInternalLinks, 0)
  assert.equal(preview.stats.missingAssets, 0)

  const first = await importNotionExportBuffer(zip, { archiveName: 'validation.zip', client: prisma, replaceEditorial: true })
  assert.equal(first.validation.topics, 1)
  assert.equal(first.validation.articles, 2)
  assert.equal(first.validation.published, 0)
  assert.equal(first.validation.emptyPlainText, 0)
  assert.equal(first.validation.emptyContentJson, 0)
  assert.equal(first.validation.duplicateSourceIds, 0)
  assert.equal(first.validation.missingAssetFiles, 0)
  assert.equal(await prisma.user.count({ where: { id: user.id } }), 1)
  assert.equal(await prisma.article.count({ where: { id: legacyArticle.id } }), 0)

  const second = await importNotionExportBuffer(zip, { archiveName: 'validation.zip', client: prisma, replaceEditorial: false })
  assert.equal(second.validation.articles, 2)
  assert.equal(second.validation.topics, 1)
  assert.equal(second.validation.published, 0)

  console.log(JSON.stringify({
    preview: preview.stats,
    imported: first.validation,
    idempotentReimport: second.validation,
    backup: first.backup,
    usersPreserved: true,
  }, null, 2))
}

main().finally(async () => prisma.$disconnect())
