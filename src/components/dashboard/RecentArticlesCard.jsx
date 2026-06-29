import AppIcon from '../ui/AppIcon'

function RecentArticlesCard({ items, onNavigate }) {
  return (
    <article className="dashboard-card dashboard-card--list">
      <h2>Articulos vistos recientemente</h2>
      {items.length > 0 ? (
        <ul className="article-list">
          {items.map((article) => (
            <li key={article.id} className="article-list__item">
              <button type="button" className="article-list__link" onClick={() => onNavigate(article.path)}>
                <span className="article-list__icon">
                  <AppIcon name="article" className="article-list__icon-svg" />
                </span>
                <span>{article.title}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-card__meta">Cuando empieces a leer, aqui veras tus articulos recientes.</p>
      )}
    </article>
  )
}

export default RecentArticlesCard
