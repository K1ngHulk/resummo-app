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

router.post('/import/anki/preview', async (request, response, next) => {
  try {
    const { format, content } = request.body
    if (format !== 'tsv') {
      throw validationError('Solo se soporta formato TSV en esta fase')
    }
    if (typeof content !== 'string') {
      throw validationError('Content debe ser un string')
    }

    const lines = content.split(/\r?\n/)
    if (lines.length < 2) {
      throw validationError('El TSV debe tener al menos una fila de headers y una de datos')
    }

    const headers = lines[0].split('\t').map(h => h.trim())
    const getCol = (rowArr, name) => {
      const idx = headers.indexOf(name)
      return idx >= 0 ? rowArr[idx]?.trim() || '' : ''
    }

    const topics = await prisma.topic.findMany({ select: { id: true, slug: true } })
    const articles = await prisma.article.findMany({ select: { id: true, slug: true, topicId: true } })
    const existingQuestions = await prisma.question.findMany({ select: { prompt: true, topicId: true } })

    const stats = { totalRows: 0, validRows: 0, invalidRows: 0, warningRows: 0 }
    const items = []
    const seenPrompts = new Set()

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      stats.totalRows++
      const rowArr = line.split('\t')
      const rowErrors = []
      const rowWarnings = []

      const topicSlug = getCol(rowArr, 'topicSlug')
      const articleSlug = getCol(rowArr, 'articleSlug')
      const prompt = getCol(rowArr, 'prompt')
      const explanation = getCol(rowArr, 'explanation')
      const correctOption = getCol(rowArr, 'correctOption').toUpperCase()
      const optionA = getCol(rowArr, 'optionA')
      const optionB = getCol(rowArr, 'optionB')
      const optionC = getCol(rowArr, 'optionC')
      const optionD = getCol(rowArr, 'optionD')
      const optionE = getCol(rowArr, 'optionE')
      const tagsStr = getCol(rowArr, 'tags')

      let difficulty = parseInt(getCol(rowArr, 'difficulty'), 10)
      if (isNaN(difficulty) || difficulty < 1 || difficulty > 5) {
        difficulty = 3
        if (getCol(rowArr, 'difficulty')) {
          rowErrors.push('difficulty debe ser un entero entre 1 y 5')
        }
      }

      if (!topicSlug) rowErrors.push('topicSlug es requerido')
      if (!prompt) rowErrors.push('prompt es requerido')
      if (!explanation) rowErrors.push('explanation es requerido')
      if (!correctOption) rowErrors.push('correctOption es requerido')

      const rawOptions = [
        { label: 'A', text: optionA },
        { label: 'B', text: optionB },
        { label: 'C', text: optionC },
        { label: 'D', text: optionD },
        { label: 'E', text: optionE },
      ]

      const options = rawOptions
        .filter(o => o.text)
        .map((o, idx) => ({ ...o, isCorrect: o.label === correctOption, order: idx }))

      if (options.length < 2) {
        rowErrors.push('Se requieren al menos 2 opciones no vacías')
      } else {
        const correctCount = options.filter(o => o.isCorrect).length
        if (correctCount !== 1) {
          rowErrors.push('correctOption debe apuntar a exactamente 1 opción no vacía')
        }
      }

      const topic = topics.find(t => t.slug === topicSlug)
      if (topicSlug && !topic) rowErrors.push(`El topicSlug '${topicSlug}' no existe en la DB`)

      let article = null
      if (articleSlug) {
        article = articles.find(a => a.slug === articleSlug)
        if (!article) {
          rowErrors.push(`El articleSlug '${articleSlug}' no existe en la DB`)
        } else if (topic && article.topicId !== topic.id) {
          rowErrors.push(`El articleSlug '${articleSlug}' no pertenece al topicSlug '${topicSlug}'`)
        }
      }

      if (prompt) {
        const normalizedPrompt = prompt.toLowerCase()
        if (seenPrompts.has(normalizedPrompt)) {
          rowWarnings.push('Prompt duplicado en este mismo archivo TSV')
        }
        seenPrompts.add(normalizedPrompt)

        if (topic && existingQuestions.some(q => q.topicId === topic.id && q.prompt.toLowerCase() === normalizedPrompt)) {
          rowWarnings.push('Este prompt ya existe en la base de datos para este topic')
        }
      }

      const status = rowErrors.length > 0 ? 'INVALID' : 'VALID'
      if (status === 'VALID') stats.validRows++
      else stats.invalidRows++

      if (rowWarnings.length > 0) stats.warningRows++

      let questionPayload = null
      if (status === 'VALID') {
        questionPayload = {
          topicId: topic.id,
          topicSlug: topic.slug,
          articleId: article ? article.id : null,
          articleSlug: article ? article.slug : null,
          prompt,
          explanation,
          difficulty,
          hint: getCol(rowArr, 'hint') || null,
          tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
          status: 'DRAFT',
          options
        }
      }

      items.push({
        rowIndex: i + 1,
        status,
        question: questionPayload,
        errors: rowErrors,
        warnings: rowWarnings
      })
    }

    response.json({ stats, items })
  } catch (error) {
    next(error)
  }
})

export default router
