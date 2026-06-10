import { questionSession } from '../../mocks/learningMockData'

function QuestionSessionCard() {
  const completion = (questionSession.answered / questionSession.total) * 100

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__row dashboard-card__row--top">
        <h2>{questionSession.heading}</h2>
        <button type="button" className="text-link">
          {questionSession.viewAllLabel}
        </button>
      </div>

      <p className="dashboard-card__meta">
        {questionSession.mode}: {questionSession.topic}
      </p>

      <div className="progress-line">
        <div className="progress-line__track">
          <div className="progress-line__fill" style={{ width: `${completion}%` }} />
        </div>
        <span>{questionSession.answered}/{questionSession.total}</span>
      </div>

      <div className="dashboard-card__footer-action">
        <button type="button" className="secondary-button">
          {questionSession.action}
        </button>
      </div>
    </article>
  )
}

export default QuestionSessionCard
