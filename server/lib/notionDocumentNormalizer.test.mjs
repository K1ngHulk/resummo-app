import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createNotionAnchor,
  normalizeNotionDocument,
  normalizeNotionRichText,
  RESUMMO_DOCUMENT_VERSION,
} from './notionDocumentNormalizer.js'

const richText = (content, annotations = {}, extra = {}) => ({
  type: 'text',
  plain_text: content,
  href: extra.href || null,
  annotations: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    color: 'default',
    ...annotations,
  },
  text: {
    content,
    link: extra.href ? { url: extra.href } : null,
  },
})

test('normalizes rich text without losing inline formatting or links', () => {
  const normalized = normalizeNotionRichText([
    richText('Importante', { bold: true, underline: true, color: 'red' }),
    richText(' referencia', { italic: true }, { href: 'https://example.com/reference' }),
  ])

  assert.equal(normalized[0].plainText, 'Importante')
  assert.equal(normalized[0].annotations.bold, true)
  assert.equal(normalized[0].annotations.underline, true)
  assert.equal(normalized[0].annotations.color, 'red')
  assert.equal(normalized[1].annotations.italic, true)
  assert.equal(normalized[1].href, 'https://example.com/reference')
})

test('builds a structured document, stable anchors, search chunks, links and unsupported warnings', () => {
  const headingId = '11111111-1111-4111-8111-111111111111'
  const paragraphId = '22222222-2222-4222-8222-222222222222'
  const linkedPageId = '33333333-3333-4333-8333-333333333333'
  const tableId = '44444444-4444-4444-8444-444444444444'
  const rowId = '55555555-5555-4555-8555-555555555555'
  const imageId = '66666666-6666-4666-8666-666666666666'
  const unsupportedId = '77777777-7777-4777-8777-777777777777'
  const temporaryImageUrl = 'https://prod-files-secure.s3.us-west-2.amazonaws.com/signed-image?token=temporary'

  const result = normalizeNotionDocument({
    page: {
      id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      url: 'https://www.notion.so/Example-aaaaaaaaaaaa4aaa8aaaaaaaaaaaaaaa',
      title: 'Insuficiencia cardíaca',
      last_edited_time: '2026-08-10T20:00:00.000Z',
    },
    blocks: [
      {
        id: headingId,
        type: 'heading_2',
        heading_2: {
          rich_text: [richText('Diagnóstico', { bold: true })],
          color: 'default',
          is_toggleable: false,
        },
        children: [],
      },
      {
        id: paragraphId,
        type: 'paragraph',
        paragraph: {
          rich_text: [
            richText('Los péptidos natriuréticos ayudan a contextualizar el diagnóstico. '),
            {
              type: 'mention',
              plain_text: 'Ver manejo',
              href: null,
              annotations: {},
              mention: { type: 'page', page: { id: linkedPageId } },
            },
          ],
          color: 'default',
        },
        children: [
          {
            id: '88888888-8888-4888-8888-888888888888',
            type: 'callout',
            callout: {
              rich_text: [richText('Interpretar según contexto clínico y objetivo educativo.')],
              icon: { type: 'emoji', emoji: '💡' },
              color: 'yellow_background',
            },
            children: [],
          },
        ],
      },
      {
        id: tableId,
        type: 'table',
        table: {
          table_width: 2,
          has_column_header: true,
          has_row_header: false,
        },
        children: [
          {
            id: rowId,
            type: 'table_row',
            table_row: {
              cells: [
                [richText('Marcador')],
                [richText('Utilidad')],
              ],
            },
            children: [],
          },
        ],
      },
      {
        id: imageId,
        type: 'image',
        image: {
          type: 'file',
          file: {
            url: temporaryImageUrl,
            expiry_time: '2026-08-10T22:00:00.000Z',
          },
          caption: [richText('Algoritmo diagnóstico')],
        },
        children: [],
      },
      {
        id: '99999999-9999-4999-8999-999999999999',
        type: 'link_to_page',
        link_to_page: {
          type: 'page_id',
          page_id: linkedPageId,
        },
        children: [],
      },
      {
        id: unsupportedId,
        type: 'unsupported',
        unsupported: { block_type: 'button' },
        children: [],
      },
    ],
  })

  assert.equal(result.document.version, RESUMMO_DOCUMENT_VERSION)
  assert.equal(result.document.source.type, 'NOTION')
  assert.equal(result.document.title, 'Insuficiencia cardíaca')
  assert.equal(result.document.blocks[0].type, 'heading')
  assert.equal(result.document.blocks[0].level, 2)
  assert.equal(result.document.blocks[0].anchor, createNotionAnchor(headingId))
  assert.equal(result.document.blocks[1].children[0].type, 'callout')
  assert.equal(result.document.blocks[2].type, 'table')
  assert.equal(result.document.blocks[2].children[0].type, 'table_row')
  assert.equal(result.document.blocks[3].type, 'media')
  assert.equal(result.document.blocks[3].externalUrl, null)
  assert.equal(result.document.blocks[3].assetKey, `notion:${imageId}`)
  assert.equal(result.assets[0].transientUrl, temporaryImageUrl)
  assert.equal(result.assets[0].requiresControlledCopy, true)
  assert.equal(JSON.stringify(result.document).includes(temporaryImageUrl), false)
  assert.equal(result.warnings.length, 1)
  assert.equal(result.warnings[0].blockType, 'button')

  assert.deepEqual(
    result.internalLinks.map(({ type, id }) => ({ type, id })),
    [
      { type: 'page', id: linkedPageId },
      { type: 'page', id: linkedPageId },
    ],
  )

  const paragraphChunk = result.searchChunks.find((chunk) => chunk.blockId === paragraphId)
  assert.ok(paragraphChunk)
  assert.deepEqual(paragraphChunk.headingPath, ['Diagnóstico'])
  assert.match(paragraphChunk.text, /péptidos natriuréticos/)
  assert.equal(paragraphChunk.anchor, createNotionAnchor(paragraphId))

  const tableChunk = result.searchChunks.find((chunk) => chunk.blockId === rowId)
  assert.equal(tableChunk.text, 'Marcador | Utilidad')
  assert.deepEqual(tableChunk.headingPath, ['Diagnóstico'])
  assert.match(result.document.plainText, /Algoritmo diagnóstico/)
})

test('keeps transient Notion-hosted asset URLs outside the persistable document', () => {
  const temporaryUrl = 'https://secure.notion-static.com/file?signature=temporary'
  const { document, assets } = normalizeNotionDocument({
    page: { id: 'page', title: 'Asset test' },
    blocks: [
      {
        id: 'asset-block',
        type: 'file',
        file: {
          type: 'file',
          file: { url: temporaryUrl, expiry_time: '2026-08-10T22:00:00.000Z' },
          caption: [],
        },
        children: [],
      },
    ],
  })

  assert.equal(JSON.stringify(document).includes(temporaryUrl), false)
  assert.equal(assets[0].transientUrl, temporaryUrl)
  assert.equal(assets[0].requiresControlledCopy, true)
})
