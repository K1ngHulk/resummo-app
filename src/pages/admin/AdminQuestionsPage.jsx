import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminQuestionsPage.css'

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return status
}

export default function AdminQuestionsPage({ onNavigate }) {
  const { request } = useAuth()
  const [questions, setQuestions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('') // '' means all
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const fetchQuestions = async () => {
      setIsLoading(true)
      setError('')
      try {
        const qs = filter ? `?status=${filter}` : ''
        const payload = await request(`/api/admin/content/questions${qs}`)
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
  }, [request, filter])

  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id)
    setError('')
    try {
      await request(`/api/admin/content/questions/${id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      })
      // Actualizar localmente sin refetch para mejor UX
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
      ) : questions.length === 0 ? (
        <div className="admin-empty-state">
          No hay preguntas para mostrar en este filtro.
        </div>
      ) : (
        <div className="admin-questions-list">
          {questions.map((q) => (
            <div key={q.id} className="admin-question-item">
              <div className="admin-question-item__header">
                <p className="admin-question-item__prompt">{q.prompt}</p>
                <span className={`admin-status-badge admin-status-badge--${q.status.toLowerCase()}`}>
                  {getHumanStatus(q.status)}
                </span>
              </div>
              <div className="admin-question-item__meta">
                <span>Tema: {q.topic?.title || 'Sin tema'}</span>
                <span>Opciones: {q._count?.options || 0}</span>
                <span>Dificultad: {q.difficulty}</span>
              </div>
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
