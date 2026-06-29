function QuestionSessionCard({ item, onNavigate }) {
  if (!item) {
    return (
      <article className="dashboard-card">
        <div className="dashboard-card__row dashboard-card__row--top">
          <h2>Continuar sesion de preguntas</h2>
        </div>
        <p className="dashboard-card__meta">Todavia no tienes sesiones activas.</p>
        <div className="dashboard-card__footer-action">
          <button type="button" className="secondary-button" onClick={() => onNavigate('/learning/qbank/new')}>
            Crear una sesion
          </button>
        </div>
      </article>
    )
  }

  const completion = item.total ? (item.answered / item.total) * 100 : 0

  return (
    <article className="dashboard-card">
      <div className="dashboard-card__row dashboard-card__row--top">
        <h2>Continuar sesion de preguntas</h2>
        <button type="button" className="text-link" onClick={() => onNavigate('/learning/qbank')}>
          Ver todo
        </button>
      </div>

      <p className="dashboard-card__meta">Modo de estudio: {item.title}</p>

      <div className="progress-line">
        <div className="progress-line__track">
          <div className="progress-line__fill" style={{ width: `${completion}%` }} />
        </div>
        <span>{item.answered}/{item.total}</span>
      </div>

      <div className="dashboard-card__footer-action">
        <button type="button" className="secondary-button" onClick={() => onNavigate(item.path)}>
          Continuar
        </button>
      </div>
    </article>
  )
}

export default QuestionSessionCard
