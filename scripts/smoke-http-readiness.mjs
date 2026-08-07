import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const healthyPort = Number(process.env.READINESS_SMOKE_PORT || 3109)
const unavailablePort = healthyPort + 1
const smokeSecret = 'resummo-readiness-smoke-secret-with-40-characters'

function pass(message) {
  console.log(`[pass] ${message}`)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function startServer(port, databaseUrl) {
  const processHandle = spawn('node', ['server/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(port),
      JWT_SECRET: smokeSecret,
      DATABASE_URL: databaseUrl,
      DIRECT_URL: databaseUrl,
      PRIVATE_MVP_ACCESS: 'true',
      SHOW_DEMO_CREDENTIALS: 'false',
    },
    stdio: 'ignore',
  })
  const baseUrl = `http://localhost:${port}`

  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (processHandle.exitCode !== null) {
      throw new Error(`Server exited before health check on port ${port}`)
    }

    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return { baseUrl, processHandle }
    } catch {
      // Server may still be starting.
    }

    await wait(500)
  }

  processHandle.kill()
  throw new Error(`Server did not start on port ${port}`)
}

async function stopServer(processHandle) {
  if (!processHandle || processHandle.exitCode !== null || processHandle.killed) return
  processHandle.kill()
  await Promise.race([once(processHandle, 'exit'), wait(2000)])
}

async function readJson(url) {
  const response = await fetch(url)
  const payload = await response.json()
  return { response, payload }
}

async function run() {
  const configuredDatabaseUrl = String(process.env.DATABASE_URL || '').trim()
  if (!configuredDatabaseUrl) {
    throw new Error('DATABASE_URL is required for readiness smoke')
  }

  let healthyServer
  let unavailableServer

  try {
    healthyServer = await startServer(healthyPort, configuredDatabaseUrl)

    const health = await readJson(`${healthyServer.baseUrl}/api/health`)
    if (!health.response.ok || health.payload?.ok !== true) {
      throw new Error('Liveness endpoint did not return ok')
    }
    pass('liveness remains independent from database readiness')

    const ready = await readJson(`${healthyServer.baseUrl}/api/ready`)
    if (
      !ready.response.ok ||
      ready.payload?.ok !== true ||
      ready.payload?.dependencies?.database !== 'ready'
    ) {
      throw new Error('Readiness endpoint did not confirm the configured database')
    }
    pass('readiness confirms database availability')

    const unavailableDatabaseUrl = 'postgresql://postgres:postgres@127.0.0.1:59999/resummo'
    unavailableServer = await startServer(unavailablePort, unavailableDatabaseUrl)

    const unavailableHealth = await readJson(`${unavailableServer.baseUrl}/api/health`)
    if (!unavailableHealth.response.ok || unavailableHealth.payload?.ok !== true) {
      throw new Error('Liveness failed when the database was unavailable')
    }
    pass('liveness stays available when the database is unavailable')

    const unavailableReady = await readJson(`${unavailableServer.baseUrl}/api/ready`)
    if (
      unavailableReady.response.status !== 503 ||
      unavailableReady.payload?.ok !== false ||
      unavailableReady.payload?.dependencies?.database !== 'unavailable'
    ) {
      throw new Error('Readiness did not fail closed for an unavailable database')
    }
    pass('readiness returns 503 without exposing database details')

    console.log('[smoke:readiness] result PASS')
  } finally {
    await stopServer(unavailableServer?.processHandle)
    await stopServer(healthyServer?.processHandle)
  }
}

run().catch((error) => {
  console.error(`[smoke:readiness] result FAIL: ${error.message}`)
  process.exitCode = 1
})
