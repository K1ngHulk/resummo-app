import crypto from 'node:crypto'
import path from 'node:path'
import { blockPlainText, inlinePlainText, parseInlineMarkdown, parseNotionMarkdown, slugify } from './notionExportMarkdown.js'

const posix = path.posix
const SOURCE_TYPE = 'NOTION_EXPORT'
const markdownExtensions = new Set(['.md', '.markdown'])
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp'])

function decodeUri(value) {
  try { return decodeURIComponent(value) } catch { return value }
}

function keyForPath(value) {
  return decodeUri(String(value || '')).replace(/\\/g, '/').replace(/^\.\//, '').toLocaleLowerCase('es')
}

function sourceIdFromStem(stem) {
  const match = stem.match(/(?:^|\s)([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i)
  return match ? match[1].replace(/-/g, '').toLowerCase() : null
}

function titleFromStem(stem) {
  return stem.replace(/(?:^|\s)([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, '').trim() || 'Sin título'
}

function chooseRoot(pages) {
  const roots = pages.filter((page) => !page.parentSourceId)
  if (roots.length === 1) return roots[0]
  const named = roots.find((page) => slugify(page.title) === 'resummo-mir')
  if (named) return named
  if (!roots.length) return null
  const descendants = (sourceId) => {
    let total = 0
    const queue = [sourceId]
    while (queue.length) {
      const current = queue.shift()
      const children = pages.filter((page) => page.parentSourceId === current)
      total += children.length
      queue.push(...children.map((page) => page.sourceId))
    }
    return total
  }
  return [...roots].sort((a, b) => descendants(b.sourceId) - descendants(a.sourceId))[0]
}

function buildPages(entries, warnings) {
  const pages = entries
    .filter((entry) => markdownExtensions.has(posix.extname(entry.path).toLowerCase()))
    .map((entry) => {
      const extension = posix.extname(entry.path)
      const stem = posix.basename(entry.path, extension)
      const actualId = sourceIdFromStem(stem)
      const noExtensionPath = entry.path.slice(0, -extension.length)
      if (!actualId) warnings.push({ code: 'MISSING_SOURCE_ID', message: 'Una página no incluye ID de Notion en el nombre; se derivó uno estable desde su ruta.' })
      return {
        path: entry.path,
        noExtensionPath,
        folderAliasPath: actualId ? posix.join(posix.dirname(noExtensionPath), titleFromStem(stem)) : null,
        sourceId: actualId || crypto.createHash('sha256').update(`notion-export:${entry.path}`).digest('hex').slice(0, 32),
        title: titleFromStem(stem),
        markdown: entry.data.toString('utf8'),
        parentSourceId: null,
      }
    })

  const seen = new Set()
  for (const page of pages) {
    if (seen.has(page.sourceId)) {
      const error = new Error('El ZIP contiene IDs de página duplicados y no puede importarse de forma idempotente.')
      error.statusCode = 400
      error.code = 'DUPLICATE_SOURCE_IDS'
      throw error
    }
    seen.add(page.sourceId)
  }

  const orderedPages = [...pages].sort((left, right) => {
    const leftPath = keyForPath(left.noExtensionPath)
    const rightPath = keyForPath(right.noExtensionPath)
    if (leftPath < rightPath) return -1
    if (leftPath > rightPath) return 1
    return left.sourceId.localeCompare(right.sourceId)
  })
  const exactFolderMap = new Map()
  const aliasFolderMap = new Map()
  for (const page of orderedPages) {
    const exactKey = keyForPath(page.noExtensionPath)
    if (!exactFolderMap.has(exactKey)) exactFolderMap.set(exactKey, page)
    if (page.folderAliasPath) {
      const aliasKey = keyForPath(page.folderAliasPath)
      if (!aliasFolderMap.has(aliasKey)) aliasFolderMap.set(aliasKey, page)
    }
  }
  for (const page of pages) {
    let directory = posix.dirname(page.path)
    while (directory && directory !== '.') {
      const directoryKey = keyForPath(directory)
      const parent = exactFolderMap.get(directoryKey) || aliasFolderMap.get(directoryKey)
      if (parent && parent.sourceId !== page.sourceId) {
        page.parentSourceId = parent.sourceId
        break
      }
      const next = posix.dirname(directory)
      if (next === directory) break
      directory = next
    }
  }
  return pages
}

function summaryFromBlocks(blocks) {
  for (const block of blocks) {
    if (!['paragraph', 'callout', 'blockquote'].includes(block.type)) continue
    const text = blockPlainText(block).replace(/\s+/g, ' ').trim()
    if (text) return text.slice(0, 280)
  }
  return ''
}

function assignSlugs(topics, articles) {
  const topicSlugs = new Set()
  for (const topic of topics) {
    let candidate = slugify(topic.title)
    if (topicSlugs.has(candidate)) candidate = `${candidate}-${topic.sourceId.slice(0, 8)}`
    topic.slug = candidate
    topicSlugs.add(candidate)
  }

  const counts = new Map()
  for (const article of articles) {
    article.baseSlug = slugify(article.title)
    counts.set(article.baseSlug, (counts.get(article.baseSlug) || 0) + 1)
  }
  const used = new Set()
  for (const article of articles) {
    const topic = topics.find((item) => item.sourceId === article.topicSourceId)
    let candidate = counts.get(article.baseSlug) === 1 ? article.baseSlug : `${topic?.slug || 'tema'}-${article.baseSlug}`
    if (used.has(candidate)) candidate = `${candidate}-${article.sourceId.slice(0, 8)}`
    article.slug = candidate
    used.add(candidate)
    delete article.baseSlug
  }
}

function detectImage(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { extension: '.png', mimeType: 'image/png' }
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { extension: '.jpg', mimeType: 'image/jpeg' }
  if (['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString('ascii'))) return { extension: '.gif', mimeType: 'image/gif' }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') return { extension: '.webp', mimeType: 'image/webp' }
  return null
}

function resolveRelative(sourcePath, rawHref) {
  const raw = String(rawHref || '').trim()
  const hashAt = raw.indexOf('#')
  const queryAt = raw.indexOf('?')
  let boundary = raw.length
  if (hashAt >= 0) boundary = Math.min(boundary, hashAt)
  if (queryAt >= 0) boundary = Math.min(boundary, queryAt)
  const relative = decodeUri(raw.slice(0, boundary))
  const fragment = hashAt >= 0 ? decodeUri(raw.slice(hashAt + 1)) : ''
  const resolved = posix.normalize(posix.join(posix.dirname(sourcePath), relative)).replace(/^\.\//, '')
  if (resolved === '..' || resolved.startsWith('../') || posix.isAbsolute(resolved)) return { path: null, fragment }
  return { path: resolved, fragment }
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:)/i.test(String(value || '').trim())
}

function walkInline(nodes, visitor) {
  for (const node of nodes || []) {
    visitor(node)
    if (node.children) walkInline(node.children, visitor)
  }
}

function walkBlocks(blocks, blockVisitor, inlineVisitor) {
  for (const block of blocks || []) {
    blockVisitor?.(block)
    if (block.children) walkInline(block.children, inlineVisitor)
    if (block.type === 'table') for (const row of block.rows) for (const cell of row.cells) walkInline(cell.children, inlineVisitor)
    if (block.type === 'list') for (const item of block.items) walkBlocks(item.children, blockVisitor, inlineVisitor)
    if (block.blocks) walkBlocks(block.blocks, blockVisitor, inlineVisitor)
  }
}

function buildAssetMap(entries, warnings) {
  const map = new Map()
  for (const entry of entries.filter((item) => imageExtensions.has(posix.extname(item.path).toLowerCase()))) {
    const detected = detectImage(entry.data)
    if (!detected) {
      warnings.push({ code: 'INVALID_ASSET_TYPE', message: 'Se ignoró un asset cuya firma binaria no corresponde a una imagen permitida.' })
      continue
    }
    const checksum = crypto.createHash('sha256').update(entry.data).digest('hex')
    map.set(keyForPath(entry.path), {
      sourcePath: entry.path,
      checksum,
      extension: detected.extension,
      mimeType: detected.mimeType,
      sizeBytes: entry.data.length,
      data: entry.data,
      publicPath: `/content-assets/${checksum}${detected.extension}`,
      referencedBy: new Set(),
    })
  }
  return map
}

function duplicateTitleReport(articles) {
  const groups = new Map()
  for (const article of articles) {
    const key = article.title.toLocaleLowerCase('es')
    const group = groups.get(key) || []
    group.push(article)
    groups.set(key, group)
  }
  return [...groups.values()].filter((group) => group.length > 1).map((group) => ({ title: group[0].title, slugs: group.map((item) => item.slug) }))
}

export function buildNotionExportModel(entries, { archiveName = 'notion-export.zip' } = {}) {
  const warnings = []
  const pages = buildPages(entries, warnings)
  const root = chooseRoot(pages)
  if (!root) {
    const error = new Error('No se pudo determinar la página raíz del export de Notion.')
    error.statusCode = 400
    error.code = 'NOTION_ROOT_NOT_FOUND'
    throw error
  }

  const parsedByPageId = new Map()
  for (const page of pages) {
    const parsed = parseNotionMarkdown(page.markdown, page.sourceId, { stripMatchingTitle: page.title })
    parsedByPageId.set(page.sourceId, parsed)
    warnings.push(...parsed.warnings.map((warning) => ({ ...warning, path: page.path })))
  }

  const topics = pages.filter((page) => page.parentSourceId === root.sourceId).map((page) => {
    const parsed = parsedByPageId.get(page.sourceId)
    const plain = parsed.blocks.map(blockPlainText).filter(Boolean).join('\n').trim()
    return {
      sourceId: page.sourceId,
      sourcePath: page.path,
      sourceSnapshotHash: crypto.createHash('sha256').update(page.markdown).digest('hex'),
      title: page.title,
      slug: '',
      summary: summaryFromBlocks(parsed.blocks) || `Contenido de ${page.title}`,
      description: plain.slice(0, 1200) || `Contenido de ${page.title}`,
      status: 'DRAFT',
    }
  })

  const topicIds = new Set(topics.map((topic) => topic.sourceId))
  const pageById = new Map(pages.map((page) => [page.sourceId, page]))
  const findTopic = (page) => {
    let current = page
    const visited = new Set()
    while (current?.parentSourceId && !visited.has(current.sourceId)) {
      visited.add(current.sourceId)
      if (topicIds.has(current.parentSourceId)) return current.parentSourceId
      current = pageById.get(current.parentSourceId)
    }
    return null
  }

  const disconnected = []
  const emptyArticles = []
  const articles = []
  for (const page of pages) {
    if (page.sourceId === root.sourceId || topicIds.has(page.sourceId)) continue
    const topicSourceId = findTopic(page)
    if (!topicSourceId) { disconnected.push(page); continue }
    const parsed = parsedByPageId.get(page.sourceId)
    const firstH1 = page.markdown.replace(/\r\n?/g, '\n').match(/^#\s+(.+)$/m)?.[1]?.trim()
    const title = firstH1 ? inlinePlainText(parseInlineMarkdown(firstH1)).trim() || page.title : page.title
    const text = parsed.blocks.map(blockPlainText).filter(Boolean).join('\n').replace(/\n{3,}/g, '\n\n').trim()
    if (parsed.blocks.length === 0) {
      emptyArticles.push({ sourceId: page.sourceId, sourcePath: page.path, title })
    }
    articles.push({
      sourceId: page.sourceId,
      sourcePath: page.path,
      sourceSnapshotHash: crypto.createHash('sha256').update(page.markdown).digest('hex'),
      topicSourceId,
      title,
      slug: '',
      summary: summaryFromBlocks(parsed.blocks) || `Material educativo de ${title}`,
      body: page.markdown,
      plainText: [title, text].filter(Boolean).join('\n'),
      readTimeMinutes: Math.max(1, Math.ceil(text.split(/\s+/).filter(Boolean).length / 200)),
      tags: [],
      status: 'DRAFT',
      contentJson: { version: 1, source: { type: SOURCE_TYPE, sourceId: page.sourceId, sourcePath: page.path }, blocks: parsed.blocks, headings: parsed.headings },
    })
  }
  if (disconnected.length) warnings.push({ code: 'DISCONNECTED_PAGES', message: `${disconnected.length} páginas no pertenecen a una especialidad y se ignorarán.` })
  if (emptyArticles.length) warnings.push({ code: 'EMPTY_ARTICLE_CONTENT', message: `${emptyArticles.length} artículos no contienen bloques importables después del título y deben corregirse antes de importar.` })

  assignSlugs(topics, articles)

  const pageAlias = new Map()
  for (const page of pages) {
    pageAlias.set(keyForPath(page.path), page)
    pageAlias.set(keyForPath(page.noExtensionPath), page)
  }
  const routes = new Map([[root.sourceId, '/learning/library']])
  for (const topic of topics) routes.set(topic.sourceId, '/learning/library')
  const headings = new Map()
  for (const page of pages) {
    const parsed = parsedByPageId.get(page.sourceId)
    headings.set(page.sourceId, new Map((parsed?.headings || []).map((heading) => [slugify(heading.text), heading.anchor])))
  }
  for (const article of articles) {
    routes.set(article.sourceId, `/learning/library/article?slug=${encodeURIComponent(article.slug)}`)
  }

  const assetsByPath = buildAssetMap(entries, warnings)
  const brokenInternalLinks = []
  const missingAssets = []
  let internalLinks = 0
  let externalLinks = 0

  const articleBySourceId = new Map(articles.map((article) => [article.sourceId, article]))
  const scanPageReferences = (page, blocks, mutatePersistedArticle) => {
    const currentHeadings = headings.get(page.sourceId) || new Map()
    const resolveLink = (href) => {
      if (isExternal(href)) return { external: true, href }
      if (String(href).startsWith('#')) {
        if (!articleBySourceId.has(page.sourceId)) return null
        const fragment = decodeUri(href.slice(1))
        const mappedAnchor = fragment ? currentHeadings.get(slugify(fragment)) : null
        return mappedAnchor ? { internal: true, href: `#${mappedAnchor}` } : null
      }
      const resolved = resolveRelative(page.path, href)
      if (!resolved.path) return null
      const target = pageAlias.get(keyForPath(resolved.path))
      if (!target || !routes.has(target.sourceId)) return null
      let hrefResult = routes.get(target.sourceId)
      if (resolved.fragment) {
        if (!articleBySourceId.has(target.sourceId)) return null
        const targetHeadings = headings.get(target.sourceId)
        const mappedAnchor = targetHeadings?.get(slugify(resolved.fragment))
        if (!mappedAnchor) return null
        hrefResult += `#${mappedAnchor}`
      }
      return { internal: true, href: hrefResult, targetSourceId: target.sourceId }
    }

    const resolveImage = (node) => {
      if (isExternal(node.src)) {
        if (mutatePersistedArticle) node.external = true
        return
      }
      const resolved = resolveRelative(page.path, node.src)
      const asset = resolved.path ? assetsByPath.get(keyForPath(resolved.path)) : null
      if (!asset) {
        missingAssets.push({ articleSourceId: page.sourceId, pageSourceId: page.sourceId, sourcePath: node.src })
        if (mutatePersistedArticle) node.missing = true
        return
      }
      asset.referencedBy.add(page.sourceId)
      if (mutatePersistedArticle) {
        node.assetKey = asset.checksum
        node.src = asset.publicPath
        node.mimeType = asset.mimeType
      }
    }

    walkBlocks(blocks, (block) => {
      if (block.type === 'image') resolveImage(block)
    }, (node) => {
      if (node.type === 'inline_image') { resolveImage(node); return }
      if (node.type !== 'link') return
      const resolution = resolveLink(node.href)
      if (resolution?.external) {
        externalLinks += 1
        if (mutatePersistedArticle) node.external = true
        return
      }
      if (resolution?.internal) {
        internalLinks += 1
        if (mutatePersistedArticle) {
          node.href = resolution.href
          node.internal = true
          if (resolution.targetSourceId) node.targetSourceId = resolution.targetSourceId
        }
      } else {
        brokenInternalLinks.push({ articleSourceId: page.sourceId, pageSourceId: page.sourceId, href: node.href })
        if (mutatePersistedArticle) node.broken = true
      }
    })
  }

  for (const page of pages) {
    const article = articleBySourceId.get(page.sourceId)
    const blocks = article?.contentJson?.blocks || parsedByPageId.get(page.sourceId)?.blocks || []
    scanPageReferences(page, blocks, Boolean(article))
  }

  const allAssets = [...assetsByPath.values()]
  const assets = allAssets
  const orphanAssets = allAssets.filter((asset) => asset.referencedBy.size === 0)
  const duplicateTitles = duplicateTitleReport(articles)

  return {
    version: 1,
    sourceType: SOURCE_TYPE,
    archiveName,
    root: { sourceId: root.sourceId, title: root.title, sourcePath: root.path },
    topics,
    articles,
    assets,
    allAssets,
    warnings,
    duplicateTitles,
    emptyArticles,
    brokenInternalLinks,
    missingAssets,
    orphanAssets: orphanAssets.map((asset) => asset.sourcePath),
    stats: {
      markdownPages: pages.length,
      topics: topics.length,
      articles: articles.length,
      assets: assets.length,
      orphanAssets: orphanAssets.length,
      internalLinks,
      externalLinks,
      brokenInternalLinks: brokenInternalLinks.length,
      missingAssets: missingAssets.length,
      duplicateTitles: duplicateTitles.length,
      emptyArticles: emptyArticles.length,
    },
  }
}

export function toPublicNotionExportPreview(model, meta = {}) {
  const { wrapperDepth = 0, ignoredPaths = [], archiveStats = null, existingContent = null } = meta
  return {
    status: model.stats.brokenInternalLinks === 0 && model.stats.missingAssets === 0 && model.stats.emptyArticles === 0 ? 'VALID' : 'INVALID',
    source: model.root,
    stats: {
      ...model.stats,
      wrapperDepth,
      ignoredFiles: ignoredPaths.length,
      uncompressedBytes: archiveStats?.uncompressedBytes ?? null,
    },
    structure: model.topics.map((topic) => ({
      sourceId: topic.sourceId,
      title: topic.title,
      slug: topic.slug,
      articleCount: model.articles.filter((article) => article.topicSourceId === topic.sourceId).length,
    })),
    duplicateTitles: model.duplicateTitles,
    emptyArticles: model.emptyArticles.slice(0, 50),
    warnings: model.warnings.map((warning) => warning.message),
    brokenLinks: model.brokenInternalLinks.slice(0, 50),
    missingAssets: model.missingAssets.slice(0, 50),
    ignoredFiles: ignoredPaths.slice(0, 50),
    existingContent,
  }
}
