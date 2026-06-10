import { recentArticles } from '../../mocks/learningMockData'
import AppIcon from '../ui/AppIcon'

function RecentArticlesCard() {
  return (
    <article className="dashboard-card dashboard-card--list">
      <h2>Articulos vistos recientemente</h2>
      <ul className="article-list">
        {recentArticles.map((article) => (
          <li key={article} className="article-list__item">
            <span className="article-list__icon">
              <AppIcon name="article" className="article-list__icon-svg" />
            </span>
            <span>{article}</span>
          </li>
        ))}
      </ul>
    </article>
  )
}

export default RecentArticlesCard
