import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminQuestionsPage.css'

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return 'Estado desconocido'
}

export default function AdminQuestionsPage({ onNavigate }) {
  const { request } = useAuth()
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchQuestions = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await request('/api/admin/content/questions')
        if (isMounted) setQuestions(payload.questions || [])
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar preguntas')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchQuestions()

    return () => {
      isMounted = false
    }
  }, [request])

  const counts = useMemo(() => ({
    total: questions.length,
    draft: questions.filter((question) => question.status === 'DRAFT').length,
    published: questions.filter((question) => question.status === 'PUBLISHED').length,
    archived: questions.filter((question) => question.status === 'ARCHIVED').length,
  }), [questions])
  const visibleQuestions = useMemo(
    () => (filter ? questions.filter((question) => question.status === filter) : questions),
    [filter, questions],
  )

  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id)
    setError('')
    try {
      await request(`/api/admin/content/questions/${id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q))
      )
    } catch (err) {
      setError(err.message || 'Error al actualizar el estado')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="admin-questions-page">
      <header className="admin-questions-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1>Gestión de Preguntas</h1>
            <p>Revisa y cambia el estado de las preguntas del banco (Borrador, Publicado, Archivado).</p>
          </div>
          <button
            className="admin-action-btn admin-action-btn--publish"
            style={{ padding: '0.75rem 1.25rem', fontSize: '1rem' }}
            onClick={() => onNavigate && onNavigate('/admin/questions/new')}
          >
            Nueva pregunta
          </button>
        </div>
      </header>

      <section className="admin-question-stats" aria-label="Resumen editorial de preguntas">
        <article><span>Total</span><strong>{counts.total}</strong></article>
        <article><span>Borradores</span><strong>{counts.draft}</strong></article>
        <article><span>Publicadas</span><strong>{counts.published}</strong></article>
        <article><span>Archivadas</span><strong>{counts.archived}</strong></article>
      </section>

      <div className="admin-filters">
        <button
          className={`admin-filter-btn ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          Todas
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
          Publicadas
        </button>
        <button
          className={`admin-filter-btn ${filter === 'ARCHIVED' ? 'active' : ''}`}
          onClick={() => setFilter('ARCHIVED')}
        >
          Archivadas
        </button>
      </div>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-soft)' }}>Cargando preguntas...</p>
      ) : visibleQuestions.length === 0 ? (
        <div className="admin-empty-state">
          No hay preguntas para mostrar en este filtro.
        </div>
      ) : (
        <div className="admin-questions-list">
          {visibleQuestions.map((q) => (
            <div key={q.id} className="admin-question-item">
              <div className="admin-question-item__header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <p className="admin-question-item__prompt" style={{ margin: 0 }}>{q.prompt}</p>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: q.type === 'FLASHCARD' ? '#8A342C' : '#64748b' }}>
                    {q.type === 'FLASHCARD' ? '⚡ Flashcard' : '📝 Opción Múltiple'}
                  </span>
                </div>
                <span className={`admin-status-badge admin-status-badge--${q.status.toLowerCase()}`}>
                  {getHumanStatus(q.status)}
                </span>
              </div>
              <div className="admin-question-item__meta">
                <span>Tema: {q.topic?.title || 'Sin tema'}</span>
                <span>Artículo: {q.article?.title || 'Sin artículo asociado'}</span>
                <span>{q._count?.options || 0} opciones</span>
                <span>Dificultad {q.difficulty}/5</span>
              </div>
              {q.status !== 'PUBLISHED' || q.topic?.status !== 'PUBLISHED' || (q.article && q.article.status !== 'PUBLISHED') ? (
                <p className="admin-question-item__notice">Revisa el checklist editorial antes de publicar.</p>
              ) : null}
              <div className="admin-question-item__actions">
                <button
                  className="admin-action-btn admin-action-btn--draft"
                  onClick={() => onNavigate && onNavigate(`/admin/questions/review?id=${q.id}`)}
                >
                  Revisar
                </button>
                {q.status !== 'PUBLISHED' && (
                  <button
                    className="admin-action-btn admin-action-btn--publish"
                    disabled={actionLoadingId === q.id}
                    onClick={() => handleStatusChange(q.id, 'PUBLISHED')}
                  >
                    Publicar
                  </button>
                )}
                {q.status !== 'DRAFT' && (
                  <button
                    className="admin-action-btn admin-action-btn--draft"
                    disabled={actionLoadingId === q.id}
                    onClick={() => handleStatusChange(q.id, 'DRAFT')}
                  >
                    Volver a borrador
                  </button>
                )}
                {q.status !== 'ARCHIVED' && (
                  <button
                    className="admin-action-btn admin-action-btn--archive"
                    disabled={actionLoadingId === q.id}
                    onClick={() => handleStatusChange(q.id, 'ARCHIVED')}
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
