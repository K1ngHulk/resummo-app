import { overallProgress, progressSegments } from '../../data/dashboardData'
import DonutChart from '../ui/DonutChart'

function ProgressOverviewCard() {
  return (
    <article className="dashboard-card dashboard-card--progress">
      <h2>Analisis de tu progreso</h2>

      <div className="progress-overview">
        <DonutChart
          segments={progressSegments}
          value={overallProgress.value}
          description={overallProgress.description}
        />

        <div className="progress-overview__legend">
          <p>En general, respondiste {overallProgress.totalAnswered} preguntas:</p>
          <ul>
            {progressSegments.map((segment) => (
              <li key={segment.label}>
                <span className="progress-overview__swatch" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button type="button" className="primary-button primary-button--full">
        Crear sesion de preguntas
      </button>
    </article>
  )
}

export default ProgressOverviewCard
