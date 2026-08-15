import test from 'node:test'
import assert from 'node:assert/strict'
import {
  clearLibraryDataCache,
  fetchLibraryTopics,
  getCachedLibraryTopics,
  isLibraryCacheFresh,
  markLibraryCacheStale,
} from './libraryDataCache.js'

const editor = { id: 'editor-1', role: 'EDITOR' }
const student = { id: 'student-1', role: 'STUDENT' }

test.beforeEach(() => {
  clearLibraryDataCache()
})

test('caches Library topics per user and view without refetching while fresh', async () => {
  let calls = 0
  const request = async (path) => {
    calls += 1
    assert.equal(path, '/api/topics?view=editorial')
    return { topics: [{ id: 'topic-1', title: 'Cardiología' }] }
  }

  const first = await fetchLibraryTopics({ request, user: editor })
  const second = await fetchLibraryTopics({ request, user: editor })

  assert.equal(calls, 1)
  assert.deepEqual(second, first)
  assert.deepEqual(getCachedLibraryTopics(editor), first)
  assert.equal(isLibraryCacheFresh(editor), true)
})

test('marks cached Library data stale while keeping it available for instant rendering', async () => {
  let calls = 0
  const request = async () => {
    calls += 1
    return { topics: [{ id: `topic-${calls}` }] }
  }

  const initial = await fetchLibraryTopics({ request, user: student })
  markLibraryCacheStale()

  assert.deepEqual(getCachedLibraryTopics(student), initial)
  assert.equal(isLibraryCacheFresh(student), false)

  const refreshed = await fetchLibraryTopics({ request, user: student })
  assert.equal(calls, 2)
  assert.notDeepEqual(refreshed, initial)
})

test('deduplicates concurrent Library requests', async () => {
  let calls = 0
  let resolveRequest
  const request = () => {
    calls += 1
    return new Promise((resolve) => {
      resolveRequest = resolve
    })
  }

  const first = fetchLibraryTopics({ request, user: editor, force: true })
  const second = fetchLibraryTopics({ request, user: editor, force: true })
  assert.equal(calls, 1)

  resolveRequest({ topics: [{ id: 'topic-1' }] })
  assert.deepEqual(await first, await second)
})
