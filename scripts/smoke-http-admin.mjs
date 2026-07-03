import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const SMOKE_PORT = process.env.SMOKE_PORT || '3099';
const BASE_URL = `http://localhost:${SMOKE_PORT}`;

console.log(`[smoke] starting API on ${BASE_URL}`);

const serverProcess = spawn('node', ['server/index.js'], {
  env: { ...process.env, PORT: SMOKE_PORT },
  stdio: 'pipe'
});

let serverError = '';
serverProcess.stderr.on('data', (data) => {
  serverError += data.toString();
});

let processExited = false;
serverProcess.on('exit', (code) => {
  processExited = true;
  if (code === 125 || serverError.includes('EADDRINUSE')) {
      console.error(`[smoke] Port ${SMOKE_PORT} already in use. Retry with a different SMOKE_PORT.`);
  }
});

async function waitForHealth() {
  const maxRetries = 30;
  for (let i = 0; i < maxRetries; i++) {
    if (processExited) {
      console.error(`[smoke] API process exited prematurely. stderr: ${serverError}`);
      process.exit(1);
    }
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.ok) {
        const json = await res.json();
        if (json.ok) {
          return true;
        }
      }
    } catch (err) {
      // ignore and retry
    }
    await delay(500);
  }
  return false;
}

async function runChecks() {
  let studentToken = '';
  try {
    // 1. Wait for health
    const isHealthy = await waitForHealth();
    if (!isHealthy) {
      throw new Error('Health check failed or timed out');
    }
    console.log('[pass] health endpoint returned ok');

    // 2. Unauthenticated admin topics
    const unauthRes = await fetch(`${BASE_URL}/api/admin/content/topics`);
    if (unauthRes.status === 401) {
      console.log('[pass] unauthenticated admin topics returned 401');
    } else {
      throw new Error(`Expected 401 for unauthenticated admin topics, got ${unauthRes.status}`);
    }

    // 3. Student login (403 check)
    const studentLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo@resummo.app', password: 'Demo12345' })
    });

    if (studentLogin.ok) {
      const data = await studentLogin.json();
      studentToken = data.token;
      const studentTopics = await fetch(`${BASE_URL}/api/admin/content/topics`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });

      if (studentTopics.status !== 403) {
        throw new Error(`Expected 403 for student on admin topics, got ${studentTopics.status}`);
      }

      console.log('[pass] student 403 check passed');
    } else {
      console.log('[skip] student 403 check: seeded student login unavailable');
    }

    // 4. Editor login (200 check)
    const editorLogin = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'editor@resummo.app', password: 'Editor12345' })
    });

    if (editorLogin.ok) {
      const data = await editorLogin.json();
      const editorTopics = await fetch(`${BASE_URL}/api/admin/content/topics`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });

      if (!editorTopics.ok) {
        throw new Error(`Expected 200 for editor on admin topics, got ${editorTopics.status}`);
      }

      const topicsData = await editorTopics.json();
      if (!Array.isArray(topicsData.topics)) {
        throw new Error('Editor admin topics returned 200 but topics is not an array');
      }

      console.log('[pass] editor admin topics returned 200');

      const editorArticles = await fetch(`${BASE_URL}/api/admin/content/articles`, {
        headers: { Authorization: `Bearer ${data.token}` }
      });

      if (!editorArticles.ok) {
        throw new Error(`Expected 200 for editor on admin articles, got ${editorArticles.status}`);
      }

      const articlesData = await editorArticles.json();
      const articleForGuardCheck = articlesData.articles?.[0];
      if (articleForGuardCheck) {
        const guardedPublish = await fetch(`${BASE_URL}/api/admin/content/articles/${articleForGuardCheck.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.token}`
          },
          body: JSON.stringify({
            status: 'PUBLISHED',
            body: '## Revision editorial\n[FALTA CITA]'
          })
        });

        if (guardedPublish.status !== 400) {
          throw new Error(`Expected 400 when publishing article with editorial markers, got ${guardedPublish.status}`);
        }
        console.log('[pass] editorial guard rejected article with pending citation');
      } else {
        console.log('[skip] editorial publication guard: no article available');
      }

      const privateArticle = articlesData.articles?.find((article) => article.status !== 'PUBLISHED');
      if (studentToken && privateArticle) {
        const privateArticleResponse = await fetch(`${BASE_URL}/api/articles/${privateArticle.slug}`, {
          headers: { Authorization: `Bearer ${studentToken}` }
        });
        if (privateArticleResponse.status !== 404) {
          throw new Error(`Expected 404 for non-published article, got ${privateArticleResponse.status}`);
        }
        console.log('[pass] non-published article stayed hidden from student');
      } else {
        console.log('[skip] non-published visibility check: fixture unavailable');
      }
    } else {
      console.log('[skip] editor admin-read check: seeded editor login unavailable');
    }

    console.log('[smoke] result PASS');
    return 0;
  } catch (err) {
    console.error(`[smoke] result FAIL: ${err.message}`);
    return 1;
  }
}

// Timeout to prevent hanging forever
let isTimeout = false;
let timeoutId;
const timeoutPromise = new Promise((resolve) => {
  timeoutId = globalThis.setTimeout(() => {
    isTimeout = true;
    resolve(1);
  }, 30000);
});

Promise.race([runChecks(), timeoutPromise])
  .then((code) => {
    if (isTimeout) {
      console.error('[smoke] timeout reached, killing process');
    }
    process.exitCode = code;
  })
  .finally(() => {
    globalThis.clearTimeout(timeoutId);
    if (serverProcess && !processExited) {
      serverProcess.kill('SIGTERM');
    }
  });
