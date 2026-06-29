import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function LibraryArticlePage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const slug = searchParams.get('slug')
  const [article, setArticle] = useState(null)
  const [error, setError] = useState('')
  const autoProgressRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    async function loadArticle() {
      if (!slug) {
        if (isMounted) {
          setError('No se encontro el articulo solicitado')
        }
        return
      }

      try {
        const payload = await request(`/api/articles/${slug}`)

        if (isMounted) {
          setArticle(payload.article)
          setError('')
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      }
    }

    loadArticle()

    return () => {
      isMounted = false
    }
  }, [request, slug])

  useEffect(() => {
    async function syncInProgress() {
      if (!article || autoProgressRef.current) {
        return
      }

      autoProgressRef.current = true

      if (!article.progress || article.progress.status === 'NOT_STARTED') {
        try {
          await request(`/api/articles/${article.slug}/progress`, {
            method: 'POST',
            body: {
              status: 'IN_PROGRESS',
              progressPercent: Math.max(article.progress?.progressPercent || 0, 25),
            },
          })

          setArticle((current) => current ? {
            ...current,
            progress: {
              ...(current.progress || {}),
              status: 'IN_PROGRESS',
              progressPercent: Math.max(current.progress?.progressPercent || 0, 25),
            },
          } : current)
        } catch {
          autoProgressRef.current = false
        }
      }
    }

    syncInProgress()
  }, [article, request])

  const isCompleted = article?.progress?.status === 'COMPLETED'
  const questionCtaPath = useMemo(
    () => (article ? `/learning/qbank/new?topic=${article.topic.slug}` : '/learning/qbank/new'),
    [article],
  )

  const handleComplete = async () => {
    if (!article) {
      return
    }

    try {
      await request(`/api/articles/${article.slug}/progress`, {
        method: 'POST',
        body: {
          status: 'COMPLETED',
          progressPercent: 100,
        },
      })

      setArticle((current) => current ? {
        ...current,
        progress: {
          ...(current.progress || {}),
          status: 'COMPLETED',
          progressPercent: 100,
        },
      } : current)
    } catch (updateError) {
      setError(updateError.message)
    }
  }

  return (
    <section className="library-article-page">
      <button type="button" className="library-back-button" onClick={() => onNavigate('/learning/library')}>
        <span aria-hidden="true">&lt;</span>
        Volver a Biblioteca
      </button>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {article ? (
        <div className="library-article-layout">
          <aside className="library-article-index" aria-label="Indice del articulo">
            <strong>En este articulo</strong>
            <nav>
              {article.sections.map((section) => (
                <a key={section.id} href={`#${section.id}`}>
                  {section.title}
                </a>
              ))}
            </nav>
          </aside>

          <article className="library-article-content">
            <header className="library-article-header">
              <div>
                <span className="library-eyebrow">{article.topic.title}</span>
                <div className="library-article-path">Biblioteca / {article.topic.title}</div>
                <h1>{article.title}</h1>
                <p>{article.summary}</p>
              </div>

              <button
                type="button"
                className={`library-save-button ${isCompleted ? 'library-save-button--active' : ''}`}
                onClick={handleComplete}
              >
                {isCompleted ? 'Articulo completado' : 'Marcar como completado'}
              </button>
            </header>

            <div className="library-article-meta" aria-label="Metadata del articulo">
              <span>{article.topic.title}</span>
              <span>{article.readTimeMinutes} min de lectura</span>
              <span>{article.progress?.progressPercent || 0}% de avance</span>
            </div>

            <div className="library-chip-row">
              {article.tags.map((tag) => (
                <span key={tag} className="library-chip library-chip--strong">
                  {tag}
                </span>
              ))}
            </div>

            <div className="library-article-sections">
              {article.sections.map((section) => (
                <section key={section.id} id={section.id} className="library-article-section">
                  <h2>{section.title}</h2>
                  <p>{section.body}</p>
                </section>
              ))}
            </div>

            <section className="library-related-section" aria-labelledby="library-related-heading">
              <h2 id="library-related-heading">Articulos relacionados</h2>
              <div className="library-related-list">
                {article.relatedArticles.map((relatedArticle) => (
                  <article key={relatedArticle.id} className="library-related-card">
                    <span>{article.topic.title}</span>
                    <strong>{relatedArticle.title}</strong>
                    <p>{relatedArticle.summary}</p>
                    <button
                      type="button"
                      className="outline-pill-button"
                      onClick={() => onNavigate(`/learning/library/article?slug=${relatedArticle.slug}`)}
                    >
                      Leer articulo
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <section className="library-related-section" aria-labelledby="library-questions-heading">
              <div className="library-qbank-cta">
                <div>
                  <h2 id="library-questions-heading">Preguntas relacionadas</h2>
                  <p>{article.relatedQuestionCount} preguntas disponibles para practicar este tema.</p>
                </div>
                <button type="button" className="primary-button" onClick={() => onNavigate(questionCtaPath)}>
                  Practicar preguntas relacionadas
                </button>
              </div>
            </section>
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default LibraryArticlePage
