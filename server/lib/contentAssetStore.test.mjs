import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  cleanupCreatedContentAssets,
  ensureContentAssetStore,
  findMissingContentAssets,
  loadContentAsset,
  parseContentAssetFileName,
  persistContentAssets,
  resolveContentAssetBackend,
} from './contentAssetStore.js'

function assetFrom(data, extension = '.png', mimeType = 'image/png') {
  const buffer = Buffer.from(data)
  return {
    checksum: crypto.createHash('sha256').update(buffer).digest('hex'),
    extension,
    mimeType,
    sizeBytes: buffer.length,
    data: buffer,
  }
}

test('keeps the local content-addressed asset backend idempotent and reversible', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'resummo-assets-'))
  const environment = {
    RESUMMO_CONTENT_ASSET_BACKEND: 'local',
    RESUMMO_CONTENT_ASSET_DIR: directory,
  }
  const asset = assetFrom('asset-content')
  const fileName = `${asset.checksum}${asset.extension}`

  try {
    const first = await persistContentAssets([asset, asset], { environment })
    assert.equal(first.uniqueCount, 1)
    assert.deepEqual(first.created, [fileName])
    assert.deepEqual(first.existing, [])

    const second = await persistContentAssets([asset], { environment })
    assert.deepEqual(second.created, [])
    assert.deepEqual(second.existing, [fileName])
    assert.deepEqual(await findMissingContentAssets([fileName], { environment }), [])

    const loaded = await loadContentAsset(fileName, { environment })
    assert.equal(loaded.mimeType, 'image/png')
    assert.deepEqual(loaded.data, asset.data)

    await cleanupCreatedContentAssets(first, { environment })
    assert.deepEqual(await findMissingContentAssets([fileName], { environment }), [fileName])
  } finally {
    await fs.rm(directory, { recursive: true, force: true })
  }
})

test('rejects invalid asset filenames before touching storage', () => {
  assert.equal(parseContentAssetFileName('../secret.png'), null)
  assert.equal(parseContentAssetFileName('not-a-hash.png'), null)
  assert.equal(parseContentAssetFileName(`${'a'.repeat(64)}.svg`), null)
  assert.equal(parseContentAssetFileName(`${'a'.repeat(64)}.png`)?.mimeType, 'image/png')
})

test('uses the Supabase bridge for create, dedupe, validation and rollback', async () => {
  const environment = {
    RESUMMO_CONTENT_ASSET_BACKEND: 'supabase',
    RESUMMO_STORAGE_BRIDGE_URL: 'https://project.supabase.co/functions/v1/resummo-content-assets',
    RESUMMO_STORAGE_BRIDGE_TOKEN: 'test-token-that-must-not-appear-in-errors',
  }
  const asset = assetFrom('remote-content')
  const fileName = `${asset.checksum}${asset.extension}`
  const requests = []
  let putCount = 0

  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, method: options.method || 'GET', token: options.headers?.['x-resummo-storage-token'] })
    if (options.method === 'PUT') {
      putCount += 1
      return new Response(null, { status: putCount === 1 ? 201 : 200 })
    }
    if (options.method === 'HEAD') return new Response(null, { status: 200 })
    if (options.method === 'DELETE') return new Response(null, { status: 204 })
    return new Response(asset.data, { status: 200, headers: { 'content-type': asset.mimeType } })
  }

  const created = await persistContentAssets([asset], { environment, fetchImpl })
  const existing = await persistContentAssets([asset], { environment, fetchImpl })
  assert.deepEqual(created.created, [fileName])
  assert.deepEqual(existing.existing, [fileName])
  assert.deepEqual(await findMissingContentAssets([fileName], { environment, fetchImpl }), [])

  const loaded = await loadContentAsset(fileName, { environment, fetchImpl })
  assert.deepEqual(loaded.data, asset.data)
  await cleanupCreatedContentAssets(created, { environment, fetchImpl })

  assert.ok(requests.every((request) => request.token === environment.RESUMMO_STORAGE_BRIDGE_TOKEN))
  assert.ok(requests.some((request) => request.method === 'DELETE'))
})

test('ensures the remote private bucket through the bridge', async () => {
  const environment = {
    RESUMMO_CONTENT_ASSET_BACKEND: 'supabase',
    RESUMMO_STORAGE_BRIDGE_URL: 'https://project.supabase.co/functions/v1/resummo-content-assets',
    RESUMMO_STORAGE_BRIDGE_TOKEN: 'test-token',
  }
  const result = await ensureContentAssetStore({
    environment,
    fetchImpl: async (url, options = {}) => {
      assert.equal(url, `${environment.RESUMMO_STORAGE_BRIDGE_URL}/ensure-bucket`)
      assert.equal(options.method, 'POST')
      assert.equal(options.headers?.['x-resummo-storage-token'], environment.RESUMMO_STORAGE_BRIDGE_TOKEN)
      return new Response(JSON.stringify({ ok: true, private: true, created: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    },
  })
  assert.deepEqual(result, { backend: 'supabase', ready: true, created: true })
})

test('verifies remote bytes against the content-addressed filename', async () => {
  const expected = assetFrom('expected')
  const environment = {
    RESUMMO_CONTENT_ASSET_BACKEND: 'supabase',
    RESUMMO_STORAGE_BRIDGE_URL: 'https://project.supabase.co/functions/v1/resummo-content-assets',
    RESUMMO_STORAGE_BRIDGE_TOKEN: 'test-token',
  }
  const fetchImpl = async () => new Response(Buffer.from('tampered'), { status: 200, headers: { 'content-type': 'image/png' } })

  await assert.rejects(
    loadContentAsset(`${expected.checksum}${expected.extension}`, { environment, fetchImpl }),
    (error) => error.code === 'ASSET_STORAGE_INTEGRITY_ERROR',
  )
})

test('requires complete bridge configuration without leaking the token', async () => {
  assert.equal(resolveContentAssetBackend({ RESUMMO_STORAGE_BRIDGE_URL: 'https://example.com' }), 'supabase')
  await assert.rejects(
    findMissingContentAssets([`${'a'.repeat(64)}.png`], {
      environment: {
        RESUMMO_CONTENT_ASSET_BACKEND: 'supabase',
        RESUMMO_STORAGE_BRIDGE_URL: 'https://example.com',
      },
      fetchImpl: async () => new Response(null, { status: 500 }),
    }),
    (error) => error.code === 'ASSET_STORAGE_NOT_CONFIGURED' && !error.message.includes('token'),
  )
})
