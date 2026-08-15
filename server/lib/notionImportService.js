import { normalizeNotionDocument } from './notionDocumentNormalizer.js'

const DEFAULT_NOTION_API_VERSION = '2026-03-11'
const DEFAULT_MAX_BLOCKS = 5000
const DEFAULT_MAX_DEPTH = 20

const INLINE_CHILD_TYPES = new Set([
  'paragraph',
  'heading_1',
  'heading_2',
  'heading_3',
  'heading_4',
  'bulleted_list_item',
  'numbered_list_item',
  'quote',
  'to_do',
  'toggle',
  'template',
  'synced_block',
  'callout',
  'table',
  'column_list',
  'column',
  'meeting_notes',
  'tab',
])

function createImportError(message, statusCode = 400, code = 'NOTION_IMPORT_ERROR') {
  const error = new Error(message)
  error.statusCode = statusCode
  error.code = code
  return error
}

function formatNotionPageId(compactId) {
  return `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20)}`.toLowerCase()
}

export function extractNotionPageId(value) {
  const input = String(value || '').trim()
  if (!input) throw createImportError('Pega una URL o ID de página de Notion válido')

  const uuidMatch = input.match(/\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b/)
  if (uuidMatch) return uuidMatch[1].toLowerCase()

  const compactMatches = [...input.matchAll(/([0-9a-fA-F]{32})(?![0-9a-fA-F])/g)]
  if (compactMatches.length > 0) {
    return formatNotionPageId(compactMatches[compactMatches.length - 1][1])
  }

  throw createImportError('No se pudo identificar el ID de la página de Notion')
}

function getTitleFromPage(page) {
  const properties = page?.properties && typeof page.properties === 'object' ? page.properties : {}
  const titleProperty = Object.values(properties).find((property) => property?.type === 'title')
  const titleItems = titleProperty?.title
  if (!Array.isArray(titleItems)) return 'Página sin título'
  const title = titleItems.map((item) => item?.plain_text || item?.text?.content || '').join('').trim()
  return title || 'Página sin título'
}

function mapNotionStatus(status) {
  if (status === 401) return { statusCode: 502, message: 'La conexión de Notion rechazó las credenciales configuradas' }
  if (status === 403) return { statusCode: 502, message: 'La conexión de Notion no tiene permiso para leer esta página' }
  if (status === 404) return { statusCode: 404, message: 'La página de Notion no existe o no está compartida con la integración de Resummo' }
  if (status === 429) return { statusCode: 503, message: 'Notion limitó temporalmente las solicitudes. Intenta nuevamente en unos minutos.' }
  return { statusCode: 502, message: 'Notion no pudo completar la solicitud' }
}

async function notionGet(path, { token, apiVersion, fetchImpl }) {
  const response = await fetchImpl(`https://api.notion.com/v1${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': apiVersion,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const mapped = mapNotionStatus(response.status)
    throw createImportError(mapped.message, mapped.statusCode, `NOTION_HTTP_${response.status}`)
  }

  return response.json()
}

function shouldFetchInlineChildren(block) {
  return Boolean(block?.has_children && INLINE_CHILD_TYPES.has(block.type))
}

function collectChildPages(blocks, parentPageId, output = []) {
  for (const block of blocks) {
    if (block.type === 'child_page') {
      output.push({
        pageId: block.id,
        parentPageId,
        title: block.child_page?.title || 'Página sin título',
      })
      continue
    }
    if (Array.isArray(block.children) && block.children.length > 0) {
      collectChildPages(block.children, parentPageId, output)
    }
  }
  return output
}

async function fetchBlockChildren(blockId, options, state, depth = 0) {
  if (depth > options.maxDepth) {
    throw createImportError(
      `La página supera la profundidad máxima segura de ${options.maxDepth} niveles`,
      422,
      'NOTION_MAX_DEPTH',
    )
  }

  const blocks = []
  let cursor = null

  do {
    const query = new URLSearchParams({ page_size: '100' })
    if (cursor) query.set('start_cursor', cursor)
    const payload = await notionGet(`/blocks/${blockId}/children?${query}`, options)

    for (const block of payload.results || []) {
      state.blockCount += 1
      if (state.blockCount > options.maxBlocks) {
        throw createImportError(
          `La página supera el máximo seguro de ${options.maxBlocks} bloques para una vista previa`,
          422,
          'NOTION_MAX_BLOCKS',
        )
      }

      const normalizedRawBlock = { ...block, children: [] }
      if (shouldFetchInlineChildren(block)) {
        normalizedRawBlock.children = await fetchBlockChildren(block.id, options, state, depth + 1)
      }
      blocks.push(normalizedRawBlock)
    }

    cursor = payload.has_more ? payload.next_cursor : null
  } while (cursor)

  return blocks
}

export async function fetchNotionPagePreview({
  pageUrl,
  token,
  fetchImpl = globalThis.fetch,
  apiVersion = DEFAULT_NOTION_API_VERSION,
  maxBlocks = DEFAULT_MAX_BLOCKS,
  maxDepth = DEFAULT_MAX_DEPTH,
}) {
  if (typeof fetchImpl !== 'function') {
    throw createImportError('El entorno no dispone de fetch para conectar con Notion', 500, 'FETCH_UNAVAILABLE')
  }

  const authToken = String(token || '').trim()
  if (!authToken) {
    throw createImportError(
      'La importación directa desde Notion todavía no está configurada en este entorno',
      503,
      'NOTION_TOKEN_MISSING',
    )
  }

  const pageId = extractNotionPageId(pageUrl)
  const options = { token: authToken, apiVersion, fetchImpl, maxBlocks, maxDepth }
  const page = await notionGet(`/pages/${pageId}`, options)
  const state = { blockCount: 0 }
  const blocks = await fetchBlockChildren(pageId, options, state)
  const title = getTitleFromPage(page)
  const normalized = normalizeNotionDocument({
    page: {
      id: page.id || pageId,
      url: page.url || pageUrl,
      title,
      last_edited_time: page.last_edited_time || null,
    },
    blocks,
  })

  return {
    page: {
      id: page.id || pageId,
      url: page.url || pageUrl,
      title,
      lastEditedAt: page.last_edited_time || null,
      parent: page.parent || null,
      properties: page.properties || {},
    },
    blockCount: state.blockCount,
    childPages: collectChildPages(blocks, page.id || pageId),
    ...normalized,
  }
}

export const NOTION_API_VERSION = DEFAULT_NOTION_API_VERSION
