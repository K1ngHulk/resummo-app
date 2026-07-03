import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticlesPage.css'

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'DRAFT', label: 'Borradores' },
  { value: 'PUBLISHED', label: 'Publicados' },
  { value: 'ARCHIVED', label: 'Archivados' },
]

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return 'Estado desconocido'
}

export default function AdminArticlesPage({ onNavigate }) {
  const { request } = useAuth()
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchArticles = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await request('/api/admin/content/articles')
        if (isMounted) setArticles(payload.articles || [])
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar artículos')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchArticles()

    return () => {
      isMounted = false
    }
  }, [request])

  const counts = useMemo(() => ({
    total: articles.length,
    draft: articles.filter((article) => article.status === 'DRAFT').length,
    published: articles.filter((article) => article.status === 'PUBLISHED').length,
    archived: articles.filter((article) => article.status === 'ARCHIVED').length,
  }), [articles])
  const visibleArticles = useMemo(
    () => (filter ? articles.filter((article) => article.status === filter) : articles),
    [articles, filter],
  )

  return (
    <div className="admin-articles-page">
      <header className="admin-articles-header">
        <div>
          <h1>Gestión de artículos</h1>
          <p>Revisa la preparación editorial y controla qué contenido puede llegar a Biblioteca.</p>
        </div>
        <button
          type="button"
          className="admin-action-btn admin-action-btn--publish"
          onClick={() => onNavigate('/admin/articles/new')}
        >
          Nuevo artículo
        </button>
      </header>

      <section className="admin-article-stats" aria-label="Resumen editorial">
        <article>
          <span>Total</span>
          <strong>{counts.total}</strong>
        </article>
        <article>
          <span>Borradores</span>
          <strong>{counts.draft}</strong>
        </article>
        <article>
          <span>Publicados</span>
          <strong>{counts.published}</strong>
        </article>
        <article>
          <span>Archivados</span>
          <strong>{counts.archived}</strong>
        </article>
      </section>

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

      {error ? <div className="app-feedback app-feedback--error admin-articles-feedback">{error}</div> : null}

      {isLoading ? (
        <p className="admin-articles-loading">Cargando artículos...</p>
      ) : visibleArticles.length === 0 ? (
        <div className="admin-empty-state">
          No hay artículos para mostrar en este filtro.
        </div>
      ) : (
        <div className="admin-articles-list">
          {visibleArticles.map((article) => (
            <article key={article.id} className="admin-article-item">
              <div className="admin-article-item__header">
                <div>
                  <p className="admin-article-item__title">{article.title}</p>
                  <p className="admin-article-item__summary">{article.summary || 'Sin resumen editorial.'}</p>
                </div>
                <span className={`admin-status-badge admin-status-badge--${article.status.toLowerCase()}`}>
                  {getHumanStatus(article.status)}
                </span>
              </div>
              <div className="admin-article-item__meta">
                <span>Tema: {article.topic?.title || 'Sin tema'}</span>
                <span>{article.readTimeMinutes} min de lectura</span>
                <span>{article.tags?.length || 0} etiquetas</span>
              </div>
              <div className="admin-article-item__actions">
                <button
                  type="button"
                  className="admin-action-btn admin-action-btn--draft"
                  onClick={() => onNavigate(`/admin/articles/review?id=${article.id}`)}
                >
                  Revisar
                </button>
                {article.status === 'PUBLISHED' && article.topic?.status === 'PUBLISHED' ? (
                  <button
                    type="button"
                    className="admin-action-btn admin-action-btn--library"
                    onClick={() => onNavigate(`/learning/library/article?slug=${article.slug}`)}
                  >
                    Ver en Biblioteca
                  </button>
                ) : article.status === 'PUBLISHED' ? (
                  <span className="admin-article-item__notice">No visible: el tema no está publicado</span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
