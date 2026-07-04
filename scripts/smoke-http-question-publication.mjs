import 'dotenv/config'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { prisma } from '../server/lib/prisma.js'

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const port = Number(process.env.QUESTION_SMOKE_PORT || 3105)
const baseUrl = `http://localhost:${port}`
const fixtureTopicSlug = 'smoke-question-editorial-guard'
const fixtureArticleSlug = 'smoke-question-editorial-article'

function pass(message) {
  console.log(`[pass] ${message}`)
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function cleanupFixture() {
  await prisma.topic.deleteMany({ where: { slug: fixtureTopicSlug } })
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

function expectStatus(result, expected, context) {
  if (result.response.status !== expected) {
    throw new Error(`${context}: expected ${expected}, got ${result.response.status}`)
  }
}

function cleanQuestionBody(topicId, articleId = null) {
  return {
    topicId,
    articleId,
    prompt: 'Enunciado editorial controlado para validar publicacion',
    explanation: 'Explicacion editorial completa para el smoke test',
    difficulty: 3,
    hint: 'Pista editorial opcional',
    options: [
      { label: 'A', text: 'Opcion correcta controlada', isCorrect: true },
      { label: 'B', text: 'Opcion alternativa controlada', isCorrect: false },
    ],
  }
}

async function run() {
  let serverProcess
  await cleanupFixture()

  try {
    console.log(`[smoke:question-publication] starting API on ${baseUrl}`)
    serverProcess = await startServer()

    const login = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email: 'editor@resummo.app', password: 'Editor12345' },
    })
    expectStatus(login, 200, 'editor login')
    const token = login.payload?.token
    if (!token) throw new Error('Editor login did not return a token')
    pass('editor login succeeded')

    const topicResult = await apiRequest('/api/admin/content/topics', {
      method: 'POST',
      token,
      body: {
        slug: fixtureTopicSlug,
        title: 'Smoke editorial de preguntas',
        summary: 'Fixture temporal para validar guardias editoriales',
        description: 'Se elimina automaticamente al finalizar el smoke',
        status: 'DRAFT',
      },
    })
    expectStatus(topicResult, 201, 'create draft topic')
    const topicId = topicResult.payload.topic.id

    const questionResult = await apiRequest('/api/admin/content/questions', {
      method: 'POST',
      token,
      body: cleanQuestionBody(topicId),
    })
    expectStatus(questionResult, 201, 'create draft question')
    if (questionResult.payload.question.status !== 'DRAFT') {
      throw new Error('New question was not created as DRAFT')
    }
    const questionId = questionResult.payload.question.id
    pass('question creation remains DRAFT')

    const unpublishedTopicPublish = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: { status: 'PUBLISHED' },
    })
    expectStatus(unpublishedTopicPublish, 400, 'publish with unpublished topic')
    if (!unpublishedTopicPublish.payload?.message?.includes('tema asociado no esta publicado')) {
      throw new Error('Unpublished topic error was not human-readable')
    }
    pass('publication with unpublished topic was rejected')

    const draftWithMarker = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: { prompt: 'Enunciado editorial [FALTA CITA]', status: 'DRAFT' },
    })
    expectStatus(draftWithMarker, 200, 'save draft with editorial marker')
    pass('draft with editorial marker remains editable')

    const markerPublish = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: { status: 'PUBLISHED' },
    })
    expectStatus(markerPublish, 400, 'publish with editorial marker')
    if (!markerPublish.payload?.message?.includes('pendientes editoriales')) {
      throw new Error('Editorial marker error was not human-readable')
    }
    pass('publication with editorial marker was rejected')

    const publishTopic = await apiRequest(`/api/admin/content/topics/${topicId}`, {
      method: 'PATCH',
      token,
      body: { status: 'PUBLISHED' },
    })
    expectStatus(publishTopic, 200, 'publish fixture topic')

    const optionMarkerBody = cleanQuestionBody(topicId)
    optionMarkerBody.prompt = 'Enunciado controlado para validar opciones pendientes'
    optionMarkerBody.options[1].text = 'Opcion placeholder pendiente de revision'
    const optionMarkerQuestion = await apiRequest('/api/admin/content/questions', {
      method: 'POST',
      token,
      body: optionMarkerBody,
    })
    expectStatus(optionMarkerQuestion, 201, 'create question with option marker')
    const optionMarkerPublish = await apiRequest(
      `/api/admin/content/questions/${optionMarkerQuestion.payload.question.id}`,
      { method: 'PATCH', token, body: { status: 'PUBLISHED' } },
    )
    expectStatus(optionMarkerPublish, 400, 'publish with option marker')
    if (!optionMarkerPublish.payload?.message?.includes('las opciones contienen pendientes editoriales')) {
      throw new Error('Option marker error was not human-readable')
    }
    pass('publication with an option marker was rejected')

    const markerOnlyPublish = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: { status: 'PUBLISHED' },
    })
    expectStatus(markerOnlyPublish, 400, 'publish marker after topic publication')
    pass('editorial marker remains blocking after topic publication')

    const validPublish = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: {
        prompt: 'Enunciado editorial controlado para validar publicacion',
        status: 'PUBLISHED',
      },
    })
    expectStatus(validPublish, 200, 'publish valid question')
    pass('valid question was published')

    const archive = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: { status: 'ARCHIVED' },
    })
    expectStatus(archive, 200, 'archive question')
    const returnToDraft = await apiRequest(`/api/admin/content/questions/${questionId}`, {
      method: 'PATCH',
      token,
      body: { status: 'DRAFT' },
    })
    expectStatus(returnToDraft, 200, 'return question to draft')
    pass('archive and return-to-draft remain available')

    const articleResult = await apiRequest('/api/admin/content/articles', {
      method: 'POST',
      token,
      body: {
        topicId,
        slug: fixtureArticleSlug,
        title: 'Articulo editorial temporal',
        summary: 'Fixture temporal sin contenido medico',
        body: '## Contenido editorial\nTexto controlado para smoke test.',
        readTimeMinutes: 1,
        tags: ['smoke'],
      },
    })
    expectStatus(articleResult, 201, 'create draft article')

    const linkedQuestion = await apiRequest('/api/admin/content/questions', {
      method: 'POST',
      token,
      body: cleanQuestionBody(topicId, articleResult.payload.article.id),
    })
    expectStatus(linkedQuestion, 201, 'create question linked to draft article')

    const draftArticlePublish = await apiRequest(
      `/api/admin/content/questions/${linkedQuestion.payload.question.id}`,
      { method: 'PATCH', token, body: { status: 'PUBLISHED' } },
    )
    expectStatus(draftArticlePublish, 400, 'publish with draft article')
    if (!draftArticlePublish.payload?.message?.includes('articulo asociado no esta publicado')) {
      throw new Error('Draft article error was not human-readable')
    }
    pass('publication with unpublished article was rejected')
  } finally {
    await stopServer(serverProcess)
    await cleanupFixture()
    const remainingTopics = await prisma.topic.count({ where: { slug: fixtureTopicSlug } })
    if (remainingTopics !== 0) throw new Error('Controlled smoke fixture was not removed')
    await prisma.$disconnect()
  }

  pass('controlled fixtures were removed')
  console.log('[smoke:question-publication] result PASS')
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[smoke:question-publication] result FAIL: ${error.message}`)
    process.exit(1)
  })
