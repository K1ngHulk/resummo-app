import './StructuredArticleContent.css'

function isInternalRoute(href) {
  return typeof href === 'string' && href.startsWith('/')
}

function InlineNodes({ nodes = [], onNavigate }) {
  return nodes.map((node, index) => {
    const key = `${node.type}-${index}`
    if (node.type === 'text') return <span key={key}>{node.text}</span>
    if (node.type === 'strong') return <strong key={key}><InlineNodes nodes={node.children} onNavigate={onNavigate} /></strong>
    if (node.type === 'emphasis') return <em key={key}><InlineNodes nodes={node.children} onNavigate={onNavigate} /></em>
    if (node.type === 'strikethrough') return <s key={key}><InlineNodes nodes={node.children} onNavigate={onNavigate} /></s>
    if (node.type === 'inline_code') return <code key={key} className="structured-article-inline-code">{node.text}</code>
    if (node.type === 'inline_equation') return <code key={key} className="structured-article-inline-equation">{node.expression}</code>
    if (node.type === 'inline_image') {
      if (node.missing) return <span key={key} className="structured-article-missing">[Imagen no disponible: {node.alt || 'sin descripción'}]</span>
      return <img key={key} className="structured-article-inline-image" src={node.src} alt={node.alt || ''} loading="lazy" />
    }
    if (node.type === 'link') {
      if (node.broken) return <span key={key} className="structured-article-broken-link"><InlineNodes nodes={node.children} onNavigate={onNavigate} /></span>
      const internal = node.internal || isInternalRoute(node.href)
      return (
        <a
          key={key}
          href={node.href}
          title={node.title || undefined}
          target={internal ? undefined : '_blank'}
          rel={internal ? undefined : 'noreferrer'}
          onClick={internal && onNavigate ? (event) => {
            event.preventDefault()
            onNavigate(node.href)
          } : undefined}
        >
          <InlineNodes nodes={node.children} onNavigate={onNavigate} />
        </a>
      )
    }
    return null
  })
}

function BlockList({ blocks = [], onNavigate }) {
  return blocks.map((block, index) => <StructuredBlock key={`${block.type}-${block.anchor || index}`} block={block} onNavigate={onNavigate} />)
}

function StructuredBlock({ block, onNavigate }) {
  if (block.type === 'paragraph') {
    return <p><InlineNodes nodes={block.children} onNavigate={onNavigate} /></p>
  }

  if (block.type === 'heading') {
    const level = Math.min(6, Math.max(2, Number(block.level) || 2))
    const Heading = `h${level}`
    return <Heading id={block.anchor}><InlineNodes nodes={block.children} onNavigate={onNavigate} /></Heading>
  }

  if (block.type === 'list') {
    const List = block.ordered ? 'ol' : 'ul'
    return (
      <List className="structured-article-list">
        {block.items?.map((item, index) => (
          <li key={index}>
            {typeof item.checked === 'boolean' ? <span className="structured-article-check" aria-label={item.checked ? 'Completado' : 'Pendiente'}>{item.checked ? '✓' : '○'}</span> : null}
            <BlockList blocks={item.children} onNavigate={onNavigate} />
          </li>
        ))}
      </List>
    )
  }

  if (block.type === 'table') {
    return (
      <div className="structured-article-table-wrap" role="region" aria-label="Tabla del artículo" tabIndex="0">
        <table className="structured-article-table">
          <tbody>
            {block.rows?.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.cells?.map((cell, cellIndex) => {
                  const Cell = row.header ? 'th' : 'td'
                  return <Cell key={cellIndex}><InlineNodes nodes={cell.children} onNavigate={onNavigate} /></Cell>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.type === 'callout') {
    return <aside className="structured-article-callout"><BlockList blocks={block.blocks} onNavigate={onNavigate} /></aside>
  }

  if (block.type === 'blockquote') {
    return <blockquote className="structured-article-quote"><BlockList blocks={block.blocks} onNavigate={onNavigate} /></blockquote>
  }

  if (block.type === 'image') {
    if (block.missing) return <div className="structured-article-missing">Imagen no disponible: {block.alt || 'sin descripción'}</div>
    return (
      <figure className="structured-article-figure">
        <img src={block.src} alt={block.alt || ''} loading="lazy" />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    )
  }

  if (block.type === 'code') {
    return <pre className="structured-article-code"><code data-language={block.language || undefined}>{block.value}</code></pre>
  }

  if (block.type === 'equation') {
    return <div className="structured-article-equation" role="math" aria-label="Ecuación">{block.expression}</div>
  }

  if (block.type === 'divider') return <hr className="structured-article-divider" />
  if (block.type === 'unsupported' && block.text) return <p className="structured-article-unsupported">{block.text}</p>
  return null
}

export default function StructuredArticleContent({ document, onNavigate }) {
  if (!document?.blocks?.length) return null
  return <div className="structured-article-content"><BlockList blocks={document.blocks} onNavigate={onNavigate} /></div>
}
