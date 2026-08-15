import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveNotionImportRuntime } from './notionImportRuntime.js'

test('defaults to the removable standard import profile', () => {
  const runtime = resolveNotionImportRuntime({})
  assert.equal(runtime.profile, 'standard')
  assert.equal(runtime.maxRssMb, 430)
  assert.equal(runtime.articleBatchSize, 20)
})

test('enables constrained import limits from environment without accepting unsafe values', () => {
  const runtime = resolveNotionImportRuntime({
    RESUMMO_IMPORT_PROFILE: 'constrained',
    RESUMMO_IMPORT_MAX_RSS_MB: '410',
    RESUMMO_IMPORT_ARTICLE_BATCH_SIZE: '15',
  })
  assert.deepEqual(runtime, {
    profile: 'constrained',
    maxRssMb: 410,
    articleBatchSize: 15,
  })

  const guarded = resolveNotionImportRuntime({
    RESUMMO_IMPORT_PROFILE: 'constrained',
    RESUMMO_IMPORT_MAX_RSS_MB: '128',
    RESUMMO_IMPORT_ARTICLE_BATCH_SIZE: '500',
  })
  assert.equal(guarded.maxRssMb, 430)
  assert.equal(guarded.articleBatchSize, 20)
})
