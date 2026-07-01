import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminArticlesPage.css'

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return status
}

export default function AdminArticlesPage() {
  const { request } = useAuth()
  const [articles, setArticles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('') // '' means all
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchArticles = async () => {
      setIsLoading(true)
      setError('')
      try {
        const qs = filter ? `?status=${filter}` : ''
        const payload = await request(`/api/admin/content/articles${qs}`)
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
  }, [request, filter])

  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id)
    setError('')
    try {
      await request(`/api/admin/content/articles/${id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      // Actualizar localmente sin refetch para mejor UX
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      )
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="admin-articles-page">
      <header className="admin-articles-header">
        <h1>Gestión de Artículos</h1>
        <p>Revisa y cambia el estado editorial de los artículos (Borrador, Publicado, Archivado).</p>
      </header>

      <div className="admin-filters">
        <button
          className={`admin-filter-btn ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          Todos
        </button>
        <button
          className={`admin-filter-btn ${filter === 'DRAFT' ? 'active' : ''}`}
          onClick={() => setFilter('DRAFT')}
        >
          Borradores
        </button>
        <button
          className={`admin-filter-btn ${filter === 'PUBLISHED' ? 'active' : ''}`}
          onClick={() => setFilter('PUBLISHED')}
        >
          Publicados
        </button>
        <button
          className={`admin-filter-btn ${filter === 'ARCHIVED' ? 'active' : ''}`}
          onClick={() => setFilter('ARCHIVED')}
        >
          Archivados
        </button>
      </div>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)' }}>Cargando artículos...</p>
      ) : articles.length === 0 ? (
        <div className="admin-empty-state">
          No hay artículos para mostrar en este filtro.
        </div>
      ) : (
        <div className="admin-articles-list">
          {articles.map((a) => (
            <div key={a.id} className="admin-article-item">
              <div className="admin-article-item__header">
                <p className="admin-article-item__title">{a.title}</p>
                <span className={`admin-status-badge admin-status-badge--${a.status.toLowerCase()}`}>
                  {getHumanStatus(a.status)}
                </span>
              </div>
              <div className="admin-article-item__meta">
                <span>Tema: {a.topic?.title || 'Sin tema'}</span>
                <span>Tiempo de lectura: {a.readTimeMinutes} min</span>
                {a.tags && a.tags.length > 0 && (
                  <span>Etiquetas: {a.tags.join(', ')}</span>
                )}
              </div>
              <div className="admin-article-item__actions">
                {a.status !== 'PUBLISHED' && (
                  <button
                    className="admin-action-btn admin-action-btn--publish"
                    disabled={actionLoadingId === a.id}
                    onClick={() => handleStatusChange(a.id, 'PUBLISHED')}
                  >
                    Publicar
                  </button>
                )}
                {a.status !== 'DRAFT' && (
                  <button
                    className="admin-action-btn admin-action-btn--draft"
                    disabled={actionLoadingId === a.id}
                    onClick={() => handleStatusChange(a.id, 'DRAFT')}
                  >
                    Volver a borrador
                  </button>
                )}
                {a.status !== 'ARCHIVED' && (
                  <button
                    className="admin-action-btn admin-action-btn--archive"
                    disabled={actionLoadingId === a.id}
                    onClick={() => handleStatusChange(a.id, 'ARCHIVED')}
                  >
                    Archivar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
