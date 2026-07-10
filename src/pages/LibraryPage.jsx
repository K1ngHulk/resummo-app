import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import { useAuth } from '../context/AuthContext.jsx'

function formatProgressStatus(status) {
  if (!status) return null
  const upperStatus = String(status).toUpperCase()
  if (upperStatus === 'IN_PROGRESS') {
    return 'En progreso'
  }
  if (upperStatus === 'COMPLETED') {
    return 'Completado'
  }
  return null
}

function LibraryPage({ onNavigate }) {
  const { request } = useAuth()
  const [topics, setTopics] = useState([])
  const [query, setQuery] = useState('')
  const [activeTopicSlug, setActiveTopicSlug] = useState(() => {
    try {
      return localStorage.getItem('resummo_library_active_topic') || ''
    } catch {
      return ''
    }
  })
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadTopics() {
      try {
        const payload = await request('/api/topics')

        if (isMounted) {
          setTopics(payload.topics)
          setError('')

          // Validate stored slug against loaded topics
          const savedSlug = localStorage.getItem('resummo_library_active_topic') || ''
          if (savedSlug) {
            const exists = payload.topics.some((t) => t.slug === savedSlug)
            if (!exists) {
              setActiveTopicSlug('')
              try {
                localStorage.removeItem('resummo_library_active_topic')
              } catch {
                // ignore
              }
            }
          }
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message)
        }
      }
    }

    loadTopics()

    return () => {
      isMounted = false
    }
  }, [request])

  const handleSelectTopic = (slug) => {
    setActiveTopicSlug(slug)
    try {
      if (slug) {
        localStorage.setItem('resummo_library_active_topic', slug)
      } else {
        localStorage.removeItem('resummo_library_active_topic')
      }
    } catch {
      // ignore
    }
  }

  const normalizedQuery = query.trim().toLowerCase()

  const activeTopic = useMemo(() => {
    if (!activeTopicSlug) return null
    return topics.find((topic) => topic.slug === activeTopicSlug) || null
  }, [topics, activeTopicSlug])

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return []
    const results = []
    topics.forEach((topic) => {
      topic.articles.forEach((article) => {
        const matchText = [
          topic.title,
          topic.summary,
          topic.description,
          article.title,
          article.summary,
          ...(article.tags || []),
        ]
          .join(' ')
          .toLowerCase()

        if (matchText.includes(normalizedQuery)) {
          results.push({
            ...article,
            topic,
          })
        }
      })
    })
    return results
  }, [normalizedQuery, topics])

  return (
    <section className="library-page" aria-label="Biblioteca Learning">
      <header className="library-hero">
        <div>
          <span className="library-eyebrow">Learning Library</span>
          <h1>Biblioteca médica</h1>
          <p>Explora temas, abre artículos reales de la base y conecta cada lectura con la práctica.</p>
        </div>

        <label className="library-search">
          <AppIcon name="search" />
          <span className="visually-hidden">Buscar en Biblioteca médica</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar temas, artículos o etiquetas"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      <div style={{ marginBottom: '1.5rem' }}>
        <nav className="library-breadcrumbs" aria-label="Ruta de navegación">
          {normalizedQuery ? (
            <>
              <button type="button" onClick={() => setQuery('')}>
                Biblioteca
              </button>
              <span className="library-breadcrumbs__segment">
                <AppIcon name="chevronRight" />
                <span>Búsqueda</span>
              </span>
            </>
          ) : activeTopic ? (
            <>
              <button type="button" onClick={() => handleSelectTopic('')}>
                Biblioteca
              </button>
              <span className="library-breadcrumbs__segment">
                <AppIcon name="chevronRight" />
                <span>{activeTopic.title}</span>
              </span>
            </>
          ) : (
            <span>Biblioteca</span>
          )}
        </nav>
      </div>

      {normalizedQuery ? (
        <section className="library-section" aria-labelledby="library-search-results-heading">
          <div className="library-section__head">
            <div>
              <h2 id="library-search-results-heading">Resultados de búsqueda</h2>
              <p>Artículos encontrados dentro de la biblioteca.</p>
            </div>
            <p>{searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}</p>
          </div>

          {searchResults.length > 0 ? (
            <div className="library-node-list">
              {searchResults.map((article) => (
                <article key={article.id} className="library-node-row library-node-row--article">
                  <span className="library-node-icon library-node-icon--article">
                    <AppIcon name="article" />
                  </span>
                  <div className="library-node-row__content">
                    <span className="library-node-row__type">Artículo</span>
                    <strong>{article.title}</strong>
                    <span className="library-node-row__path">Biblioteca / {article.topic.title}</span>
                    <p>{article.summary}</p>
                    <div className="library-chip-row">
                      {article.tags.map((tag) => (
                        <span key={tag} className="library-chip">
                          {tag}
                        </span>
                      ))}
                      {formatProgressStatus(article.progress?.status) ? (
                        <span className="library-chip library-chip--strong">
                          {formatProgressStatus(article.progress?.status)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="library-node-row__action">
                    <small>{article.readTimeMinutes} min</small>
                    <button
                      type="button"
                      className="outline-pill-button"
                      onClick={() => onNavigate(`/learning/library/article?slug=${article.slug}`)}
                    >
                      Leer artículo
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="library-empty-state">
              <strong>No se encontraron resultados</strong>
              <p>Intenta con otros términos, temas o etiquetas.</p>
            </div>
          )}
        </section>
      ) : activeTopic ? (
        <div className="library-browse-shell">
          <aside className="library-branch-panel" aria-label="Tema activo">
            <button
              type="button"
              className="library-branch-back"
              onClick={() => handleSelectTopic('')}
            >
              <AppIcon name="chevronLeft" />
              Volver a la Biblioteca
            </button>
            <div className="library-panel-heading">
              <span>Tema Activo</span>
              <h2>{activeTopic.title}</h2>
              <p>{activeTopic.summary}</p>
            </div>
          </aside>

          <section className="library-browse-content" aria-labelledby="library-active-topic-heading">
            <header className="library-browse-content__header">
              <span className="library-eyebrow">Tema</span>
              <h2 id="library-active-topic-heading">{activeTopic.title}</h2>
              <p>{activeTopic.description}</p>
              <div className="library-flashcard-cta">
                <span className="library-flashcard-cta__icon" aria-hidden="true">
                  <AppIcon name="lightning" />
                </span>
                <div>
                  <strong>Flashcards del tema</strong>
                  <span>Revisión rápida con tarjetas publicadas.</span>
                </div>
                <button
                  type="button"
                  className="outline-pill-button"
                  onClick={() => onNavigate(`/learning/flashcards?topicId=${activeTopic.id}`)}
                >
                  Repasar tarjetas
                </button>
              </div>
            </header>

            <div className="library-node-list">
              {activeTopic.articles && activeTopic.articles.length > 0 ? (
                activeTopic.articles.map((article) => (
                  <article key={article.id} className="library-node-row library-node-row--article">
                    <span className="library-node-icon library-node-icon--article">
                      <AppIcon name="article" />
                    </span>
                    <div className="library-node-row__content">
                      <span className="library-node-row__type">Artículo</span>
                      <strong>{article.title}</strong>
                      <span className="library-node-row__path">Biblioteca / {activeTopic.title}</span>
                      <p>{article.summary}</p>
                      <div className="library-chip-row">
                        {article.tags.map((tag) => (
                          <span key={tag} className="library-chip">
                            {tag}
                          </span>
                        ))}
                        {formatProgressStatus(article.progress?.status) ? (
                          <span className="library-chip library-chip--strong">
                            {formatProgressStatus(article.progress?.status)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="library-node-row__action">
                      <small>{article.readTimeMinutes} min</small>
                      <button
                        type="button"
                        className="outline-pill-button"
                        onClick={() => onNavigate(`/learning/library/article?slug=${article.slug}`)}
                      >
                        Leer artículo
                      </button>
                    </div>
                  </article>
                ))
              ) : (
                <div className="library-empty-state">
                  <strong>No hay artículos disponibles</strong>
                  <p>Este tema aún no tiene artículos publicados.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="library-section" aria-labelledby="library-overview-heading">
          <div className="library-overview">
            <div className="library-section__head">
              <div>
                <h2 id="library-overview-heading">Áreas de estudio</h2>
                <p>Selecciona un dominio para ver sus artículos disponibles.</p>
              </div>
            </div>

            {topics.length > 0 ? (
              <div className="library-domain-grid">
                {topics.map((topic) => (
                  <div key={topic.id} className="library-domain-card">
                    <button
                      type="button"
                      onClick={() => handleSelectTopic(topic.slug)}
                    >
                      <span className="library-node-icon">
                        <AppIcon name="folder" />
                      </span>
                      <div className="library-domain-card__body">
                        <strong>{topic.title}</strong>
                        <span>{topic.summary}</span>
                        <small>
                          {topic.articleCount} {topic.articleCount === 1 ? 'artículo' : 'artículos'}
                          {' · '}
                          {topic.availableQuestionCount} {topic.availableQuestionCount === 1 ? 'pregunta QBank' : 'preguntas QBank'}
                        </small>
                      </div>
                      <div className="library-domain-card__action">
                        <span>Explorar tema</span>
                        <AppIcon name="chevronRight" />
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="library-empty-state">
                <strong>No encontramos temas disponibles</strong>
                <p>Verifica que el backend y los seeds estén cargados.</p>
              </div>
            )}
          </div>
        </section>
      )}
    </section>
  )
}

export default LibraryPage
