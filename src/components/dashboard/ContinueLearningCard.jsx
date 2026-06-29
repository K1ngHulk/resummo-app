import AppIcon from '../ui/AppIcon'
import CircularProgress from '../ui/CircularProgress'

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return 'Sin actividad reciente'
  }

  return new Date(dateValue).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
  })
}

function ContinueLearningCard({ item, onNavigate }) {
  if (!item) {
    return (
      <article className="dashboard-card dashboard-card--split">
        <div className="dashboard-card__content">
          <header className="dashboard-card__header-block">
            <h2>Continua donde lo dejaste</h2>
          </header>
          <p className="dashboard-card__meta">Todavia no has abierto articulos en tu cuenta.</p>
        </div>
        <CircularProgress value={0} showScale />
      </article>
    )
  }

  return (
    <article className="dashboard-card dashboard-card--split">
      <div className="dashboard-card__content">
        <header className="dashboard-card__header-block">
          <h2>Continua donde lo dejaste</h2>
        </header>
        <p className="dashboard-card__topic">{item.title}</p>
        <p className="dashboard-card__meta">
          {item.topic} � Ultima actividad {formatDateLabel(item.updatedAt)}
        </p>
        <button
          type="button"
          className="primary-button primary-button--inline"
          onClick={() => onNavigate(item.path)}
        >
          <AppIcon name="play" className="primary-button__icon" />
          Continuar estudiando
        </button>
      </div>

      <CircularProgress value={item.progress} showScale />
    </article>
  )
}

export default ContinueLearningCard
