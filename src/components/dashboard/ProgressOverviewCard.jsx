import DonutChart from '../ui/DonutChart'

function ProgressOverviewCard({ progress, onNavigate }) {
  const totalAnswered = progress?.totalAnswered || 0
  const correctCount = progress?.correctCount || 0
  const hintedCorrectCount = progress?.hintedCorrectCount || 0
  const incorrectCount = progress?.incorrectCount || 0
  const score = progress?.score || 0
  const segments = totalAnswered > 0
    ? [
        {
          label: `${Math.round((correctCount / totalAnswered) * 100)}% correctamente (${correctCount} preguntas)`,
          value: Math.round((correctCount / totalAnswered) * 100),
          color: '#44c8a6',
        },
        {
          label: `${Math.round((hintedCorrectCount / totalAnswered) * 100)}% con pistas (${hintedCorrectCount} preguntas)`,
          value: Math.round((hintedCorrectCount / totalAnswered) * 100),
          color: '#f2c24f',
        },
        {
          label: `${Math.max(0, 100 - Math.round((correctCount / totalAnswered) * 100) - Math.round((hintedCorrectCount / totalAnswered) * 100))}% incorrectamente (${incorrectCount} preguntas)`,
          value: Math.max(0, 100 - Math.round((correctCount / totalAnswered) * 100) - Math.round((hintedCorrectCount / totalAnswered) * 100)),
          color: '#ef7f7d',
        },
      ]
    : [{ label: 'Sin respuestas registradas', value: 100, color: '#d9c9c4' }]

  return (
    <article className="dashboard-card dashboard-card--progress">
      <h2>Progreso de estudio</h2>

      <div className="progress-overview">
        <DonutChart
          segments={segments}
          value={score}
          description={totalAnswered > 0 ? 'CORRECTO + USANDO PISTAS' : 'SIN DATOS'}
        />

        <div className="progress-overview__legend">
          <p>
            {totalAnswered > 0
              ? `En general, respondiste ${totalAnswered} preguntas.`
              : 'Todavía no hay preguntas respondidas en tu cuenta.'}
          </p>
          <ul>
            {segments.map((segment) => (
              <li key={segment.label}>
                <span className="progress-overview__swatch" style={{ backgroundColor: segment.color }} />
                <span>{segment.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button type="button" className="primary-button primary-button--full" onClick={() => onNavigate('/learning/qbank/new')}>
        Crear sesion de preguntas
      </button>
    </article>
  )
}

export default ProgressOverviewCard
