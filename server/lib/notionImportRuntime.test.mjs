import assert from 'node:assert/strict'
import test from 'node:test'
import {
  assertExpectedNotionExportStats,
  assertExpectedNotionPersistence,
  compareNotionExportStats,
  expectedNotionCorpus,
} from './notionImportRuntime.js'

test('accepts the audited RESUMMO MIR export gate', () => {
  assert.deepEqual(compareNotionExportStats(expectedNotionCorpus), [])
  assert.equal(assertExpectedNotionExportStats(expectedNotionCorpus), true)
})

test('rejects a corpus whose audited counts drift', () => {
  assert.throws(
    () => assertExpectedNotionExportStats({ ...expectedNotionCorpus, articles: 426 }),
    (error) => error.code === 'NOTION_CORPUS_GATE_FAILED' && error.details?.[0]?.key === 'articles',
  )
})

test('accepts only complete DRAFT persistence with all referenced assets', () => {
  assert.equal(assertExpectedNotionPersistence({
    topics: 35,
    articles: 427,
    published: 0,
    emptyPlainText: 0,
    emptyContentJson: 0,
    duplicateSourceIds: 0,
    articlesWithoutTopic: 0,
    uniqueAssetFilesReferenced: 386,
    missingAssetFiles: 0,
  }), true)
})
