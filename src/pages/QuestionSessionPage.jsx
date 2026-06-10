import resummoLogo from '../assets/brand/originals/logoguinda.png'
import { qbankQuestionSession } from '../mocks/learningMockData'

const variantToPath = {
  neutral: '/learning/qbank/session',
  correct: '/learning/qbank/session/correct',
  incorrect: '/learning/qbank/session/incorrect',
}

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

function QuestionStatusIcon({ status }) {
  if (!status) {
    return <span className="qs-sidebar-row__number-placeholder" aria-hidden="true" />
  }

  return (
    <span className={`qs-status qs-status--${status}`} aria-label={status === 'correct' ? 'Correcta' : 'Incorrecta'}>
      {status === 'correct' ? '✓' : '×'}
    </span>
  )
}

function QuestionSidebar({ session, variant }) {
  const getStatus = (number) => {
    if (variant === 'incorrect' && number === 1) return 'incorrect'
    if (number <= 3) return 'correct'
    return null
  }

  return (
    <aside className="qs-sidebar" aria-label="Lista de preguntas">
      <div className="qs-sidebar__head">
        <h1>{session.title}</h1>
        <span>{session.progress.label}</span>
        <div className="qs-sidebar__progress">
          <span style={{ width: `${session.progress.percent}%` }} />
        </div>
      </div>

      <ol className="qs-sidebar__list">
        {session.questionList.map((question) => {
          const status = getStatus(question.number)
          const isActive = question.number === session.progress.current

          return (
            <li
              key={question.id}
              className={`qs-sidebar-row ${isActive ? 'qs-sidebar-row--active' : ''}`}
            >
              <QuestionStatusIcon status={status} />
              <strong>{question.number}</strong>
              <span className="qs-sidebar-row__title">{question.title}</span>
              <DifficultyLogos count={question.difficulty} />
            </li>
          )
        })}
      </ol>
    </aside>
  )
}

function TipButtons({ tips }) {
  return (
    <div className="qs-tip-row" aria-label="Ayudas mock">
      {tips.map((tip, index) => (
        <button key={`${tip}-${index}`} type="button" className="qs-tip-pill">
          <span aria-hidden="true">{index === 2 ? '▱' : '?'}</span>
          {tip}
        </button>
      ))}
    </div>
  )
}

function AnswerOptions({ session, variant, onNavigate }) {
  const selectedOptionId = session.feedback[variant]?.selectedOptionId

  return (
    <div className="qs-answer-list" aria-label="Opciones de respuesta">
      {session.options.map((option) => {
        const isCorrect = variant === 'correct' && option.outcome === 'correct'
        const isIncorrectPanel = variant === 'incorrect' && option.id === selectedOptionId
        const showMiss = variant !== 'neutral' && !isCorrect && !isIncorrectPanel
        const path = variantToPath[option.outcome]

        return (
          <div
            key={option.id}
            className={`qs-option-wrap ${isIncorrectPanel ? 'qs-option-wrap--incorrect' : ''}`}
          >
            <button
              type="button"
              className={`qs-option ${isCorrect ? 'qs-option--correct' : ''} ${isIncorrectPanel ? 'qs-option--incorrect' : ''}`}
              onClick={() => onNavigate(path)}
            >
              <span className="qs-option__letter">{option.label}</span>
              <span className="qs-option__text">{option.text}</span>
              {showMiss ? <span className="qs-option__mark qs-option__mark--miss">×</span> : null}
            </button>

            {isIncorrectPanel ? (
              <div className="qs-inline-feedback">
                <p>{session.explanation.body}</p>
                <button type="button" className="qs-report-button">
                  <span aria-hidden="true">▱</span>
                  {session.reportAction}
                </button>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function IncorrectHint({ session }) {
  return (
    <aside className="qs-hint-card" aria-label="Tip médico mock">
      <div className="qs-hint-card__mascot">
        <img src={resummoLogo} alt="" aria-hidden="true" />
      </div>
      <p>{session.incorrectHint}</p>
    </aside>
  )
}

function QuestionSessionPage({ variant = 'neutral', onNavigate }) {
  const session = qbankQuestionSession

  return (
    <section className={`qs-page qs-page--${variant}`}>
      <div className="qs-shell">
        <QuestionSidebar session={session} variant={variant} />

        <main className="qs-question-panel">
          {variant === 'incorrect' ? <IncorrectHint session={session} /> : null}

          <p className="qs-case-text">{session.clinicalCase}</p>
          <TipButtons tips={session.tipButtons} />
          <AnswerOptions session={session} variant={variant} onNavigate={onNavigate} />

          <button type="button" className="qs-show-explanations">
            {session.explanationsAction}
          </button>
        </main>
      </div>
    </section>
  )
}

export default QuestionSessionPage
