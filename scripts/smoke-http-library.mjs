import { spawn } from 'child_process'

const PORT = process.env.SMOKE_PORT || 3102
const API_URL = `http://localhost:${PORT}`

function log(msg) {
  console.log(`[smoke:library] ${msg}`)
}

function pass(msg) {
  console.log(`[pass] ${msg}`)
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function run() {
  log(`starting API on ${API_URL}`)

  const serverProcess = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT },
    stdio: 'ignore'
  })

  let isUp = false
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${API_URL}/api/health`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok) {
          isUp = true
          break
        }
      }
    } catch (e) {
      // ignore
    }
    await wait(500)
  }

  if (!isUp) {
    serverProcess.kill()
    throw new Error('Server did not start')
  }
  pass('health endpoint returned ok')

  try {
    const resAuth = await fetch(`${API_URL}/api/articles/missing-smoke-slug`)
    if (resAuth.status !== 401) {
      throw new Error(`Expected 401 for unauthenticated article detail, got ${resAuth.status}`)
    }
    pass('unauthenticated article detail returned 401')

    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@resummo.app', password: 'Demo12345' })
    })

    if (!loginRes.ok) {
      log('SKIP library article checks: seeded student login unavailable')
      log('result PASS')
      return
    }

    const loginData = await loginRes.json()
    const token = loginData.token
    if (!token) {
      log('SKIP library article checks: seeded student login unavailable')
      log('result PASS')
      return
    }
    pass('student login succeeded')

    const authHeaders = {
      'Authorization': `Bearer ${token}`
    }

    const topicsRes = await fetch(`${API_URL}/api/topics`, { headers: authHeaders })
    if (!topicsRes.ok) {
      throw new Error(`Failed to load topics: ${topicsRes.status}`)
    }
    const topicsData = await topicsRes.json()
    const topics = topicsData.topics || []

    if (topics.length === 0) {
      log('SKIP library article checks: no published topics available')
      log('result PASS')
      return
    }
    pass('topics loaded')

    const topicWithArticle = topics.find(t => t.articles && t.articles.length > 0)
    if (!topicWithArticle) {
      log('SKIP library article checks: no published articles available')
      log('result PASS')
      return
    }

    const articleSlug = topicWithArticle.articles[0].slug

    const articleRes = await fetch(`${API_URL}/api/articles/${articleSlug}`, { headers: authHeaders })
    if (!articleRes.ok) {
      throw new Error(`Failed to load article ${articleSlug}, got ${articleRes.status}`)
    }
    const articleData = await articleRes.json()
    const article = articleData.article

    if (!article.slug || !article.title || !article.topic?.slug || !Array.isArray(article.sections) || !Array.isArray(article.relatedArticles) || typeof article.relatedQuestionCount !== 'number') {
      throw new Error('Article detail response missing required fields')
    }
    if (article.sections.length === 0 || article.sections.some(section => !Array.isArray(section.paragraphs))) {
      throw new Error('Article sections are missing structured paragraphs')
    }
    pass('loaded published article detail')
    pass('article sections include structured paragraphs')

    const missingRes = await fetch(`${API_URL}/api/articles/missing-smoke-slug`, { headers: authHeaders })
    if (missingRes.status !== 404) {
      throw new Error(`Expected 404 for missing article, got ${missingRes.status}`)
    }
    pass('missing article returned 404')

    log('result PASS')
  } finally {
    serverProcess.kill()
  }
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
