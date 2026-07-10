import { useState } from 'react'
import { studyPlanCurrent, studyPlans } from '../mocks/learningMockData'

const STUDY_PLAN_STORAGE_KEY = 'resummo_study_plan_v1'

function readStoredPlan() {
  try {
    const value = window.localStorage.getItem(STUDY_PLAN_STORAGE_KEY)
    return value ? JSON.parse(value) : null
  } catch {
    return null
  }
}

function StudyPlansPage({ onNavigate }) {
  const [currentPlan] = useState(readStoredPlan)
  const completedArticles = Array.isArray(currentPlan?.readArticleIds)
    ? currentPlan.readArticleIds.length
    : 0
  const totalArticles = studyPlanCurrent.days.reduce(
    (total, day) => total + day.articles.length,
    0,
  )
  const progress = totalArticles > 0
    ? Math.round((completedArticles / totalArticles) * 100)
    : 0

  return (
    <section className="figma-page study-plans-page">
      <header className="study-plans-header">
        <div>
          <span>Planificación local en beta</span>
          <h1>{studyPlans.title}</h1>
          <p>{studyPlans.subtitle}</p>
        </div>
      </header>

      <section className="figma-hero-card figma-hero-card--study">
        <div>
          <h2>{studyPlans.heroTitle}</h2>
          <p>{studyPlans.heroDescription}</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => onNavigate('/learning/study-plans/new/step-1')}
          >
            {currentPlan ? studyPlans.newPlanAction : studyPlans.heroAction}
          </button>
        </div>
        <div className="mock-illustration mock-illustration--study" aria-hidden="true">
          <span />
        </div>
      </section>

      <section className="study-empty-section" aria-labelledby="study-continue-heading">
        <h2 id="study-continue-heading">{studyPlans.continueTitle}</h2>
        {currentPlan ? (
          <article className="study-current-card">
            <div className="study-current-card__copy">
              <span className="study-current-card__eyebrow">Tu plan activo</span>
              <h3>{currentPlan.title || studyPlanCurrent.title}</h3>
              <p>{currentPlan.subtitle || studyPlanCurrent.subtitle}</p>
              <div className="study-current-card__meta">
                <span>{currentPlan.objectiveLabel}</span>
                <span>{currentPlan.routineLabel}</span>
              </div>
            </div>

            <div className="study-current-card__progress">
              <div>
                <strong>{progress}%</strong>
                <span>de lecturas completadas</span>
              </div>
              <div className="study-current-card__track" aria-hidden="true">
                <span style={{ width: `${progress}%` }} />
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => onNavigate('/learning/study-plans/current')}
              >
                Retomar plan
              </button>
            </div>
          </article>
        ) : (
          <div className="study-empty-card">
            <strong>{studyPlans.emptyTitle}</strong>
            <p>{studyPlans.emptyDescription}</p>
            <button
              type="button"
              className="text-link"
              onClick={() => onNavigate('/learning/study-plans/new/step-1')}
            >
              {studyPlans.emptyAction}
            </button>
          </div>
        )}
      </section>

      <section className="study-plan-benefits" aria-labelledby="study-benefits-heading">
        <div>
          <h2 id="study-benefits-heading">{studyPlans.discoverTitle}</h2>
          <p>{studyPlans.discoverDescription}</p>
        </div>
        <div className="study-plan-benefits__grid">
          {studyPlans.benefits.map((benefit) => (
            <article key={benefit.id}>
              <span>{benefit.step}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export default StudyPlansPage
