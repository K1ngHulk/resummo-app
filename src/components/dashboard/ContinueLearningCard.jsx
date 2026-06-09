import { continueLearning } from '../../data/dashboardData'
import AppIcon from '../ui/AppIcon'
import CircularProgress from '../ui/CircularProgress'

function ContinueLearningCard() {
  return (
    <article className="dashboard-card dashboard-card--split">
      <div className="dashboard-card__content">
        <header className="dashboard-card__header-block">
          <h2>Continua donde lo dejaste:</h2>
        </header>
        <p className="dashboard-card__topic">{continueLearning.title}</p>
        <p className="dashboard-card__meta">Ultima vez: {continueLearning.updatedAt}</p>
        <button type="button" className="primary-button primary-button--inline">
          <AppIcon name="play" className="primary-button__icon" />
          Continuar estudiando
        </button>
      </div>

      <CircularProgress value={continueLearning.progress} showScale />
    </article>
  )
}

export default ContinueLearningCard
