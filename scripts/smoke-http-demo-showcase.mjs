import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../server/lib/prisma.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const port = Number(process.env.DEMO_SHOWCASE_SMOKE_PORT || 3107)
const baseUrl = `http://localhost:${port}`
const demoTopicSlugs = ['diagnostic-tests', 'cardiology-basics', 'pharmacology-basics']

function pass(message) {
  console.log(`[pass] ${message}`)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function getMaskedDatabaseTarget() {
  const value = String(process.env.DATABASE_URL || '')
  if (!value) return 'NONE'
  if (/supabase/i.test(value)) return 'SUPABASE-MASKED'
  if (/(?:localhost|127\.0\.0\.1)/i.test(value)) return 'LOCAL'
  return 'REMOTE-MASKED'
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
      // The API may still be starting.
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

async function login() {
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email: 'demo@resummo.app', password: 'Demo12345' },
  })
  if (result.response.status !== 200 || !result.payload?.token) {
    throw new Error('Controlled demo student login failed')
  }
  return result.payload.token
}

async function verifyDatabaseContent() {
  const [topics, articleCount, multipleChoiceCount, flashcardCount] = await Promise.all([
    prisma.topic.findMany({
      where: { slug: { in: demoTopicSlugs }, status: 'PUBLISHED' },
      select: { id: true, slug: true },
    }),
    prisma.article.count({
      where: { status: 'PUBLISHED', topic: { slug: { in: demoTopicSlugs } } },
    }),
    prisma.question.count({
      where: {
        status: 'PUBLISHED',
        type: 'MULTIPLE_CHOICE',
        topic: { slug: { in: demoTopicSlugs } },
      },
    }),
    prisma.question.count({
      where: {
        status: 'PUBLISHED',
        type: 'FLASHCARD',
        topic: { slug: { in: demoTopicSlugs } },
      },
    }),
  ])

  if (topics.length < 3) throw new Error(`Expected 3 published demo topics, found ${topics.length}`)
  if (articleCount < 6) throw new Error(`Expected at least 6 published demo articles, found ${articleCount}`)
  if (multipleChoiceCount < 20) {
    throw new Error(`Expected at least 20 published demo MCQs, found ${multipleChoiceCount}`)
  }
  if (flashcardCount < 10) {
    throw new Error(`Expected at least 10 published demo flashcards, found ${flashcardCount}`)
  }

  pass(`database target ${getMaskedDatabaseTarget()}`)
  pass(`${topics.length} published demo topics found`)
  pass(`${articleCount} published demo articles found`)
  pass(`${multipleChoiceCount} published demo MCQs found`)
  pass(`${flashcardCount} published demo flashcards found`)
  return topics
}

async function run() {
  let serverProcess

  try {
    const topics = await verifyDatabaseContent()
    serverProcess = await startServer()
    const token = await login()
    pass('controlled demo student login succeeded')

    const library = await apiRequest('/api/topics', { token })
    if (library.response.status !== 200) {
      throw new Error(`Library topics returned ${library.response.status}`)
    }
    const libraryTopics = library.payload?.topics || []
    const libraryArticles = libraryTopics.reduce(
      (total, topic) => total + (Array.isArray(topic.articles) ? topic.articles.length : 0),
      0,
    )
    if (libraryTopics.length < 3 || libraryArticles < 6) {
      throw new Error('Library did not return the expected published demo content')
    }
    pass('Library returns published demo topics and articles')

    const qbank = await apiRequest('/api/practice-sessions', {
      method: 'POST',
      token,
      body: { topicSlug: 'cardiology-basics', questionCount: 5 },
    })
    if (qbank.response.status !== 201 || !qbank.payload?.session?.id) {
      throw new Error(`QBank demo session creation returned ${qbank.response.status}`)
    }
    const sessionQuestions = await prisma.studySessionQuestion.findMany({
      where: { sessionId: qbank.payload.session.id },
      include: { question: { select: { type: true } } },
    })
    if (sessionQuestions.length === 0 || sessionQuestions.some((item) => item.question.type !== 'MULTIPLE_CHOICE')) {
      throw new Error('QBank session included a non-MULTIPLE_CHOICE item')
    }
    pass('QBank creates a demo session using only MULTIPLE_CHOICE items')

    const flashcardTopic = topics.find((topic) => topic.slug === 'cardiology-basics')
    const flashcards = await apiRequest(`/api/study/flashcards/${flashcardTopic.id}`, { token })
    if (flashcards.response.status !== 200 || !Array.isArray(flashcards.payload?.flashcards)) {
      throw new Error(`Flashcards endpoint returned ${flashcards.response.status}`)
    }
    if (
      flashcards.payload.flashcards.length === 0
      || flashcards.payload.flashcards.some((question) => question.type !== 'FLASHCARD')
    ) {
      throw new Error('Flashcards endpoint did not return published demo flashcards')
    }
    pass('Flashcards endpoint returns published demo cards')
  } finally {
    await stopServer(serverProcess)
    await prisma.$disconnect()
  }

  console.log('[smoke:demo-showcase] result PASS')
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[smoke:demo-showcase] result FAIL: ${error.message}`)
    process.exit(1)
  })
