import { useCallback, useEffect, useMemo, useState } from 'react'
import resummoLogo from '../assets/brand/originals/logoguinda.png'
import { useAuth } from '../context/AuthContext.jsx'

function DifficultyLogos({ count }) {
  return (
    <span className="qs-difficulty" aria-label={`${count} logos de dificultad`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <img
          key={index}
          src={resummoLogo}
          alt=""
          aria-hidden="true"
          className={index < count ? 'qs-difficulty__logo' : 'qs-difficulty__logo qs-difficulty__logo--muted'}
        />
      ))}
    </span>
  )
}

function QuestionStatusIcon({ question }) {
  if (!question.selectedOptionId) {
    return <span className="qs-sidebar-row__number-placeholder" aria-hidden="true" />
  }

  const isCorrect = question.selectedOptionId === question.correctOptionId

  return (
    <span className={`qs-status qs-status--${isCorrect ? 'correct' : 'incorrect'}`} aria-label={isCorrect ? 'Correcta' : 'Incorrecta'}>
      {isCorrect ? 'OK' : 'X'}
    </span>
  )
}

function QuestionSessionPage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const sessionId = searchParams.get('id')
  const [session, setSession] = useState(null)
  const [activeOrder, setActiveOrder] = useState(1)
  const [feedback, setFeedback] = useState(null)
  const [showHint, setShowHint] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      return
    }

    const payload = await request(`/api/practice-sessions/${sessionId}`)
    setSession(payload.session)
    setError('')

    setActiveOrder((current) => {
      if (current > 0 && current <= payload.session.questions.length) {
        return current
      }

      const firstPending = payload.session.questions.find((question) => !question.selectedOptionId)
      return firstPending?.order || 1
    })
  }, [request, sessionId])

  useEffect(() => {
    let isMounted = true

    async function bootstrapSession() {
      if (!sessionId) {
        setError('No se encontro la sesion solicitada')
        return
      }

      try {
        await loadSession()
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
    }
  }, [loadSession, sessionId])

  const currentQuestion = useMemo(
    () => session?.questions.find((question) => question.order === activeOrder) || null,
    [activeOrder, session],
  )
  const allAnswered = session?.questions.every((question) => question.selectedOptionId) || false

  const handleAnswer = async (optionId) => {
    if (!currentQuestion || currentQuestion.selectedOptionId) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const payload = await request(`/api/practice-sessions/${sessionId}/answers`, {
        method: 'POST',
        body: {
          sessionQuestionId: currentQuestion.sessionQuestionId,
          optionId,
          usedHint: showHint,
        },
      })

      setFeedback(payload.result)
      await loadSession()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = () => {
    const nextQuestion = session?.questions.find((question) => question.order > activeOrder)

    if (nextQuestion) {
      setActiveOrder(nextQuestion.order)
      setFeedback(null)
      setShowHint(false)
    }
  }

  const handleFinish = async () => {
    try {
      await request(`/api/practice-sessions/${sessionId}/finish`, { method: 'POST' })
      onNavigate('/learning/qbank')
    } catch (finishError) {
      setError(finishError.message)
    }
  }

  return (
    <section className="qs-page qs-page--neutral">
      {error ? <div className="app-feedback app-feedback--error qs-feedback">{error}</div> : null}

      {session && currentQuestion ? (
        <div className="qs-shell">
          <aside className="qs-sidebar" aria-label="Lista de preguntas">
            <div className="qs-sidebar__head">
              <h1>{session.topicTitle}</h1>
              <span>{session.progress.answered}/{session.progress.total}</span>
              <div className="qs-sidebar__progress">
                <span style={{ width: `${(session.progress.answered / session.progress.total) * 100}%` }} />
              </div>
            </div>

            <ol className="qs-sidebar__list">
              {session.questions.map((question) => (
                <li
                  key={question.sessionQuestionId}
                  className={`qs-sidebar-row ${question.order === activeOrder ? 'qs-sidebar-row--active' : ''}`}
                >
                  <button type="button" className="qs-sidebar-row__button" onClick={() => setActiveOrder(question.order)}>
                    <QuestionStatusIcon question={question} />
                    <strong>{question.order}</strong>
                    <span className="qs-sidebar-row__title">Pregunta {question.order}</span>
                    <DifficultyLogos count={question.difficulty} />
                  </button>
                </li>
              ))}
            </ol>
          </aside>

          <main className="qs-question-panel">
            <p className="qs-case-text">{currentQuestion.prompt}</p>

            <div className="qs-tip-row" aria-label="Ayudas de la pregunta">
              <button type="button" className="qs-tip-pill" onClick={() => setShowHint((current) => !current)}>
                <span aria-hidden="true">?</span>
                {showHint ? 'Ocultar pista' : 'Usar pista'}
              </button>
            </div>

            {showHint && currentQuestion.hint ? (
              <aside className="qs-hint-card" aria-label="Pista de la pregunta">
                <div className="qs-hint-card__mascot">
                  <img src={resummoLogo} alt="" aria-hidden="true" />
                </div>
                <p>{currentQuestion.hint}</p>
              </aside>
            ) : null}

            <div className="qs-answer-list" aria-label="Opciones de respuesta">
              {currentQuestion.options.map((option) => {
                const isSelected = option.id === currentQuestion.selectedOptionId
                const isCorrect = option.id === currentQuestion.correctOptionId
                const showCorrect = Boolean(currentQuestion.selectedOptionId) && isCorrect
                const showIncorrect = Boolean(currentQuestion.selectedOptionId) && isSelected && !isCorrect

                return (
                  <div key={option.id} className={`qs-option-wrap ${showIncorrect ? 'qs-option-wrap--incorrect' : ''}`}>
                    <button
                      type="button"
                      className={`qs-option ${showCorrect ? 'qs-option--correct' : ''} ${showIncorrect ? 'qs-option--incorrect' : ''}`}
                      disabled={Boolean(currentQuestion.selectedOptionId) || isSubmitting}
                      onClick={() => handleAnswer(option.id)}
                    >
                      <span className="qs-option__letter">{option.label}</span>
                      <span className="qs-option__text">{option.text}</span>
                    </button>
                  </div>
                )
              })}
            </div>

            {currentQuestion.selectedOptionId ? (
              <div className="qs-inline-feedback qs-inline-feedback--static">
                <p>{feedback?.explanation || currentQuestion.explanation}</p>
              </div>
            ) : null}

            <div className="qs-actions-row">
              {currentQuestion.selectedOptionId && !allAnswered ? (
                <button type="button" className="primary-button" onClick={handleNext}>
                  Siguiente pregunta
                </button>
              ) : null}
              {allAnswered ? (
                <button type="button" className="primary-button" onClick={handleFinish}>
                  Terminar sesion
                </button>
              ) : null}
            </div>
          </main>
        </div>
      ) : null}
    </section>
  )
}

export default QuestionSessionPage
