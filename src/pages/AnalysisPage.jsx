function AnalysisPage({ onNavigate }) {
  return (
    <section className="figma-page analysis-page" aria-labelledby="analysis-heading">
      <div className="analysis-coming-soon">
        <span className="analysis-coming-soon__status">En preparación</span>
        <h1 id="analysis-heading">Análisis de estudio</h1>
        <p>
          Análisis estará disponible después de recopilar suficientes sesiones de estudio.
          Esta iteración no muestra métricas estimadas ni datos de ejemplo.
        </p>
        <div className="analysis-coming-soon__actions">
          <button type="button" className="primary-button" onClick={() => onNavigate('/learning/qbank/new')}>
            Iniciar QBank
          </button>
          <button type="button" className="outline-pill-button" onClick={() => onNavigate('/learning/library')}>
            Ir a Biblioteca
          </button>
        </div>
        <small>Módulo en preparación para la siguiente iteración.</small>
      </div>
    </section>
  )
}

export default AnalysisPage
