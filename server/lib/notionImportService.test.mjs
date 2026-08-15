import assert from 'node:assert/strict'
import test from 'node:test'
import {
  extractNotionPageId,
  fetchNotionPagePreview,
  NOTION_API_VERSION,
} from './notionImportService.js'

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return payload
    },
  }
}

const richText = (content) => ([{
  type: 'text',
  plain_text: content,
  href: null,
  annotations: {
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    color: 'default',
  },
  text: { content, link: null },
}])

test('extracts page IDs from Resummo-style Notion URLs and raw UUIDs', () => {
  assert.equal(
    extractNotionPageId('https://app.notion.com/p/resummo/RESUMMO-MIR-38f28574650f80b8beb4e4370b19402b'),
    '38f28574-650f-80b8-beb4-e4370b19402b',
  )
  assert.equal(
    extractNotionPageId('38f28574-650f-80b8-beb4-e4370b19402b'),
    '38f28574-650f-80b8-beb4-e4370b19402b',
  )
})

test('fetches paginated and nested blocks but keeps child pages as hierarchy nodes', async () => {
  const calls = []
  const rootId = '38f28574-650f-80b8-beb4-e4370b19402b'
  const headingId = '11111111-1111-4111-8111-111111111111'
  const calloutId = '22222222-2222-4222-8222-222222222222'
  const childPageId = '33333333-3333-4333-8333-333333333333'

  const fetchImpl = async (url, options) => {
    calls.push({ url, options })

    if (url.endsWith(`/pages/${rootId}`)) {
      return jsonResponse({
        id: rootId,
        url: `https://www.notion.so/${rootId.replaceAll('-', '')}`,
        last_edited_time: '2026-08-10T20:00:00.000Z',
        parent: { type: 'workspace', workspace: true },
        properties: {
          Name: { type: 'title', title: richText('RESUMMO MIR') },
        },
      })
    }

    if (url.includes(`/blocks/${rootId}/children?`) && !url.includes('start_cursor=')) {
      return jsonResponse({
        results: [
          {
            id: headingId,
            type: 'heading_1',
            has_children: false,
            heading_1: { rich_text: richText('Cardiología'), color: 'default', is_toggleable: false },
          },
        ],
        has_more: true,
        next_cursor: 'cursor-2',
      })
    }

    if (url.includes(`/blocks/${rootId}/children?`) && url.includes('start_cursor=cursor-2')) {
      return jsonResponse({
        results: [
          {
            id: calloutId,
            type: 'callout',
            has_children: true,
            callout: { rich_text: richText('Punto clave'), color: 'yellow_background', icon: null },
          },
          {
            id: childPageId,
            type: 'child_page',
            has_children: true,
            child_page: { title: 'Insuficiencia cardíaca' },
          },
        ],
        has_more: false,
        next_cursor: null,
      })
    }

    if (url.includes(`/blocks/${calloutId}/children?`)) {
      return jsonResponse({
        results: [
          {
            id: '44444444-4444-4444-8444-444444444444',
            type: 'paragraph',
            has_children: false,
            paragraph: { rich_text: richText('Contenido anidado'), color: 'default' },
          },
        ],
        has_more: false,
        next_cursor: null,
      })
    }

    throw new Error(`Unexpected URL: ${url}`)
  }

  const preview = await fetchNotionPagePreview({
    pageUrl: 'https://app.notion.com/p/resummo/RESUMMO-MIR-38f28574650f80b8beb4e4370b19402b',
    token: 'test-token',
    fetchImpl,
  })

  assert.equal(preview.page.title, 'RESUMMO MIR')
  assert.equal(preview.blockCount, 4)
  assert.equal(preview.document.blocks.length, 3)
  assert.equal(preview.document.blocks[1].children.length, 1)
  assert.deepEqual(preview.childPages, [{
    pageId: childPageId,
    parentPageId: rootId,
    title: 'Insuficiencia cardíaca',
  }])
  assert.equal(preview.searchChunks.some((chunk) => chunk.text === 'Contenido anidado'), true)
  assert.equal(calls.some((call) => call.url.includes(`/blocks/${childPageId}/children`)), false)
  assert.equal(calls[0].options.headers['Notion-Version'], NOTION_API_VERSION)
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token')
})

test('returns a safe configuration error when the direct Notion token is missing', async () => {
  await assert.rejects(
    fetchNotionPagePreview({ pageUrl: '38f28574-650f-80b8-beb4-e4370b19402b', token: '' }),
    (error) => error.statusCode === 503 && error.code === 'NOTION_TOKEN_MISSING',
  )
})

test('maps inaccessible Notion pages to a human-safe 404', async () => {
  const fetchImpl = async () => jsonResponse({ object: 'error', message: 'secret upstream detail' }, 404)

  await assert.rejects(
    fetchNotionPagePreview({
      pageUrl: '38f28574-650f-80b8-beb4-e4370b19402b',
      token: 'test-token',
      fetchImpl,
    }),
    (error) => (
      error.statusCode === 404
      && error.code === 'NOTION_HTTP_404'
      && !error.message.includes('secret upstream detail')
    ),
  )
})
