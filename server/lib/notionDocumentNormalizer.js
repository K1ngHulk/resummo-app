const DOCUMENT_VERSION = 1

const TEXT_BLOCK_TYPES = new Set([
  'paragraph',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
  'to_do',
  'toggle',
  'callout',
  'code',
])

const MEDIA_BLOCK_TYPES = new Set(['image', 'video', 'pdf', 'file', 'audio'])

function normalizeId(value) {
  return String(value || '').trim()
}

export function createNotionAnchor(blockId) {
  const compactId = normalizeId(blockId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
  return `notion-${compactId || 'block'}`
}

function normalizeAnnotations(annotations = {}) {
  return {
    bold: Boolean(annotations.bold),
    italic: Boolean(annotations.italic),
    underline: Boolean(annotations.underline),
    strikethrough: Boolean(annotations.strikethrough),
    code: Boolean(annotations.code),
    color: annotations.color || 'default',
  }
}

function extractNotionIdFromUrl(url) {
  if (typeof url !== 'string' || !url) return null

  const matches = url.match(/([0-9a-fA-F]{32})(?:[?#/]|$)/g)
  if (!matches?.length) return null
  const compact = matches[matches.length - 1].match(/[0-9a-fA-F]{32}/)?.[0]
  if (!compact) return null

  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`.toLowerCase()
}

export function normalizeNotionRichText(items) {
  if (!Array.isArray(items)) return []

  return items.map((item) => {
    const base = {
      type: item?.type || 'text',
      plainText: String(item?.plain_text ?? item?.text?.content ?? item?.equation?.expression ?? ''),
      href: item?.href || item?.text?.link?.url || null,
      annotations: normalizeAnnotations(item?.annotations),
    }

    if (item?.type === 'mention') {
      const mention = item.mention || {}
      const mentionType = mention.type || null
      const mentionValue = mentionType ? mention[mentionType] : null
      return {
        ...base,
        mention: {
          type: mentionType,
          id: mentionValue?.id || null,
          value: mentionValue || null,
        },
      }
    }

    if (item?.type === 'equation') {
      return {
        ...base,
        equation: item.equation?.expression || base.plainText,
      }
    }

    return base
  })
}

function richTextToPlainText(richText) {
  return richText.map((item) => item.plainText).join('')
}

function normalizeCaption(value) {
  return normalizeNotionRichText(value?.caption)
}

function getRichTextContainer(block) {
  const value = block?.[block?.type]
  return value && typeof value === 'object' ? value : {}
}

function getBlockRichText(block) {
  return normalizeNotionRichText(getRichTextContainer(block).rich_text)
}

function normalizeColor(block) {
  return getRichTextContainer(block).color || 'default'
}

function normalizeAsset(block, assets) {
  const value = getRichTextContainer(block)
  const caption = normalizeCaption(value)
  const assetKey = `notion:${normalizeId(block.id)}`
  const sourceType = value.type || null
  const normalized = {
    assetKey,
    kind: block.type,
    caption,
    sourceType,
    externalUrl: null,
    notionFileUploadId: null,
  }

  if (sourceType === 'external') {
    normalized.externalUrl = value.external?.url || null
    return normalized
  }

  if (sourceType === 'file_upload') {
    normalized.notionFileUploadId = value.file_upload?.id || null
    assets.push({
      assetKey,
      blockId: block.id,
      kind: block.type,
      sourceType: 'file_upload',
      notionFileUploadId: normalized.notionFileUploadId,
      transientUrl: null,
      expiresAt: null,
      captionText: richTextToPlainText(caption),
      requiresControlledCopy: true,
    })
    return normalized
  }

  if (sourceType === 'file') {
    assets.push({
      assetKey,
      blockId: block.id,
      kind: block.type,
      sourceType: 'file',
      transientUrl: value.file?.url || null,
      expiresAt: value.file?.expiry_time || null,
      captionText: richTextToPlainText(caption),
      requiresControlledCopy: true,
    })
    return normalized
  }

  assets.push({
    assetKey,
    blockId: block.id,
    kind: block.type,
    sourceType: sourceType || 'unknown',
    transientUrl: null,
    expiresAt: null,
    captionText: richTextToPlainText(caption),
    requiresControlledCopy: true,
  })
  return normalized
}

function normalizeChildren(block, context) {
  if (!Array.isArray(block.children) || block.children.length === 0) return []
  return block.children.map((child) => normalizeBlock(child, context))
}

function normalizeHeading(block, level, context) {
  const value = getRichTextContainer(block)
  return {
    id: block.id,
    anchor: createNotionAnchor(block.id),
    type: 'heading',
    level,
    richText: getBlockRichText(block),
    color: value.color || 'default',
    isToggleable: Boolean(value.is_toggleable),
    children: normalizeChildren(block, context),
  }
}

function normalizeTextBlock(block, context) {
  const value = getRichTextContainer(block)
  const normalized = {
    id: block.id,
    anchor: createNotionAnchor(block.id),
    type: block.type,
    richText: getBlockRichText(block),
    color: value.color || 'default',
    children: normalizeChildren(block, context),
  }

  if (block.type === 'to_do') normalized.checked = Boolean(value.checked)
  if (block.type === 'callout') normalized.icon = value.icon || null
  if (block.type === 'code') normalized.language = value.language || 'plain text'
  return normalized
}

function normalizeLinkTarget(value) {
  if (!value || typeof value !== 'object') return { type: null, id: null }
  if (value.type === 'page_id') return { type: 'page', id: value.page_id || null }
  if (value.type === 'database_id') return { type: 'database', id: value.database_id || null }
  if (value.type === 'comment_id') return { type: 'comment', id: value.comment_id || null }
  return { type: value.type || null, id: null }
}

function normalizeUnsupportedBlock(block, context, sourceType = block.type) {
  context.warnings.push({
    code: 'UNSUPPORTED_NOTION_BLOCK',
    blockId: block.id,
    blockType: sourceType || 'unknown',
    message: `El bloque de Notion '${sourceType || 'unknown'}' no tiene una representación Resummo V1 completa.`,
  })

  return {
    id: block.id,
    anchor: createNotionAnchor(block.id),
    type: 'unsupported',
    sourceType: sourceType || 'unknown',
    children: normalizeChildren(block, context),
  }
}

function normalizeBlock(block, context) {
  if (!block || typeof block !== 'object') {
    return normalizeUnsupportedBlock({ id: '', type: 'invalid', children: [] }, context, 'invalid')
  }

  if (TEXT_BLOCK_TYPES.has(block.type)) {
    return normalizeTextBlock(block, context)
  }

  if (block.type === 'heading_1') return normalizeHeading(block, 1, context)
  if (block.type === 'heading_2') return normalizeHeading(block, 2, context)
  if (block.type === 'heading_3') return normalizeHeading(block, 3, context)
  if (block.type === 'heading_4') return normalizeHeading(block, 4, context)

  if (block.type === 'divider') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'divider',
      children: [],
    }
  }

  if (block.type === 'equation') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'equation',
      expression: getRichTextContainer(block).expression || '',
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'table') {
    const value = getRichTextContainer(block)
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'table',
      tableWidth: Number(value.table_width) || 0,
      hasColumnHeader: Boolean(value.has_column_header),
      hasRowHeader: Boolean(value.has_row_header),
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'table_row') {
    const cells = Array.isArray(getRichTextContainer(block).cells)
      ? getRichTextContainer(block).cells.map((cell) => normalizeNotionRichText(cell))
      : []
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'table_row',
      cells,
      children: [],
    }
  }

  if (MEDIA_BLOCK_TYPES.has(block.type)) {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'media',
      ...normalizeAsset(block, context.assets),
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'child_page') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'child_page',
      pageId: block.id,
      title: getRichTextContainer(block).title || 'Página sin título',
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'child_database') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'child_database',
      databaseId: block.id,
      title: getRichTextContainer(block).title || 'Base de datos sin título',
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'link_to_page') {
    const target = normalizeLinkTarget(getRichTextContainer(block))
    context.internalLinks.push({ blockId: block.id, ...target })
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'internal_link',
      target,
      children: [],
    }
  }

  if (block.type === 'synced_block') {
    const value = getRichTextContainer(block)
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'synced_block',
      syncedFromBlockId: value.synced_from?.block_id || null,
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'column_list') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'column_list',
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'column') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: 'column',
      widthRatio: getRichTextContainer(block).width_ratio ?? null,
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'bookmark' || block.type === 'embed' || block.type === 'link_preview') {
    const value = getRichTextContainer(block)
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: block.type,
      url: value.url || null,
      caption: normalizeCaption(value),
      children: normalizeChildren(block, context),
    }
  }

  if (block.type === 'table_of_contents' || block.type === 'breadcrumb') {
    return {
      id: block.id,
      anchor: createNotionAnchor(block.id),
      type: block.type,
      color: normalizeColor(block),
      children: [],
    }
  }

  if (block.type === 'unsupported') {
    return normalizeUnsupportedBlock(
      block,
      context,
      getRichTextContainer(block).block_type || 'unsupported',
    )
  }

  return normalizeUnsupportedBlock(block, context)
}

function getBlockOwnText(block) {
  if (Array.isArray(block.richText)) return richTextToPlainText(block.richText)
  if (block.type === 'equation') return block.expression || ''
  if (block.type === 'table_row') {
    return block.cells.map((cell) => richTextToPlainText(cell)).filter(Boolean).join(' | ')
  }
  if (block.type === 'media') return richTextToPlainText(block.caption || [])
  if (block.type === 'child_page' || block.type === 'child_database') return block.title || ''
  if (Array.isArray(block.caption)) return richTextToPlainText(block.caption)
  return ''
}

function collectPlainText(blocks) {
  const parts = []
  for (const block of blocks) {
    const text = getBlockOwnText(block).trim()
    if (text) parts.push(text)
    if (block.children?.length) {
      const childText = collectPlainText(block.children)
      if (childText) parts.push(childText)
    }
  }
  return parts.join('\n')
}

function collectHeadings(blocks) {
  const headings = []
  for (const block of blocks) {
    if (block.type === 'heading') {
      headings.push({
        blockId: block.id,
        anchor: block.anchor,
        level: block.level,
        text: richTextToPlainText(block.richText),
      })
    }
    if (block.children?.length) headings.push(...collectHeadings(block.children))
  }
  return headings
}

function collectInlineInternalLinks(richText, blockId, internalLinks) {
  for (const item of richText || []) {
    if (item.mention?.type === 'page' && item.mention.id) {
      internalLinks.push({ blockId, type: 'page', id: item.mention.id })
      continue
    }

    const linkedPageId = extractNotionIdFromUrl(item.href)
    if (linkedPageId) internalLinks.push({ blockId, type: 'page', id: linkedPageId })
  }
}

function collectRichTextLinks(blocks, internalLinks) {
  for (const block of blocks) {
    collectInlineInternalLinks(block.richText, block.id, internalLinks)
    if (block.type === 'table_row') {
      for (const cell of block.cells) collectInlineInternalLinks(cell, block.id, internalLinks)
    }
    collectInlineInternalLinks(block.caption, block.id, internalLinks)
    if (block.children?.length) collectRichTextLinks(block.children, internalLinks)
  }
}

function dedupeInternalLinks(links) {
  const seen = new Set()
  return links.filter((link) => {
    const key = `${link.blockId}:${link.type}:${link.id}`
    if (!link.id || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function buildSearchChunks(document) {
  const chunks = []
  const headingStack = []

  function visit(blocks) {
    for (const block of blocks) {
      if (block.type === 'heading') {
        headingStack.splice(block.level - 1)
        headingStack[block.level - 1] = getBlockOwnText(block).trim()
      }

      const text = getBlockOwnText(block).trim()
      if (text) {
        chunks.push({
          blockId: block.id,
          anchor: block.anchor,
          blockType: block.type,
          headingPath: headingStack.filter(Boolean),
          text,
        })
      }

      if (block.children?.length) visit(block.children)
    }
  }

  visit(document.blocks || [])
  return chunks
}

export function normalizeNotionDocument({ page, blocks }) {
  const context = { warnings: [], assets: [], internalLinks: [] }
  const normalizedBlocks = Array.isArray(blocks)
    ? blocks.map((block) => normalizeBlock(block, context))
    : []

  collectRichTextLinks(normalizedBlocks, context.internalLinks)

  const document = {
    version: DOCUMENT_VERSION,
    source: {
      type: 'NOTION',
      pageId: page?.id || null,
      url: page?.url || null,
      lastEditedAt: page?.last_edited_time || page?.lastEditedAt || null,
    },
    title: String(page?.title || '').trim(),
    blocks: normalizedBlocks,
    plainText: collectPlainText(normalizedBlocks),
    headings: collectHeadings(normalizedBlocks),
  }

  return {
    document,
    assets: context.assets,
    internalLinks: dedupeInternalLinks(context.internalLinks),
    warnings: context.warnings,
    searchChunks: buildSearchChunks(document),
  }
}

export const RESUMMO_DOCUMENT_VERSION = DOCUMENT_VERSION
