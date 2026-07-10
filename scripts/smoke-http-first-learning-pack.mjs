import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../server/lib/prisma.js'
import { firstLearningPack } from './load-first-learning-pack.mjs'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const port = Number(process.env.LEARNING_PACK_SMOKE_PORT || 3106)
const baseUrl = `http://localhost:${port}`
const prohibitedEditorialPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

function pass(message) {
  console.log(`[pass] ${message}`)
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

async function login(email, password) {
  const result = await apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  if (result.response.status !== 200 || !result.payload?.token) {
    throw new Error(`Login failed for controlled ${email.split('@')[0]} account`)
  }
  return result.payload.token
}

async function verifyPackInDatabase() {
  const topic = await prisma.topic.findUnique({ where: { slug: firstLearningPack.topic.slug } })
  if (!topic) throw new Error('Learning Pack topic was not found')

  const article = await prisma.article.findUnique({ where: { slug: firstLearningPack.article.slug } })
  if (!article || article.topicId !== topic.id) {
    throw new Error('Learning Pack article was not found under the expected topic')
  }

  const expectedPrompts = firstLearningPack.questions.map((question) => question.prompt)
  const questions = await prisma.question.findMany({
    where: { topicId: topic.id, prompt: { in: expectedPrompts } },
    include: { options: { orderBy: { order: 'asc' } } },
  })

  const [unrelatedArticles, unrelatedQuestions] = await Promise.all([
    prisma.article.count({ where: { topicId: topic.id, NOT: { id: article.id } } }),
    prisma.question.count({
      where: {
        topicId: topic.id,
        type: 'MULTIPLE_CHOICE',
        prompt: { notIn: expectedPrompts },
      },
    }),
  ])
  if (unrelatedArticles > 0 || unrelatedQuestions > 0) {
    throw new Error('Topic validation is unsafe because the topic contains unrelated content')
  }

  if (questions.length !== firstLearningPack.questions.length) {
    throw new Error(`Expected 6 controlled questions, found ${questions.length}`)
  }
  for (const prompt of expectedPrompts) {
    if (questions.filter((question) => question.prompt === prompt).length !== 1) {
      throw new Error('A controlled question is missing or duplicated')
    }
  }

  const topicStatus = topic.status
  const articleStatus = article.status
  const questionStatuses = new Set(questions.map((q) => q.status))

  const isAllDraft = topicStatus === 'DRAFT' && articleStatus === 'DRAFT' && questionStatuses.size === 1 && questionStatuses.has('DRAFT')
  const isAllPublished = topicStatus === 'PUBLISHED' && articleStatus === 'PUBLISHED' && questionStatuses.size === 1 && questionStatuses.has('PUBLISHED')

  if (!isAllDraft && !isAllPublished) {
    throw new Error(`State is mixed: Topic=${topicStatus}, Article=${articleStatus}, Questions=${[...questionStatuses].join(',')}`)
  }

  const contentFields = [article.title, article.summary, article.body]
  for (const question of questions) {
    if (question.articleId !== article.id) {
      throw new Error('A controlled question is linked to another article')
    }
    if (question.options.length < 2 || question.options.length > 5) {
      throw new Error('A controlled question has an invalid option count')
    }
    if (question.options.filter((option) => option.isCorrect).length !== 1) {
      throw new Error('A controlled question does not have exactly one correct option')
    }
    contentFields.push(
      question.prompt,
      question.explanation,
      question.hint,
      ...question.options.map((option) => option.text),
    )
  }

  if (contentFields.some((field) => prohibitedEditorialPattern.test(field || ''))) {
    throw new Error('Loaded content contains an editorial marker')
  }

  return { article, questions, topic, mode: isAllDraft ? 'DRAFT' : 'PUBLISHED' }
}

async function run() {
  let serverProcess
  let packState

  try {
    packState = await verifyPackInDatabase()
    pass(`database contains 1 topic, 1 article and 6 controlled questions in ${packState.mode}`)

    console.log(`[smoke:first-learning-pack] starting API on ${baseUrl}`)
    serverProcess = await startServer()
    const studentToken = await login('demo@resummo.app', 'Demo12345')
    const editorToken = await login('editor@resummo.app', 'Editor12345')
    pass('controlled student and editor login succeeded')

    if (packState.mode === 'DRAFT') {
      const studentArticle = await apiRequest(`/api/articles/${firstLearningPack.article.slug}`, {
        token: studentToken,
      })
      if (studentArticle.response.status !== 404) {
        throw new Error(`Expected DRAFT article to return 404 for student, got ${studentArticle.response.status}`)
      }
      pass('DRAFT article is unavailable to student')

      const draftTopicSession = await apiRequest('/api/practice-sessions', {
        method: 'POST',
        token: studentToken,
        body: { topicSlug: firstLearningPack.topic.slug, questionCount: 6 },
      })
      if (draftTopicSession.response.status !== 404 && draftTopicSession.response.status !== 400) {
        throw new Error(`Expected DRAFT topic/questions to fail session creation, got ${draftTopicSession.response.status}`)
      }
      pass('DRAFT topic/questions are unavailable to QBank')
    } else {
      const studentArticle = await apiRequest(`/api/articles/${firstLearningPack.article.slug}`, {
        token: studentToken,
      })
      if (studentArticle.response.status !== 200) {
        throw new Error(`Expected PUBLISHED article to return 200 for student, got ${studentArticle.response.status}`)
      }
      pass('PUBLISHED article is visible to student')

      const pubTopicSession = await apiRequest('/api/practice-sessions', {
        method: 'POST',
        token: studentToken,
        body: { topicSlug: firstLearningPack.topic.slug, questionCount: 6 },
      })
      if (pubTopicSession.response.status !== 201) {
        throw new Error(`Expected PUBLISHED topic/questions to create session, got ${pubTopicSession.response.status}`)
      }
      pass('PUBLISHED topic/questions can be used to create QBank session')
    }
  } finally {
    await stopServer(serverProcess)
    await prisma.$disconnect()
  }

  console.log('[smoke:first-learning-pack] result PASS')
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[smoke:first-learning-pack] result FAIL: ${error.message}`)
    process.exit(1)
  })
