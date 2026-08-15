const libraryCache = new Map()
const pendingRequests = new Map()
const FRESH_FOR_MS = 30_000

function getViewKey(user) {
  if (!user?.id) return null
  const editorialView = user.role === 'EDITOR' || user.role === 'ADMIN'
  return `${user.id}:${editorialView ? 'editorial' : 'published'}`
}

function getEndpoint(user) {
  const editorialView = user?.role === 'EDITOR' || user?.role === 'ADMIN'
  return `/api/topics${editorialView ? '?view=editorial' : ''}`
}

export function getCachedLibraryTopics(user) {
  const key = getViewKey(user)
  if (!key) return null
  return libraryCache.get(key)?.topics ?? null
}

export function isLibraryCacheFresh(user) {
  const key = getViewKey(user)
  if (!key) return false
  const cached = libraryCache.get(key)
  return Boolean(cached && Date.now() - cached.updatedAt < FRESH_FOR_MS)
}

export function markLibraryCacheStale() {
  for (const [key, cached] of libraryCache.entries()) {
    libraryCache.set(key, { ...cached, updatedAt: 0 })
  }
}

export function clearLibraryDataCache() {
  libraryCache.clear()
  pendingRequests.clear()
}

export async function fetchLibraryTopics({ request, user, force = false }) {
  const key = getViewKey(user)
  if (!key) return []

  const cached = libraryCache.get(key)
  if (!force && cached && Date.now() - cached.updatedAt < FRESH_FOR_MS) {
    return cached.topics
  }

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)
  }

  const pending = request(getEndpoint(user))
    .then((payload) => {
      const topics = Array.isArray(payload?.topics) ? payload.topics : []
      libraryCache.set(key, { topics, updatedAt: Date.now() })
      return topics
    })
    .finally(() => {
      pendingRequests.delete(key)
    })

  pendingRequests.set(key, pending)
  return pending
}

export function prefetchLibraryTopics({ request, user }) {
  if (!user?.id || isLibraryCacheFresh(user)) return Promise.resolve(getCachedLibraryTopics(user) ?? [])
  return fetchLibraryTopics({ request, user })
}
