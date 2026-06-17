import { useState } from 'react'
import {
  featuredLibraryArticles,
  library,
  libraryArticles,
  libraryCategories,
} from '../mocks/learningMockData'

const allCategory = { id: 'all', label: 'Todas' }

function searchableText(article) {
  return [
    article.title,
    article.category,
    article.summary,
    article.tags.join(' '),
    article.badges.join(' '),
  ]
    .join(' ')
    .toLocaleLowerCase('es')
}

function ArticleCard({ article, onNavigate, isFeatured = false }) {
  const canOpen = Boolean(article.path)

  return (
    <article className={`library-article-card ${isFeatured ? 'library-article-card--featured' : ''}`}>
      <button
        type="button"
        className="library-article-card__button"
        onClick={() => {
          if (article.path) {
            onNavigate(article.path)
          }
        }}
        aria-disabled={!canOpen}
      >
        <span className="library-article-card__meta">
          <span>{article.category}</span>
          <span>{article.readingTime}</span>
        </span>

        <span className="library-article-card__title">{article.title}</span>
        <span className="library-article-card__summary">{article.summary}</span>

        <span className="library-chip-row" aria-label="Etiquetas">
          {article.badges.map((badge) => (
            <span key={badge} className="library-chip library-chip--strong">
              {badge}
            </span>
          ))}
          {article.tags.map((tag) => (
            <span key={tag} className="library-chip">
              {tag}
            </span>
          ))}
        </span>

        <span className="library-article-card__action">
          {canOpen ? library.readAction : library.pendingAction}
        </span>
      </button>
    </article>
  )
}

function CategoryList({ activeCategory, onSelect }) {
  const categories = [allCategory, ...libraryCategories]

  return (
    <div className="library-category-list" aria-label="Categorias de biblioteca">
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          className={`library-category-pill ${activeCategory === category.id ? 'library-category-pill--active' : ''}`}
          onClick={() => onSelect(category.id)}
          aria-pressed={activeCategory === category.id}
        >
          {category.label}
        </button>
      ))}
    </div>
  )
}

function countArticlesForCategory(categoryId) {
  if (categoryId === allCategory.id) {
    return libraryArticles.length
  }

  return libraryArticles.filter((article) => article.categoryId === categoryId).length
}

function CategoryPanel({ activeCategory, onSelect }) {
  const categories = [allCategory, ...libraryCategories]

  return (
    <aside className="library-category-panel" aria-label="Carpetas de Biblioteca">
      <div className="library-category-panel__head">
        <span>{library.categoryPanelEyebrow}</span>
        <h2>{library.categoryPanelTitle}</h2>
        <p>{library.categoryPanelDescription}</p>
      </div>

      <div className="library-category-menu">
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={`library-category-menu__item ${activeCategory === category.id ? 'library-category-menu__item--active' : ''}`}
            onClick={() => onSelect(category.id)}
            aria-pressed={activeCategory === category.id}
          >
            <span>{category.label}</span>
            <small>{countArticlesForCategory(category.id)}</small>
          </button>
        ))}
      </div>
    </aside>
  )
}

function LibraryPage({ onNavigate }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(allCategory.id)
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const isSearchActive = normalizedQuery.length > 0
  const activeCategoryMeta = [allCategory, ...libraryCategories].find((category) => category.id === activeCategory) ?? allCategory

  const featuredArticles = featuredLibraryArticles
    .map((articleId) => libraryArticles.find((article) => article.id === articleId))
    .filter(Boolean)

  const filteredArticles = libraryArticles.filter((article) => {
    const matchesQuery = searchableText(article).includes(normalizedQuery)

    if (isSearchActive) {
      return matchesQuery
    }

    return activeCategory === allCategory.id || article.categoryId === activeCategory
  })

  const showFeaturedArticles = !isSearchActive && activeCategory === allCategory.id
  const resultsTitle = isSearchActive
    ? library.searchResultsTitle
    : activeCategory === allCategory.id
      ? library.allArticlesTitle
      : library.categoryArticlesTitle.replace('{category}', activeCategoryMeta.label)

  return (
    <section className="library-page" aria-label={library.ariaLabel}>
      <header className="library-hero">
        <div>
          <span className="library-eyebrow">{library.eyebrow}</span>
          <h1>{library.title}</h1>
          <p>{library.subtitle}</p>
        </div>

        <label className="library-search">
          <span className="visually-hidden">{library.searchLabel}</span>
          <input
            type="search"
            value={query}
            placeholder={library.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      <CategoryList activeCategory={activeCategory} onSelect={setActiveCategory} />

      <div className="library-browser">
        <CategoryPanel activeCategory={activeCategory} onSelect={setActiveCategory} />

        <div className="library-content">
          {showFeaturedArticles ? (
            <section className="library-section" aria-labelledby="library-featured-heading">
              <div className="library-section__head">
                <h2 id="library-featured-heading">{library.featuredTitle}</h2>
                <p>{library.featuredDescription}</p>
              </div>

              <div className="library-featured-grid">
                {featuredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onNavigate={onNavigate}
                    isFeatured
                  />
                ))}
              </div>
            </section>
          ) : null}

          <section className="library-section" aria-labelledby="library-results-heading">
            <div className="library-section__head">
              <h2 id="library-results-heading">{resultsTitle}</h2>
              <p>{library.resultsLabel.replace('{count}', filteredArticles.length)}</p>
            </div>

            {filteredArticles.length > 0 ? (
              <div className="library-article-grid">
                {filteredArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} onNavigate={onNavigate} />
                ))}
              </div>
            ) : (
              <div className="library-empty-state">
                <strong>{library.emptyTitle}</strong>
                <p>{library.emptyDescription}</p>
                <button
                  type="button"
                  className="outline-pill-button"
                  onClick={() => {
                    setQuery('')
                    setActiveCategory(allCategory.id)
                  }}
                >
                  {library.emptyAction}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

export default LibraryPage
