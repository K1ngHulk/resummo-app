import { continueLearning } from '../../mocks/learningMockData'
import AppIcon from '../ui/AppIcon'
import CircularProgress from '../ui/CircularProgress'

function ContinueLearningCard() {
  return (
    <article className="dashboard-card dashboard-card--split">
      <div className="dashboard-card__content">
        <header className="dashboard-card__header-block">
          <h2>{continueLearning.heading}</h2>
        </header>
        <p className="dashboard-card__topic">{continueLearning.title}</p>
        <p className="dashboard-card__meta">{continueLearning.updatedLabel}: {continueLearning.updatedAt}</p>
        <button type="button" className="primary-button primary-button--inline">
          <AppIcon name="play" className="primary-button__icon" />
          {continueLearning.action}
        </button>
      </div>

      <CircularProgress value={continueLearning.progress} showScale />
    </article>
  )
}

export default ContinueLearningCard
