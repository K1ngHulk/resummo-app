import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AdminQuestionReviewPage.css'

const pendingEditorialPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

function getHumanStatus(status) {
  if (status === 'DRAFT') return 'Borrador'
  if (status === 'PUBLISHED') return 'Publicado'
  if (status === 'ARCHIVED') return 'Archivado'
  return 'Estado desconocido'
}

function buildEditorialChecklist(formData, question) {
  const options = question?.options || []
  const textToReview = [
    formData.prompt,
    formData.explanation,
    formData.hint,
    ...options.map((option) => option.text),
  ].join(' ')

  return [
    { id: 'prompt', label: 'Enunciado presente', passed: Boolean(formData.prompt.trim()) },
    { id: 'explanation', label: 'Explicación presente', passed: Boolean(formData.explanation.trim()) },
    {
      id: 'difficulty',
      label: 'Dificultad válida entre 1 y 5',
      passed: Number.isInteger(formData.difficulty) && formData.difficulty >= 1 && formData.difficulty <= 5,
    },
    { id: 'topic', label: 'Tema asociado publicado', passed: question?.topic?.status === 'PUBLISHED' },
    {
      id: 'article',
      label: 'Artículo asociado publicado y en el mismo tema',
      passed: !question?.article || (
        question.article.status === 'PUBLISHED' && question.article.topicId === question.topicId
      ),
    },
    { id: 'option-count', label: 'Entre 2 y 5 opciones', passed: options.length >= 2 && options.length <= 5 },
    {
      id: 'correct-option',
      label: 'Exactamente una opción correcta',
      passed: options.filter((option) => option.isCorrect).length === 1,
    },
    { id: 'option-text', label: 'Todas las opciones tienen texto', passed: options.every((option) => option.text?.trim()) },
    { id: 'pending', label: 'Sin pendientes editoriales', passed: !pendingEditorialPattern.test(textToReview) },
  ]
}

export default function AdminQuestionReviewPage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const questionId = searchParams?.get('id')

  const [question, setQuestion] = useState(null)
  const [formData, setFormData] = useState({
    prompt: '',
    explanation: '',
    difficulty: 1,
    hint: '',
    status: 'DRAFT'
  })
  const [isLoading, setIsLoading] = useState(!!questionId)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(questionId ? '' : 'No se encontró una pregunta válida para revisar.')
  const [successMsg, setSuccessMsg] = useState('')
  const editorialChecklist = useMemo(
    () => buildEditorialChecklist(formData, question),
    [formData, question],
  )
  const publicationReady = editorialChecklist.every((item) => item.passed)

  useEffect(() => {
    if (!questionId) return

    let isMounted = true
    const fetchQuestion = async () => {
      setIsLoading(true)
      setError('')
      try {
        const payload = await request(`/api/admin/content/questions/${questionId}`)
        if (isMounted) {
          setQuestion(payload.question)
          setFormData({
            prompt: payload.question.prompt || '',
            explanation: payload.question.explanation || '',
            difficulty: payload.question.difficulty || 1,
            hint: payload.question.hint || '',
            status: payload.question.status || 'DRAFT'
          })
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error al cargar la pregunta')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchQuestion()

    return () => {
      isMounted = false
    }
  }, [questionId, request])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'difficulty' ? parseInt(value, 10) : value
    }))
  }

  const handleSave = async (e, forceStatus = null) => {
    if (e) e.preventDefault()

    const requestedStatus = forceStatus || formData.status
    const returnToDraftOnSave = !forceStatus && requestedStatus === 'PUBLISHED' && !publicationReady
    const statusToSave = returnToDraftOnSave ? 'DRAFT' : requestedStatus
    if (forceStatus === 'PUBLISHED' && !publicationReady) {
      setError('Completa el checklist editorial antes de publicar. Guardar, archivar o volver a borrador sigue disponible.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMsg('')

    try {
      await request(`/api/admin/content/questions/${questionId}`, {
        method: 'PATCH',
        body: {
          prompt: formData.prompt.trim(),
          explanation: formData.explanation.trim(),
          difficulty: formData.difficulty,
          hint: formData.hint.trim() || null,
          status: statusToSave
        }
      })
      
      setSuccessMsg(
        returnToDraftOnSave
          ? 'Cambios guardados como borrador porque la pregunta requiere revisión editorial.'
          : statusToSave === 'PUBLISHED'
            ? 'Pregunta publicada correctamente.'
            : 'Cambios guardados correctamente.',
      )
      setFormData(prev => ({ ...prev, status: statusToSave }))
      setQuestion(prev => ({
        ...prev,
        prompt: formData.prompt.trim(),
        explanation: formData.explanation.trim(),
        difficulty: formData.difficulty,
        hint: formData.hint.trim() || null,
        status: statusToSave,
      }))
      
      // Auto-hide success message
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios')
    } finally {
      setIsSaving(false)
    }
  }

  if (!questionId) {
    return (
      <div className="admin-review-page">
        <div className="admin-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="admin-btn admin-btn--secondary" onClick={() => onNavigate('/admin/questions')}>
            Volver a Preguntas
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="admin-review-page">
        <p style={{ color: 'var(--color-text-soft)' }}>Cargando pregunta...</p>
      </div>
    )
  }

  if (error && !question) {
    return (
      <div className="admin-review-page">
        <div className="admin-error-container">
          <h2>Error al cargar</h2>
          <p>{error}</p>
          <button className="admin-btn admin-btn--secondary" onClick={() => onNavigate('/admin/questions')}>
            Volver a Preguntas
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-review-page">
      <header className="admin-review-header">
        <div>
          <h1 className="admin-review-title">Revisión de Pregunta</h1>
          <p className="admin-review-subtitle">
            Estado actual: <strong>{getHumanStatus(formData.status)}</strong>
          </p>
        </div>
        <button 
          className="admin-back-btn"
          onClick={() => onNavigate('/admin/questions')}
        >
          &larr; Volver a lista
        </button>
      </header>

      {error && <div className="app-feedback app-feedback--error" style={{ marginBottom: '1rem' }}>{error}</div>}
      {successMsg && <div className="app-feedback app-feedback--success" style={{ marginBottom: '1rem', backgroundColor: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '8px' }}>{successMsg}</div>}

      <div className="admin-review-content">
        <form onSubmit={handleSave} className="admin-form-section">
          <h2>Contenido Principal</h2>
          
          <div className="admin-form-group">
            <label className="admin-form-label">Enunciado</label>
            <textarea 
              className="admin-form-textarea"
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Explicación</label>
            <textarea 
              className="admin-form-textarea"
              name="explanation"
              value={formData.explanation}
              onChange={handleChange}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Pista opcional</label>
            <input 
              type="text"
              className="admin-form-input"
              name="hint"
              value={formData.hint || ''}
              onChange={handleChange}
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Dificultad</label>
            <select 
              className="admin-form-select"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              {[1, 2, 3, 4, 5].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Tema Asociado</label>
            <input 
              type="text"
              className="admin-form-input"
              value={question.topic?.title || 'Sin tema asignado'}
              disabled
              title="Para cambiar el tema, usa la gestión de temas (próximamente)"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Artículo Asociado</label>
            <input 
              type="text"
              className="admin-form-input"
              value={question.article?.title || 'Sin artículo asignado'}
              disabled
              title="Para cambiar el artículo, usa la gestión de artículos (próximamente)"
            />
          </div>

          <aside className={`admin-question-editorial-checklist ${publicationReady ? 'admin-question-editorial-checklist--ready' : ''}`}>
            <span>Control editorial</span>
            <h2>{publicationReady ? 'Lista para publicar' : 'Revisión pendiente'}</h2>
            <p>
              {publicationReady
                ? 'La pregunta cumple los requisitos mínimos de publicación.'
                : 'Puedes guardar el borrador, pero debes resolver estos puntos antes de publicar.'}
            </p>
            <ul>
              {editorialChecklist.map((item) => (
                <li key={item.id} className={item.passed ? 'admin-check-pass' : 'admin-check-fail'}>
                  <span aria-hidden="true">{item.passed ? '✓' : '!'}</span>
                  {item.label}
                </li>
              ))}
            </ul>
          </aside>

          <div className="admin-review-actions">
            <button 
              type="submit" 
              className="admin-btn admin-btn--primary"
              disabled={isSaving}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
            
            <div className="admin-review-actions-group">
              {formData.status !== 'DRAFT' && (
                <button 
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={isSaving}
                  onClick={(e) => handleSave(e, 'DRAFT')}
                >
                  Volver a Borrador
                </button>
              )}
              {formData.status !== 'ARCHIVED' && (
                <button 
                  type="button"
                  className="admin-btn admin-btn--secondary"
                  disabled={isSaving}
                  style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={(e) => handleSave(e, 'ARCHIVED')}
                >
                  Archivar
                </button>
              )}
              {formData.status !== 'PUBLISHED' && (
                <button 
                  type="button"
                  className="admin-btn admin-btn--primary"
                  disabled={isSaving || !publicationReady}
                  title={publicationReady ? 'Publicar pregunta' : 'Completa el checklist editorial antes de publicar'}
                  onClick={(e) => handleSave(e, 'PUBLISHED')}
                >
                  Publicar pregunta
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="admin-form-section">
          <h2>Opciones (Solo Lectura)</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)', marginBottom: '1.25rem' }}>
            Las opciones no se pueden editar para proteger el historial de respuestas de los estudiantes. Si hay un error en las opciones, archiva esta pregunta y crea una nueva.
          </p>
          
          <div className="admin-options-list">
            {question.options?.map((opt, idx) => (
              <div key={opt.id || idx} className={`admin-option-item ${opt.isCorrect ? 'admin-option-item--correct' : ''}`}>
                <div className="admin-option-indicator">
                  {opt.label || String.fromCharCode(65 + idx)}
                </div>
                <div className="admin-option-content">
                  <p className="admin-option-text">{opt.text}</p>
                </div>
              </div>
            ))}
            {(!question.options || question.options.length === 0) && (
              <p style={{ color: 'var(--color-text-soft)' }}>Esta pregunta no tiene opciones registradas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
