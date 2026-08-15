import crypto from 'node:crypto'

export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'contenido'
}

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function normalizeInlineHtml(value) {
  return String(value || '')
    .replace(/<\/?(?:strong|b)\s*>/gi, '**')
    .replace(/<\/?(?:em|i)\s*>/gi, '*')
    .replace(/<br\s*\/?>/gi, '\n')
}

function nextToken(text, start) {
  const patterns = [
    ['image', /!\[([^\]]*)\]\(([^)]+)\)/g],
    ['link', /\[([^\]]+)\]\(([^)]+)\)/g],
    ['strong', /\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/g],
    ['strong', /__([^_]+(?:_(?!_)[^_]*)*)__/g],
    ['strike', /~~([^~]+)~~/g],
    ['code', /`([^`]+)`/g],
    ['math', /\$([^$\n]+)\$/g],
    ['em', /\*([^*\n]+)\*/g],
    ['em', /_([^_\n]+)_/g],
  ]
  let best = null
  for (const [kind, regex] of patterns) {
    regex.lastIndex = start
    const match = regex.exec(text)
    if (!match) continue
    if (!best || match.index < best.match.index || (match.index === best.match.index && match[0].length > best.match[0].length)) {
      best = { kind, match }
    }
  }
  return best
}

function parseDestination(raw) {
  const value = String(raw || '').trim()
  const match = value.match(/^(\S+)(?:\s+["']([^"']*)["'])?$/)
  return match ? { href: match[1], title: match[2] || null } : { href: value, title: null }
}

export function parseInlineMarkdown(value) {
  const text = decodeEntities(normalizeInlineHtml(value))
  const nodes = []
  let cursor = 0
  while (cursor < text.length) {
    const token = nextToken(text, cursor)
    if (!token) {
      nodes.push({ type: 'text', text: text.slice(cursor) })
      break
    }
    if (token.match.index > cursor) nodes.push({ type: 'text', text: text.slice(cursor, token.match.index) })
    const [raw, first, second] = token.match
    if (token.kind === 'link') {
      const destination = parseDestination(second)
      nodes.push({ type: 'link', href: destination.href, title: destination.title, children: parseInlineMarkdown(first) })
    } else if (token.kind === 'image') {
      const destination = parseDestination(second)
      nodes.push({ type: 'inline_image', src: destination.href, alt: first || '', title: destination.title })
    } else if (token.kind === 'strong') nodes.push({ type: 'strong', children: parseInlineMarkdown(first) })
    else if (token.kind === 'em') nodes.push({ type: 'emphasis', children: parseInlineMarkdown(first) })
    else if (token.kind === 'strike') nodes.push({ type: 'strikethrough', children: parseInlineMarkdown(first) })
    else if (token.kind === 'code') nodes.push({ type: 'inline_code', text: first })
    else if (token.kind === 'math') nodes.push({ type: 'inline_equation', expression: first })
    else nodes.push({ type: 'text', text: raw })
    cursor = token.match.index + raw.length
  }
  return nodes.filter((node) => node.type !== 'text' || node.text.length > 0)
}

export function inlinePlainText(nodes) {
  return (nodes || []).map((node) => {
    if (node.type === 'text' || node.type === 'inline_code') return node.text || ''
    if (node.type === 'inline_equation') return node.expression || ''
    if (node.type === 'inline_image') return node.alt || ''
    return node.children ? inlinePlainText(node.children) : ''
  }).join('')
}

function splitTableRow(line) {
  let value = String(line || '').trim()
  if (value.startsWith('|')) value = value.slice(1)
  if (value.endsWith('|')) value = value.slice(0, -1)
  const cells = []
  let current = ''
  let escaped = false
  for (const char of value) {
    if (escaped) {
      current += char
      escaped = false
    } else if (char === '\\') {
      current += char
      escaped = true
    } else if (char === '|') {
      cells.push(current.trim())
      current = ''
    } else current += char
  }
  cells.push(current.trim())
  return cells
}

function isTableSeparator(line) {
  const cells = splitTableRow(line)
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
}

function readListLine(line) {
  const match = String(line || '').match(/^(\s*)([-+*]|\d+\.)\s+(.+)$/)
  if (!match) return null
  return { indent: match[1].replace(/\t/g, '    ').length, ordered: /^\d+\.$/.test(match[2]), text: match[3] }
}

function parseList(lines, startIndex) {
  const first = readListLine(lines[startIndex])
  const baseIndent = first.indent
  const ordered = first.ordered
  const items = []
  let index = startIndex
  while (index < lines.length) {
    const current = readListLine(lines[index])
    if (!current || current.indent < baseIndent) break
    if (current.indent > baseIndent) {
      if (!items.length) break
      const nested = parseList(lines, index)
      items.at(-1).children.push(nested.block)
      index = nested.nextIndex
      continue
    }
    if (current.ordered !== ordered) break
    const checkbox = current.text.match(/^\[([ xX])\]\s+(.*)$/)
    items.push({
      type: 'list_item',
      checked: checkbox ? checkbox[1].toLowerCase() === 'x' : null,
      children: [{ type: 'paragraph', children: parseInlineMarkdown(checkbox ? checkbox[2] : current.text) }],
    })
    index += 1
  }
  return { block: { type: 'list', ordered, items }, nextIndex: index }
}

export function blockPlainText(block) {
  if (!block) return ''
  if (block.children && ['paragraph', 'heading', 'table_cell'].includes(block.type)) return inlinePlainText(block.children)
  if (block.type === 'equation') return block.expression || ''
  if (block.type === 'code') return block.value || ''
  if (block.type === 'image') return [block.alt, block.caption].filter(Boolean).join(' ')
  if (block.type === 'table') return block.rows.flatMap((row) => row.cells.map((cell) => inlinePlainText(cell.children))).join(' ')
  if (block.type === 'list') return block.items.flatMap((item) => item.children.map(blockPlainText)).join(' ')
  if (block.blocks) return block.blocks.map(blockPlainText).join(' ')
  if (block.type === 'unsupported') return block.text || ''
  return ''
}

function anchorFor(sourceId, index, text) {
  return `h-${crypto.createHash('sha256').update(`${sourceId}:${index}:${text}`).digest('hex').slice(0, 12)}`
}

export function parseNotionMarkdown(markdown, sourceId, { stripMatchingTitle = null } = {}) {
  const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n')
  const warnings = []
  const blocks = []
  const headings = []
  let index = 0
  let headingIndex = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()
    if (!trimmed) { index += 1; continue }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || null
      const body = []
      index += 1
      while (index < lines.length && !lines[index].trim().startsWith('```')) body.push(lines[index++])
      if (index < lines.length) index += 1
      else warnings.push({ code: 'UNCLOSED_CODE_FENCE', message: 'Se encontró un bloque de código sin cierre.' })
      blocks.push({ type: 'code', language, value: body.join('\n') })
      continue
    }

    if (/^<aside(?:\s[^>]*)?>\s*$/i.test(trimmed)) {
      const body = []
      index += 1
      while (index < lines.length && !/^<\/aside>\s*$/i.test(lines[index].trim())) body.push(lines[index++])
      if (index < lines.length) index += 1
      else warnings.push({ code: 'UNCLOSED_CALLOUT', message: 'Se encontró un callout de Notion sin cierre.' })
      const inner = parseNotionMarkdown(body.join('\n'), sourceId)
      warnings.push(...inner.warnings)
      blocks.push({ type: 'callout', blocks: inner.blocks })
      continue
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const children = parseInlineMarkdown(headingMatch[2])
      const text = inlinePlainText(children).trim()
      const anchor = anchorFor(sourceId, headingIndex++, text)
      const strip = level === 1 && stripMatchingTitle && slugify(text) === slugify(stripMatchingTitle) && blocks.length === 0
      if (!strip) {
        blocks.push({ type: 'heading', level, anchor, children })
        headings.push({ level, anchor, text })
      }
      index += 1
      continue
    }

    if (trimmed === '$$' || /^\$\$.+\$\$$/.test(trimmed)) {
      let expression
      if (trimmed === '$$') {
        const body = []
        index += 1
        while (index < lines.length && lines[index].trim() !== '$$') body.push(lines[index++])
        if (index < lines.length) index += 1
        else warnings.push({ code: 'UNCLOSED_EQUATION', message: 'Se encontró una ecuación de bloque sin cierre.' })
        expression = body.join('\n').trim()
      } else {
        expression = trimmed.slice(2, -2).trim()
        index += 1
      }
      blocks.push({ type: 'equation', expression })
      continue
    }

    if (/^(?:-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { blocks.push({ type: 'divider' }); index += 1; continue }

    const imageOnly = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
    if (imageOnly) {
      const destination = parseDestination(imageOnly[2])
      blocks.push({ type: 'image', src: destination.href, alt: imageOnly[1] || '', caption: destination.title })
      index += 1
      continue
    }

    if (index + 1 < lines.length && line.includes('|') && isTableSeparator(lines[index + 1])) {
      const rows = [{ header: true, cells: splitTableRow(line).map((cell) => ({ type: 'table_cell', children: parseInlineMarkdown(cell) })) }]
      index += 2
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        rows.push({ header: false, cells: splitTableRow(lines[index]).map((cell) => ({ type: 'table_cell', children: parseInlineMarkdown(cell) })) })
        index += 1
      }
      blocks.push({ type: 'table', rows })
      continue
    }

    if (readListLine(line)) {
      const parsed = parseList(lines, index)
      blocks.push(parsed.block)
      index = parsed.nextIndex
      continue
    }

    if (/^>\s?/.test(line)) {
      const quoted = []
      while (index < lines.length && /^>\s?/.test(lines[index])) quoted.push(lines[index++].replace(/^>\s?/, ''))
      const inner = parseNotionMarkdown(quoted.join('\n'), sourceId)
      warnings.push(...inner.warnings)
      blocks.push({ type: 'blockquote', blocks: inner.blocks })
      continue
    }

    if (/^<(?:strong|b|em|i)>/i.test(trimmed)) {
      blocks.push({ type: 'paragraph', children: parseInlineMarkdown(trimmed) })
      index += 1
      continue
    }

    if (/^<[^>]+>/.test(trimmed)) {
      const raw = []
      while (index < lines.length && lines[index].trim()) raw.push(lines[index++])
      const text = decodeEntities(raw.join(' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
      warnings.push({ code: 'UNSUPPORTED_HTML', message: 'Se preservó texto de un bloque HTML no reconocido; el Markdown original permanece intacto.' })
      blocks.push({ type: 'unsupported', source: 'html', text })
      continue
    }

    const paragraph = []
    while (index < lines.length) {
      const candidate = lines[index]
      const t = candidate.trim()
      if (!t) break
      if (paragraph.length && (/^(#{1,6})\s+/.test(candidate) || t.startsWith('```') || /^<aside/i.test(t) || readListLine(candidate) || /^>\s?/.test(candidate) || t === '$$')) break
      if (paragraph.length && index + 1 < lines.length && candidate.includes('|') && isTableSeparator(lines[index + 1])) break
      paragraph.push(t)
      index += 1
    }
    blocks.push({ type: 'paragraph', children: parseInlineMarkdown(paragraph.join(' ')) })
  }

  return { blocks, headings, warnings }
}
