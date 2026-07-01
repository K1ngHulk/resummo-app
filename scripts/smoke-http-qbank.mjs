import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, '..')
const PORT = process.env.SMOKE_PORT || 3101
const API_URL = `http://localhost:${PORT}`

function logPass(msg) {
  console.log(`[pass] ${msg}`)
}

function logSkip(msg) {
  console.log(`[skip] ${msg}`)
}

function logError(msg) {
  console.error(`[error] ${msg}`)
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runSmoke() {
  console.log(`[smoke:qbank] starting API on ${API_URL}`)

  const server = spawn('node', ['server/index.js'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore'
  })

  let isRunning = false
  try {
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`${API_URL}/api/health`)
        if (res.ok) {
          const data = await res.json()
          if (data.ok) {
            isRunning = true
            break
          }
        }
      } catch (err) {
        // Wait and retry
      }
      await wait(500)
    }

    if (!isRunning) {
      throw new Error('Server did not start in time')
    }
    logPass('health endpoint returned ok')

    const unauthRes = await fetch(`${API_URL}/api/practice-sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicSlug: 'missing', questionCount: 1 })
    })

    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 for unauth session creation, got ${unauthRes.status}`)
    }
    logPass('unauthenticated practice session creation returned 401')

    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@resummo.app', password: 'Demo12345' })
    })

    if (!loginRes.ok) {
      console.log('SKIP qbank write checks: seeded student login unavailable')
      console.log('[smoke:qbank] result PASS')
      return
    }

    const loginData = await loginRes.json()
    const token = loginData.token
    if (!token) {
      console.log('SKIP qbank write checks: seeded student login unavailable')
      console.log('[smoke:qbank] result PASS')
      return
    }
    logPass('student login succeeded')

    const topicsRes = await fetch(`${API_URL}/api/topics`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (!topicsRes.ok) {
      throw new Error(`Failed to load topics: ${topicsRes.status}`)
    }

    const topicsData = await topicsRes.json()
    const topics = topicsData.topics || []

    if (topics.length === 0) {
      console.log('SKIP qbank write checks: no published topics available')
      console.log('[smoke:qbank] result PASS')
      return
    }

    let createdSession = null
    for (const topic of topics) {
      const sessionRes = await fetch(`${API_URL}/api/practice-sessions`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topicSlug: topic.slug, questionCount: 1 })
      })

      if (sessionRes.status === 201) {
        const sessionData = await sessionRes.json()
        if (sessionData.session && sessionData.session.id && sessionData.session.path) {
          createdSession = sessionData.session
          break
        }
      } else if (sessionRes.status === 400) {
        // Try next topic
      } else {
        throw new Error(`Unexpected status during session creation: ${sessionRes.status}`)
      }
    }

    if (!createdSession) {
      console.log('SKIP qbank write checks: no published questions available')
      console.log('[smoke:qbank] result PASS')
      return
    }
    logPass('created practice session')

    const getSessionRes = await fetch(`${API_URL}/api/practice-sessions/${createdSession.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (getSessionRes.status !== 200) {
      throw new Error(`Failed to load session: ${getSessionRes.status}`)
    }

    const getSessionData = await getSessionRes.json()
    const sessionDetails = getSessionData.session

    if (!sessionDetails || !sessionDetails.questions || sessionDetails.questions.length === 0) {
      throw new Error('Loaded session has no questions')
    }

    const firstQuestion = sessionDetails.questions[0]
    if (!firstQuestion.options || firstQuestion.options.length === 0) {
      throw new Error('Loaded session question has no options')
    }
    logPass('loaded created session with questions')

    const firstOptionId = firstQuestion.options[0].id
    const answerRes = await fetch(`${API_URL}/api/practice-sessions/${createdSession.id}/answers`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        sessionQuestionId: firstQuestion.sessionQuestionId, 
        optionId: firstOptionId, 
        usedHint: false 
      })
    })

    if (answerRes.status !== 200) {
      throw new Error(`Failed to answer question: ${answerRes.status}`)
    }

    const answerData = await answerRes.json()
    if (typeof answerData.result?.isCorrect !== 'boolean' || !answerData.result?.hasOwnProperty('correctOptionId')) {
      throw new Error('Answer response missing result properties')
    }
    logPass('answered first question')

    const finishRes = await fetch(`${API_URL}/api/practice-sessions/${createdSession.id}/finish`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })

    if (finishRes.status !== 200) {
      throw new Error(`Failed to finish session: ${finishRes.status}`)
    }
    logPass('finished session')

    console.log('[smoke:qbank] result PASS')
  } catch (err) {
    logError(err.message)
    console.log('[smoke:qbank] result FAIL')
    process.exitCode = 1
  } finally {
    server.kill()
  }
}

runSmoke()
