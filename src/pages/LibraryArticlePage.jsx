import { useEffect, useMemo, useRef, useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import StructuredArticleContent from '../components/library/StructuredArticleContent.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getTopicLibraryPath } from '../data/libraryTree.js'

function formatEditorialDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function getEditorialSummary(editorial) {
  if (editorial?.reviewStatus === 'APPROVED' && editorial.reviewer && editorial.lastReviewed) {
    return {
      status: 'Revisión editorial aprobada',
      reviewer: editorial.reviewer,
      reviewedAt: formatEditorialDate(editorial.lastReviewed),
      evidenceCutoff: formatEditorialDate(editorial.evidenceCutoff),
      approved: true,
    }
  }

  if (editorial?.reviewStatus === 'CLINICAL_REVIEW') {
    return {
      status: 'En revisión clínica',
      reviewer: editorial.reviewer || null,
      reviewedAt: null,
      evidenceCutoff: formatEditorialDate(editorial.evidenceCutoff),
      approved: false,
    }
  }

  return {
    status: 'Revisión editorial pendiente',
    reviewer: null,
    reviewedAt: null,
    evidenceCutoff: formatEditorialDate(editorial?.evidenceCutoff),
    approved: false,
  }
}

function getSectionParagraphs(section) {
  if (Array.isArray(section.paragraphs)) return section.paragraphs
  return String(section.body || '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
}

function LibraryArticlePage({ onNavigate, searchParams, hash = '' }) {
  const { request, user } = useAuth()
  const slug = searchParams.get('slug')
  const editorialView = user?.role === 'EDITOR' || user?.role === 'ADMIN'
  const [article, setArticle] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const autoProgressRef = useRef(false)
  const articleId = article?.id

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
        const payload = await request(`/api/articles/${slug}${editorialView ? '?view=editorial' : ''}`)
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
  }, [editorialView, request, slug])

  useEffect(() => {
    if (!articleId || !hash) return undefined

    let targetId = hash.slice(1)
    try {
      targetId = decodeURIComponent(targetId)
    } catch {
      // Keep the raw fragment when it is not valid percent-encoding.
    }
    if (!targetId) return undefined

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: 'start' })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [articleId, hash])

  useEffect(() => {
    async function syncInProgress() {
      if (!article || article.status !== 'PUBLISHED' || autoProgressRef.current) return
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
  const articleLibraryPath = useMemo(
    () => getTopicLibraryPath(article?.topic),
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
  const structuredHeadings = article?.document?.headings || []
  const articleOutline = structuredHeadings.length > 0
    ? structuredHeadings.filter((heading) => heading.level <= 3).map((heading) => ({ id: heading.anchor, title: heading.text }))
    : sections.map((section) => ({ id: section.id, title: section.title }))
  const relatedArticles = article?.relatedArticles || []
  const editorialSummary = getEditorialSummary(article?.editorial)

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
            {articleOutline.length > 0 ? (
              <nav>
                {articleOutline.map((item) => (
                  <a key={item.id} href={`#${item.id}`}>{item.title}</a>
                ))}
              </nav>
            ) : (
              <p>El artículo no tiene secciones disponibles.</p>
            )}
          </aside>

          <article className="library-article-content">
            <header className="library-article-header">
              <div>
                <nav className="library-article-breadcrumbs" aria-label="Ubicación del artículo">
                  <button type="button" onClick={() => onNavigate('/learning/library')}>Biblioteca</button>
                  {articleLibraryPath.map((label) => (
                    <span key={label}>
                      <AppIcon name="chevronRight" />
                      <span>{label}</span>
                    </span>
                  ))}
                </nav>
                <span className="library-context-label">
                  {article.status === 'DRAFT' ? 'Vista editorial' : 'Artículo educativo'}
                </span>
                <h1>{article.title}</h1>
                <p>{article.summary}</p>
                <div className="library-article-editorial-meta" aria-label="Información editorial">
                  <span>{article.readTimeMinutes} min de lectura</span>
                  <span>Contenido educativo</span>
                  <span>{editorialSummary.status}</span>
                  {editorialSummary.approved ? (
                    <span>Revisado por {editorialSummary.reviewer}</span>
                  ) : null}
                  {editorialSummary.reviewedAt ? (
                    <span>Última revisión: {editorialSummary.reviewedAt}</span>
                  ) : null}
                  {editorialSummary.evidenceCutoff ? (
                    <span>Evidencia consultada hasta {editorialSummary.evidenceCutoff}</span>
                  ) : null}
                </div>
              </div>
              {article.status === 'PUBLISHED' ? (
                <button type="button" className={`library-save-button ${isCompleted ? 'library-save-button--active' : ''}`} onClick={handleComplete}>
                  {isCompleted ? 'Artículo completado' : 'Marcar como completado'}
                </button>
              ) : (
                <button type="button" className="outline-pill-button" onClick={() => onNavigate(`/admin/articles/review?id=${article.id}`)}>
                  Revisar en Panel editorial
                </button>
              )}
            </header>

            <div className="library-article-meta" aria-label="Información del artículo">
              <span>{article.topic.title}</span>
              <span>{article.status === 'DRAFT' ? 'Solo visible para revisión editorial' : `${article.progress?.progressPercent || 0}% de avance`}</span>
            </div>

            {article.tags?.length > 0 ? (
              <div className="library-chip-row">
                {article.tags.map((tag) => <span key={tag} className="library-chip library-chip--strong">{tag}</span>)}
              </div>
            ) : null}

            <div className="library-article-sections">
              {article.document?.blocks?.length ? (
                <StructuredArticleContent document={article.document} onNavigate={onNavigate} />
              ) : sections.length > 0 ? sections.map((section) => {
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

            <aside className="library-article-disclaimer" aria-label="Alcance del contenido">
              <strong>Uso educativo</strong>
              <p>
                Este material apoya el estudio y no reemplaza la evaluación, el criterio clínico
                ni las guías vigentes aplicables a una persona concreta.
              </p>
            </aside>

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

            {article.relatedQuestionCount > 0 ? (
              <section className="library-related-section" aria-labelledby="library-questions-heading">
                <div className="library-qbank-cta">
                  <div>
                    <h2 id="library-questions-heading">Preguntas relacionadas</h2>
                    <p>{article.relatedQuestionCount} preguntas disponibles para practicar este tema.</p>
                  </div>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => onNavigate(questionCtaPath)}
                  >
                    Practicar preguntas relacionadas
                  </button>
                </div>
              </section>
            ) : null}
          </article>
        </div>
      ) : null}
    </section>
  )
}

export default LibraryArticlePage
