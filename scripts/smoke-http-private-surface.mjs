import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const port = Number(process.env.PRIVATE_SURFACE_SMOKE_PORT || 3112)
const baseUrl = `http://localhost:${port}`

const privateRequests = [
  ['GET', '/api/topics'],
  ['GET', '/api/topics/example-topic'],
  ['GET', '/api/articles/example-article'],
  ['POST', '/api/articles/example-article/progress', { status: 'IN_PROGRESS', progressPercent: 10 }],
  ['GET', '/api/dashboard'],
  ['GET', '/api/progress'],
  ['GET', '/api/practice-sessions'],
  ['POST', '/api/practice-sessions', {}],
  ['GET', '/api/practice-sessions/example-session'],
  ['POST', '/api/practice-sessions/example-session/answers', {}],
  ['POST', '/api/practice-sessions/example-session/finish', {}],
  ['GET', '/api/study/flashcards/example-topic'],
  ['POST', '/api/study/flashcards/example-question/review', { difficulty: 2 }],
  ['GET', '/api/admin/me'],
  ['GET', '/api/admin/content/topics'],
  ['POST', '/api/admin/content/import/articles/preview', { format: 'markdown', content: '' }],
  ['POST', '/api/admin/content/import/anki/preview', { format: 'tsv', content: '' }],
]

function pass(message) {
  console.log(`[pass] ${message}`)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function startServer() {
  const processHandle = spawn('node', ['server/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      JWT_SECRET: 'resummo-private-surface-secret-with-more-than-32-characters',
      PRIVATE_MVP_ACCESS: 'true',
      SHOW_DEMO_CREDENTIALS: 'false',
    },
    stdio: 'ignore',
  })

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (processHandle.exitCode !== null) {
      throw new Error('Server exited before health check')
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return processHandle
    } catch {
      // Server may still be starting.
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

async function run() {
  let processHandle

  try {
    processHandle = await startServer()

    for (const [method, path, body] of privateRequests) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })

      if (response.status !== 401) {
        throw new Error(`${method} ${path} returned ${response.status} instead of 401`)
      }
    }

    pass(`${privateRequests.length} private route checks rejected anonymous access`)
    console.log('[smoke:private-surface] result PASS')
  } finally {
    await stopServer(processHandle)
  }
}

run().catch((error) => {
  console.error(`[smoke:private-surface] result FAIL: ${error.message}`)
  process.exitCode = 1
})
