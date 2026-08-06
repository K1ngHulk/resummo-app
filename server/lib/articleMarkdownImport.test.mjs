import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getArticleEditorialMetadata,
  mapArticlePreviewToCreateData,
  parseArticleMarkdownDocument,
  validateArticleMarkdownDocument,
} from './articleMarkdownImport.js'

const validMarkdown = `---
title: "Principios de farmacocinética"
slug: principios-farmacocinetica
topic_slug: pharmacology-basics
summary: "Introducción educativa a absorción, distribución, metabolismo y eliminación."
read_time_minutes: 7
tags: [Farmacología, Fundamentos]
educational_only: true
evidence_cutoff: 2026-07-01
last_reviewed: 2026-07-15
reviewer: "Equipo editorial de prueba"
review_status: CLINICAL_REVIEW
---

## Objetivo de aprendizaje

Reconocer los procesos generales que modifican la concentración de un medicamento en el organismo.

## Conceptos clave

La farmacocinética describe de forma general qué ocurre con una sustancia desde su administración hasta su eliminación.`

const referenceData = {
  topics: [{ id: 'topic-1', slug: 'pharmacology-basics', title: 'Farmacología básica' }],
  existingArticles: [],
}

test('parses frontmatter and keeps the markdown body intact', () => {
  const parsed = parseArticleMarkdownDocument(validMarkdown, { requireFrontmatter: true })

  assert.equal(parsed.hasFrontmatter, true)
  assert.equal(parsed.metadata.title, 'Principios de farmacocinética')
  assert.deepEqual(parsed.metadata.tags, ['Farmacología', 'Fundamentos'])
  assert.match(parsed.body, /^## Objetivo de aprendizaje/m)
})

test('validates a Notion-style Markdown export and maps it to a DRAFT article', () => {
  const preview = validateArticleMarkdownDocument(validMarkdown, referenceData)
  const createData = mapArticlePreviewToCreateData(preview)

  assert.equal(preview.status, 'VALID')
  assert.equal(preview.duplicate, false)
  assert.equal(createData.topicId, 'topic-1')
  assert.equal(createData.status, 'DRAFT')
  assert.equal(createData.slug, 'principios-farmacocinetica')
  assert.match(createData.body, /^review_status: DRAFT$/m)
  assert.deepEqual(createData.tags, ['Farmacología', 'Fundamentos'])
})

test('normalizes empty editorial fields into honest preview warnings', () => {
  const incomplete = validMarkdown
    .replace('last_reviewed: 2026-07-15', 'last_reviewed:')
    .replace('reviewer: "Equipo editorial de prueba"', 'reviewer:')

  const preview = validateArticleMarkdownDocument(incomplete, referenceData)

  assert.equal(preview.status, 'VALID')
  assert.equal(preview.article.editorial.lastReviewed, null)
  assert.equal(preview.article.editorial.reviewer, null)
  assert.ok(preview.warnings.some((warning) => warning.includes('last_reviewed')))
  assert.ok(preview.warnings.some((warning) => warning.includes('reviewer')))
})

test('blocks missing educational scope and unresolved editorial markers', () => {
  const invalid = validMarkdown
    .replace('educational_only: true', 'educational_only: false')
    .replace('Reconocer los procesos generales', '[FALTA CITA] Reconocer los procesos generales')

  const preview = validateArticleMarkdownDocument(invalid, referenceData)

  assert.equal(preview.status, 'INVALID')
  assert.ok(preview.errors.some((error) => error.includes('educational_only')))
  assert.ok(preview.errors.some((error) => error.includes('pendientes editoriales')))
})

test('keeps unknown topics and duplicate slugs from being confirmed', () => {
  const missingTopic = validateArticleMarkdownDocument(validMarkdown, {
    topics: [],
    existingArticles: [],
  })
  assert.equal(missingTopic.status, 'INVALID')
  assert.ok(missingTopic.errors.some((error) => error.includes('no existe')))
  assert.throws(() => mapArticlePreviewToCreateData(missingTopic), /válido/)

  const duplicate = validateArticleMarkdownDocument(validMarkdown, {
    ...referenceData,
    existingArticles: [{ id: 'article-1', slug: 'principios-farmacocinetica' }],
  })
  assert.equal(duplicate.status, 'VALID')
  assert.equal(duplicate.duplicate, true)
  assert.throws(() => mapArticlePreviewToCreateData(duplicate), /Ya existe/)
})

test('extracts human editorial metadata for article rendering', () => {
  assert.deepEqual(getArticleEditorialMetadata(validMarkdown), {
    evidenceCutoff: '2026-07-01',
    reviewer: 'Equipo editorial de prueba',
    lastReviewed: '2026-07-15',
    reviewStatus: 'CLINICAL_REVIEW',
    educationalOnly: true,
  })

  assert.equal(getArticleEditorialMetadata('## Contenido\n\nTexto sin frontmatter.'), null)
})
