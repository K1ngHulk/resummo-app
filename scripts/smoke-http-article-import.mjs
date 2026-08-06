import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../server/lib/prisma.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const port = Number(process.env.ARTICLE_IMPORT_SMOKE_PORT || 3108)
const baseUrl = `http://localhost:${port}`
const samplePath = join(root, 'docs', 'demo', 'resummo-demo-article-import.md')

function pass(message) {
  console.log(`[pass] ${message}`)
}

function getDatabaseTarget() {
  const value = String(process.env.DATABASE_URL || '')
  if (!value) return 'NONE'
  try {
    const url = new URL(value)
    if (['localhost', '127.0.0.1'].includes(url.hostname)) return 'LOCAL'
    if (url.hostname.includes('supabase')) return 'SUPABASE-MASKED'
    return 'REMOTE-MASKED'
  } catch {
    return 'INVALID'
  }
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function startServer() {
  const processHandle = spawn('node', ['server/index.js'], {
    cwd: root,
    env: { ...process.env, PORT: String(port) },
    stdio: 'ignore',
  })

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return processHandle
    } catch {
      // API may still be starting.
    }
    await wait(500)
  }

  processHandle.kill()
  throw new Error('Server did not start in time')
}

async function stopServer(processHandle) {
  if (!processHandle || processHandle.exitCode !== null || processHandle.killed) return
  processHandle.kill()
  await Promise.race([once(processHandle, 'exit'), wait(2000)])
}

async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  return { response, payload: text ? JSON.parse(text) : null }
}

async function loginEditor() {
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'editor@resummo.app', password: 'Editor12345' },
  })
  if (result.response.status !== 200 || !result.payload?.token) {
    throw new Error('Controlled editor login failed')
  }
  return result.payload.token
}

async function run() {
  const target = getDatabaseTarget()
  let serverProcess
  let createdArticleId = null

  try {
    const source = await readFile(samplePath, 'utf8')
    const smokeSlug = `smoke-markdown-import-${Date.now()}`
    const smokeContent = source.replace(
      'slug: principios-farmacocinetica-demo',
      `slug: ${smokeSlug}`,
    )

    serverProcess = await startServer()

    const unauthenticated = await apiRequest('/api/admin/content/import/articles/preview', {
      method: 'POST',
      body: { format: 'markdown', content: smokeContent },
    })
    if (unauthenticated.response.status !== 401) {
      throw new Error(`Unauthenticated preview returned ${unauthenticated.response.status}`)
    }
    pass('unauthenticated Markdown preview returned 401')

    const token = await loginEditor()
    pass('controlled editor login succeeded')

    const preview = await apiRequest('/api/admin/content/import/articles/preview', {
      method: 'POST',
      token,
      body: { format: 'markdown', content: smokeContent },
    })
    if (preview.response.status !== 200 || preview.payload?.status !== 'VALID') {
      throw new Error(`Markdown preview failed with ${preview.response.status}`)
    }
    if (preview.payload?.article?.status !== 'DRAFT') {
      throw new Error('Markdown preview did not force DRAFT')
    }
    pass('Markdown preview validates sample and forces DRAFT')

    if (target !== 'LOCAL') {
      pass(`confirm skipped safely for target=${target}`)
      return
    }

    const confirmation = await apiRequest('/api/admin/content/import/articles/confirm', {
      method: 'POST',
      token,
      body: { format: 'markdown', content: smokeContent },
    })
    if (confirmation.response.status !== 201 || confirmation.payload?.article?.status !== 'DRAFT') {
      throw new Error(`Markdown confirmation failed with ${confirmation.response.status}`)
    }
    createdArticleId = confirmation.payload.article.id
    pass('local Markdown confirmation created one DRAFT article')

    const prematurePublication = await apiRequest(`/api/admin/content/articles/${createdArticleId}`, {
      method: 'PATCH',
      token,
      body: { status: 'PUBLISHED' },
    })
    if (prematurePublication.response.status !== 400) {
      throw new Error(`Premature publication returned ${prematurePublication.response.status}`)
    }
    if (!String(prematurePublication.payload?.message || '').includes('revision editorial no esta aprobada')) {
      throw new Error('Premature publication did not return the editorial approval guard')
    }
    pass('imported DRAFT cannot publish before editorial approval metadata is complete')
  } finally {
    if (createdArticleId && getDatabaseTarget() === 'LOCAL') {
      await prisma.article.delete({ where: { id: createdArticleId } })
      pass('local smoke article cleaned up')
    }
    await stopServer(serverProcess)
    await prisma.$disconnect()
  }

  console.log('[smoke:article-import] result PASS')
}

run()
  .then(() => {
    if (getDatabaseTarget() !== 'LOCAL') {
      console.log('[smoke:article-import] result PASS (preview only)')
    }
    process.exit(0)
  })
  .catch((error) => {
    console.error(`[smoke:article-import] result FAIL: ${error.message}`)
    process.exit(1)
  })
