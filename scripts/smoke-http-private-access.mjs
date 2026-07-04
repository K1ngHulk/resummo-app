import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../server/lib/prisma.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const privatePort = Number(process.env.SMOKE_PORT || 3103)
const controlledEmail = 'private-access-smoke@resummo.invalid'

function pass(message) {
  console.log(`[pass] ${message}`)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function startServer(port, { nodeEnv, privateMvpAccess, showDemoCredentials }) {
  const processHandle = spawn('node', ['server/index.js'], {
    cwd: root,
    env: {
      ...process.env,
      NODE_ENV: nodeEnv,
      PORT: String(port),
      PRIVATE_MVP_ACCESS: String(privateMvpAccess),
      SHOW_DEMO_CREDENTIALS: String(showDemoCredentials),
    },
    stdio: 'ignore',
  })
  const baseUrl = `http://localhost:${port}`

  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) {
        return { baseUrl, processHandle, health: await response.json() }
      }
    } catch {
      // The server may still be starting.
    }

    await wait(500)
  }

  processHandle.kill()
  throw new Error(`Server did not start on port ${port}`)
}

async function stopServer(processHandle) {
  if (processHandle.exitCode !== null || processHandle.killed) {
    return
  }

  processHandle.kill()
  await Promise.race([once(processHandle, 'exit'), wait(2000)])
}

async function postJson(baseUrl, path, body, token) {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}

async function run() {
  await prisma.user.deleteMany({ where: { email: controlledEmail } })

  try {
    console.log(`[smoke:private-access] starting private API on port ${privatePort}`)
    const privateServer = await startServer(privatePort, {
      nodeEnv: 'production',
      privateMvpAccess: true,
      showDemoCredentials: true,
    })

    try {
      if (privateServer.health.config?.privateMvpAccess !== true) {
        throw new Error('Health config did not expose privateMvpAccess=true')
      }
      if (privateServer.health.config?.showDemoCredentials !== false) {
        throw new Error('Production health config exposed demo credentials')
      }
      pass('health exposes safe private access configuration')

      const registerResponse = await postJson(privateServer.baseUrl, '/api/auth/register', {
        firstName: 'Smoke',
        lastName: 'Private',
        email: controlledEmail,
        password: 'Private12345',
      })
      if (registerResponse.status !== 403) {
        throw new Error(`Expected private registration to return 403, got ${registerResponse.status}`)
      }
      const registerPayload = await registerResponse.json()
      if (!registerPayload.message?.toLowerCase().includes('invitaci')) {
        throw new Error('Private registration response did not include an invitation message')
      }
      pass('private registration returned 403 without persistence')

      const loginResponse = await postJson(privateServer.baseUrl, '/api/auth/login', {
        email: 'demo@resummo.app',
        password: 'Demo12345',
      })
      if (loginResponse.status !== 200) {
        throw new Error(`Expected seeded student login to return 200, got ${loginResponse.status}`)
      }

      const loginPayload = await loginResponse.json()
      if (!loginPayload.token) {
        throw new Error('Login response did not include a token')
      }
      pass('seeded student login remains available in private mode')

      const meResponse = await fetch(`${privateServer.baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${loginPayload.token}` },
      })
      if (meResponse.status !== 200) {
        throw new Error(`Expected /api/auth/me to return 200, got ${meResponse.status}`)
      }
      pass('authenticated /api/auth/me remains available in private mode')
    } finally {
      await stopServer(privateServer.processHandle)
    }

    const publicPort = privatePort + 1
    console.log(`[smoke:private-access] starting public API on port ${publicPort}`)
    const publicServer = await startServer(publicPort, {
      nodeEnv: 'development',
      privateMvpAccess: false,
      showDemoCredentials: true,
    })

    try {
      if (publicServer.health.config?.privateMvpAccess !== false) {
        throw new Error('Health config did not expose privateMvpAccess=false')
      }
      if (publicServer.health.config?.showDemoCredentials !== true) {
        throw new Error('Development health config did not enable demo credentials')
      }

      const registerResponse = await postJson(publicServer.baseUrl, '/api/auth/register', {
        firstName: 'Smoke',
        lastName: 'Public',
        email: controlledEmail,
        password: 'Public12345',
      })
      if (registerResponse.status !== 201) {
        throw new Error(`Expected public registration to return 201, got ${registerResponse.status}`)
      }
      pass('public registration creates a controlled user in development mode')
    } finally {
      await stopServer(publicServer.processHandle)
    }
  } finally {
    await prisma.user.deleteMany({ where: { email: controlledEmail } })
    await prisma.$disconnect()
  }

  pass('controlled public registration user was removed')
  console.log('[smoke:private-access] result PASS')
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[smoke:private-access] ${error.message}`)
    console.log('[smoke:private-access] result FAIL')
    process.exit(1)
  })
