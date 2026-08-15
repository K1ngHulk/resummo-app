const DEFAULT_CONSTRAINED_MAX_RSS_MB = 430
const DEFAULT_CONSTRAINED_ARTICLE_BATCH_SIZE = 20

function runtimeError(message, code, statusCode = 503) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

export function resolveNotionImportRuntime(environment = process.env) {
  const configured = String(environment.RESUMMO_IMPORT_PROFILE || '').trim().toLowerCase()
  const profile = configured === 'constrained' ? 'constrained' : 'standard'
  const parsedMaxRss = Number(environment.RESUMMO_IMPORT_MAX_RSS_MB)
  const parsedBatchSize = Number(environment.RESUMMO_IMPORT_ARTICLE_BATCH_SIZE)

  return {
    profile,
    maxRssMb: Number.isFinite(parsedMaxRss) && parsedMaxRss >= 256
      ? parsedMaxRss
      : DEFAULT_CONSTRAINED_MAX_RSS_MB,
    articleBatchSize: Number.isInteger(parsedBatchSize) && parsedBatchSize >= 5 && parsedBatchSize <= 100
      ? parsedBatchSize
      : DEFAULT_CONSTRAINED_ARTICLE_BATCH_SIZE,
  }
}

export function currentRssMb() {
  return process.memoryUsage().rss / (1024 * 1024)
}

export async function waitForImportMemoryBudget(stage, {
  environment = process.env,
  attempts = 6,
  delayMs = 150,
} = {}) {
  const runtime = resolveNotionImportRuntime(environment)
  if (runtime.profile !== 'constrained') return { ...runtime, rssMb: currentRssMb() }

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const rssMb = currentRssMb()
    if (rssMb <= runtime.maxRssMb) return { ...runtime, rssMb }
    if (typeof globalThis.gc === 'function') globalThis.gc()
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  throw runtimeError(
    `La importación se pausó antes de exceder el presupuesto de memoria durante ${stage}. Reintenta la operación para continuar de forma segura.`,
    'IMPORT_MEMORY_BUDGET',
    503,
  )
}
