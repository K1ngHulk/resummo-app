import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = express.Router()

const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

function validationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

router.use(requireAuth)
router.use(requireRole('EDITOR', 'ADMIN'))
router.get('/topics', async (request, response, next) => {
  try {
    const topics = await prisma.topic.findMany({
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        color: true,
        status: true,
        _count: {
          select: {
            articles: true,
            questions: true,
          }
        }
      },
      orderBy: { title: 'asc' },
    })

    const topicsWithCounts = topics.map(topic => ({
      ...topic,
      counts: {
        articles: topic._count.articles,
        questions: topic._count.questions,
      }
    }))

    response.json({ topics: topicsWithCounts })
  } catch (error) {
    next(error)
  }
})

router.get('/topics/:id', async (request, response, next) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { id: request.params.id },
      include: {
        _count: {
          select: {
            articles: true,
            questions: true,
          }
        }
      }
    })

    if (!topic) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    response.json({ topic })
  } catch (error) {
    next(error)
  }
})

router.post('/topics', async (request, response, next) => {
  try {
    const schema = z.object({
      slug: z.string().trim().min(1),
      title: z.string().trim().min(1),
      summary: z.string().trim().min(1),
      description: z.string().trim().min(1),
      color: z.string().optional().nullable(),
      status: contentStatusSchema.optional().default('DRAFT'),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Payload invalido')
    }
    const parsed = result.data

    const existingSlug = await prisma.topic.findUnique({ where: { slug: parsed.slug } })
    if (existingSlug) {
      const error = new Error('Ya existe un tema con este slug')
      error.statusCode = 409
      throw error
    }

    const topic = await prisma.topic.create({
      data: {
        slug: parsed.slug,
        title: parsed.title,
        summary: parsed.summary,
        description: parsed.description,
        color: parsed.color,
        status: parsed.status,
      }
    })

    response.status(201).json({ topic })
  } catch (error) {
    next(error)
  }
})

router.patch('/topics/:id', async (request, response, next) => {
  try {
    const schema = z.object({
      slug: z.string().trim().min(1).optional(),
      title: z.string().trim().min(1).optional(),
      summary: z.string().trim().min(1).optional(),
      description: z.string().trim().min(1).optional(),
      color: z.string().optional().nullable(),
      status: contentStatusSchema.optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Payload invalido')
    }
    const parsed = result.data

    const existingTopic = await prisma.topic.findUnique({ where: { id: request.params.id } })
    if (!existingTopic) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    if (parsed.slug && parsed.slug !== existingTopic.slug) {
      const existingSlug = await prisma.topic.findUnique({ where: { slug: parsed.slug } })
      if (existingSlug) {
        const error = new Error('Ya existe un tema con este slug')
        error.statusCode = 409
        throw error
      }
    }

    const topic = await prisma.topic.update({
      where: { id: request.params.id },
      data: parsed,
    })

    response.json({ topic })
  } catch (error) {
    next(error)
  }
})

router.get('/articles', async (request, response, next) => {
  try {
    const { status, topicId, search } = request.query
    const where = {}

    if (status) {
      const parsedStatus = contentStatusSchema.safeParse(status)
      if (!parsedStatus.success) {
        throw validationError('Status invalido')
      }
      where.status = parsedStatus.data
    }

    if (topicId) {
      where.topicId = topicId
    }

    if (search) {
      const q = String(search).trim()
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ]
      }
    }

    const articles = await prisma.article.findMany({
      where,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        status: true,
        topicId: true,
        topic: { select: { title: true, slug: true } },
        readTimeMinutes: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    response.json({ articles })
  } catch (error) {
    next(error)
  }
})

router.get('/articles/:id', async (request, response, next) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: request.params.id },
      include: {
        topic: { select: { id: true, title: true, slug: true } },
      },
    })

    if (!article) {
      const error = new Error('Articulo no encontrado')
      error.statusCode = 404
      throw error
    }

    response.json({ article })
  } catch (error) {
    next(error)
  }
})

router.post('/articles', async (request, response, next) => {
  try {
    const schema = z.object({
      topicId: z.string().trim().min(1),
      slug: z.string().trim().min(1),
      title: z.string().trim().min(1),
      summary: z.string().optional().default(''),
      body: z.string().trim().min(1),
      readTimeMinutes: z.number().int().positive().optional().default(5),
      tags: z.array(z.string()).optional().default([]),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Payload invalido')
    }
    const parsed = result.data

    const topic = await prisma.topic.findUnique({ where: { id: parsed.topicId } })
    if (!topic) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    const existingSlug = await prisma.article.findUnique({ where: { slug: parsed.slug } })
    if (existingSlug) {
      const error = new Error('Ya existe un articulo con este slug')
      error.statusCode = 409
      throw error
    }

    const article = await prisma.article.create({
      data: {
        topicId: parsed.topicId,
        slug: parsed.slug,
        title: parsed.title,
        summary: parsed.summary,
        body: parsed.body,
        readTimeMinutes: parsed.readTimeMinutes,
        tags: parsed.tags,
        status: 'DRAFT',
      },
    })

    response.status(201).json({ article })
  } catch (error) {
    next(error)
  }
})

router.patch('/articles/:id', async (request, response, next) => {
  try {
    const schema = z.object({
      topicId: z.string().trim().min(1).optional(),
      slug: z.string().trim().min(1).optional(),
      title: z.string().trim().min(1).optional(),
      summary: z.string().optional(),
      body: z.string().trim().min(1).optional(),
      readTimeMinutes: z.number().int().positive().optional(),
      tags: z.array(z.string()).optional(),
      status: contentStatusSchema.optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Payload invalido')
    }
    const parsed = result.data

    const existingArticle = await prisma.article.findUnique({ where: { id: request.params.id } })
    if (!existingArticle) {
      const error = new Error('Articulo no encontrado')
      error.statusCode = 404
      throw error
    }

    if (parsed.topicId) {
      const topic = await prisma.topic.findUnique({ where: { id: parsed.topicId } })
      if (!topic) {
        const error = new Error('Tema no encontrado')
        error.statusCode = 404
        throw error
      }
    }

    if (parsed.slug && parsed.slug !== existingArticle.slug) {
      const existingSlug = await prisma.article.findUnique({ where: { slug: parsed.slug } })
      if (existingSlug) {
        const error = new Error('Ya existe un articulo con este slug')
        error.statusCode = 409
        throw error
      }
    }

    const article = await prisma.article.update({
      where: { id: request.params.id },
      data: parsed,
    })

    response.json({ article })
  } catch (error) {
    next(error)
  }
})

router.get('/questions', async (request, response, next) => {
  try {
    const { status, topicId, articleId, search } = request.query
    const where = {}

    if (status) {
      const parsedStatus = contentStatusSchema.safeParse(status)
      if (!parsedStatus.success) {
        throw validationError('Status invalido')
      }
      where.status = parsedStatus.data
    }

    if (topicId) {
      where.topicId = topicId
    }

    if (articleId) {
      where.articleId = articleId
    }

    if (search) {
      const q = String(search).trim()
      if (q) {
        where.prompt = { contains: q, mode: 'insensitive' }
      }
    }

    const questions = await prisma.question.findMany({
      where,
      select: {
        id: true,
        topicId: true,
        articleId: true,
        prompt: true,
        difficulty: true,
        status: true,
        hint: true,
        createdAt: true,
        updatedAt: true,
        topic: { select: { title: true, slug: true } },
        article: { select: { title: true, slug: true } },
        _count: { select: { options: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    response.json({ questions })
  } catch (error) {
    next(error)
  }
})

router.get('/questions/:id', async (request, response, next) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: request.params.id },
      include: {
        topic: { select: { id: true, title: true, slug: true } },
        article: { select: { id: true, title: true, slug: true } },
        options: { orderBy: { order: 'asc' } },
      },
    })

    if (!question) {
      const error = new Error('Pregunta no encontrada')
      error.statusCode = 404
      throw error
    }

    response.json({ question })
  } catch (error) {
    next(error)
  }
})

router.post('/questions', async (request, response, next) => {
  try {
    const optionSchema = z.object({
      label: z.string().trim().min(1),
      text: z.string().trim().min(1),
      isCorrect: z.boolean(),
    })

    const schema = z.object({
      topicId: z.string().trim().min(1),
      articleId: z.string().trim().min(1).optional().nullable(),
      prompt: z.string().trim().min(1),
      explanation: z.string().trim().min(1),
      difficulty: z.number().int().min(1).max(5),
      hint: z.string().trim().min(1).optional().nullable(),
      options: z.array(optionSchema).min(2).max(5),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Payload invalido')
    }
    const parsed = result.data

    const topic = await prisma.topic.findUnique({ where: { id: parsed.topicId } })
    if (!topic) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    if (parsed.articleId) {
      const article = await prisma.article.findUnique({ where: { id: parsed.articleId } })
      if (!article) {
        const error = new Error('Articulo no encontrado')
        error.statusCode = 404
        throw error
      }
      if (article.topicId !== parsed.topicId) {
        throw validationError('El articulo no pertenece al tema indicado')
      }
    }

    const correctCount = parsed.options.filter(o => o.isCorrect).length
    if (correctCount !== 1) {
      throw validationError('Debe haber exactamente 1 opcion correcta')
    }

    const labels = parsed.options.map(o => o.label)
    if (new Set(labels).size !== labels.length) {
      throw validationError('Las labels de las opciones deben ser unicas')
    }

    const question = await prisma.question.create({
      data: {
        topicId: parsed.topicId,
        articleId: parsed.articleId,
        prompt: parsed.prompt,
        explanation: parsed.explanation,
        difficulty: parsed.difficulty,
        hint: parsed.hint,
        status: 'DRAFT',
        options: {
          create: parsed.options.map((opt, idx) => ({
            label: opt.label,
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: idx,
          })),
        },
      },
      include: {
        options: { orderBy: { order: 'asc' } }
      }
    })

    response.status(201).json({ question })
  } catch (error) {
    next(error)
  }
})

router.patch('/questions/:id', async (request, response, next) => {
  try {
    if (request.body.options !== undefined) {
      throw validationError('No se permite actualizar opciones en esta fase para proteger el historial de respuestas. Archive la pregunta y cree una nueva.')
    }

    const schema = z.object({
      topicId: z.string().trim().min(1).optional(),
      articleId: z.string().trim().min(1).optional().nullable(),
      prompt: z.string().trim().min(1).optional(),
      explanation: z.string().trim().min(1).optional(),
      difficulty: z.number().int().min(1).max(5).optional(),
      hint: z.string().trim().min(1).optional().nullable(),
      status: contentStatusSchema.optional(),
    })

    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Payload invalido')
    }
    const parsed = result.data

    const existingQuestion = await prisma.question.findUnique({ where: { id: request.params.id } })
    if (!existingQuestion) {
      const error = new Error('Pregunta no encontrada')
      error.statusCode = 404
      throw error
    }

    const finalTopicId = parsed.topicId || existingQuestion.topicId

    if (parsed.topicId) {
      const topic = await prisma.topic.findUnique({ where: { id: parsed.topicId } })
      if (!topic) {
        const error = new Error('Tema no encontrado')
        error.statusCode = 404
        throw error
      }
    }

    if (parsed.articleId) {
      const article = await prisma.article.findUnique({ where: { id: parsed.articleId } })
      if (!article) {
        const error = new Error('Articulo no encontrado')
        error.statusCode = 404
        throw error
      }
      if (article.topicId !== finalTopicId) {
        throw validationError('El articulo no pertenece al tema indicado')
      }
    }

    const question = await prisma.question.update({
      where: { id: request.params.id },
      data: parsed,
    })

    response.json({ question })
  } catch (error) {
    next(error)
  }
})

const duplicateTsvWarning = 'Prompt duplicado en este mismo archivo TSV'
const duplicateDatabaseWarning = 'Este prompt ya existe en la base de datos para este topic'
const duplicateTsvConfirmError = 'Prompt duplicado en este mismo archivo TSV; solo se importa la primera fila valida'
const duplicateDatabaseConfirmError = 'Este prompt ya existe en la base de datos para este topic y no se importara'

function normalizePrompt(prompt) {
  return prompt.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es')
}

function normalizeTags(tagsValue) {
  const normalizedTags = []
  const seenTags = new Set()

  for (const tag of tagsValue.split(',')) {
    const trimmedTag = tag.trim()
    const normalizedTag = trimmedTag.toLocaleLowerCase('es')

    if (trimmedTag && !seenTags.has(normalizedTag)) {
      seenTags.add(normalizedTag)
      normalizedTags.push(trimmedTag)
    }
  }

  return normalizedTags
}

export function parseAnkiTsv(content) {
  if (typeof content !== 'string') {
    throw validationError('Content debe ser un string')
  }

  const lines = content.split(/\r?\n/)
  if (lines.length < 2) {
    throw validationError('El TSV debe tener al menos una fila de headers y una de datos')
  }

  const headers = lines[0].split('\t').map(header => header.trim())
  const rows = []

  for (let index = 1; index < lines.length; index++) {
    if (!lines[index].trim()) continue

    rows.push({
      rowIndex: index + 1,
      values: lines[index].split('\t'),
    })
  }

  return { headers, rows }
}

function getTsvColumn(headers, values, columnName) {
  const columnIndex = headers.indexOf(columnName)
  return columnIndex >= 0 ? values[columnIndex]?.trim() || '' : ''
}

async function loadAnkiReferenceData() {
  const [topics, articles, existingQuestions] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, slug: true } }),
    prisma.article.findMany({ select: { id: true, slug: true, topicId: true } }),
    prisma.question.findMany({ select: { prompt: true, topicId: true } }),
  ])

  return { topics, articles, existingQuestions }
}

export function validateAnkiRows(parsedTsv, referenceData) {
  const { headers, rows } = parsedTsv
  const { topics, articles, existingQuestions } = referenceData
  const topicsBySlug = new Map(topics.map(topic => [topic.slug, topic]))
  const articlesBySlug = new Map(articles.map(article => [article.slug, article]))
  const existingPromptKeys = new Set(
    existingQuestions.map(question => `${question.topicId}:${normalizePrompt(question.prompt)}`),
  )
  const seenPreviewPrompts = new Set()
  const seenValidPrompts = new Set()
  const stats = { totalRows: 0, validRows: 0, invalidRows: 0, warningRows: 0 }
  const items = []

  for (const row of rows) {
    stats.totalRows++
    const rowErrors = []
    const rowWarnings = []
    const confirmErrors = []
    const getColumn = (columnName) => getTsvColumn(headers, row.values, columnName)
    const topicSlug = getColumn('topicSlug')
    const articleSlug = getColumn('articleSlug')
    const prompt = getColumn('prompt')
    const explanation = getColumn('explanation')
    const correctOption = getColumn('correctOption').toUpperCase()
    const difficultyValue = getColumn('difficulty')
    const tagsValue = getColumn('tags')
    const sourceStatus = getColumn('status')

    let difficulty = 3
    if (difficultyValue) {
      if (!/^\d+$/.test(difficultyValue)) {
        rowErrors.push('difficulty debe ser un entero entre 1 y 5')
      } else {
        difficulty = Number(difficultyValue)
        if (difficulty < 1 || difficulty > 5) {
          rowErrors.push('difficulty debe ser un entero entre 1 y 5')
        }
      }
    }

    if (!topicSlug) rowErrors.push('topicSlug es requerido')
    if (!prompt) rowErrors.push('prompt es requerido')
    if (!explanation) rowErrors.push('explanation es requerido')
    if (!correctOption) rowErrors.push('correctOption es requerido')

    if (sourceStatus && sourceStatus.toUpperCase() !== 'DRAFT') {
      rowWarnings.push('La columna status se ignora; las preguntas siempre se crean como DRAFT')
    }

    const rawOptions = ['A', 'B', 'C', 'D', 'E'].map(label => ({
      label,
      text: getColumn(`option${label}`),
    }))
    const options = rawOptions
      .filter(option => option.text)
      .map((option, index) => ({
        ...option,
        isCorrect: option.label === correctOption,
        order: index,
      }))

    if (options.length < 2) {
      rowErrors.push('Se requieren al menos 2 opciones no vacias')
    } else if (options.filter(option => option.isCorrect).length !== 1) {
      rowErrors.push('correctOption debe apuntar a exactamente 1 opcion no vacia')
    }

    const topic = topicsBySlug.get(topicSlug) ?? null
    if (topicSlug && !topic) {
      rowErrors.push(`El topicSlug '${topicSlug}' no existe en la DB`)
    }

    let article = null
    if (articleSlug) {
      article = articlesBySlug.get(articleSlug) ?? null
      if (!article) {
        rowErrors.push(`El articleSlug '${articleSlug}' no existe en la DB`)
      } else if (topic && article.topicId !== topic.id) {
        rowErrors.push(`El articleSlug '${articleSlug}' no pertenece al topicSlug '${topicSlug}'`)
      }
    }

    const normalizedPrompt = prompt ? normalizePrompt(prompt) : ''
    if (normalizedPrompt) {
      if (seenPreviewPrompts.has(normalizedPrompt)) {
        rowWarnings.push(duplicateTsvWarning)
      }
      seenPreviewPrompts.add(normalizedPrompt)

      if (topic && existingPromptKeys.has(`${topic.id}:${normalizedPrompt}`)) {
        rowWarnings.push(duplicateDatabaseWarning)
      }
    }

    const status = rowErrors.length > 0 ? 'INVALID' : 'VALID'
    if (status === 'VALID') {
      stats.validRows++

      if (seenValidPrompts.has(normalizedPrompt)) {
        confirmErrors.push(duplicateTsvConfirmError)
      } else {
        seenValidPrompts.add(normalizedPrompt)
      }

      if (existingPromptKeys.has(`${topic.id}:${normalizedPrompt}`)) {
        confirmErrors.push(duplicateDatabaseConfirmError)
      }
    } else {
      stats.invalidRows++
    }

    if (rowWarnings.length > 0) stats.warningRows++

    items.push({
      rowIndex: row.rowIndex,
      status,
      question: status === 'VALID'
        ? {
            topicId: topic.id,
            topicSlug: topic.slug,
            articleId: article?.id ?? null,
            articleSlug: article?.slug ?? null,
            prompt,
            explanation,
            difficulty,
            hint: getColumn('hint') || null,
            tags: normalizeTags(tagsValue),
            status: 'DRAFT',
            options,
          }
        : null,
      errors: rowErrors,
      warnings: rowWarnings,
      confirmErrors,
    })
  }

  return { stats, items }
}

export async function buildAnkiPreview(format, content, referenceData = null) {
  if (format !== 'tsv') {
    throw validationError('Solo se soporta formato TSV en esta fase')
  }

  const parsedTsv = parseAnkiTsv(content)
  const resolvedReferenceData = referenceData ?? await loadAnkiReferenceData()
  return validateAnkiRows(parsedTsv, resolvedReferenceData)
}

export function mapValidPreviewItemToCreateData(item) {
  if (item.status !== 'VALID' || !item.question) {
    throw validationError('Solo se pueden persistir items validos')
  }

  return {
    topicId: item.question.topicId,
    articleId: item.question.articleId,
    prompt: item.question.prompt,
    explanation: item.question.explanation,
    difficulty: item.question.difficulty,
    hint: item.question.hint,
    status: 'DRAFT',
    options: {
      create: item.question.options.map((option, index) => ({
        label: option.label,
        text: option.text,
        isCorrect: option.isCorrect,
        order: index,
      })),
    },
  }
}

function toPublicPreviewItem(item) {
  return {
    rowIndex: item.rowIndex,
    status: item.status,
    question: item.question,
    errors: item.errors,
    warnings: item.warnings,
  }
}

function toSkippedItem(item, additionalErrors = []) {
  return {
    rowIndex: item.rowIndex,
    errors: [...item.errors, ...item.confirmErrors, ...additionalErrors],
    warnings: item.warnings,
  }
}

router.post('/import/anki/preview', async (request, response, next) => {
  try {
    const { format, content } = request.body ?? {}
    const preview = await buildAnkiPreview(format, content)

    response.json({
      stats: preview.stats,
      items: preview.items.map(toPublicPreviewItem),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/import/anki/confirm', async (request, response, next) => {
  try {
    const { format, content } = request.body ?? {}
    const preview = await buildAnkiPreview(format, content)
    const invalidItems = preview.items.filter(item => item.status === 'INVALID')
    const duplicateItems = preview.items.filter(
      item => item.status === 'VALID' && item.confirmErrors.length > 0,
    )
    const candidates = preview.items.filter(
      item => item.status === 'VALID' && item.confirmErrors.length === 0,
    )

    if (candidates.length === 0) {
      return response.status(400).json({
        stats: {
          totalRows: preview.stats.totalRows,
          createdRows: 0,
          skippedRows: duplicateItems.length,
          invalidRows: invalidItems.length,
        },
        createdQuestions: [],
        skippedItems: [...invalidItems, ...duplicateItems]
          .sort((left, right) => left.rowIndex - right.rowIndex)
          .map(item => toSkippedItem(item)),
      })
    }

    const transactionResult = await prisma.$transaction(async transaction => {
      const topicIds = [...new Set(candidates.map(item => item.question.topicId))]
      const currentQuestions = await transaction.question.findMany({
        where: { topicId: { in: topicIds } },
        select: { topicId: true, prompt: true },
      })
      const currentPromptKeys = new Set(
        currentQuestions.map(question => `${question.topicId}:${normalizePrompt(question.prompt)}`),
      )
      const createdQuestions = []
      const runtimeSkippedItems = []

      for (const item of candidates) {
        const promptKey = `${item.question.topicId}:${normalizePrompt(item.question.prompt)}`
        if (currentPromptKeys.has(promptKey)) {
          runtimeSkippedItems.push(toSkippedItem(item, [duplicateDatabaseConfirmError]))
          continue
        }

        const question = await transaction.question.create({
          data: mapValidPreviewItemToCreateData(item),
          include: { options: { select: { id: true } } },
        })
        currentPromptKeys.add(promptKey)
        createdQuestions.push({
          rowIndex: item.rowIndex,
          id: question.id,
          prompt: question.prompt,
          status: question.status,
          optionsCount: question.options.length,
        })
      }

      return { createdQuestions, runtimeSkippedItems }
    }, { isolationLevel: 'Serializable' })

    const skippedItems = [
      ...invalidItems.map(item => toSkippedItem(item)),
      ...duplicateItems.map(item => toSkippedItem(item)),
      ...transactionResult.runtimeSkippedItems,
    ].sort((left, right) => left.rowIndex - right.rowIndex)
    const result = {
      stats: {
        totalRows: preview.stats.totalRows,
        createdRows: transactionResult.createdQuestions.length,
        skippedRows: duplicateItems.length + transactionResult.runtimeSkippedItems.length,
        invalidRows: invalidItems.length,
      },
      createdQuestions: transactionResult.createdQuestions,
      skippedItems,
    }

    if (result.stats.createdRows === 0) {
      return response.status(400).json(result)
    }

    response.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

export default router
