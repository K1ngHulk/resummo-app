import { useEffect, useMemo, useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import { useAuth } from '../context/AuthContext.jsx'
import {
  buildLibraryTree,
  getLibraryChildren,
  getLibraryNode,
  getLibraryPath,
  getLibraryRootNode,
  getLibraryRootNodes,
  libraryTopicNodeMap,
} from '../data/libraryTree.js'

const activeNodeStorageKey = 'resummo_library_active_node'
const legacyTopicStorageKey = 'resummo_library_active_topic'

function formatProgressStatus(status) {
  if (!status) return null
  const upperStatus = String(status).toUpperCase()
  if (upperStatus === 'IN_PROGRESS') return 'En progreso'
  if (upperStatus === 'COMPLETED') return 'Completado'
  return null
}

function formatFolderMeta(node) {
  const folderCount = node.folderCount || 0
  const articleCount = node.articleCount || 0
  const articleLabel = articleCount === 1 ? 'artículo' : 'artículos'

  if (folderCount > 0) {
    const folderLabel = folderCount === 1 ? 'subcarpeta' : 'subcarpetas'
    return `${folderCount} ${folderLabel} · ${articleCount} ${articleLabel} en la rama`
  }

  return `${articleCount} ${articleLabel}`
}

function readStoredNodeId() {
  try {
    const storedNodeId = localStorage.getItem(activeNodeStorageKey)
    if (storedNodeId) return storedNodeId

    const legacyTopicSlug = localStorage.getItem(legacyTopicStorageKey)
    return libraryTopicNodeMap[legacyTopicSlug] || ''
  } catch {
    return ''
  }
}

function FolderButton({ node, active = false, onSelect }) {
  return (
    <button
      type="button"
      className={`library-tree-folder-button ${active ? 'library-tree-folder-button--active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={() => onSelect(node.id)}
    >
      <span className="library-node-icon" aria-hidden="true">
        <AppIcon name="folder" />
      </span>
      <span className="library-tree-folder-button__body">
        <strong>{node.label}</strong>
        <span>{node.description}</span>
        <small>{formatFolderMeta(node)}</small>
      </span>
      <AppIcon name="chevronRight" className="library-tree-folder-button__chevron" />
    </button>
  )
}

function ArticleRow({ node, nodes, onNavigate }) {
  const { article } = node
  const pathLabel = getLibraryPath(nodes, node.id)
    .filter((pathNode) => pathNode.type === 'folder')
    .map((pathNode) => pathNode.label)
    .join(' / ')
  const progressStatus = formatProgressStatus(article.progress?.status)

  return (
    <article className="library-node-row library-node-row--article">
      <span className="library-node-icon library-node-icon--article" aria-hidden="true">
        <AppIcon name="article" />
      </span>
      <div className="library-node-row__content">
        <span className="library-node-row__type">Artículo</span>
        <strong>{article.title}</strong>
        <span className="library-node-row__path">Biblioteca / {pathLabel}</span>
        <p>{article.summary}</p>
        <div className="library-chip-row">
          {(article.tags || []).map((tag) => (
            <span key={tag} className="library-chip">{tag}</span>
          ))}
          {progressStatus ? (
            <span className="library-chip library-chip--strong">{progressStatus}</span>
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
  )
}

function LibraryPage({ onNavigate }) {
  const { request } = useAuth()
  const [topics, setTopics] = useState([])
  const [query, setQuery] = useState('')
  const [activeNodeId, setActiveNodeId] = useState(readStoredNodeId)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTopics() {
      try {
        const payload = await request('/api/topics')
        if (!isMounted) return

        const nextTopics = Array.isArray(payload.topics) ? payload.topics : []
        const nextTree = buildLibraryTree(nextTopics)
        setTopics(nextTopics)
        setActiveNodeId((current) => getLibraryNode(nextTree, current) ? current : '')
        setError('')
      } catch (loadError) {
        if (isMounted) setError(loadError.message || 'No se pudo cargar la Biblioteca.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTopics()
    return () => {
      isMounted = false
    }
  }, [request])

  const nodes = useMemo(() => buildLibraryTree(topics), [topics])
  const rootNodes = useMemo(() => getLibraryRootNodes(nodes), [nodes])
  const activeNode = getLibraryNode(nodes, activeNodeId)
  const activePath = activeNode ? getLibraryPath(nodes, activeNode.id) : []
  const activeRoot = activeNode ? getLibraryRootNode(nodes, activeNode.id) : null
  const activeParent = activeNode?.parentId ? getLibraryNode(nodes, activeNode.parentId) : null
  const activeChildren = activeNode ? getLibraryChildren(nodes, activeNode.id) : []
  const childFolders = activeChildren.filter((node) => node.type === 'folder')
  const directArticles = activeChildren.filter((node) => node.type === 'article')
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const isSearching = normalizedQuery.length > 0

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return []

    return nodes.filter((node) => {
      if (node.type !== 'article') return false
      const { article, topic } = node
      const searchableText = [
        article.title,
        article.summary,
        topic.title,
        topic.summary,
        topic.description,
        ...(article.tags || []),
      ].join(' ').toLocaleLowerCase('es')
      return searchableText.includes(normalizedQuery)
    })
  }, [nodes, normalizedQuery])

  const handleSelectNode = (nodeId) => {
    setActiveNodeId(nodeId)
    try {
      if (nodeId) localStorage.setItem(activeNodeStorageKey, nodeId)
      else localStorage.removeItem(activeNodeStorageKey)
      localStorage.removeItem(legacyTopicStorageKey)
    } catch {
      // Navigation still works when local persistence is unavailable.
    }
  }

  return (
    <section className="library-page" aria-label="Biblioteca médica">
      <header className="library-hero">
        <div>
          <span className="library-context-label">Biblioteca Resummo</span>
          <h1>Aprende desde una biblioteca organizada</h1>
          <p>Explora contenidos publicados por área, abre artículos y conecta cada lectura con tu práctica.</p>
        </div>

        <label className="library-search">
          <AppIcon name="search" />
          <span className="visually-hidden">Buscar en Biblioteca médica</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar artículos, temas o etiquetas"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      {error ? <div className="app-feedback app-feedback--error">{error}</div> : null}

      <nav className="library-breadcrumbs" aria-label="Ruta de navegación">
        <button type="button" onClick={() => handleSelectNode('')}>Biblioteca</button>
        {isSearching ? (
          <span className="library-breadcrumbs__segment">
            <AppIcon name="chevronRight" />
            <span>Resultados de búsqueda</span>
          </span>
        ) : activePath.map((node, index) => {
          const isLast = index === activePath.length - 1
          return (
            <span key={node.id} className="library-breadcrumbs__segment">
              <AppIcon name="chevronRight" />
              {isLast ? (
                <span>{node.label}</span>
              ) : (
                <button type="button" onClick={() => handleSelectNode(node.id)}>{node.label}</button>
              )}
            </span>
          )
        })}
      </nav>

      {isLoading ? (
        <div className="library-empty-state" aria-live="polite">
          <strong>Organizando la Biblioteca</strong>
          <p>Cargando temas y artículos publicados.</p>
        </div>
      ) : isSearching ? (
        <section className="library-search-results" aria-labelledby="library-search-results-heading">
          <div className="library-section__head">
            <div>
              <h2 id="library-search-results-heading">Resultados de búsqueda</h2>
              <p>La búsqueda revisa toda la Biblioteca, independientemente de la carpeta abierta.</p>
            </div>
            <div className="library-search-results__summary">
              <span>{searchResults.length} {searchResults.length === 1 ? 'resultado' : 'resultados'}</span>
              <button type="button" className="text-link" onClick={() => setQuery('')}>Cerrar búsqueda</button>
            </div>
          </div>

          {searchResults.length > 0 ? (
            <div className="library-node-list">
              {searchResults.map((node) => (
                <ArticleRow key={node.id} node={node} nodes={nodes} onNavigate={onNavigate} />
              ))}
            </div>
          ) : (
            <div className="library-empty-state">
              <strong>No se encontraron artículos</strong>
              <p>Prueba con otro término, área o etiqueta.</p>
            </div>
          )}
        </section>
      ) : (
        <div className="library-tree-shell">
          <aside className="library-tree-rail" aria-label="Áreas de la Biblioteca">
            <div className="library-tree-rail__header">
              <strong>Áreas de estudio</strong>
              <span>Navegación principal</span>
            </div>
            <button
              type="button"
              className={`library-tree-home ${!activeNode ? 'library-tree-home--active' : ''}`}
              aria-current={!activeNode ? 'page' : undefined}
              onClick={() => handleSelectNode('')}
            >
              Inicio de Biblioteca
            </button>
            <div className="library-tree-rail__list">
              {rootNodes.map((node) => (
                <FolderButton
                  key={node.id}
                  node={node}
                  active={activeRoot?.id === node.id}
                  onSelect={handleSelectNode}
                />
              ))}
            </div>
          </aside>

          <section className="library-tree-main" aria-labelledby="library-tree-heading">
            {activeNode ? (
              <>
                <header className="library-tree-main__header">
                  {activeParent ? (
                    <button
                      type="button"
                      className="library-branch-back"
                      onClick={() => handleSelectNode(activeParent.id)}
                    >
                      <AppIcon name="chevronLeft" />
                      Volver a {activeParent.label}
                    </button>
                  ) : null}
                  <span className="library-tree-main__context">
                    {activeParent ? `Dentro de ${activeParent.label}` : 'Área de estudio'}
                  </span>
                  <h2 id="library-tree-heading">{activeNode.label}</h2>
                  <p>{activeNode.description}</p>
                  <small>{formatFolderMeta(activeNode)}</small>
                </header>

                {activeNode.topic ? (
                  <div className="library-flashcard-cta">
                    <span className="library-flashcard-cta__icon" aria-hidden="true">
                      <AppIcon name="lightning" />
                    </span>
                    <div>
                      <strong>Flashcards del tema</strong>
                      <span>Acción secundaria para una revisión rápida.</span>
                    </div>
                    <button
                      type="button"
                      className="outline-pill-button"
                      onClick={() => onNavigate(`/learning/flashcards?topicId=${activeNode.topic.id}`)}
                    >
                      Repasar tarjetas
                    </button>
                  </div>
                ) : null}

                {childFolders.length > 0 ? (
                  <section className="library-tree-group" aria-labelledby="library-folders-heading">
                    <div>
                      <h3 id="library-folders-heading">Carpetas</h3>
                      <p>Continúa explorando dentro de esta área.</p>
                    </div>
                    <div className="library-tree-list">
                      {childFolders.map((node) => (
                        <FolderButton key={node.id} node={node} onSelect={handleSelectNode} />
                      ))}
                    </div>
                  </section>
                ) : null}

                {directArticles.length > 0 ? (
                  <section className="library-tree-group" aria-labelledby="library-articles-heading">
                    <div>
                      <h3 id="library-articles-heading">Artículos publicados</h3>
                      <p>Contenido disponible directamente en esta carpeta.</p>
                    </div>
                    <div className="library-node-list">
                      {directArticles.map((node) => (
                        <ArticleRow key={node.id} node={node} nodes={nodes} onNavigate={onNavigate} />
                      ))}
                    </div>
                  </section>
                ) : childFolders.length === 0 ? (
                  <div className="library-empty-state">
                    <strong>No hay artículos directos en esta carpeta</strong>
                    <p>El tema está publicado, pero todavía no contiene artículos visibles.</p>
                  </div>
                ) : null}
              </>
            ) : (
              <div className="library-tree-overview">
                <span className="library-tree-main__context">Exploración jerárquica</span>
                <h2 id="library-tree-heading">Biblioteca por áreas</h2>
                <p>Selecciona un área en el panel izquierdo y avanza por sus carpetas hasta encontrar los artículos publicados.</p>
                <dl>
                  {rootNodes.map((node) => (
                    <div key={node.id}>
                      <dt>{node.label}</dt>
                      <dd>{node.description} {formatFolderMeta(node)}.</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}

export default LibraryPage
