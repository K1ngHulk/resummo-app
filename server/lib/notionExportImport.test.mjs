import assert from 'node:assert/strict'
import test from 'node:test'
import { deflateRawSync } from 'node:zlib'
import { parseNotionExportZip } from './notionExportZip.js'
import { buildNotionExportModel, toPublicNotionExportPreview } from './notionExportModel.js'
import { parseNotionMarkdown } from './notionExportMarkdown.js'

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

function u16(value) {
  const buffer = Buffer.alloc(2)
  buffer.writeUInt16LE(value)
  return buffer
}

function u32(value) {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32LE(value >>> 0)
  return buffer
}

function makeZip(files) {
  const localParts = []
  const centralParts = []
  let localOffset = 0

  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const data = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data, 'utf8')
    const compressed = deflateRawSync(data)
    const crc = crc32(data)
    const flags = 0x800
    const localHeader = Buffer.concat([
      u32(0x04034b50), u16(20), u16(flags), u16(8), u16(0), u16(0), u32(crc), u32(compressed.length), u32(data.length), u16(name.length), u16(0), name,
    ])
    localParts.push(localHeader, compressed)

    const centralHeader = Buffer.concat([
      u32(0x02014b50), u16(20), u16(20), u16(flags), u16(8), u16(0), u16(0), u32(crc), u32(compressed.length), u32(file.declaredUncompressedSize ?? data.length),
      u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(localOffset), name,
    ])
    centralParts.push(centralHeader)
    localOffset += localHeader.length + compressed.length
  }

  const central = Buffer.concat(centralParts)
  const eocd = Buffer.concat([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(central.length), u32(localOffset), u16(0),
  ])
  return Buffer.concat([...localParts, central, eocd])
}

const ids = {
  root: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  bio: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  phys: 'cccccccccccccccccccccccccccccccc',
  metabolismBio: 'dddddddddddddddddddddddddddddddd',
  transportBio: 'eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
  metabolismPhys: 'ffffffffffffffffffffffffffffffff',
}

function corpusFiles() {
  const rootDir = `RESUMMO MIR ${ids.root}`
  const bioDir = `${rootDir}/Bioquímica ${ids.bio}`
  const physDir = `${rootDir}/Fisiología ${ids.phys}`
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(24, 1)])

  return [
    { name: `RESUMMO MIR ${ids.root}.md`, data: '# RESUMMO MIR\n\nBiblioteca médica.' },
    { name: `${rootDir}/Bioquímica ${ids.bio}.md`, data: '# Bioquímica\n\nBases moleculares.' },
    { name: `${rootDir}/Fisiología ${ids.phys}.md`, data: '# Fisiología\n\nFunciones del organismo.' },
    {
      name: `${bioDir}/Metabolismo ${ids.metabolismBio}.md`,
      data: `# Metabolismo\n\n## Concepto\n\nEl **metabolismo** integra *rutas* y \`enzimas\`.\n\n<aside>\n**Clave:** revisar el balance energético.\n</aside>\n\n| Sustrato | Producto |\n| --- | --- |\n| A | B |\n\n- Principal\n  - Anidado\n\n$$\nATP = ADP + P_i\n$$\n\n![Esquema](assets/esquema.png)\n\n[Transporte](Transporte%20${ids.transportBio}.md)\n\n[Referencia](https://example.org/reference)`,
    },
    { name: `${bioDir}/Transporte ${ids.transportBio}.md`, data: '# Transporte\n\n## Membrana\n\nContenido relacionado.' },
    { name: `${physDir}/Metabolismo ${ids.metabolismPhys}.md`, data: '# Metabolismo\n\n## Regulación\n\nPerspectiva fisiológica.' },
    { name: `${bioDir}/assets/esquema.png`, data: png },
  ]
}

test('parses direct and single-wrapper Notion ZIP exports', async () => {
  const directZip = makeZip(corpusFiles())
  const direct = await parseNotionExportZip(directZip)
  assert.equal(direct.wrapperDepth, 0)
  assert.equal(direct.entries.length, corpusFiles().length)

  const wrapper = makeZip([{ name: 'ExportBlock-test.zip', data: directZip }])
  const nested = await parseNotionExportZip(wrapper)
  assert.equal(nested.wrapperDepth, 1)
  assert.equal(nested.entries.length, corpusFiles().length)
})

test('rejects ZIP path traversal before extraction', async () => {
  const malicious = makeZip([{ name: '../outside.md', data: '# no' }])
  await assert.rejects(parseNotionExportZip(malicious), /salir de la carpeta de importación/)
})

test('reconstructs root topics articles assets and internal links deterministically', async () => {
  const archive = await parseNotionExportZip(makeZip(corpusFiles()))
  const model = buildNotionExportModel(archive.entries, { archiveName: 'resummo.zip' })

  assert.equal(model.root.title, 'RESUMMO MIR')
  assert.equal(model.stats.markdownPages, 6)
  assert.equal(model.stats.topics, 2)
  assert.equal(model.stats.articles, 3)
  assert.equal(model.stats.assets, 1)
  assert.equal(model.stats.orphanAssets, 0)
  assert.equal(model.stats.internalLinks, 1)
  assert.equal(model.stats.externalLinks, 1)
  assert.equal(model.stats.brokenInternalLinks, 0)
  assert.equal(model.stats.missingAssets, 0)
  assert.equal(model.stats.duplicateTitles, 1)

  const duplicateSlugs = model.duplicateTitles[0].slugs
  assert.deepEqual(duplicateSlugs.sort(), ['bioquimica-metabolismo', 'fisiologia-metabolismo'])

  const metabolism = model.articles.find((article) => article.sourceId === ids.metabolismBio)
  assert.equal(metabolism.status, 'DRAFT')
  assert.match(metabolism.body, /<aside>/)
  assert.match(metabolism.plainText, /Sustrato Product/)
  assert.ok(metabolism.contentJson.blocks.some((block) => block.type === 'table'))
  assert.ok(metabolism.contentJson.blocks.some((block) => block.type === 'callout'))
  assert.ok(metabolism.contentJson.blocks.some((block) => block.type === 'list'))
  assert.ok(metabolism.contentJson.blocks.some((block) => block.type === 'equation'))
  assert.ok(metabolism.contentJson.blocks.some((block) => block.type === 'image' && block.src.startsWith('/content-assets/')))
})

test('reconstructs real Notion file-with-id and folder-without-id hierarchy and links', async () => {
  const rootFolder = 'Private & Shared/RESUMMO MIR'
  const topicFolder = `${rootFolder}/Alergología`
  const archive = await parseNotionExportZip(makeZip([
    {
      name: `Private & Shared/RESUMMO MIR ${ids.root}.md`,
      data: `# RESUMMO MIR\n\n[Alergología](RESUMMO%20MIR/Alergolog%C3%ADa%20${ids.bio}.md)`,
    },
    {
      name: `${rootFolder}/Alergología ${ids.bio}.md`,
      data: `# Alergología\n\n[Anafilaxia](Alergolog%C3%ADa/Anafilaxia%20${ids.metabolismBio}.md)`,
    },
    {
      name: `${topicFolder}/Anafilaxia ${ids.metabolismBio}.md`,
      data: `# Anafilaxia\n\n[Urticaria](Urticaria%20${ids.transportBio}.md)`,
    },
    {
      name: `${topicFolder}/Urticaria ${ids.transportBio}.md`,
      data: '# Urticaria\n\nContenido.',
    },
  ]))

  const model = buildNotionExportModel(archive.entries, { archiveName: 'real-notion-shape.zip' })

  assert.equal(model.root.sourceId, ids.root)
  assert.deepEqual(model.topics.map((topic) => topic.sourceId), [ids.bio])
  assert.deepEqual(model.articles.map((article) => article.sourceId), [ids.metabolismBio, ids.transportBio])
  assert.ok(model.articles.every((article) => article.topicSourceId === ids.bio))
  assert.equal(model.stats.internalLinks, 3)
  assert.equal(model.stats.brokenInternalLinks, 0)
  assert.ok(!model.warnings.some((warning) => warning.code === 'DISCONNECTED_PAGES'))

  const anaphylaxis = model.articles.find((article) => article.sourceId === ids.metabolismBio)
  const siblingLink = anaphylaxis.contentJson.blocks
    .flatMap((block) => block.children || [])
    .find((node) => node.type === 'link')
  assert.equal(siblingLink.targetSourceId, ids.transportBio)
  assert.equal(siblingLink.href, '/learning/library/article?slug=urticaria')
})

test('preserves inline formatting and safe HTML strong generated by Notion', () => {
  const parsed = parseNotionMarkdown('## Título\n\n<strong>Importante</strong> y **negrita**, *cursiva*, [link](https://example.org).', ids.root)
  const paragraph = parsed.blocks.find((block) => block.type === 'paragraph')
  assert.ok(paragraph)
  assert.ok(paragraph.children.some((node) => node.type === 'strong'))
  assert.ok(paragraph.children.some((node) => node.type === 'emphasis'))
  assert.ok(paragraph.children.some((node) => node.type === 'link'))
})

test('keeps unsafe HTML inert instead of rendering executable markup', () => {
  const parsed = parseNotionMarkdown('<script>alert(1)</script>\n\nTexto seguro.', ids.root)
  assert.equal(parsed.blocks[0].type, 'unsupported')
  assert.equal(parsed.blocks[0].text, 'alert(1)')
  assert.ok(parsed.warnings.some((warning) => warning.code === 'UNSUPPORTED_HTML'))
})

test('counts references from root and Topic pages, not only Article bodies', async () => {
  const rootDir = `RESUMMO MIR ${ids.root}`
  const topicDir = `${rootDir}/Bioquímica ${ids.bio}`
  const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(24, 2)])
  const archive = await parseNotionExportZip(makeZip([
    { name: `RESUMMO MIR ${ids.root}.md`, data: `# RESUMMO MIR\n\n[Bioquímica](${encodeURIComponent(rootDir)}/Bioquímica%20${ids.bio}.md)` },
    { name: `${rootDir}/Bioquímica ${ids.bio}.md`, data: `# Bioquímica\n\n![Mapa](${encodeURIComponent(`Bioquímica ${ids.bio}`)}/assets/mapa.png)` },
    { name: `${topicDir}/Metabolismo ${ids.metabolismBio}.md`, data: '# Metabolismo\n\nContenido.' },
    { name: `${topicDir}/assets/mapa.png`, data: png },
  ]))
  const model = buildNotionExportModel(archive.entries)
  assert.equal(model.stats.internalLinks, 1)
  assert.equal(model.stats.assets, 1)
  assert.equal(model.stats.orphanAssets, 0)
})

test('rejects suspicious high-ratio ZIP entries before inflation is trusted', async () => {
  const bombLike = makeZip([{ name: 'RESUMMO MIR aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.md', data: Buffer.alloc(2 * 1024 * 1024, 0) }])
  await assert.rejects(parseNotionExportZip(bombLike), /ratio de compresión sospechoso/)
})

test('caps actual inflation when the ZIP lies about its uncompressed size', async () => {
  const forged = makeZip([{
    name: 'RESUMMO MIR aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.md',
    data: Buffer.alloc(4 * 1024 * 1024, 65),
    declaredUncompressedSize: 1024,
  }])

  await assert.rejects(
    parseNotionExportZip(forged, { limits: { maxCompressionRatio: 10_000 } }),
    /excede el tamaño descomprimido declarado o permitido/,
  )
})

test('blocks preview when an article contains only its stripped H1 title', () => {
  const rootDir = `RESUMMO MIR ${ids.root}`
  const topicDir = `${rootDir}/Bioquímica ${ids.bio}`
  const model = buildNotionExportModel([
    { path: `RESUMMO MIR ${ids.root}.md`, data: Buffer.from('# RESUMMO MIR') },
    { path: `${rootDir}/Bioquímica ${ids.bio}.md`, data: Buffer.from('# Bioquímica') },
    { path: `${topicDir}/Vacío ${ids.metabolismBio}.md`, data: Buffer.from('# Vacío') },
  ])

  assert.equal(model.stats.emptyArticles, 1)
  assert.equal(toPublicNotionExportPreview(model).status, 'INVALID')
  assert.match(model.warnings.find((warning) => warning.code === 'EMPTY_ARTICLE_CONTENT')?.message || '', /1 artículos/)
})

test('treats missing heading fragments as broken internal links instead of silently dropping anchors', () => {
  const rootDir = `RESUMMO MIR ${ids.root}`
  const topicDir = `${rootDir}/Bioquímica ${ids.bio}`
  const model = buildNotionExportModel([
    { path: `RESUMMO MIR ${ids.root}.md`, data: Buffer.from('# RESUMMO MIR') },
    { path: `${rootDir}/Bioquímica ${ids.bio}.md`, data: Buffer.from('# Bioquímica') },
    {
      path: `${topicDir}/Origen ${ids.metabolismBio}.md`,
      data: Buffer.from(`# Origen\n\n## Inicio\n\n[Válido](Destino%20${ids.transportBio}.md#Destino)\n\n[Fragmento ausente](Destino%20${ids.transportBio}.md#No%20existe)\n\n[Local ausente](#No%20existe)`),
    },
    { path: `${topicDir}/Destino ${ids.transportBio}.md`, data: Buffer.from('# Destino\n\n## Destino\n\nTexto.') },
  ])

  assert.equal(model.stats.internalLinks, 1)
  assert.equal(model.stats.brokenInternalLinks, 2)
  const source = model.articles.find((article) => article.sourceId === ids.metabolismBio)
  const valid = source.contentJson.blocks.flatMap((block) => block.children || []).find((node) => node.type === 'link' && node.internal)
  assert.match(valid.href, /#h-[a-f0-9]{12}$/)
})
