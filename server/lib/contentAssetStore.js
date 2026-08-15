import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const assetFilePattern = /^(?<checksum>[a-f0-9]{64})(?<extension>\.(?:png|jpg|gif|webp))$/
const mimeTypes = new Map([
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.gif', 'image/gif'],
  ['.webp', 'image/webp'],
])

function assetError(message, code, statusCode = 500) {
  const error = new Error(message)
  error.code = code
  error.statusCode = statusCode
  return error
}

export function resolveContentAssetBackend(environment = process.env) {
  const configured = String(environment.RESUMMO_CONTENT_ASSET_BACKEND || '').trim().toLowerCase()
  if (!configured) {
    return environment.RESUMMO_STORAGE_BRIDGE_URL || environment.RESUMMO_STORAGE_BRIDGE_TOKEN ? 'supabase' : 'local'
  }
  if (!['local', 'supabase'].includes(configured)) {
    throw assetError('RESUMMO_CONTENT_ASSET_BACKEND debe ser local o supabase.', 'INVALID_ASSET_BACKEND')
  }
  return configured
}

function localAssetDirectory(environment) {
  return environment.RESUMMO_CONTENT_ASSET_DIR || path.resolve(process.cwd(), '.runtime', 'content-assets')
}

export function parseContentAssetFileName(fileName) {
  const match = assetFilePattern.exec(String(fileName || '').trim().toLowerCase())
  if (!match) return null
  return {
    fileName: match[0],
    checksum: match.groups.checksum,
    extension: match.groups.extension,
    mimeType: mimeTypes.get(match.groups.extension),
  }
}

function bridgeConfig(environment) {
  const baseUrl = String(environment.RESUMMO_STORAGE_BRIDGE_URL || '').trim().replace(/\/+$/, '')
  const token = String(environment.RESUMMO_STORAGE_BRIDGE_TOKEN || '').trim()
  if (!baseUrl || !token) {
    throw assetError(
      'El backend Supabase de assets no está configurado completamente.',
      'ASSET_STORAGE_NOT_CONFIGURED',
      503,
    )
  }
  let parsed
  try {
    parsed = new URL(baseUrl)
  } catch {
    throw assetError('RESUMMO_STORAGE_BRIDGE_URL no es una URL válida.', 'INVALID_ASSET_STORAGE_URL')
  }
  if (parsed.protocol !== 'https:' && parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') {
    throw assetError('El bridge de assets debe usar HTTPS.', 'INSECURE_ASSET_STORAGE_URL')
  }
  return { baseUrl, token }
}

async function bridgeRequest(resourcePath, {
  environment,
  fetchImpl,
  method = 'GET',
  body,
  headers = {},
}) {
  const { baseUrl, token } = bridgeConfig(environment)
  let response
  try {
    response = await fetchImpl(`${baseUrl}${resourcePath}`, {
      method,
      body,
      headers: {
        ...headers,
        'x-resummo-storage-token': token,
      },
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw assetError('No se pudo contactar el almacenamiento persistente de assets.', 'ASSET_STORAGE_UNAVAILABLE', 503)
  }
  return response
}

function uniqueAssets(assets) {
  const unique = new Map()
  for (const asset of assets || []) {
    const fileName = `${asset.checksum}${asset.extension}`
    const parsed = parseContentAssetFileName(fileName)
    if (!parsed || parsed.checksum !== asset.checksum || parsed.mimeType !== asset.mimeType) {
      throw assetError('Un asset no cumple el contrato de nombre, hash o tipo permitido.', 'INVALID_ASSET')
    }
    unique.set(parsed.fileName, asset)
  }
  return unique
}

async function readAssetData(asset) {
  const loaded = asset.data ?? (typeof asset.loadData === 'function' ? await asset.loadData() : null)
  if (!loaded) throw assetError('Un asset no contiene datos binarios disponibles.', 'INVALID_ASSET')
  const data = Buffer.isBuffer(loaded) ? loaded : Buffer.from(loaded)
  const checksum = crypto.createHash('sha256').update(data).digest('hex')
  if (data.length !== asset.sizeBytes || checksum !== asset.checksum) {
    throw assetError('Un asset no coincide con el hash o tamaño declarado.', 'ASSET_INTEGRITY_ERROR', 409)
  }
  return data
}

async function persistLocalAssets(assets, environment) {
  const directory = localAssetDirectory(environment)
  await fs.mkdir(directory, { recursive: true })
  const created = []
  const existing = []

  for (const [fileName, asset] of uniqueAssets(assets)) {
    const destination = path.join(directory, fileName)
    try {
      const current = await fs.readFile(destination)
      const checksum = crypto.createHash('sha256').update(current).digest('hex')
      if (current.length !== asset.sizeBytes || checksum !== asset.checksum) {
        throw assetError('Un asset local existente no coincide con el contenido importado.', 'ASSET_COLLISION', 409)
      }
      existing.push(fileName)
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      const data = await readAssetData(asset)
      await fs.writeFile(destination, data, { flag: 'wx' })
      created.push(fileName)
    }
  }

  return { backend: 'local', directory, created, existing, uniqueCount: created.length + existing.length }
}

async function persistSupabaseAssets(assets, environment, fetchImpl, { releaseData = false } = {}) {
  const created = []
  const existing = []
  const unique = uniqueAssets(assets)

  for (const [fileName, asset] of unique) {
    try {
      const data = await readAssetData(asset)
      const response = await bridgeRequest(`/objects/${encodeURIComponent(fileName)}`, {
        environment,
        fetchImpl,
        method: 'PUT',
        body: data,
        headers: {
          'content-type': asset.mimeType,
          'content-length': String(asset.sizeBytes),
        },
      })
      if (response.status === 201) {
        created.push(fileName)
        continue
      }
      if (response.status === 200) {
        existing.push(fileName)
        continue
      }
      if (response.status === 409) {
        throw assetError('Un asset persistente existente no coincide con el contenido importado.', 'ASSET_COLLISION', 409)
      }
      throw assetError('No se pudo persistir un asset en el almacenamiento cloud.', 'ASSET_STORAGE_WRITE_FAILED', 503)
    } finally {
      if (releaseData) {
        asset.data = null
        asset.loadData = null
      }
    }
  }

  return { backend: 'supabase', created, existing, uniqueCount: unique.size }
}

export async function persistContentAssets(assets, {
  environment = process.env,
  fetchImpl = globalThis.fetch,
  releaseData = false,
} = {}) {
  return resolveContentAssetBackend(environment) === 'supabase'
    ? persistSupabaseAssets(assets, environment, fetchImpl, { releaseData })
    : persistLocalAssets(assets, environment)
}

export async function cleanupCreatedContentAssets(assetResult, {
  environment = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!assetResult?.created?.length) return

  if (assetResult.backend === 'local') {
    await Promise.all(assetResult.created.map(async (fileName) => {
      try { await fs.unlink(path.join(assetResult.directory, fileName)) } catch { /* best effort rollback */ }
    }))
    return
  }

  await Promise.all(assetResult.created.map(async (fileName) => {
    try {
      await bridgeRequest(`/objects/${encodeURIComponent(fileName)}`, {
        environment,
        fetchImpl,
        method: 'DELETE',
      })
    } catch {
      // Best effort. The caller keeps the original import failure as the primary error.
    }
  }))
}

export async function findMissingContentAssets(fileNames, {
  environment = process.env,
  fetchImpl = globalThis.fetch,
  concurrency = 1,
} = {}) {
  const backend = resolveContentAssetBackend(environment)
  const missing = []
  const parsedFiles = []

  for (const rawFileName of fileNames || []) {
    const parsed = parseContentAssetFileName(rawFileName)
    if (!parsed) missing.push(String(rawFileName || ''))
    else parsedFiles.push(parsed)
  }

  if (backend === 'local') {
    for (const parsed of parsedFiles) {
      try {
        await fs.access(path.join(localAssetDirectory(environment), parsed.fileName))
      } catch {
        missing.push(parsed.fileName)
      }
    }
    return missing
  }

  const batchSize = Number.isInteger(concurrency) && concurrency > 0 ? Math.min(concurrency, 32) : 1
  for (let offset = 0; offset < parsedFiles.length; offset += batchSize) {
    const batch = parsedFiles.slice(offset, offset + batchSize)
    const results = await Promise.all(batch.map(async (parsed) => {
      const response = await bridgeRequest(`/objects/${encodeURIComponent(parsed.fileName)}`, {
        environment,
        fetchImpl,
        method: 'HEAD',
      })
      if (response.status === 404) return parsed.fileName
      if (!response.ok) throw assetError('No se pudo validar un asset persistente.', 'ASSET_STORAGE_READ_FAILED', 503)
      return null
    }))
    missing.push(...results.filter(Boolean))
  }

  return missing
}

export async function loadContentAsset(fileName, {
  environment = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  const parsed = parseContentAssetFileName(fileName)
  if (!parsed) return null

  if (resolveContentAssetBackend(environment) === 'local') {
    try {
      const data = await fs.readFile(path.join(localAssetDirectory(environment), parsed.fileName))
      return { data, mimeType: parsed.mimeType }
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
  }

  const response = await bridgeRequest(`/objects/${encodeURIComponent(parsed.fileName)}`, {
    environment,
    fetchImpl,
  })
  if (response.status === 404) return null
  if (!response.ok) throw assetError('No se pudo recuperar un asset persistente.', 'ASSET_STORAGE_READ_FAILED', 503)
  const data = Buffer.from(await response.arrayBuffer())
  const checksum = crypto.createHash('sha256').update(data).digest('hex')
  if (checksum !== parsed.checksum) {
    throw assetError('El asset persistente no coincide con su hash de contenido.', 'ASSET_STORAGE_INTEGRITY_ERROR', 502)
  }
  return { data, mimeType: response.headers.get('content-type') || parsed.mimeType }
}

export async function ensureContentAssetStore({
  environment = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (resolveContentAssetBackend(environment) === 'local') {
    const directory = localAssetDirectory(environment)
    await fs.mkdir(directory, { recursive: true })
    return { backend: 'local', ready: true, created: false }
  }

  const response = await bridgeRequest('/ensure-bucket', {
    environment,
    fetchImpl,
    method: 'POST',
  })
  if (!response.ok) {
    throw assetError('No se pudo preparar el almacenamiento persistente de assets.', 'ASSET_STORAGE_UNAVAILABLE', 503)
  }
  const payload = await response.json().catch(() => ({}))
  return { backend: 'supabase', ready: true, created: payload.created === true }
}

export async function checkContentAssetStore({
  environment = process.env,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (resolveContentAssetBackend(environment) === 'local') {
    const directory = localAssetDirectory(environment)
    await fs.mkdir(directory, { recursive: true })
    return { backend: 'local', ready: true }
  }

  const response = await bridgeRequest('/health', {
    environment,
    fetchImpl,
    method: 'GET',
  })
  return { backend: 'supabase', ready: response.ok }
}
