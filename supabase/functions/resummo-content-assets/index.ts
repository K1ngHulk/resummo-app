import { createClient } from 'npm:@supabase/supabase-js@2'

const FUNCTION_NAME = 'resummo-content-assets'
const CONFIG_ID = 'content-assets'
const MAX_ASSET_BYTES = 25 * 1024 * 1024
const CONFIG_CACHE_MS = 60_000
const FILE_PATTERN = /^(?<checksum>[a-f0-9]{64})(?<extension>\.(?:png|jpg|gif|webp))$/
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

let cachedConfig: { tokenHash: string; bucket: string; loadedAt: number } | null = null

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

function getSecretKey() {
  const modernKeys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (modernKeys) {
    try {
      const parsed = JSON.parse(modernKeys)
      if (typeof parsed?.default === 'string' && parsed.default) return parsed.default
    } catch {
      // Fall through to the legacy hosted secret while projects transition key formats.
    }
  }
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (legacy) return legacy
  throw new Error('Supabase server secret is unavailable.')
}

const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL') ?? '', getSecretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function sha256Hex(value: Uint8Array | string) {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))
  return [...digest].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function fixedTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

async function loadConfig() {
  if (cachedConfig && Date.now() - cachedConfig.loadedAt < CONFIG_CACHE_MS) return cachedConfig

  const { data, error } = await supabaseAdmin
    .from('storage_bridge_config')
    .select('token_hash,bucket')
    .eq('id', CONFIG_ID)
    .single()

  if (error || !data?.token_hash || !data?.bucket) {
    throw new Error('Storage bridge configuration is unavailable.')
  }

  cachedConfig = {
    tokenHash: data.token_hash,
    bucket: data.bucket,
    loadedAt: Date.now(),
  }
  return cachedConfig
}

async function authorize(request: Request) {
  const token = request.headers.get('x-resummo-storage-token') ?? ''
  if (!token || token.length > 512) return null
  const config = await loadConfig()
  const incomingHash = await sha256Hex(token)
  return fixedTimeEqual(incomingHash, config.tokenHash) ? config : null
}

function routeParts(request: Request) {
  const parts = new URL(request.url).pathname.split('/').filter(Boolean)
  const functionIndex = parts.lastIndexOf(FUNCTION_NAME)
  return functionIndex >= 0 ? parts.slice(functionIndex + 1) : parts
}

function parseFileName(raw: string | undefined) {
  const fileName = decodeURIComponent(raw ?? '').toLowerCase()
  const match = FILE_PATTERN.exec(fileName)
  if (!match) return null
  const extension = match.groups?.extension ?? ''
  return {
    fileName,
    checksum: match.groups?.checksum ?? '',
    mimeType: MIME_TYPES[extension],
  }
}

async function ensureBucket(bucket: string) {
  const { data: existing, error: lookupError } = await supabaseAdmin.storage.getBucket(bucket)
  if (existing && !lookupError) {
    if (existing.public) throw new Error('Content asset bucket must remain private.')
    return { created: false }
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(bucket, {
    public: false,
    fileSizeLimit: MAX_ASSET_BYTES,
    allowedMimeTypes: Object.values(MIME_TYPES),
  })
  if (createError) {
    const { data: retry } = await supabaseAdmin.storage.getBucket(bucket)
    if (!retry || retry.public) throw new Error('Unable to create private content asset bucket.')
    return { created: false }
  }
  return { created: true }
}

async function readObject(bucket: string, fileName: string) {
  const { data, error } = await supabaseAdmin.storage.from(bucket).download(fileName)
  if (error || !data) return null
  const bytes = new Uint8Array(await data.arrayBuffer())
  return bytes
}

async function handleObject(request: Request, config: { bucket: string }, fileName: string) {
  const parsed = parseFileName(fileName)
  if (!parsed) return jsonResponse({ error: 'invalid_asset_name' }, 400)

  if (request.method === 'PUT') {
    const contentLength = Number(request.headers.get('content-length') || 0)
    if (contentLength > MAX_ASSET_BYTES) return jsonResponse({ error: 'asset_too_large' }, 413)

    const bytes = new Uint8Array(await request.arrayBuffer())
    if (bytes.byteLength === 0 || bytes.byteLength > MAX_ASSET_BYTES) {
      return jsonResponse({ error: 'invalid_asset_size' }, bytes.byteLength > MAX_ASSET_BYTES ? 413 : 400)
    }
    if (await sha256Hex(bytes) !== parsed.checksum) {
      return jsonResponse({ error: 'asset_hash_mismatch' }, 400)
    }
    const requestMime = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (requestMime && requestMime !== parsed.mimeType) {
      return jsonResponse({ error: 'asset_type_mismatch' }, 400)
    }

    const { error: uploadError } = await supabaseAdmin.storage.from(config.bucket).upload(parsed.fileName, bytes, {
      contentType: parsed.mimeType,
      cacheControl: '31536000',
      upsert: false,
    })
    if (!uploadError) return jsonResponse({ status: 'created' }, 201)

    const existing = await readObject(config.bucket, parsed.fileName)
    if (!existing) return jsonResponse({ error: 'asset_upload_failed' }, 503)
    if (await sha256Hex(existing) !== parsed.checksum) {
      return jsonResponse({ error: 'asset_collision' }, 409)
    }
    return jsonResponse({ status: 'existing' }, 200)
  }

  if (request.method === 'GET' || request.method === 'HEAD') {
    const bytes = await readObject(config.bucket, parsed.fileName)
    if (!bytes) return new Response(null, { status: 404 })
    if (await sha256Hex(bytes) !== parsed.checksum) {
      return jsonResponse({ error: 'asset_integrity_error' }, 502)
    }
    const headers = {
      'content-type': parsed.mimeType,
      'cache-control': 'private, max-age=31536000, immutable',
      'content-length': String(bytes.byteLength),
      etag: `"${parsed.checksum}"`,
    }
    return new Response(request.method === 'HEAD' ? null : bytes, { status: 200, headers })
  }

  if (request.method === 'DELETE') {
    const { error } = await supabaseAdmin.storage.from(config.bucket).remove([parsed.fileName])
    return error ? jsonResponse({ error: 'asset_delete_failed' }, 503) : new Response(null, { status: 204 })
  }

  return jsonResponse({ error: 'method_not_allowed' }, 405)
}

Deno.serve(async (request) => {
  try {
    const config = await authorize(request)
    if (!config) return jsonResponse({ error: 'unauthorized' }, 401)

    const parts = routeParts(request)
    if (parts.length === 1 && parts[0] === 'ensure-bucket' && request.method === 'POST') {
      const result = await ensureBucket(config.bucket)
      return jsonResponse({ ok: true, bucket: config.bucket, private: true, created: result.created })
    }

    if (parts.length === 1 && parts[0] === 'health' && request.method === 'GET') {
      const { data, error } = await supabaseAdmin.storage.getBucket(config.bucket)
      if (error || !data || data.public) return jsonResponse({ ok: false }, 503)
      return jsonResponse({ ok: true, bucket: config.bucket, private: true })
    }

    if (parts.length === 2 && parts[0] === 'objects') {
      return await handleObject(request, config, parts[1])
    }

    return jsonResponse({ error: 'not_found' }, 404)
  } catch (error) {
    console.error('[resummo-content-assets] request failed', { name: error instanceof Error ? error.name : 'Error' })
    return jsonResponse({ error: 'storage_bridge_unavailable' }, 503)
  }
})
