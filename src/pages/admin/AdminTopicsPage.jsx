import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminTopics.css'

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return status
}

export default function AdminTopicsPage({ onNavigate }) {
  const { request } = useAuth()
  const [topics, setTopics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const fetchTopics = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await request('/api/admin/content/topics')
        if (isMounted) setTopics(payload.topics || [])
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar temas')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchTopics()

    return () => {
      isMounted = false
    }
  }, [request])

  return (
    <div className="admin-topics-page">
      <header className="admin-topics-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1>Temas</h1>
            <p>Gestiona los temas, colores, slugs y estados (Borrador, Publicado, Archivado).</p>
          </div>
          <button
            className="admin-action-btn admin-action-btn--publish"
            onClick={() => onNavigate && onNavigate('/admin/topics/new')}
          >
            Nuevo tema
          </button>
        </div>
      </header>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)' }}>Cargando temas...</p>
      ) : topics.length === 0 ? (
        <div className="admin-empty-state">
          No hay temas para mostrar.
        </div>
      ) : (
        <div className="admin-topics-list">
          {topics.map((t) => {
            const counts = t.counts || t._count || {}
            return (
            <div key={t.id || t.slug} className="admin-topic-item">
              <div className="admin-topic-item__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {t.color && (
                    <div
                      className="admin-topic-color-swatch"
                      style={{ backgroundColor: t.color }}
                      title={`Color: ${t.color}`}
                    />
                  )}
                  <p className="admin-topic-item__title">{t.title}</p>
                </div>
                <span className={`admin-status-badge admin-status-badge--${t.status?.toLowerCase() || 'draft'}`}>
                  {getHumanStatus(t.status)}
                </span>
              </div>
              <div className="admin-topic-item__meta">
                <span>Slug: {t.slug}</span>
                <span>{t.summary}</span>
                {(counts.articles !== undefined || counts.questions !== undefined) && (
                  <div className="admin-topic-counts">
                    {counts.articles !== undefined && <span>Artículos: {counts.articles}</span>}
                    {counts.questions !== undefined && <span>Preguntas: {counts.questions}</span>}
                  </div>
                )}
              </div>
              <div className="admin-topic-item__actions">
                <button
                  className="admin-action-btn admin-action-btn--draft"
                  onClick={() => onNavigate && onNavigate(`/admin/topics/review?id=${t.id}`)}
                >
                  Revisar
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
