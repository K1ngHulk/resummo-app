import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../../components/ui/AppIcon'
import { useAuth } from '../../context/AuthContext'
import './AdminArticlesPage.css'

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'En revisión' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'ARCHIVED', label: 'Archivados' },
]

function hasCurrentEditorialApproval(article) {
  if (article.sourceType !== 'NOTION_EXPORT') return true
  return Boolean(
    article.editorialApprovedAt
    && article.editorialApprovedByUserId
    && article.editorialApprovedSnapshotHash
    && article.sourceSnapshotHash
    && article.editorialApprovedSnapshotHash === article.sourceSnapshotHash,
  )
}

function getWorkflowStatus(article) {
  if (article.status === 'PUBLISHED') return { label: 'Publicado', tone: 'published' }
  if (article.status === 'ARCHIVED') return { label: 'Archivado', tone: 'archived' }
  if (hasCurrentEditorialApproval(article)) return { label: 'Aprobado', tone: 'approved' }
  return { label: 'Por revisar', tone: 'review' }
}

export default function AdminArticlesPage({ onNavigate }) {
  const { request, user } = useAuth()
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)
  const [pendingPublishConfirmation, setPendingPublishConfirmation] = useState(false)
  const [pendingLibraryPublish, setPendingLibraryPublish] = useState(false)
  const [isLibraryPublishing, setIsLibraryPublishing] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadArticles() {
      try {
        const payload = await request('/api/admin/content/articles')
        if (isMounted) setArticles(payload.articles || [])
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar artículos')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadArticles()
    return () => {
      isMounted = false
    }
  }, [request])

  const counts = useMemo(() => ({
    topics: new Set(articles.map((article) => article.topic?.title).filter(Boolean)).size,
    total: articles.length,
    review: articles.filter((article) => article.status === 'DRAFT').length,
    approved: articles.filter((article) => article.status === 'DRAFT' && hasCurrentEditorialApproval(article)).length,
    published: articles.filter((article) => article.status === 'PUBLISHED').length,
  }), [articles])

  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const visibleArticles = useMemo(() => articles.filter((article) => {
    if (filter && article.status !== filter) return false
    if (!normalizedQuery) return true
    return [article.title, article.summary, article.topic?.title, ...(article.tags || [])]
      .join(' ')
      .toLocaleLowerCase('es')
      .includes(normalizedQuery)
  }), [articles, filter, normalizedQuery])

  const selectedArticles = useMemo(
    () => articles.filter((article) => selectedIds.has(article.id)),
    [articles, selectedIds],
  )
  const allVisibleSelected = visibleArticles.length > 0 && visibleArticles.every((article) => selectedIds.has(article.id))
  const selectedNeedApproval = selectedArticles.filter((article) => !hasCurrentEditorialApproval(article) && article.status !== 'PUBLISHED').length

  const toggleArticle = (articleId) => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(articleId)) next.delete(articleId)
      else next.add(articleId)
      return next
    })
    setPendingPublishConfirmation(false)
  }

  const toggleVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) visibleArticles.forEach((article) => next.delete(article.id))
      else visibleArticles.forEach((article) => next.add(article.id))
      return next
    })
    setPendingPublishConfirmation(false)
  }

  const runPublishLibrary = async () => {
    setIsLibraryPublishing(true)
    setError('')
    setSuccess('')
    try {
      const payload = await request('/api/admin/content/articles/publish-library', {
        method: 'POST',
      })
      setSuccess(`Biblioteca publicada: ${payload.published || 0} artículo(s) y ${payload.topicsPublished || 0} especialidad(es) visibles para estudiantes.`)
      setPendingLibraryPublish(false)
      setSelectedIds(new Set())
      const refreshed = await request('/api/admin/content/articles')
      setArticles(refreshed.articles || [])
    } catch (publishError) {
      setError(publishError.message || 'No se pudo publicar la biblioteca.')
    } finally {
      setIsLibraryPublishing(false)
    }
  }

  const runBulkAction = async (action) => {
    if (selectedIds.size === 0) return
    setIsBulkProcessing(true)
    setError('')
    setSuccess('')
    try {
      const payload = await request('/api/admin/content/articles/bulk-action', {
        method: 'POST',
        body: { articleIds: [...selectedIds], action },
      })
      if (action === 'APPROVE') {
        setSuccess(`${payload.approved || 0} artículo(s) importado(s) quedaron aprobados para su snapshot actual.`)
      } else {
        setSuccess(`${payload.published || 0} artículo(s) publicados. También se publicaron ${payload.topicsPublished || 0} especialidad(es) necesarias.`)
      }
      setSelectedIds(new Set())
      setPendingPublishConfirmation(false)
      const refreshed = await request('/api/admin/content/articles')
      setArticles(refreshed.articles || [])
    } catch (bulkError) {
      setError(bulkError.message || 'No se pudo completar la acción editorial.')
    } finally {
      setIsBulkProcessing(false)
    }
  }

  return (
    <div className="admin-articles-page">
      <header className="admin-articles-header">
        <div>
          <h1>Biblioteca editorial</h1>
          <p>Gestiona especialidades y artículos importados. Puedes revisar contenido individualmente o publicar la biblioteca completa cuando el snapshot actual esté listo.</p>
        </div>
        <div className="admin-articles-header__actions">
          <button type="button" className="admin-action-btn admin-action-btn--secondary" onClick={() => onNavigate('/admin/import/articles')}>
            Importar contenido
          </button>
          {user?.role === 'ADMIN' && counts.review > 0 ? (
            <button type="button" className="admin-action-btn admin-action-btn--publish" onClick={() => setPendingLibraryPublish(true)}>
              <AppIcon name="publish" />
              Publicar biblioteca
            </button>
          ) : null}
          <button type="button" className="admin-action-btn admin-action-btn--secondary" onClick={() => onNavigate('/admin/articles/new')}>
            Nuevo artículo
          </button>
        </div>
      </header>

      <section className="admin-article-stats" aria-label="Resumen editorial">
        <article><span>Especialidades</span><strong>{counts.topics}</strong></article>
        <article><span>Artículos</span><strong>{counts.total}</strong></article>
        <article><span>En revisión</span><strong>{counts.review}</strong></article>
        <article><span>Aprobados</span><strong>{counts.approved}</strong></article>
        <article><span>Publicados</span><strong>{counts.published}</strong></article>
      </section>

      {pendingLibraryPublish ? (
        <section className="admin-library-publish-card" role="alert">
          <div>
            <strong>Publicar la biblioteca completa</strong>
            <p>Esta acción aprobará el snapshot actual de los artículos importados y publicará automáticamente las especialidades asociadas. El contenido pasará a ser visible para cuentas Student.</p>
          </div>
          <div className="admin-library-publish-card__actions">
            <button type="button" className="admin-action-btn admin-action-btn--secondary" onClick={() => setPendingLibraryPublish(false)} disabled={isLibraryPublishing}>Cancelar</button>
            <button type="button" className="admin-action-btn admin-action-btn--publish" onClick={runPublishLibrary} disabled={isLibraryPublishing}>{isLibraryPublishing ? 'Publicando biblioteca…' : `Confirmar publicación (${counts.review} en revisión)`}</button>
          </div>
        </section>
      ) : null}

      <section className="admin-articles-toolbar" aria-label="Buscar y filtrar artículos">
        <label className="admin-articles-search">
          <span className="visually-hidden">Buscar artículos</span>
          <AppIcon name="search" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título o especialidad" />
        </label>
        <div className="admin-filters" aria-label="Filtrar artículos por estado">
          {statusOptions.map((option) => (
            <button
              key={option.value || 'all'}
              type="button"
              className={`admin-filter-btn ${filter === option.value ? 'active' : ''}`}
              onClick={() => setFilter(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      {error ? <div className="app-feedback app-feedback--error admin-articles-feedback">{error}</div> : null}
      {success ? <div className="app-feedback admin-articles-feedback" role="status">{success}</div> : null}

      {!isLoading && visibleArticles.length > 0 ? (
        <div className="admin-selection-bar">
          <label className="admin-selection-toggle">
            <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisible} />
            <span>{allVisibleSelected ? 'Quitar selección visible' : `Seleccionar visibles (${visibleArticles.length})`}</span>
          </label>
          <span>{selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}</span>
        </div>
      ) : null}

      {selectedIds.size > 0 ? (
        <section className="admin-bulk-bar" aria-label="Acciones por lote">
          <div>
            <strong>{selectedIds.size} artículo{selectedIds.size === 1 ? '' : 's'} seleccionado{selectedIds.size === 1 ? '' : 's'}</strong>
            <span>{selectedNeedApproval > 0 ? `${selectedNeedApproval} aún requieren aprobación editorial.` : 'La selección puede pasar al siguiente estado editorial.'}</span>
          </div>
          <div className="admin-bulk-bar__actions">
            <button type="button" className="admin-action-btn admin-action-btn--secondary" disabled={isBulkProcessing || selectedNeedApproval === 0} onClick={() => runBulkAction('APPROVE')}>
              <AppIcon name="check" />
              {isBulkProcessing ? 'Procesando…' : 'Aprobar selección'}
            </button>
            <button type="button" className="admin-action-btn admin-action-btn--publish" disabled={isBulkProcessing || selectedNeedApproval > 0} onClick={() => setPendingPublishConfirmation(true)}>
              <AppIcon name="publish" />
              Publicar selección
            </button>
          </div>

          {pendingPublishConfirmation ? (
            <div className="admin-bulk-confirm" role="alert">
              <p><strong>¿Publicar {selectedIds.size} artículo{selectedIds.size === 1 ? '' : 's'}?</strong> Las especialidades asociadas se publicarán automáticamente para que el contenido sea visible a estudiantes.</p>
              <div>
                <button type="button" className="admin-action-btn admin-action-btn--secondary" onClick={() => setPendingPublishConfirmation(false)} disabled={isBulkProcessing}>Cancelar</button>
                <button type="button" className="admin-action-btn admin-action-btn--publish" onClick={() => runBulkAction('PUBLISH')} disabled={isBulkProcessing}>{isBulkProcessing ? 'Publicando…' : 'Confirmar publicación'}</button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {isLoading ? (
        <p className="admin-articles-loading">Cargando artículos…</p>
      ) : visibleArticles.length === 0 ? (
        <div className="admin-empty-state">No hay artículos para mostrar con estos filtros.</div>
      ) : (
        <div className="admin-articles-list">
          {visibleArticles.map((article) => {
            const workflow = getWorkflowStatus(article)
            return (
              <article key={article.id} className={`admin-article-item ${selectedIds.has(article.id) ? 'admin-article-item--selected' : ''}`}>
                <label className="admin-article-select" aria-label={`Seleccionar ${article.title}`}>
                  <input type="checkbox" checked={selectedIds.has(article.id)} onChange={() => toggleArticle(article.id)} />
                </label>
                <div className="admin-article-item__body">
                  <div className="admin-article-item__header">
                    <div>
                      <p className="admin-article-item__title">{article.title}</p>
                      <p className="admin-article-item__summary">{article.summary || 'Sin resumen editorial.'}</p>
                    </div>
                    <span className={`admin-status-badge admin-status-badge--${workflow.tone}`}>{workflow.label}</span>
                  </div>
                  <div className="admin-article-item__meta">
                    <span>{article.topic?.title || 'Sin especialidad'}</span>
                    <span>{article.readTimeMinutes} min</span>
                    {article.sourceType === 'NOTION_EXPORT' ? <span>Importado desde Notion</span> : null}
                  </div>
                  <div className="admin-article-item__actions">
                    <button type="button" className="admin-action-btn admin-action-btn--draft" onClick={() => onNavigate(`/admin/articles/review?id=${article.id}`)}>Revisar</button>
                    {article.status === 'PUBLISHED' && article.topic?.status === 'PUBLISHED' ? (
                      <button type="button" className="admin-action-btn admin-action-btn--library" onClick={() => onNavigate(`/learning/library/article?slug=${article.slug}`)}>Ver en Biblioteca</button>
                    ) : null}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
