import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { deflateRawSync } from 'node:zlib'
import { prisma } from '../server/lib/prisma.js'
import { signToken } from '../server/lib/auth.js'
import { getLocalDatabaseTarget } from '../server/lib/localEditorialReset.js'

getLocalDatabaseTarget()
const port = Number(process.env.NOTION_EXPORT_HTTP_SMOKE_PORT || 3112)
const baseUrl = `http://127.0.0.1:${port}`
const stamp = Date.now().toString(16).padStart(32, '0').slice(-32)
const topicId = `a${stamp.slice(1)}`
const articleId = `b${stamp.slice(1)}`
const rootId = `c${stamp.slice(1)}`

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
  const local = []
  const central = []
  let offset = 0
  for (const file of files) {
    const name = Buffer.from(file.name, 'utf8')
    const data = Buffer.from(file.data, 'utf8')
    const compressed = deflateRawSync(data)
    const crc = crc32(data)
    const header = Buffer.concat([u32(0x04034b50), u16(20), u16(0x800), u16(8), u16(0), u16(0), u32(crc), u32(compressed.length), u32(data.length), u16(name.length), u16(0), name])
    local.push(header, compressed)
    central.push(Buffer.concat([u32(0x02014b50), u16(20), u16(20), u16(0x800), u16(8), u16(0), u16(0), u32(crc), u32(compressed.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name]))
    offset += header.length + compressed.length
  }
  const directory = Buffer.concat(central)
  return Buffer.concat([...local, directory, u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(directory.length), u32(offset), u16(0)])
}

const rootDir = `RESUMMO MIR ${rootId}`
const topicDir = `${rootDir}/Validación ${topicId}`
const zip = makeZip([
  { name: `RESUMMO MIR ${rootId}.md`, data: '# RESUMMO MIR\n\nRoot' },
  { name: `${rootDir}/Validación ${topicId}.md`, data: '# Validación\n\nTopic' },
  { name: `${topicDir}/Artículo HTTP ${articleId}.md`, data: '# Artículo HTTP\n\n## Sección\n\nContenido **estructurado**.' },
])

function wait(ms) { return new Promise((resolve) => setTimeout(resolve, ms)) }
async function startServer() {
  const child = spawn('node', ['server/index.js'], { env: { ...process.env, PORT: String(port), CORS_ORIGIN: 'http://127.0.0.1:5173' }, stdio: 'ignore' })
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`${baseUrl}/api/health`)).ok) return child } catch { /* starting */ }
    await wait(250)
  }
  child.kill()
  throw new Error('HTTP smoke server did not start')
}
async function stopServer(child) {
  if (!child || child.exitCode !== null || child.killed) return
  child.kill()
  await Promise.race([once(child, 'exit'), wait(1500)])
}
async function zipRequest(path, token, extraHeaders = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/zip', 'X-Resummo-File-Name': 'http-smoke.zip', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
    body: zip,
  })
  const payload = JSON.parse(await response.text())
  return { response, payload }
}

let server
let editor
let student
try {
  editor = await prisma.user.create({ data: { email: `editor-${stamp}@resummo.local`, passwordHash: 'synthetic', firstName: 'Editor', lastName: 'Smoke', role: 'EDITOR' } })
  student = await prisma.user.create({ data: { email: `student-${stamp}@resummo.local`, passwordHash: 'synthetic', firstName: 'Student', lastName: 'Smoke', role: 'STUDENT' } })
  const editorToken = signToken(editor)
  const studentToken = signToken(student)
  server = await startServer()

  const unauthenticated = await zipRequest('/api/admin/content/import/notion-export/preview')
  if (unauthenticated.response.status !== 401) throw new Error(`Expected 401, got ${unauthenticated.response.status}`)

  const forbidden = await zipRequest('/api/admin/content/import/notion-export/preview', studentToken)
  if (forbidden.response.status !== 403) throw new Error(`Expected 403, got ${forbidden.response.status}`)

  const preview = await zipRequest('/api/admin/content/import/notion-export/preview', editorToken)
  if (preview.response.status !== 200 || preview.payload?.status !== 'VALID') throw new Error(`Editor preview failed: ${preview.response.status}`)

  const confirmed = await zipRequest('/api/admin/content/import/notion-export/confirm', editorToken, { 'X-Resummo-Replace-Editorial': 'false' })
  if (confirmed.response.status !== 201 || confirmed.payload?.validation?.published !== 0) throw new Error(`Editor confirm failed: ${confirmed.response.status}`)

  const article = await prisma.article.findUnique({ where: { sourceType_sourceId: { sourceType: 'NOTION_EXPORT', sourceId: articleId } } })
  if (!article || article.status !== 'DRAFT') throw new Error('Imported HTTP smoke article is not DRAFT')

  const studentRead = await fetch(`${baseUrl}/api/articles/${article.slug}`, { headers: { Authorization: `Bearer ${studentToken}` } })
  if (studentRead.status !== 404) throw new Error(`Student could access DRAFT article: ${studentRead.status}`)

  const staleBodyAttempt = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: '# Modified\n\nThis must not silently desynchronize contentJson.' }),
  })
  if (staleBodyAttempt.status !== 400) throw new Error(`Structured body edit was not blocked: ${staleBodyAttempt.status}`)

  const metadataUpdate = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary: 'Metadata update remains allowed.' }),
  })
  if (metadataUpdate.status !== 200) throw new Error(`Structured metadata edit failed: ${metadataUpdate.status}`)

  const publicationAttempt = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'PUBLISHED' }),
  })
  const publicationPayload = JSON.parse(await publicationAttempt.text())
  if (publicationAttempt.status !== 400 || !String(publicationPayload?.message || '').includes('requiere aprobacion editorial explicita')) {
    throw new Error(`NOTION_EXPORT publication guard failed: ${publicationAttempt.status}`)
  }

  const approvalResponse = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}/editorial-approval`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved: true }),
  })
  const approvalPayload = JSON.parse(await approvalResponse.text())
  if (approvalResponse.status !== 200 || approvalPayload?.approval?.approved !== true) {
    throw new Error(`Editorial approval endpoint failed: ${approvalResponse.status}`)
  }

  const reimport = await zipRequest('/api/admin/content/import/notion-export/confirm', editorToken, { 'X-Resummo-Replace-Editorial': 'false' })
  if (reimport.response.status !== 201) throw new Error(`Approved snapshot reimport failed: ${reimport.response.status}`)
  const afterReimport = await prisma.article.findUnique({ where: { id: article.id } })
  if (afterReimport?.editorialApprovedAt || afterReimport?.editorialApprovedByUserId || afterReimport?.editorialApprovedSnapshotHash) {
    throw new Error('Reimport kept stale editorial approval metadata')
  }

  const publicationAfterReimport = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'PUBLISHED' }),
  })
  if (publicationAfterReimport.status !== 400) {
    throw new Error(`Reimported article bypassed approval gate: ${publicationAfterReimport.status}`)
  }

  const bulkApproval = await fetch(`${baseUrl}/api/admin/content/articles/bulk-action`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleIds: [article.id], action: 'APPROVE' }),
  })
  const bulkApprovalPayload = JSON.parse(await bulkApproval.text())
  if (bulkApproval.status !== 200 || bulkApprovalPayload?.approved !== 1) {
    throw new Error(`Bulk editorial approval failed: ${bulkApproval.status}`)
  }

  const importedTopic = await prisma.topic.findUnique({
    where: { sourceType_sourceId: { sourceType: 'NOTION_EXPORT', sourceId: topicId } },
  })
  if (!importedTopic) throw new Error('Imported HTTP smoke topic was not found')

  const bulkPublication = await fetch(`${baseUrl}/api/admin/content/articles/bulk-action`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleIds: [article.id], action: 'PUBLISH' }),
  })
  const bulkPublicationPayload = JSON.parse(await bulkPublication.text())
  if (bulkPublication.status !== 200 || bulkPublicationPayload?.published !== 1 || bulkPublicationPayload?.topicsPublished !== 1) {
    throw new Error(`Bulk publication failed: ${bulkPublication.status}`)
  }

  const publishedTopic = await prisma.topic.findUnique({ where: { id: importedTopic.id } })
  if (publishedTopic?.status !== 'PUBLISHED') throw new Error('Bulk publication did not publish the associated topic')

  const studentPublishedRead = await fetch(`${baseUrl}/api/articles/${article.slug}`, { headers: { Authorization: `Bearer ${studentToken}` } })
  if (studentPublishedRead.status !== 200) throw new Error(`Student could not read approved published article: ${studentPublishedRead.status}`)

  const revokeResponse = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}/editorial-approval`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${editorToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved: false }),
  })
  const revokePayload = JSON.parse(await revokeResponse.text())
  if (revokeResponse.status !== 200 || revokePayload?.approval?.approved !== false || revokePayload?.approval?.articleStatus !== 'DRAFT') {
    throw new Error(`Editorial approval revoke failed: ${revokeResponse.status}`)
  }

  const studentAfterRevoke = await fetch(`${baseUrl}/api/articles/${article.slug}`, { headers: { Authorization: `Bearer ${studentToken}` } })
  if (studentAfterRevoke.status !== 404) throw new Error(`Revoked article remained visible to STUDENT: ${studentAfterRevoke.status}`)

  const editorReview = await fetch(`${baseUrl}/api/admin/content/articles/${article.id}`, { headers: { Authorization: `Bearer ${editorToken}` } })
  if (editorReview.status !== 200) throw new Error(`Editor could not review DRAFT article: ${editorReview.status}`)

  console.log(JSON.stringify({ unauthenticated: 401, studentImport: 403, editorPreview: 200, editorConfirm: 201, importedStatus: article.status, studentDraftRead: 404, structuredBodyEdit: 400, structuredMetadataEdit: 200, notionExportPublicationWithoutApproval: 400, editorialApproval: 200, reimportClearsApproval: true, publicationAfterReimportWithoutReapproval: 400, bulkEditorialApproval: 200, bulkPublication: 200, bulkTopicPublication: 'PUBLISHED', studentPublishedRead: 200, editorialApprovalRevoke: 200, revokedArticleStatus: 'DRAFT', studentAfterRevoke: 404, editorDraftReview: 200 }, null, 2))
} finally {
  await stopServer(server)
  await prisma.article.deleteMany({ where: { sourceType: 'NOTION_EXPORT', sourceId: articleId } })
  await prisma.topic.deleteMany({ where: { sourceType: 'NOTION_EXPORT', sourceId: topicId } })
  if (editor) await prisma.user.deleteMany({ where: { id: editor.id } })
  if (student) await prisma.user.deleteMany({ where: { id: student.id } })
  await prisma.$disconnect()
}
