const pendingEditorialPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i
const datePattern = /^\d{4}-\d{2}-\d{2}$/
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reviewStatuses = new Set(['DRAFT', 'CLINICAL_REVIEW', 'APPROVED', 'RETIRED'])

function validationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

function stripWrappingQuotes(value) {
  if (value.length < 2) return value
  const first = value[0]
  const last = value[value.length - 1]
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1)
  }
  return value
}

function splitInlineList(value) {
  const inner = value.slice(1, -1).trim()
  if (!inner) return []

  const items = []
  let current = ''
  let quote = null

  for (const character of inner) {
    if ((character === '"' || character === "'") && (!quote || quote === character)) {
      quote = quote ? null : character
      current += character
      continue
    }

    if (character === ',' && !quote) {
      items.push(stripWrappingQuotes(current.trim()))
      current = ''
      continue
    }

    current += character
  }

  if (current.trim()) items.push(stripWrappingQuotes(current.trim()))
  return items.filter(Boolean)
}

function parseScalar(value) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return splitInlineList(trimmed)
  if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true'
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed)
  return stripWrappingQuotes(trimmed)
}

function parseFrontmatterLines(lines) {
  const metadata = {}
  let activeListKey = null

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line.trim() || line.trimStart().startsWith('#')) continue

    const listItemMatch = line.match(/^\s*-\s+(.+)$/)
    if (listItemMatch && activeListKey) {
      if (!Array.isArray(metadata[activeListKey])) metadata[activeListKey] = []
      metadata[activeListKey].push(stripWrappingQuotes(listItemMatch[1].trim()))
      continue
    }

    const keyValueMatch = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!keyValueMatch) {
      throw validationError(`Frontmatter inválido cerca de: ${line.trim()}`)
    }

    const [, key, rawValue] = keyValueMatch
    if (!rawValue.trim()) {
      metadata[key] = []
      activeListKey = key
    } else {
      metadata[key] = parseScalar(rawValue)
      activeListKey = null
    }
  }

  return metadata
}

function normalizeTags(value) {
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  const tags = []
  const seen = new Set()
  for (const tag of source) {
    const humanTag = String(tag).trim()
    const key = humanTag.toLocaleLowerCase('es')
    if (humanTag && !seen.has(key)) {
      seen.add(key)
      tags.push(humanTag)
    }
  }
  return tags
}

function isValidDate(value) {
  if (!datePattern.test(String(value || ''))) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function forceDraftReviewStatus(content) {
  if (/^review_status:\s*.*$/m.test(content)) {
    return content.replace(/^review_status:\s*.*$/m, 'review_status: DRAFT')
  }

  const closingIndex = content.indexOf('\n---\n', 4)
  if (closingIndex < 0) return content
  return `${content.slice(0, closingIndex)}\nreview_status: DRAFT${content.slice(closingIndex)}`
}

export function parseArticleMarkdownDocument(content, { requireFrontmatter = false } = {}) {
  if (typeof content !== 'string') {
    throw validationError('El contenido Markdown debe ser texto')
  }

  const normalizedContent = content.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim()
  if (!normalizedContent) {
    throw validationError('El archivo Markdown está vacío')
  }

  if (!normalizedContent.startsWith('---\n')) {
    if (requireFrontmatter) {
      throw validationError('El archivo debe comenzar con frontmatter delimitado por ---')
    }
    return {
      hasFrontmatter: false,
      metadata: {},
      body: normalizedContent,
      normalizedContent,
    }
  }

  const lines = normalizedContent.split('\n')
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === '---')
  if (closingIndex < 0) {
    throw validationError('El frontmatter no tiene delimitador de cierre ---')
  }

  const metadata = parseFrontmatterLines(lines.slice(1, closingIndex))
  const body = lines.slice(closingIndex + 1).join('\n').trim()

  return {
    hasFrontmatter: true,
    metadata,
    body,
    normalizedContent,
  }
}

function getOptionalMetadataText(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).trim()
  return text || null
}

export function getArticleEditorialMetadata(content) {
  try {
    const document = parseArticleMarkdownDocument(content)
    if (!document.hasFrontmatter) return null

    const reviewStatus = getOptionalMetadataText(document.metadata.review_status)
    return {
      evidenceCutoff: getOptionalMetadataText(document.metadata.evidence_cutoff),
      reviewer: getOptionalMetadataText(document.metadata.reviewer),
      lastReviewed: getOptionalMetadataText(document.metadata.last_reviewed),
      reviewStatus: reviewStatus ? reviewStatus.toUpperCase() : null,
      educationalOnly: document.metadata.educational_only === true,
    }
  } catch {
    return null
  }
}

export function validateArticleMarkdownDocument(content, referenceData = {}) {
  const document = parseArticleMarkdownDocument(content, { requireFrontmatter: true })
  const { metadata, body } = document
  const hasTopicReferenceData = Array.isArray(referenceData.topics)
  const topics = hasTopicReferenceData ? referenceData.topics : []
  const existingArticles = Array.isArray(referenceData.existingArticles) ? referenceData.existingArticles : []
  const errors = []
  const warnings = []

  const title = String(metadata.title || '').trim()
  const slug = String(metadata.slug || '').trim()
  const topicSlug = String(metadata.topic_slug || '').trim()
  const summary = String(metadata.summary || '').trim()
  const readTimeMinutes = Number(metadata.read_time_minutes)
  const tags = normalizeTags(metadata.tags)
  const evidenceCutoff = getOptionalMetadataText(metadata.evidence_cutoff)
  const lastReviewed = getOptionalMetadataText(metadata.last_reviewed)
  const reviewer = getOptionalMetadataText(metadata.reviewer)
  const sourceReviewStatus = getOptionalMetadataText(metadata.review_status)
  const reviewStatus = sourceReviewStatus ? sourceReviewStatus.toUpperCase() : 'DRAFT'

  if (!title) errors.push('title es requerido')
  if (!slug) errors.push('slug es requerido')
  else if (!slugPattern.test(slug)) errors.push('slug debe usar minúsculas, números y guiones')
  if (!topicSlug) errors.push('topic_slug es requerido')
  if (!summary) errors.push('summary es requerido')
  if (!Number.isInteger(readTimeMinutes) || readTimeMinutes <= 0) {
    errors.push('read_time_minutes debe ser un entero positivo')
  }
  if (metadata.educational_only !== true) {
    errors.push('educational_only debe ser true')
  }
  if (!body) errors.push('el cuerpo del artículo está vacío')
  if (body && !/^##\s+\S.*$/m.test(body)) {
    errors.push('el cuerpo debe incluir al menos una sección con encabezado ##')
  }
  if (pendingEditorialPattern.test(body)) {
    errors.push('el cuerpo contiene pendientes editoriales o contenido placeholder')
  }

  if (!reviewStatuses.has(reviewStatus)) {
    errors.push('review_status debe ser DRAFT, CLINICAL_REVIEW, APPROVED o RETIRED')
  }

  if (!evidenceCutoff) {
    warnings.push('Falta evidence_cutoff; el artículo seguirá como borrador')
  } else if (!isValidDate(evidenceCutoff)) {
    errors.push('evidence_cutoff debe usar formato YYYY-MM-DD')
  }

  if (!lastReviewed) {
    warnings.push('Falta last_reviewed; no se mostrará una fecha de revisión')
  } else if (!isValidDate(lastReviewed)) {
    errors.push('last_reviewed debe usar formato YYYY-MM-DD')
  }

  if (!reviewer) {
    warnings.push('Falta reviewer; la interfaz mostrará revisión editorial pendiente')
  }

  if (reviewStatus !== 'DRAFT') {
    warnings.push('review_status se conserva como metadata, pero la importación siempre crea un borrador')
  }

  const topic = topics.find((candidate) => candidate.slug === topicSlug) || null
  if (hasTopicReferenceData && !topic) {
    errors.push(`El tema '${topicSlug}' no existe`)
  }

  const duplicateArticle = existingArticles.find((article) => article.slug === slug) || null
  if (duplicateArticle) {
    warnings.push('Ya existe un artículo con este slug; no se importará un duplicado')
  }

  const status = errors.length > 0 ? 'INVALID' : 'VALID'
  return {
    status,
    errors,
    warnings,
    duplicate: Boolean(duplicateArticle),
    article: status === 'VALID'
      ? {
          topicId: topic?.id || null,
          topicSlug,
          topicTitle: topic?.title || null,
          slug,
          title,
          summary,
          body: forceDraftReviewStatus(document.normalizedContent),
          readTimeMinutes,
          tags,
          status: 'DRAFT',
          editorial: {
            evidenceCutoff,
            reviewer,
            lastReviewed,
            reviewStatus,
            educationalOnly: true,
          },
        }
      : null,
  }
}

export function mapArticlePreviewToCreateData(preview) {
  if (preview.status !== 'VALID' || !preview.article) {
    throw validationError('Solo se puede importar un artículo Markdown válido')
  }
  if (!preview.article.topicId) {
    throw validationError('El artículo no tiene un tema válido asociado')
  }
  if (preview.duplicate) {
    const error = new Error('Ya existe un artículo con este slug')
    error.statusCode = 409
    throw error
  }

  return {
    topicId: preview.article.topicId,
    slug: preview.article.slug,
    title: preview.article.title,
    summary: preview.article.summary,
    body: preview.article.body,
    readTimeMinutes: preview.article.readTimeMinutes,
    tags: preview.article.tags,
    status: 'DRAFT',
  }
}
