import { useMemo, useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import { studyPlanCurrent } from '../mocks/learningMockData'

const STUDY_PLAN_STORAGE_KEY = 'resummo_study_plan_v1'

function readStoredPlan() {
  try {
    const value = window.localStorage.getItem(STUDY_PLAN_STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function getDayProgress(day, readArticleIds) {
  const completedArticles = day.articles.filter((article) => readArticleIds.includes(article.id)).length
  const articleProgress = day.articles.length > 0 ? completedArticles / day.articles.length : 0
  const sessionProgress = day.sessions.length > 0
    ? day.sessions.reduce((total, session) => total + session.percent, 0) / day.sessions.length / 100
    : 0
  const trackedGroups = Number(day.articles.length > 0) + Number(day.sessions.length > 0)
  const percent = trackedGroups > 0
    ? Math.round(((articleProgress + sessionProgress) / trackedGroups) * 100)
    : 0

  return {
    ...day,
    articleProgress: `${completedArticles}/${day.articles.length} artículos`,
    questionProgress: `${day.sessions.reduce((total, session) => total + session.completedQuestions, 0)}/${day.sessions.reduce((total, session) => total + session.totalQuestions, 0)} preguntas`,
    percent,
    percentLabel: `${percent}% completado`,
  }
}

function StudyPlanHeading({ plan }) {
  return (
    <header className="spd-heading">
      <h1>{plan.title}</h1>
      <p>{plan.subtitle}</p>
    </header>
  )
}

function DayProgress({ day }) {
  return (
    <div className="spd-progress" aria-label={day.percentLabel}>
      <span style={{ width: `${day.percent}%` }} />
    </div>
  )
}

function DayMetrics({ day }) {
  return (
    <div className="spd-day-metrics">
      <span>{day.articleProgress}</span>
      <span>{day.questionProgress}</span>
    </div>
  )
}

function StudyPlanDayCard({ day, onOpen }) {
  return (
    <button type="button" className="spd-day-card" onClick={onOpen}>
      <div>
        <strong>{day.label}</strong>
        <span>{day.title}</span>
        <DayMetrics day={day} />
      </div>
      <div className="spd-day-card__progress">
        <DayProgress day={day} />
        <span>{day.percentLabel}</span>
      </div>
    </button>
  )
}

function StudyPlanSummary({ onNavigate, plan, days }) {
  return (
    <section className="spd-page">
      <button
        type="button"
        className="spd-back-button"
        onClick={() => onNavigate('/learning/study-plans')}
      >
        <span aria-hidden="true">&lt;</span>
        {studyPlanCurrent.backAction}
      </button>

      <StudyPlanHeading plan={plan} />

      <article className="spd-welcome-card">
        <span>{plan.objectiveLabel || studyPlanCurrent.objectiveLabel}</span>
        <h2>{studyPlanCurrent.welcomeTitle}</h2>
        <p>{studyPlanCurrent.welcomeText}</p>
        {plan.routineLabel ? <small>{plan.routineLabel}</small> : null}
      </article>

      <section className="spd-days-section" aria-labelledby="study-days-heading">
        <div className="spd-days-section__head">
          <div>
            <h2 id="study-days-heading">Tu recorrido de estudio</h2>
            <p>Abre un día para consultar sus lecturas y sesiones de práctica.</p>
          </div>
          <span>{days.length} jornadas</span>
        </div>
        <div className="spd-day-list">
          {days.map((day) => (
            <StudyPlanDayCard
              key={day.id}
              day={day}
              onOpen={() => onNavigate(`/learning/study-plans/current/elements?day=${day.id}`)}
            />
          ))}
        </div>
      </section>
    </section>
  )
}

function StudyPlanSidebar({ days, activeDayId, onSelect }) {
  return (
    <aside className="spd-elements-sidebar">
      <h1>{studyPlanCurrent.sidebarTitle}</h1>
      <div className="spd-elements-days">
        {days.map((day) => (
          <button
            key={day.id}
            type="button"
            className={`spd-elements-day ${day.id === activeDayId ? 'spd-elements-day--active' : ''}`}
            onClick={() => onSelect(day.id)}
            aria-current={day.id === activeDayId ? 'page' : undefined}
          >
            <strong>{day.label}</strong>
            <span>{day.title}</span>
            <small>{day.percentLabel}</small>
          </button>
        ))}
      </div>
    </aside>
  )
}

function ArticleCard({ article, isRead, onOpen, onToggle }) {
  return (
    <article className={`spd-element-card ${isRead ? 'spd-element-card--complete' : ''}`}>
      <span className="spd-element-card__icon" aria-hidden="true">
        <AppIcon name="article" />
      </span>
      <div className="spd-element-card__copy">
        <strong>{article.title}</strong>
        <span>{article.readTime}</span>
      </div>
      <button type="button" className="spd-element-open" onClick={onOpen}>
        Abrir artículo
      </button>
      <label className="spd-read-check">
        <input type="checkbox" checked={isRead} onChange={(event) => onToggle(event.target.checked)} />
        <span>{isRead ? 'Leído' : article.readLabel}</span>
      </label>
    </article>
  )
}

function SessionCard({ session, onOpen }) {
  return (
    <article className="spd-session-card">
      <div>
        <strong>{session.title}</strong>
        <span>{session.completedQuestions}/{session.totalQuestions} preguntas completadas</span>
      </div>
      <button type="button" onClick={onOpen}>{session.action}</button>
      <div className="spd-session-card__progress" aria-label={`${session.percent}% completado`}>
        <span style={{ width: `${session.percent}%` }} />
      </div>
    </article>
  )
}

function StudyPlanElements({ onNavigate, plan, days, activeDay, onToggleArticle, storageError }) {
  return (
    <section className="spd-elements-shell">
      <StudyPlanSidebar
        days={days}
        activeDayId={activeDay.id}
        onSelect={(dayId) => onNavigate(`/learning/study-plans/current/elements?day=${dayId}`)}
      />

      <main className="spd-elements-main">
        <button
          type="button"
          className="spd-sidebar-toggle"
          aria-label="Volver al resumen del plan"
          onClick={() => onNavigate('/learning/study-plans/current')}
        >
          &lt;
        </button>

        <span className="spd-plan-badge">{activeDay.label}</span>
        <StudyPlanHeading plan={plan} />
        <p className="spd-active-day-title">{activeDay.title}</p>

        {storageError ? <div className="app-feedback app-feedback--error">{storageError}</div> : null}

        <section className="spd-elements-section">
          <div className="spd-elements-section__head">
            <h2>{studyPlanCurrent.articlesTitle}</h2>
            <span>{activeDay.articleProgress}</span>
          </div>
          <div className="spd-elements-list">
            {activeDay.articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isRead={plan.readArticleIds.includes(article.id)}
                onOpen={() => onNavigate(article.path)}
                onToggle={(checked) => onToggleArticle(article.id, checked)}
              />
            ))}
          </div>
        </section>

        <section className="spd-elements-section">
          <div className="spd-elements-section__head">
            <h2>{studyPlanCurrent.sessionsTitle}</h2>
            <span>{activeDay.questionProgress}</span>
          </div>
          <div className="spd-elements-list">
            {activeDay.sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onOpen={() => onNavigate(session.path)}
              />
            ))}
          </div>
        </section>
      </main>
    </section>
  )
}

function StudyPlanCurrentPage({ mode = 'summary', onNavigate, searchParams }) {
  const [plan, setPlan] = useState(() => {
    const storedPlan = readStoredPlan()
    return {
      ...storedPlan,
      title: storedPlan?.title || studyPlanCurrent.title,
      subtitle: storedPlan?.subtitle || studyPlanCurrent.subtitle,
      objectiveLabel: storedPlan?.objectiveLabel || studyPlanCurrent.objectiveLabel,
      routineLabel: storedPlan?.routineLabel || studyPlanCurrent.routineLabel,
      readArticleIds: Array.isArray(storedPlan?.readArticleIds) ? storedPlan.readArticleIds : [],
    }
  })
  const [storageError, setStorageError] = useState('')
  const days = useMemo(
    () => studyPlanCurrent.days.map((day) => getDayProgress(day, plan.readArticleIds)),
    [plan.readArticleIds],
  )
  const requestedDayId = searchParams?.get('day')
  const activeDay = days.find((day) => day.id === requestedDayId) || days[0]

  const handleToggleArticle = (articleId, checked) => {
    const currentIds = Array.isArray(plan.readArticleIds) ? plan.readArticleIds : []
    const readArticleIds = checked
      ? [...new Set([...currentIds, articleId])]
      : currentIds.filter((id) => id !== articleId)
    const nextPlan = { ...plan, readArticleIds }

    setPlan(nextPlan)
    try {
      window.localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(nextPlan))
      setStorageError('')
    } catch {
      setStorageError('El cambio se aplicó en pantalla, pero no pudo guardarse en este dispositivo.')
    }
  }

  return mode === 'elements' ? (
    <StudyPlanElements
      onNavigate={onNavigate}
      plan={plan}
      days={days}
      activeDay={activeDay}
      onToggleArticle={handleToggleArticle}
      storageError={storageError}
    />
  ) : (
    <StudyPlanSummary onNavigate={onNavigate} plan={plan} days={days} />
  )
}

export default StudyPlanCurrentPage
