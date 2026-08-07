import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const port = Number(process.env.ERROR_HANDLING_SMOKE_PORT || 3111)
const baseUrl = `http://localhost:${port}`

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
      JWT_SECRET: 'resummo-error-smoke-secret-with-more-than-32-characters',
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

async function readPayload(response) {
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function run() {
  let processHandle

  try {
    processHandle = await startServer()

    const malformedJsonResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid-json',
    })
    const malformedJsonPayload = await readPayload(malformedJsonResponse)
    if (
      malformedJsonResponse.status !== 400 ||
      malformedJsonPayload?.message !== 'JSON inválido.'
    ) {
      throw new Error('Malformed JSON did not return the safe 400 response')
    }
    pass('malformed JSON returns a safe 400 response')

    const invalidPayloadResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: 'short' }),
    })
    const invalidPayload = await readPayload(invalidPayloadResponse)
    if (
      invalidPayloadResponse.status !== 400 ||
      invalidPayload?.message !== 'Datos inválidos.'
    ) {
      throw new Error('Invalid payload did not return the safe validation response')
    }
    pass('validation errors do not expose Zod internals')

    const missingRouteResponse = await fetch(`${baseUrl}/api/route-that-does-not-exist`)
    const missingRoutePayload = await readPayload(missingRouteResponse)
    if (
      missingRouteResponse.status !== 404 ||
      missingRoutePayload?.message !== 'Ruta no encontrada.'
    ) {
      throw new Error('Unknown API route did not return the JSON 404 response')
    }
    pass('unknown API routes return a stable JSON 404 response')

    console.log('[smoke:error-handling] result PASS')
  } finally {
    await stopServer(processHandle)
  }
}

run().catch((error) => {
  console.error(`[smoke:error-handling] result FAIL: ${error.message}`)
  process.exitCode = 1
})
