import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import { useAuth } from '../context/AuthContext.jsx'

function topicMatchesQuery(topic, query) {
  const searchableText = [
    topic.title,
    topic.summary,
    topic.description,
    ...topic.articles.flatMap((article) => [article.title, article.summary, ...(article.tags || [])]),
  ]
    .join(' ')
    .toLowerCase()

  return searchableText.includes(query)
}

function LibraryPage({ onNavigate }) {
  const { request } = useAuth()
  const [topics, setTopics] = useState([])
  const [query, setQuery] = useState('')
  const [activeTopicSlug, setActiveTopicSlug] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadTopics() {
      try {
        const payload = await request('/api/topics')

        if (isMounted) {
          setTopics(payload.topics)
          setActiveTopicSlug(payload.topics[0]?.slug || '')
          setError('')
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

  const normalizedQuery = query.trim().toLowerCase()
  const filteredTopics = useMemo(
    () => (normalizedQuery ? topics.filter((topic) => topicMatchesQuery(topic, normalizedQuery)) : topics),
    [normalizedQuery, topics],
  )
  const activeTopic = filteredTopics.find((topic) => topic.slug === activeTopicSlug) || filteredTopics[0] || null
  const searchResults = filteredTopics.flatMap((topic) =>
    topic.articles
      .filter((article) => topicMatchesQuery({ ...topic, articles: [article] }, normalizedQuery))
      .map((article) => ({ ...article, topic }))
  )

  return (
    <section className="library-page" aria-label="Biblioteca Learning">
      <header className="library-hero">
        <div>
          <span className="library-eyebrow">Learning Library</span>
          <h1>Biblioteca medica</h1>
          <p>Explora temas, abre articulos reales de la base y conecta cada lectura con la practica.</p>
        </div>

        <label className="library-search">
          <AppIcon name="search" />
          <span className="visually-hidden">Buscar en Biblioteca medica</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar temas, articulos o etiquetas"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      {normalizedQuery ? (
        <section className="library-section" aria-labelledby="library-search-results-heading">
          <div className="library-section__head">
            <div>
              <h2 id="library-search-results-heading">Resultados de busqueda</h2>
              <p>Articulos encontrados dentro de la biblioteca.</p>
            </div>
            <p>{searchResults.length} resultados</p>
          </div>

          <div className="library-node-list">
            {searchResults.map((article) => (
              <article key={article.id} className="library-node-row library-node-row--article">
                <span className="library-node-icon library-node-icon--article">
                  <AppIcon name="article" />
                </span>
                <div className="library-node-row__content">
                  <span className="library-node-row__type">Articulo</span>
                  <strong>{article.title}</strong>
                  <span className="library-node-row__path">{article.topic.title}</span>
                  <p>{article.summary}</p>
                  <div className="library-chip-row">
                    {article.tags.map((tag) => (
                      <span key={tag} className="library-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="library-node-row__action">
                  <small>{article.readTimeMinutes} min</small>
                  <button
                    type="button"
                    className="outline-pill-button"
                    onClick={() => onNavigate(`/learning/library/article?slug=${article.slug}`)}
                  >
                    Leer articulo
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <div className="library-browse-shell library-browse-shell--simple">
          <aside className="library-domain-rail" aria-label="Temas de Biblioteca">
            <div className="library-panel-heading">
              <span>Temas</span>
              <h2>Areas de estudio</h2>
              <p>Selecciona un dominio para ver sus articulos disponibles.</p>
            </div>

            <div className="library-domain-rail__list">
              {filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  className={`library-folder-row ${activeTopic?.slug === topic.slug ? 'library-folder-row--active' : ''}`}
                  onClick={() => setActiveTopicSlug(topic.slug)}
                >
                  <span className="library-node-icon library-node-icon--folder">
                    <AppIcon name="folder" />
                  </span>
                  <span className="library-folder-row__body">
                    <strong>{topic.title}</strong>
                    <small>{topic.articleCount} articulos</small>
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="library-browse-content" aria-labelledby="library-active-topic-heading">
            {activeTopic ? (
              <>
                <header className="library-browse-content__header">
                  <span className="library-eyebrow">Tema activo</span>
                  <h2 id="library-active-topic-heading">{activeTopic.title}</h2>
                  <p>{activeTopic.description}</p>
                </header>

                <div className="library-node-list">
                  {activeTopic.articles.map((article) => (
                    <article key={article.id} className="library-node-row library-node-row--article">
                      <span className="library-node-icon library-node-icon--article">
                        <AppIcon name="article" />
                      </span>
                      <div className="library-node-row__content">
                        <span className="library-node-row__type">Articulo</span>
                        <strong>{article.title}</strong>
                        <span className="library-node-row__path">{activeTopic.title}</span>
                        <p>{article.summary}</p>
                        <div className="library-chip-row">
                          {article.tags.map((tag) => (
                            <span key={tag} className="library-chip">
                              {tag}
                            </span>
                          ))}
                          {article.progress?.status ? (
                            <span className="library-chip library-chip--strong">{article.progress.status}</span>
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
                          Leer articulo
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="library-empty-state">
                <strong>No encontramos temas disponibles</strong>
                <p>Verifica que el backend y los seeds esten cargados.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default LibraryPage
