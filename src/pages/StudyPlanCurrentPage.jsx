import { studyPlanCurrent } from '../mocks/learningMockData'

function StudyPlanHeading() {
  return (
    <header className="spd-heading">
      <h1>{studyPlanCurrent.title}</h1>
      <p>{studyPlanCurrent.subtitle}</p>
    </header>
  )
}

function DayProgress({ day }) {
  return (
    <div className="spd-progress">
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

function StudyPlanSummary({ onNavigate }) {
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

      <StudyPlanHeading />

      <article className="spd-welcome-card">
        <h2>{studyPlanCurrent.welcomeTitle}</h2>
        <p>{studyPlanCurrent.welcomeText}</p>
      </article>

      <div className="spd-day-list">
        {studyPlanCurrent.days.map((day) => (
          <StudyPlanDayCard
            key={day.id}
            day={day}
            onOpen={() => onNavigate('/learning/study-plans/current/elements')}
          />
        ))}
      </div>
    </section>
  )
}

function StudyPlanSidebar({ onNavigate }) {
  return (
    <aside className="spd-elements-sidebar">
      <h1>{studyPlanCurrent.title}</h1>
      <div className="spd-elements-days">
        {studyPlanCurrent.days.map((day, index) => (
          <button
            key={day.id}
            type="button"
            className={`spd-elements-day ${index === 0 ? 'spd-elements-day--active' : ''}`}
            onClick={() => onNavigate('/learning/study-plans/current/elements')}
          >
            <strong>{day.label}</strong>
            <span>{day.title}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function ArticleCard({ article }) {
  return (
    <article className="spd-element-card">
      <span className="spd-element-card__icon" aria-hidden="true">A</span>
      <strong>{article.title}</strong>
      <label className="spd-read-check">
        <input type="checkbox" />
        <span>{article.readLabel}</span>
      </label>
    </article>
  )
}

function SessionCard({ session }) {
  return (
    <article className="spd-session-card">
      <div>
        <strong>{session.title}</strong>
        <span>{session.progress}</span>
      </div>
      <button type="button">{session.action}</button>
      <div className="spd-session-card__progress" aria-hidden="true">
        <span style={{ width: `${session.percent}%` }} />
      </div>
    </article>
  )
}

function StudyPlanElements({ onNavigate }) {
  const { elements } = studyPlanCurrent

  return (
    <section className="spd-elements-shell">
      <StudyPlanSidebar onNavigate={onNavigate} />

      <main className="spd-elements-main">
        <button
          type="button"
          className="spd-sidebar-toggle"
          aria-label="Volver al resumen del plan"
          onClick={() => onNavigate('/learning/study-plans/current')}
        >
          &lt;
        </button>

        <span className="spd-plan-badge">{studyPlanCurrent.badge}</span>
        <StudyPlanHeading />

        <section className="spd-elements-section">
          <h2>{elements.articlesTitle}</h2>
          <div className="spd-elements-list">
            {elements.articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>

        <section className="spd-elements-section">
          <h2>{elements.sessionsTitle}</h2>
          <div className="spd-elements-list">
            {elements.sessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        </section>
      </main>
    </section>
  )
}

function StudyPlanCurrentPage({ mode = 'summary', onNavigate }) {
  return mode === 'elements' ? (
    <StudyPlanElements onNavigate={onNavigate} />
  ) : (
    <StudyPlanSummary onNavigate={onNavigate} />
  )
}

export default StudyPlanCurrentPage
