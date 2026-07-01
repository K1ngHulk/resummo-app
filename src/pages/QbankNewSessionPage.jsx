import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function QbankNewSessionPage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const [topics, setTopics] = useState([])
  const [topicSlug, setTopicSlug] = useState(searchParams.get('topic') || '')
  const [questionCount, setQuestionCount] = useState(5)
  const [difficulty, setDifficulty] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTopics() {
      try {
        const payload = await request('/api/topics')

        if (isMounted) {
          setTopics(payload.topics)
          setTopicSlug((current) => current || payload.topics[0]?.slug || '')
          setIsLoading(false)
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
          setIsLoading(false)
        }
      }
    }

    loadTopics()

    return () => {
      isMounted = false
    }
  }, [request])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const payload = await request('/api/practice-sessions', {
        method: 'POST',
        body: {
          topicSlug,
          questionCount: Number(questionCount),
          ...(difficulty ? { difficulty: Number(difficulty) } : {}),
        },
      })

      onNavigate(payload.session.path)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="figma-page">
      <h1>Nueva sesion personalizada de estudio</h1>

      <form className="new-session-form" onSubmit={handleSubmit}>
        <label className="new-session-field">
          <span>Tema</span>
          {isLoading ? (
            <div style={{ padding: '0.5rem', color: '#666' }}>Cargando temas...</div>
          ) : topics.length === 0 ? (
            <div style={{ padding: '0.5rem', color: '#e53e3e' }}>No hay temas publicados disponibles.</div>
          ) : (
            <select value={topicSlug} onChange={(event) => setTopicSlug(event.target.value)} required>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.slug}>
                  {topic.title}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="new-session-field">
          <span>Cantidad de preguntas</span>
          <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}>
            {[3, 5, 10].map((value) => (
              <option key={value} value={value}>
                {value} preguntas
              </option>
            ))}
          </select>
        </label>

        <label className="new-session-field">
          <span>Dificultad</span>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="">Todas</option>
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                Nivel {value}
              </option>
            ))}
          </select>
        </label>

        {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

        <div className="new-session-actions">
          <button type="button" className="outline-pill-button" onClick={() => onNavigate('/learning/qbank')}>
            Volver al banco
          </button>
          <button type="submit" className="primary-button" disabled={isSubmitting || !topicSlug}>
            {isSubmitting ? 'Creando...' : 'Crear sesion'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default QbankNewSessionPage
