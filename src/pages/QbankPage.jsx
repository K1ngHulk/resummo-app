import { qbankOverview } from '../mocks/learningMockData'

function QbankPage({ onNavigate }) {
  return (
    <section className="figma-page">
      <h1>{qbankOverview.title}</h1>

      <section className="figma-hero-card figma-hero-card--qbank">
        <div>
          <h2>{qbankOverview.heroTitle}</h2>
          <p>{qbankOverview.heroDescription}</p>
          <button type="button" className="primary-button" onClick={() => onNavigate('/learning/qbank/new')}>
            {qbankOverview.heroAction}
          </button>
        </div>
        <div className="mock-illustration mock-illustration--qbank" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="session-history" aria-label={qbankOverview.historyTitle}>
        <h2>{qbankOverview.historyTitle}</h2>
        <div className="session-history__table">
          <header>{qbankOverview.continueTitle}</header>
          {qbankOverview.sessions.map((session) => (
            <article key={session.id} className="session-history__row">
              <p>
                <strong>{qbankOverview.sessionMode.mode}:</strong> Preguntas basadas en "{session.title}" ({session.status})
              </p>
              <button type="button" className="outline-pill-button">
                {qbankOverview.continueAction}
              </button>
              <span aria-hidden="true">...</span>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default QbankPage
