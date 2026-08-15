import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNotionExportImportAllowed, getArticlePublicationIssues } from './adminContentRoutes.js'

const topic = { status: 'PUBLISHED' }
const baseArticle = {
  title: 'Artículo educativo',
  summary: 'Resumen estructurado.',
  readTimeMinutes: 5,
}

function bodyWithFrontmatter(overrides = {}) {
  const metadata = {
    review_status: 'DRAFT',
    reviewer: '',
    last_reviewed: '',
    evidence_cutoff: '2026-07-01',
    educational_only: 'true',
    ...overrides,
  }

  return `---
review_status: ${metadata.review_status}
reviewer: "${metadata.reviewer}"
last_reviewed: ${metadata.last_reviewed}
evidence_cutoff: ${metadata.evidence_cutoff}
educational_only: ${metadata.educational_only}
---

## Contenido

Texto educativo revisable.`
}

test('allows a normal Notion export import against a remote production database', () => {
  assert.doesNotThrow(() => assertNotionExportImportAllowed({
    replaceEditorial: false,
    databaseUrl: 'postgresql://resummo_app.example:secret@pooler.supabase.com:5432/postgres',
  }))
})

test('keeps destructive editorial replacement restricted to the local Resummo database', () => {
  assert.throws(
    () => assertNotionExportImportAllowed({
      replaceEditorial: true,
      databaseUrl: 'postgresql://resummo_app.example:secret@pooler.supabase.com:5432/postgres',
    }),
    (error) => error.code === 'LOCAL_DATABASE_REQUIRED',
  )
})

test('keeps legacy articles publishable when their existing fields are complete', () => {
  const issues = getArticlePublicationIssues({
    ...baseArticle,
    body: '## Contenido\n\nTexto educativo heredado.',
  }, topic)

  assert.deepEqual(issues, [])
})

test('accepts a generic structured section without requiring Markdown ## syntax', () => {
  const issues = getArticlePublicationIssues({
    ...baseArticle,
    body: '# Título\n\nTexto estructurado.',
    contentJson: {
      headings: [{ level: 2, anchor: 'h-section', text: 'Sección estructurada' }],
    },
  }, topic)

  assert.deepEqual(issues, [])
})

test('blocks publishing a NOTION_EXPORT article until the current snapshot has explicit editorial approval', () => {
  const article = {
    ...baseArticle,
    body: '# Título\n\nTexto importado.',
    sourceType: 'NOTION_EXPORT',
    sourceSnapshotHash: 'snapshot-current',
    contentJson: {
      headings: [{ level: 2, anchor: 'h-section', text: 'Sección estructurada' }],
    },
  }

  const missingApproval = getArticlePublicationIssues(article, topic)
  assert.ok(missingApproval.includes('el articulo importado desde Notion requiere aprobacion editorial explicita para el snapshot actual antes de publicar'))

  const staleApproval = getArticlePublicationIssues({
    ...article,
    editorialApprovedAt: new Date('2026-08-11T00:00:00Z'),
    editorialApprovedByUserId: 'editor-id',
    editorialApprovedSnapshotHash: 'snapshot-old',
  }, topic)
  assert.ok(staleApproval.includes('el articulo importado desde Notion requiere aprobacion editorial explicita para el snapshot actual antes de publicar'))

  const approved = getArticlePublicationIssues({
    ...article,
    editorialApprovedAt: new Date('2026-08-11T00:00:00Z'),
    editorialApprovedByUserId: 'editor-id',
    editorialApprovedSnapshotHash: 'snapshot-current',
  }, topic)
  assert.ok(!approved.some((issue) => issue.includes('requiere aprobacion editorial explicita')))
})

test('allows a library-level publication check to ignore only the pending snapshot approval', () => {
  const article = {
    ...baseArticle,
    body: '# Título\n\nTexto importado.',
    sourceType: 'NOTION_EXPORT',
    sourceSnapshotHash: 'snapshot-current',
    contentJson: {
      blocks: [{ type: 'paragraph', children: [{ type: 'text', value: 'Texto importado.' }] }],
      headings: [],
    },
  }

  assert.deepEqual(
    getArticlePublicationIssues(article, topic, { ignoreEditorialApproval: true }),
    [],
  )
})

test('blocks imported Markdown while editorial approval metadata is incomplete', () => {
  const issues = getArticlePublicationIssues({
    ...baseArticle,
    body: bodyWithFrontmatter(),
  }, topic)

  assert.ok(issues.includes('la revision editorial no esta aprobada'))
  assert.ok(issues.includes('falta el revisor responsable'))
  assert.ok(issues.includes('falta la fecha de revision'))
})

test('does not treat normal Spanish uses of todo or pendiente as editorial markers', () => {
  const issues = getArticlePublicationIssues({
    ...baseArticle,
    body: '## Contenido\n\nTodo paciente debe ser evaluado según el contexto y puede quedar pendiente de seguimiento clínico.',
  }, topic)

  assert.deepEqual(issues, [])
})

test('still blocks explicit TODO editorial markers', () => {
  const issues = getArticlePublicationIssues({
    ...baseArticle,
    body: '## Contenido\n\nTODO: completar la revisión editorial.',
  }, topic)

  assert.ok(issues.includes('el cuerpo contiene citas o pendientes editoriales'))
})

test('accepts imported Markdown only with approved and complete editorial metadata', () => {
  const issues = getArticlePublicationIssues({
    ...baseArticle,
    body: bodyWithFrontmatter({
      review_status: 'APPROVED',
      reviewer: 'Revisor clínico autorizado',
      last_reviewed: '2026-08-06',
    }),
  }, topic)

  assert.deepEqual(issues, [])
})
