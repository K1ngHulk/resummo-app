import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function QbankPage({ onNavigate }) {
  const { request } = useAuth()
  const [sessions, setSessions] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadSessions() {
      try {
        const payload = await request('/api/practice-sessions')

        if (isMounted) {
          setSessions(payload.sessions)
          setError('')
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      }
    }

    loadSessions()

    return () => {
      isMounted = false
    }
  }, [request])

  const activeSession = sessions.find((session) => session.status === 'ACTIVE') || null

  return (
    <section className="figma-page">
      <h1>Banco de preguntas</h1>

      <section className="figma-hero-card figma-hero-card--qbank">
        <div>
          <h2>Crear sesion de QBank</h2>
          <p>
            Crea una sesion personalizada segun tu tema de estudio y empieza a generar progreso
            persistente en tu cuenta.
          </p>
          <button type="button" className="primary-button" onClick={() => onNavigate('/learning/qbank/new')}>
            Crear una sesion de QBank
          </button>
        </div>
        <div className="mock-illustration mock-illustration--qbank" aria-hidden="true">
          <span />
        </div>
      </section>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {activeSession ? (
        <section className="session-history" aria-label="Continua tu sesion activa">
          <h2>Continua tu sesion</h2>
          <div className="session-history__table">
            <header>Sesion activa</header>
            <article className="session-history__row">
              <p>
                <strong>Modo de estudio:</strong> {activeSession.topicTitle} ({activeSession.answeredQuestions}/{activeSession.totalQuestions})
              </p>
              <button type="button" className="outline-pill-button" onClick={() => onNavigate(activeSession.path)}>
                Continuar
              </button>
              <span aria-hidden="true">...</span>
            </article>
          </div>
        </section>
      ) : null}

      <section className="session-history" aria-label="Historial de sesion">
        <h2>Historial de sesion</h2>
        <div className="session-history__table">
          <header>Sesiones recientes</header>
          {sessions.length > 0 ? sessions.map((session) => (
            <article key={session.id} className="session-history__row">
              <p>
                <strong>{session.status === 'ACTIVE' ? 'Activa' : 'Completada'}:</strong> {session.topicTitle} ({session.answeredQuestions}/{session.totalQuestions})
              </p>
              <button type="button" className="outline-pill-button" onClick={() => onNavigate(session.path)}>
                Abrir
              </button>
              <span aria-hidden="true">...</span>
            </article>
          )) : (
            <article className="session-history__row session-history__row--empty">
              <p>Aun no has creado sesiones. Usa el boton principal para empezar.</p>
            </article>
          )}
        </div>
      </section>
    </section>
  )
}

export default QbankPage
