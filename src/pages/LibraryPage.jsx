import { useState } from 'react'
import AppIcon from '../components/ui/AppIcon'
import {
  getLibraryChildren,
  getLibraryDescendantArticles,
  getLibraryNode,
  getLibraryPath,
  getLibraryRootNode,
} from '../data/libraryTree'
import {
  library,
  libraryNodes,
} from '../mocks/learningMockData'

const rootNodes = getLibraryChildren(libraryNodes, null)
function formatTemplate(template, replacements) {
  return Object.entries(replacements).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  )
}

function getHumanPath(node, includeCurrent = false) {
  const nodes = getLibraryPath(libraryNodes, node.id)
  const visibleNodes = includeCurrent ? nodes : nodes.slice(0, -1)

  return [library.breadcrumbRoot, ...visibleNodes.map((pathNode) => pathNode.label)].join(' / ')
}

function getDescendantArticleCount(nodeId) {
  return getLibraryDescendantArticles(libraryNodes, nodeId).length
}

function getChildCountLabel(node) {
  const count = node.type === 'folder'
    ? getLibraryChildren(libraryNodes, node.id).length
    : 0

  return formatTemplate(library.childCountLabel, { count })
}

function searchableText(node) {
  return [
    node.label,
    node.description,
    ...(node.tags ?? []),
    ...getLibraryPath(libraryNodes, node.id).map((pathNode) => pathNode.label),
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('es')
}

function LibraryBreadcrumbs({ activeNode, isSearchActive, onNavigate }) {
  const pathNodes = activeNode ? getLibraryPath(libraryNodes, activeNode.id) : []

  if (!isSearchActive && pathNodes.length === 0) {
    return null
  }

  return (
    <nav className="library-breadcrumbs" aria-label="Ruta de Biblioteca">
      <button type="button" onClick={() => onNavigate('/learning/library')}>
        {library.breadcrumbRoot}
      </button>

      <span aria-hidden="true">/</span>

      {isSearchActive ? (
        <strong aria-current="page">{library.searchResultsTitle}</strong>
      ) : (
        pathNodes.map((node, index) => {
          const isCurrent = index === pathNodes.length - 1

          return (
            <span key={node.id} className="library-breadcrumbs__segment">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {isCurrent || !node.path ? (
                <strong aria-current={isCurrent ? 'page' : undefined}>{node.label}</strong>
              ) : (
                <button type="button" onClick={() => onNavigate(node.path)}>
                  {node.label}
                </button>
              )}
            </span>
          )
        })
      )}
    </nav>
  )
}

function DomainCard({ node, onNavigate }) {
  const articleCount = getDescendantArticleCount(node.id)
  const canOpen = Boolean(node.path)

  return (
    <article className="library-domain-card">
      <button
        type="button"
        onClick={() => canOpen && onNavigate(node.path)}
        disabled={!canOpen}
      >
        <span className="library-node-icon library-node-icon--folder">
          <AppIcon name="folder" />
        </span>
        <span className="library-domain-card__body">
          <strong>{node.label}</strong>
          <span>{node.description}</span>
          <small>{formatTemplate(library.articleCountLabel, { count: articleCount })}</small>
        </span>
        <span className="library-domain-card__action">
          {canOpen ? library.openFolderAction : library.pendingFolderAction}
          <AppIcon name="chevronRight" />
        </span>
      </button>
    </article>
  )
}



function FolderRow({ node, isActive = false, onNavigate }) {
  const canOpen = Boolean(node.path)
  const articleCount = getDescendantArticleCount(node.id)

  return (
    <button
      type="button"
      className={`library-folder-row ${isActive ? 'library-folder-row--active' : ''}`}
      onClick={() => canOpen && onNavigate(node.path)}
      disabled={!canOpen}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="library-node-icon library-node-icon--folder">
        <AppIcon name="folder" />
      </span>
      <span className="library-folder-row__body">
        <strong>{node.label}</strong>
        <small>{formatTemplate(library.articleCountLabel, { count: articleCount })}</small>
      </span>
      <AppIcon name="chevronRight" className="library-folder-row__chevron" />
    </button>
  )
}

function FolderCard({ node, onNavigate }) {
  const canOpen = Boolean(node.path)

  return (
    <article className="library-folder-card">
      <button
        type="button"
        onClick={() => canOpen && onNavigate(node.path)}
        disabled={!canOpen}
      >
        <span className="library-node-icon library-node-icon--folder">
          <AppIcon name="folder" />
        </span>
        <span className="library-folder-card__body">
          <strong>{node.label}</strong>
          <span>{node.description}</span>
          <small>{getChildCountLabel(node)}</small>
        </span>
        <AppIcon name="chevronRight" className="library-folder-card__chevron" />
      </button>
    </article>
  )
}

function LibraryNodeRow({ node, onNavigate }) {
  const isFolder = node.type === 'folder'
  const canOpen = Boolean(node.path)
  const meta = isFolder
    ? getChildCountLabel(node)
    : node.readTime

  return (
    <article className={`library-node-row library-node-row--${node.type}`}>
      <span className={`library-node-icon library-node-icon--${node.type}`}>
        <AppIcon name={isFolder ? 'folder' : 'article'} />
      </span>

      <div className="library-node-row__content">
        <span className="library-node-row__type">
          {isFolder ? library.folderTypeLabel : library.articleTypeLabel}
        </span>
        <strong>{node.label}</strong>
        <span className="library-node-row__path">{getHumanPath(node)}</span>
        <p>{node.description}</p>
        {!isFolder ? (
          <div className="library-chip-row">
            {node.tags.map((tag) => (
              <span key={tag} className="library-chip">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="library-node-row__action">
        <small>{meta}</small>
        <button
          type="button"
          className="outline-pill-button"
          onClick={() => canOpen && onNavigate(node.path)}
          disabled={!canOpen}
        >
          {isFolder
            ? canOpen ? library.openFolderAction : library.pendingFolderAction
            : canOpen ? library.readAction : library.pendingAction}
        </button>
      </div>
    </article>
  )
}

function DomainRail({ activeRootId, onNavigate }) {
  return (
    <aside className="library-domain-rail" aria-label="Dominios de Biblioteca">
      <div className="library-panel-heading">
        <span>{library.domainRailEyebrow}</span>
        <h2>{library.domainRailTitle}</h2>
        <p>{library.domainRailDescription}</p>
      </div>

      <div className="library-domain-rail__list">
        {rootNodes.map((node) => (
          <FolderRow
            key={node.id}
            node={node}
            isActive={node.id === activeRootId}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </aside>
  )
}

function BranchPanel({ activeNode, onNavigate }) {
  const branchOwner = activeNode.parentId
    ? getLibraryNode(libraryNodes, activeNode.parentId)
    : activeNode
  const branchNodes = getLibraryChildren(libraryNodes, branchOwner.id)
    .filter((node) => node.type === 'folder')

  return (
    <aside className="library-branch-panel" aria-label="Ramas de Biblioteca">
      {activeNode.parentId && (
        <button
          type="button"
          className="library-branch-back"
          onClick={() => onNavigate(branchOwner.path)}
        >
          <AppIcon name="chevronLeft" /> Volver a {branchOwner.label}
        </button>
      )}

      <div className="library-panel-heading">
        <span>{library.folderTypeLabel}</span>
        <h2>{formatTemplate(library.branchPanelTitle, { branch: branchOwner.label })}</h2>
        <p>{library.branchPanelDescription}</p>
      </div>

      <div className="library-branch-panel__list">
        {branchNodes.map((node) => (
          <FolderRow
            key={node.id}
            node={node}
            isActive={node.id === activeNode.id}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </aside>
  )
}

function SearchResults({ query, onNavigate, onClear }) {
  const normalizedQuery = query.trim().toLocaleLowerCase('es')
  const results = libraryNodes.filter((node) => searchableText(node).includes(normalizedQuery))

  return (
    <section className="library-search-results" aria-labelledby="library-search-results-heading">
      <div className="library-section__head">
        <div>
          <h2 id="library-search-results-heading">{library.searchResultsTitle}</h2>
          <p>{library.searchResultsDescription}</p>
        </div>
        <p>{formatTemplate(library.resultsLabel, { count: results.length })}</p>
      </div>

      {results.length > 0 ? (
        <div className="library-node-list">
          {results.map((node) => (
            <LibraryNodeRow key={node.id} node={node} onNavigate={onNavigate} />
          ))}
        </div>
      ) : (
        <div className="library-empty-state">
          <strong>{library.emptyTitle}</strong>
          <p>{library.emptyDescription}</p>
          <button type="button" className="outline-pill-button" onClick={onClear}>
            {library.emptyAction}
          </button>
        </div>
      )}
    </section>
  )
}

function LibraryOverview({ onNavigate }) {
  return (
    <div className="library-overview">
      <section className="library-section" aria-labelledby="library-domains-heading">
        <div className="library-section__head">
          <div>
            <h2 id="library-domains-heading">{library.rootTitle}</h2>
            <p>{library.rootDescription}</p>
          </div>
        </div>

        <div className="library-domain-grid">
          {rootNodes.map((node) => (
            <DomainCard key={node.id} node={node} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  )
}

function LibraryBrowse({ activeNode, onNavigate }) {
  const activeRoot = getLibraryRootNode(libraryNodes, activeNode.id)
  const childFolders = activeNode.parentId
    ? getLibraryChildren(libraryNodes, activeNode.id).filter((node) => node.type === 'folder')
    : []
  const articles = getLibraryChildren(libraryNodes, activeNode.id).filter((node) => node.type === 'article')

  return (
    <div className="library-browse-shell">
      <DomainRail activeRootId={activeRoot?.id} onNavigate={onNavigate} />
      <BranchPanel activeNode={activeNode} onNavigate={onNavigate} />

      <section className="library-browse-content" aria-labelledby="library-active-branch-heading">
        <header className="library-browse-content__header">
          <span className="library-eyebrow">
            {activeNode.parentId
              ? `Dentro de ${getLibraryNode(libraryNodes, activeNode.parentId).label}`
              : library.currentBranchEyebrow}
          </span>
          <h2 id="library-active-branch-heading">{activeNode.label}</h2>
          <p>{activeNode.description}</p>
        </header>

        {childFolders.length > 0 ? (
          <section className="library-browse-group" aria-labelledby="library-subfolders-heading">
            <div className="library-section__head">
              <div>
                <h3 id="library-subfolders-heading">{library.folderSectionTitle}</h3>
                <p>{library.folderSectionDescription}</p>
              </div>
            </div>
            <div className="library-folder-grid">
              {childFolders.map((node) => (
                <FolderCard key={node.id} node={node} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        ) : null}

        {articles.length > 0 ? (
          <section className="library-browse-group" aria-labelledby="library-branch-articles-heading">
            <div className="library-section__head">
              <div>
                <h3 id="library-branch-articles-heading">{library.browseArticlesTitle}</h3>
                <p>{library.browseArticlesDescription}</p>
              </div>
              <p>{formatTemplate(library.resultsLabel, { count: articles.length })}</p>
            </div>

            <div className="library-node-list">
              {articles.map((node) => (
                <LibraryNodeRow key={node.id} node={node} onNavigate={onNavigate} />
              ))}
            </div>
          </section>
        ) : childFolders.length > 0 ? (
          <div className="library-empty-state library-empty-state--inline" style={{ marginTop: '2rem' }}>
            <p>{library.emptyFolderState}</p>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function LibraryPage({ onNavigate, activeNodeId = null }) {
  const [query, setQuery] = useState('')
  const activeNode = activeNodeId ? getLibraryNode(libraryNodes, activeNodeId) : null
  const isSearchActive = query.trim().length > 0

  return (
    <section className="library-page" aria-label={library.ariaLabel}>
      <header className="library-hero">
        <div>
          <span className="library-eyebrow">{library.eyebrow}</span>
          <h1>{library.title}</h1>
          <p>{library.subtitle}</p>
        </div>

        <label className="library-search">
          <AppIcon name="search" />
          <span className="visually-hidden">{library.searchLabel}</span>
          <input
            type="search"
            value={query}
            placeholder={library.searchPlaceholder}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </header>

      <LibraryBreadcrumbs
        activeNode={activeNode}
        isSearchActive={isSearchActive}
        onNavigate={onNavigate}
      />

      {isSearchActive ? (
        <SearchResults
          query={query}
          onNavigate={onNavigate}
          onClear={() => setQuery('')}
        />
      ) : activeNode ? (
        <LibraryBrowse activeNode={activeNode} onNavigate={onNavigate} />
      ) : (
        <LibraryOverview onNavigate={onNavigate} />
      )}
    </section>
  )
}

export default LibraryPage
