const EXPECTED_CORPUS = Object.freeze({
  topics: 35,
  articles: 427,
  assets: 386,
  internalLinks: 462,
  brokenInternalLinks: 0,
  missingAssets: 0,
  emptyArticles: 0,
})

function gateError(message, details) {
  const error = new Error(message)
  error.code = 'NOTION_CORPUS_GATE_FAILED'
  error.statusCode = 409
  error.details = details
  return error
}

export const expectedNotionCorpus = EXPECTED_CORPUS

export function compareNotionExportStats(stats, expected = EXPECTED_CORPUS) {
  return Object.entries(expected)
    .filter(([key, value]) => Number(stats?.[key]) !== value)
    .map(([key, value]) => ({ key, expected: value, actual: Number(stats?.[key]) }))
}

export function assertExpectedNotionExportStats(stats, expected = EXPECTED_CORPUS) {
  const mismatches = compareNotionExportStats(stats, expected)
  if (mismatches.length > 0) {
    throw gateError('El export de Notion no coincide con el corpus auditado de RESUMMO MIR.', mismatches)
  }
  return true
}

export function assertExpectedNotionPersistence(validation, expected = EXPECTED_CORPUS) {
  const required = {
    topics: expected.topics,
    articles: expected.articles,
    published: 0,
    emptyPlainText: 0,
    emptyContentJson: 0,
    duplicateSourceIds: 0,
    articlesWithoutTopic: 0,
    uniqueAssetFilesReferenced: expected.assets,
    missingAssetFiles: 0,
  }
  const mismatches = Object.entries(required)
    .filter(([key, value]) => Number(validation?.[key]) !== value)
    .map(([key, value]) => ({ key, expected: value, actual: Number(validation?.[key]) }))
  if (mismatches.length > 0) {
    throw gateError('La persistencia cloud no coincide con el corpus esperado de RESUMMO MIR.', mismatches)
  }
  return true
}
