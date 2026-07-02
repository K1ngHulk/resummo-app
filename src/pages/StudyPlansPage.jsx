import { studyPlans } from '../mocks/learningMockData'

function StudyPlansPage({ onNavigate }) {
  return (
    <section className="figma-page">
      <h1>{studyPlans.title}</h1>

      <section className="figma-hero-card figma-hero-card--study">
        <div>
          <h2>{studyPlans.heroTitle}</h2>
          <p>{studyPlans.heroDescription}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate('/learning/study-plans/new/step-1')}
          >
            {studyPlans.heroAction}
          </button>
        </div>
        <div className="mock-illustration mock-illustration--study" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="study-empty-section">
        <h2>{studyPlans.continueTitle}</h2>
        <div className="study-empty-card">
          <strong>{studyPlans.emptyTitle}</strong>
          <button
            type="button"
            className="text-link"
            onClick={() => onNavigate('/learning/study-plans/new/step-1')}
          >
            {studyPlans.emptyAction}
          </button>
        </div>
      </section>

      <h2 className="figma-section-title">{studyPlans.discoverTitle}</h2>
    </section>
  )
}

export default StudyPlansPage
