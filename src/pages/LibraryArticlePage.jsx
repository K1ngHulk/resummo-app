import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

function getSectionParagraphs(section) {
  if (Array.isArray(section.paragraphs)) return section.paragraphs
  return String(section.body || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}

function LibraryArticlePage({ onNavigate, searchParams }) {
  const { request } = useAuth()
  const slug = searchParams.get('slug')
  const [article, setArticle] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const autoProgressRef = useRef(false)

  useEffect(() => {
    let isMounted = true

    async function loadArticle() {
      autoProgressRef.current = false
      setArticle(null)
      setIsLoading(true)
      if (!slug) {
        if (isMounted) {
          setError('No se encontró el artículo solicitado.')
          setIsLoading(false)
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
        if (isMounted) setError(loadError.message || 'No se pudo cargar el artículo.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadArticle()
    return () => {
      isMounted = false
    }
  }, [request, slug])

  useEffect(() => {
    async function syncInProgress() {
      if (!article || autoProgressRef.current) return
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
    if (!article) return
    try {
      await request(`/api/articles/${article.slug}/progress`, {
        method: 'POST',
        body: { status: 'COMPLETED', progressPercent: 100 },
      })
      setArticle((current) => current ? {
        ...current,
        progress: { ...(current.progress || {}), status: 'COMPLETED', progressPercent: 100 },
      } : current)
      setError('')
    } catch (updateError) {
      setError(updateError.message || 'No se pudo actualizar el progreso.')
    }
  }

  const sections = article?.sections || []
  const relatedArticles = article?.relatedArticles || []

  return (
    <section className="library-article-page">
      <button type="button" className="library-back-button" onClick={() => onNavigate('/learning/library')}>
        <span aria-hidden="true">&lt;</span>
        Volver a Biblioteca
      </button>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}
      {isLoading ? <div className="library-article-loading">Cargando artículo...</div> : null}

      {article ? (
        <div className="library-article-layout">
          <aside className="library-article-index" aria-label="Índice del artículo">
            <strong>En este artículo</strong>
            {sections.length > 0 ? (
              <nav>
                {sections.map((section) => (
                  <a key={section.id} href={`#${section.id}`}>{section.title}</a>
                ))}
              </nav>
            ) : (
              <p>El artículo no tiene secciones disponibles.</p>
            )}
          </aside>

          <article className="library-article-content">
            <header className="library-article-header">
              <div>
                <span className="library-eyebrow">{article.topic.title}</span>
                <div className="library-article-path">Biblioteca / {article.topic.title}</div>
                <h1>{article.title}</h1>
                <p>{article.summary}</p>
              </div>
              <button type="button" className={`library-save-button ${isCompleted ? 'library-save-button--active' : ''}`} onClick={handleComplete}>
                {isCompleted ? 'Artículo completado' : 'Marcar como completado'}
              </button>
            </header>

            <div className="library-article-meta" aria-label="Información del artículo">
              <span>{article.topic.title}</span>
              <span>{article.readTimeMinutes} min de lectura</span>
              <span>{article.progress?.progressPercent || 0}% de avance</span>
            </div>

            {article.tags?.length > 0 ? (
              <div className="library-chip-row">
                {article.tags.map((tag) => <span key={tag} className="library-chip library-chip--strong">{tag}</span>)}
              </div>
            ) : null}

            <div className="library-article-sections">
              {sections.length > 0 ? sections.map((section) => {
                const paragraphs = getSectionParagraphs(section)
                return (
                  <section key={section.id} id={section.id} className="library-article-section">
                    <h2>{section.title}</h2>
                    {paragraphs.length > 0 ? (
                      <div className="library-article-paragraphs">
                        {paragraphs.map((paragraph, index) => <p key={`${section.id}-${index}`}>{paragraph}</p>)}
                      </div>
                    ) : (
                      <p className="library-article-empty-copy">Esta sección aún no tiene contenido disponible.</p>
                    )}
                  </section>
                )
              }) : (
                <section className="library-article-section">
                  <h2>Contenido del artículo</h2>
                  <p className="library-article-empty-copy">Este artículo aún no tiene contenido disponible.</p>
                </section>
              )}
            </div>

            <section className="library-related-section" aria-labelledby="library-related-heading">
              <h2 id="library-related-heading">Artículos relacionados</h2>
              {relatedArticles.length > 0 ? (
                <div className="library-related-list">
                  {relatedArticles.map((relatedArticle) => (
                    <article key={relatedArticle.id} className="library-related-card">
                      <span>{article.topic.title}</span>
                      <strong>{relatedArticle.title}</strong>
                      <p>{relatedArticle.summary}</p>
                      <button type="button" className="outline-pill-button" onClick={() => onNavigate(`/learning/library/article?slug=${relatedArticle.slug}`)}>
                        Leer artículo
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="library-related-empty">No hay otros artículos relacionados disponibles por ahora.</div>
              )}
            </section>

            <section className="library-related-section" aria-labelledby="library-questions-heading">
              <div className="library-qbank-cta">
                <div>
                  <h2 id="library-questions-heading">Preguntas relacionadas</h2>
                  <p>
                    {article.relatedQuestionCount > 0
                      ? `${article.relatedQuestionCount} preguntas disponibles para practicar este tema.`
                      : 'Todavía no hay preguntas vinculadas directamente con este artículo.'}
                  </p>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onNavigate(article.relatedQuestionCount > 0 ? questionCtaPath : '/learning/qbank')}
                >
                  {article.relatedQuestionCount > 0 ? 'Practicar preguntas relacionadas' : 'Explorar Banco de preguntas'}
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
