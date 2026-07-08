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
      <header className="admin-page__header-redesign">
        <div className="admin-page-title-group">
          <h1>Temas</h1>
          <p>Gestiona los temas, colores, slugs y estados.</p>
        </div>
        <button
          className="admin-btn-primary"
          onClick={() => onNavigate && onNavigate('/admin/topics/new')}
        >
          + Nuevo tema
        </button>
      </header>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <div className="admin-loading-state">
          <div className="admin-spinner"></div>
          <p>Cargando temas...</p>
        </div>
      ) : topics.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">📚</div>
          <h3>No hay temas creados</h3>
          <p>Comienza creando el primer tema para tu biblioteca.</p>
          <button className="admin-btn-primary" onClick={() => onNavigate && onNavigate('/admin/topics/new')}>Crear tema</button>
        </div>
      ) : (
        <div className="admin-topics-grid">
          {topics.map((t) => {
            const counts = t.counts || t._count || {}
            return (
              <div key={t.id || t.slug} className="admin-topic-card" onClick={() => onNavigate && onNavigate(`/admin/topics/review?id=${t.id}`)}>
                <div className="admin-topic-card__header">
                  <div className="admin-topic-card__title-group">
                    {t.color && (
                      <div
                        className="admin-topic-color-dot"
                        style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}80` }}
                      />
                    )}
                    <h3 className="admin-topic-card__title">{t.title}</h3>
                  </div>
                  <span className={`admin-badge admin-badge--${t.status?.toLowerCase() || 'draft'}`}>
                    {getHumanStatus(t.status)}
                  </span>
                </div>
                
                <p className="admin-topic-card__summary">{t.summary || 'Sin descripción'}</p>
                
                <div className="admin-topic-card__footer">
                  <div className="admin-topic-card__slug">/{t.slug}</div>
                  {(counts.articles !== undefined || counts.questions !== undefined) && (
                    <div className="admin-topic-card__stats">
                      {counts.articles !== undefined && (
                        <div className="admin-stat" title="Artículos">📄 {counts.articles}</div>
                      )}
                      {counts.questions !== undefined && (
                        <div className="admin-stat" title="Preguntas">❓ {counts.questions}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
