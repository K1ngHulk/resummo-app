import './AdminHomePage.css'

export default function AdminHomePage({ onNavigate }) {
  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Panel editorial</h1>
        <p className="admin-page__subtitle">
          Gestiona el contenido de Resummo, importa nuevas preguntas y mantén actualizada la biblioteca.
        </p>
      </div>

      <div className="admin-grid">
        <div
          className="admin-card"
          style={{ cursor: 'pointer', borderColor: 'var(--color-primary-muted)' }}
          onClick={() => onNavigate('/admin/topics')}
        >
          <div className="admin-card__icon">📚</div>
          <h2 className="admin-card__title">Temas</h2>
          <p className="admin-card__desc">Gestiona los temas, sus colores, slugs y estados.</p>
          <div className="admin-card__action" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Ver temas &rarr;</div>
        </div>

        <div
          className="admin-card"
          style={{ cursor: 'pointer', borderColor: 'var(--color-primary-muted)' }}
          onClick={() => onNavigate('/admin/articles')}
        >
          <div className="admin-card__icon">📄</div>
          <h2 className="admin-card__title">Artículos</h2>
          <p className="admin-card__desc">Administra la biblioteca de lectura y sus temas.</p>
          <div className="admin-card__action" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Ver artículos &rarr;</div>
        </div>

        <div
          className="admin-card"
          style={{ cursor: 'pointer', borderColor: 'var(--color-primary-muted)' }}
          onClick={() => onNavigate('/admin/questions')}
        >
          <div className="admin-card__icon">❓</div>
          <h2 className="admin-card__title">Preguntas</h2>
          <p className="admin-card__desc">Gestiona el banco de preguntas, explicaciones y niveles.</p>
          <div className="admin-card__action" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Ver preguntas &rarr;</div>
        </div>

        <div
          className="admin-card"
          style={{ cursor: 'pointer', borderColor: 'var(--color-primary-muted)' }}
          onClick={() => onNavigate('/admin/import/anki')}
        >
          <div className="admin-card__icon">📥</div>
          <h2 className="admin-card__title">Importar Anki TSV</h2>
          <p className="admin-card__desc">Importa masivamente desde TSV generado por Anki.</p>
          <div className="admin-card__action" style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>Abrir herramienta &rarr;</div>
        </div>
      </div>
    </div>
  )
}
