import { useState } from 'react'
import { getLibraryNode, getLibraryPath } from '../data/libraryTree'
import {
  library,
  libraryArticleDetail,
  libraryNodes,
  relatedLibraryArticles,
  relatedLibraryQuestions,
} from '../mocks/learningMockData'

function RelatedArticleList() {
  const relatedArticles = relatedLibraryArticles
    .map((articleId) => getLibraryNode(libraryNodes, articleId))
    .filter(Boolean)

  return (
    <div className="library-related-list">
      {relatedArticles.map((article) => (
        <article key={article.id} className="library-related-card">
          <span>
            {getLibraryPath(libraryNodes, article.id)
              .slice(0, -1)
              .map((node) => node.label)
              .join(' / ')}
          </span>
          <strong>{article.label}</strong>
          <p>{article.description}</p>
        </article>
      ))}
    </div>
  )
}

function RelatedQuestions({ onNavigate }) {
  return (
    <div className="library-question-list">
      {relatedLibraryQuestions.map((question) => (
        <article key={question.id} className="library-question-card">
          <div>
            <span>{question.type}</span>
            <strong>{question.title}</strong>
            <p>{question.description}</p>
          </div>
          <button
            type="button"
            className="outline-pill-button"
            onClick={() => onNavigate('/learning/qbank/session')}
          >
            {question.action}
          </button>
        </article>
      ))}
    </div>
  )
}

function ArticleIndex({ items }) {
  return (
    <aside className="library-article-index" aria-label="Indice del articulo">
      <strong>{libraryArticleDetail.indexTitle}</strong>
      <nav>
        {items.map((section) => (
          <a key={section.id} href={`#${section.id}`}>
            {section.title}
          </a>
        ))}
      </nav>
    </aside>
  )
}

function LibraryArticlePage({ onNavigate }) {
  const [isSaved, setIsSaved] = useState(libraryArticleDetail.initiallySaved)
  const article = libraryArticleDetail
  const articleNode = getLibraryNode(libraryNodes, article.nodeId)
  const articlePath = getLibraryPath(libraryNodes, article.nodeId)
  const rootLabel = articlePath[0]?.label

  return (
    <section className="library-article-page">
      <button
        type="button"
        className="library-back-button"
        onClick={() => onNavigate('/learning/library')}
      >
        <span aria-hidden="true">&lt;</span>
        {library.backToLibrary}
      </button>

      <div className="library-article-layout">
        <ArticleIndex items={article.sections} />

        <article className="library-article-content">
          <header className="library-article-header">
            <div>
              <span className="library-eyebrow">{rootLabel}</span>
              <div className="library-article-path">
                {articlePath.slice(0, -1).map((node) => node.label).join(' / ')}
              </div>
              <h1>{articleNode?.label}</h1>
              <p>{article.summary}</p>
            </div>

            <button
              type="button"
              className={`library-save-button ${isSaved ? 'library-save-button--active' : ''}`}
              onClick={() => setIsSaved((current) => !current)}
            >
              {isSaved ? article.savedAction : article.saveAction}
            </button>
          </header>

          <div className="library-article-meta" aria-label="Metadata del articulo">
            <span>{rootLabel}</span>
            <span>{article.readingTime}</span>
            <span>{article.updatedAt}</span>
          </div>

          <div className="library-chip-row">
            {article.tags.map((tag) => (
              <span key={tag} className="library-chip library-chip--strong">
                {tag}
              </span>
            ))}
          </div>

          <section className="library-summary-card" aria-labelledby="library-keypoints-heading">
            <h2 id="library-keypoints-heading">{article.keyPointsTitle}</h2>
            <ul>
              {article.keyPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </section>

          <section className="library-callout">
            <strong>{article.callout.title}</strong>
            <p>{article.callout.body}</p>
          </section>

          <div className="library-article-sections">
            {article.sections.map((section) => (
              <section key={section.id} id={section.id} className="library-article-section">
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </section>
            ))}
          </div>

          <section className="library-related-section" aria-labelledby="library-related-heading">
            <h2 id="library-related-heading">{article.relatedArticlesTitle}</h2>
            <RelatedArticleList />
          </section>

          <section className="library-related-section" aria-labelledby="library-questions-heading">
            <div className="library-qbank-cta">
              <div>
                <h2 id="library-questions-heading">{article.relatedQuestionsTitle}</h2>
                <p>{article.relatedQuestionsDescription}</p>
              </div>
              <button
                type="button"
                className="primary-button"
                onClick={() => onNavigate('/learning/qbank/session')}
              >
                {article.qbankAction}
              </button>
            </div>
            <RelatedQuestions onNavigate={onNavigate} />
          </section>
        </article>
      </div>
    </section>
  )
}

export default LibraryArticlePage
