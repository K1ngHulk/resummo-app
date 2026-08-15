import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'
import {
  getArticleEditorialMetadata,
  mapArticlePreviewToCreateData,
  validateArticleMarkdownDocument,
} from '../lib/articleMarkdownImport.js'
import { fetchNotionPagePreview } from '../lib/notionImportService.js'
import {
  buildNotionExportPreview,
  importNotionExportBuffer,
} from '../lib/notionExportImportService.js'
import { getLocalDatabaseTarget } from '../lib/localEditorialReset.js'

const router = express.Router()

const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

function validationError(message) {
  const error = new Error(message)
  error.statusCode = 400
  return error
}

const pendingEditorialContentPattern = /\[FALTA CITA\]|\b(?:TODO|PENDIENTE|placeholder|mock)\b/i

function hasArticleSection(article) {
  const structuredHeadings = Array.isArray(article.contentJson?.headings) ? article.contentJson.headings : []
  return structuredHeadings.some((heading) => Number(heading?.level) >= 2)
    || /^#{2,6}\s+\S.*$/m.test(article.body || '')
}

function hasCurrentEditorialApproval(article) {
  if (article.sourceType !== 'NOTION_EXPORT') return true
  return Boolean(
    article.editorialApprovedAt
    && article.editorialApprovedByUserId
    && article.editorialApprovedSnapshotHash
    && article.sourceSnapshotHash
    && article.editorialApprovedSnapshotHash === article.sourceSnapshotHash,
  )
}

export function getArticlePublicationIssues(article, topic) {
  const issues = []
  if (!article.title?.trim()) issues.push('falta el titulo')
  if (!article.summary?.trim()) issues.push('falta el resumen')
  if (!article.body?.trim()) issues.push('falta el cuerpo')
  if (!hasArticleSection(article)) issues.push('falta al menos una seccion estructurada')
  if (!Number.isInteger(article.readTimeMinutes) || article.readTimeMinutes <= 0) issues.push('el tiempo de lectura no es valido')
  if (pendingEditorialContentPattern.test(article.body || '')) issues.push('el cuerpo contiene citas o pendientes editoriales')
  if (!hasCurrentEditorialApproval(article)) {
    issues.push('el articulo importado desde Notion requiere aprobacion editorial explicita para el snapshot actual antes de publicar')
  }

  const hasFrontmatter = String(article.body || '').trimStart().startsWith('---')
  if (hasFrontmatter) {
    const editorial = getArticleEditorialMetadata(article.body)
    if (!editorial) {
      issues.push('la metadata editorial del Markdown no es valida')
    } else {
      if (editorial.educationalOnly !== true) issues.push('el contenido no esta marcado como educativo')
      if (editorial.reviewStatus !== 'APPROVED') issues.push('la revision editorial no esta aprobada')
      if (!editorial.reviewer?.trim()) issues.push('falta el revisor responsable')
      if (!editorial.lastReviewed) issues.push('falta la fecha de revision')
      if (!editorial.evidenceCutoff) issues.push('falta la fecha de corte de evidencia')
    }
  }

  if (topic?.status !== 'PUBLISHED') issues.push('el tema asociado no esta publicado')
  return issues
}

function getQuestionPublicationIssues(question, topic, article, options = []) {
  const issues = []

  if (!question.prompt?.trim()) issues.push('falta el enunciado')
  if (!question.explanation?.trim()) issues.push('falta la explicacion')
  if (!Number.isInteger(question.difficulty) || question.difficulty < 1 || question.difficulty > 5) {
    issues.push('la dificultad debe ser un entero entre 1 y 5')
  }
  if (options.length < 2) issues.push('se requieren al menos 2 opciones')
  if (options.length > 5) issues.push('se permiten como maximo 5 opciones')
  if (options.some((option) => !option.text?.trim())) issues.push('todas las opciones deben tener texto')
  if (options.filter((option) => option.isCorrect).length !== 1) issues.push('debe haber exactamente 1 opcion correcta')

  if (!topic) {
    issues.push('el tema asociado no existe')
  } else if (topic.status !== 'PUBLISHED') {
    issues.push('el tema asociado no esta publicado')
  }

  if (question.articleId) {
    if (!article) {
      issues.push('el articulo asociado no existe')
    } else {
      if (article.topicId !== question.topicId) issues.push('el articulo asociado no pertenece al mismo tema')
      if (article.status !== 'PUBLISHED') issues.push('el articulo asociado no esta publicado')
    }
  }

  const pendingFields = []
  if (pendingEditorialContentPattern.test(question.prompt || '')) pendingFields.push('el enunciado')
  if (pendingEditorialContentPattern.test(question.explanation || '')) pendingFields.push('la explicacion')
  if (pendingEditorialContentPattern.test(question.hint || '')) pendingFields.push('la pista')
  if (options.some((option) => pendingEditorialContentPattern.test(option.text || ''))) pendingFields.push('las opciones')
  if (pendingFields.length > 0) issues.push(`${pendingFields.join(', ')} contienen pendientes editoriales`)

  return issues
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
        topic: { select: { title: true, slug: true, status: true } },
        readTimeMinutes: true,
        tags: true,
        sourceType: true,
        sourceSnapshotHash: true,
        editorialApprovedAt: true,
        editorialApprovedByUserId: true,
        editorialApprovedSnapshotHash: true,
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

router.post('/articles/bulk-action', async (request, response, next) => {
  try {
    const schema = z.object({
      articleIds: z.array(z.string().trim().min(1)).min(1).max(500),
      action: z.enum(['APPROVE', 'PUBLISH']),
    })
    const result = schema.safeParse(request.body)
    if (!result.success) throw validationError('Seleccion de articulos invalida')

    const articleIds = [...new Set(result.data.articleIds)]
    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { topic: true },
    })
    if (articles.length !== articleIds.length) {
      throw validationError('Uno o mas articulos seleccionados ya no existen. Recarga la lista e intenta nuevamente.')
    }

    if (result.data.action === 'APPROVE') {
      const invalidImports = articles.filter((article) => (
        article.sourceType === 'NOTION_EXPORT'
        && (!article.sourceSnapshotHash || !Array.isArray(article.contentJson?.blocks) || article.contentJson.blocks.length === 0)
      ))
      if (invalidImports.length > 0) {
        throw validationError(`No se puede aprobar la seleccion: ${invalidImports.length} articulo(s) importado(s) no tienen un snapshot estructurado valido.`)
      }

      const importedArticles = articles.filter((article) => article.sourceType === 'NOTION_EXPORT')
      const approvedAt = new Date()
      if (importedArticles.length > 0) {
        await prisma.$transaction(importedArticles.map((article) => prisma.article.update({
          where: { id: article.id },
          data: {
            editorialApprovedAt: approvedAt,
            editorialApprovedByUserId: request.user.id,
            editorialApprovedSnapshotHash: article.sourceSnapshotHash,
          },
        })))
      }

      response.json({
        action: 'APPROVE',
        selected: articles.length,
        approved: importedArticles.length,
        alreadyApprovalFree: articles.length - importedArticles.length,
      })
      return
    }

    const blocked = articles.map((article) => ({
      article,
      issues: getArticlePublicationIssues(article, { ...article.topic, status: 'PUBLISHED' }),
    })).filter((item) => item.issues.length > 0)

    if (blocked.length > 0) {
      const sample = blocked.slice(0, 5).map((item) => `${item.article.title}: ${item.issues[0]}`).join(' | ')
      throw validationError(`No se puede publicar la seleccion: ${blocked.length} articulo(s) requieren revision. ${sample}`)
    }

    const topicIds = [...new Set(articles.map((article) => article.topicId))]
    const publication = await prisma.$transaction(async (transaction) => {
      await transaction.topic.updateMany({
        where: { id: { in: topicIds } },
        data: { status: 'PUBLISHED' },
      })

      let published = 0
      for (const article of articles) {
        if (article.sourceType === 'NOTION_EXPORT') {
          const update = await transaction.article.updateMany({
            where: {
              id: article.id,
              sourceSnapshotHash: article.sourceSnapshotHash,
              editorialApprovedAt: { not: null },
              editorialApprovedByUserId: { not: null },
              editorialApprovedSnapshotHash: article.sourceSnapshotHash,
            },
            data: { status: 'PUBLISHED' },
          })
          if (update.count !== 1) {
            const error = new Error('La seleccion cambio durante la publicacion. Recarga la lista y vuelve a intentarlo.')
            error.statusCode = 409
            throw error
          }
        } else {
          await transaction.article.update({
            where: { id: article.id },
            data: { status: 'PUBLISHED' },
          })
        }
        published += 1
      }

      return { published }
    }, { isolationLevel: 'Serializable', timeout: 30000 })

    response.json({
      action: 'PUBLISH',
      selected: articles.length,
      published: publication.published,
      topicsPublished: topicIds.length,
    })
  } catch (error) {
    next(error)
  }
})

router.get('/articles/:id', async (request, response, next) => {
  try {
    const article = await prisma.article.findUnique({
      where: { id: request.params.id },
      include: {
        topic: { select: { id: true, title: true, slug: true, status: true } },
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

router.post('/articles/:id/editorial-approval', async (request, response, next) => {
  try {
    const schema = z.object({ approved: z.boolean().default(true) })
    const result = schema.safeParse(request.body ?? {})
    if (!result.success) throw validationError('Payload invalido')

    const article = await prisma.article.findUnique({ where: { id: request.params.id } })
    if (!article) {
      const error = new Error('Articulo no encontrado')
      error.statusCode = 404
      throw error
    }
    if (article.sourceType !== 'NOTION_EXPORT') {
      throw validationError('La aprobacion estructurada solo aplica a articulos importados desde Notion')
    }
    if (!article.sourceSnapshotHash || !Array.isArray(article.contentJson?.blocks) || article.contentJson.blocks.length === 0) {
      throw validationError('El articulo importado no tiene un snapshot estructurado valido para aprobar')
    }

    const approved = result.data.approved
    const updated = await prisma.article.update({
      where: { id: article.id },
      data: approved
        ? {
            editorialApprovedAt: new Date(),
            editorialApprovedByUserId: request.user.id,
            editorialApprovedSnapshotHash: article.sourceSnapshotHash,
          }
        : {
            editorialApprovedAt: null,
            editorialApprovedByUserId: null,
            editorialApprovedSnapshotHash: null,
            ...(article.status === 'PUBLISHED' ? { status: 'DRAFT' } : {}),
          },
      select: {
        id: true,
        status: true,
        editorialApprovedAt: true,
        editorialApprovedByUserId: true,
        editorialApprovedSnapshotHash: true,
        sourceSnapshotHash: true,
      },
    })

    response.json({
      approval: {
        approved: hasCurrentEditorialApproval({ ...article, ...updated }),
        approvedAt: updated.editorialApprovedAt,
        approvedByUserId: updated.editorialApprovedByUserId,
        snapshotHash: updated.editorialApprovedSnapshotHash,
        articleStatus: updated.status,
      },
    })
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

    if (existingArticle.contentJson && parsed.body !== undefined && parsed.body !== existingArticle.body) {
      throw validationError('El Markdown fuente de un articulo estructurado es de solo lectura en esta fase; edita metadata o reimporta la fuente para evitar desincronizar contentJson.')
    }

    const finalTopic = await prisma.topic.findUnique({
      where: { id: parsed.topicId || existingArticle.topicId },
    })
    if (!finalTopic) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    if (parsed.slug && parsed.slug !== existingArticle.slug) {
      const existingSlug = await prisma.article.findUnique({ where: { slug: parsed.slug } })
      if (existingSlug) {
        const error = new Error('Ya existe un articulo con este slug')
        error.statusCode = 409
        throw error
      }
    }

    const finalArticle = { ...existingArticle, ...parsed }
    const finalStatus = parsed.status || existingArticle.status
    if (finalStatus === 'PUBLISHED') {
      const publicationIssues = getArticlePublicationIssues(finalArticle, finalTopic)
      if (publicationIssues.length > 0) {
        throw validationError(`No se puede publicar el articulo: ${publicationIssues.join('; ')}`)
      }
    }

    let article
    if (parsed.status === 'PUBLISHED' && existingArticle.sourceType === 'NOTION_EXPORT') {
      const publicationUpdate = await prisma.article.updateMany({
        where: {
          id: request.params.id,
          sourceSnapshotHash: existingArticle.sourceSnapshotHash,
          editorialApprovedAt: { not: null },
          editorialApprovedByUserId: { not: null },
          editorialApprovedSnapshotHash: existingArticle.sourceSnapshotHash,
        },
        data: parsed,
      })
      if (publicationUpdate.count !== 1) {
        const error = new Error('El articulo cambió durante la revisión editorial. Recarga el contenido y vuelve a validar el snapshot antes de publicar.')
        error.statusCode = 409
        throw error
      }
      article = await prisma.article.findUnique({ where: { id: request.params.id } })
    } else {
      article = await prisma.article.update({
        where: { id: request.params.id },
        data: parsed,
      })
    }

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
        topic: { select: { title: true, slug: true, status: true } },
        article: { select: { title: true, slug: true, status: true } },
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
        topic: { select: { id: true, title: true, slug: true, status: true } },
        article: { select: { id: true, title: true, slug: true, topicId: true, status: true } },
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

    const existingQuestion = await prisma.question.findUnique({
      where: { id: request.params.id },
      include: { options: { orderBy: { order: 'asc' } } },
    })
    if (!existingQuestion) {
      const error = new Error('Pregunta no encontrada')
      error.statusCode = 404
      throw error
    }

    const finalTopicId = parsed.topicId || existingQuestion.topicId
    const finalTopic = await prisma.topic.findUnique({ where: { id: finalTopicId } })
    if (!finalTopic) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    const finalArticleId = parsed.articleId === undefined ? existingQuestion.articleId : parsed.articleId
    let finalArticle = null
    if (finalArticleId) {
      finalArticle = await prisma.article.findUnique({ where: { id: finalArticleId } })
      if (!finalArticle) {
        const error = new Error('Articulo no encontrado')
        error.statusCode = 404
        throw error
      }
      if (finalArticle.topicId !== finalTopicId) {
        throw validationError('El articulo no pertenece al tema indicado')
      }
    }

    const finalQuestion = {
      ...existingQuestion,
      ...parsed,
      topicId: finalTopicId,
      articleId: finalArticleId,
    }
    const finalStatus = parsed.status || existingQuestion.status
    if (finalStatus === 'PUBLISHED') {
      const publicationIssues = getQuestionPublicationIssues(
        finalQuestion,
        finalTopic,
        finalArticle,
        existingQuestion.options,
      )
      if (publicationIssues.length > 0) {
        throw validationError(`No se puede publicar la pregunta: ${publicationIssues.join('; ')}`)
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

function toPublicNotionImportPreview(preview) {
  const unsupported = preview.warnings.filter((warning) => warning.code === 'UNSUPPORTED_NOTION_BLOCK')

  return {
    status: 'VALID',
    source: {
      title: preview.page.title,
      url: preview.page.url,
      lastEditedAt: preview.page.lastEditedAt,
    },
    stats: {
      blockCount: preview.blockCount,
      headingCount: preview.document.headings.length,
      childPageCount: preview.childPages.length,
      assetCount: preview.assets.length,
      unsupportedCount: unsupported.length,
      searchChunkCount: preview.searchChunks.length,
    },
    childPages: preview.childPages.map((page) => ({
      pageId: page.pageId,
      title: page.title,
    })),
    warnings: preview.warnings.map((warning) => warning.message),
    unsupported: unsupported.map((warning) => ({
      blockType: warning.blockType,
      message: warning.message,
    })),
    document: preview.document,
    assets: preview.assets.map((asset) => ({
      assetKey: asset.assetKey,
      kind: asset.kind,
      sourceType: asset.sourceType,
      previewUrl: asset.transientUrl,
      expiresAt: asset.expiresAt,
      captionText: asset.captionText,
      requiresControlledCopy: asset.requiresControlledCopy,
    })),
    internalLinks: preview.internalLinks,
  }
}

router.post('/import/notion/preview', async (request, response, next) => {
  try {
    const schema = z.object({
      url: z.string().trim().min(1).max(2048),
    })
    const result = schema.safeParse(request.body)
    if (!result.success) {
      throw validationError('Pega una URL de Notion válida')
    }

    const preview = await fetchNotionPagePreview({
      pageUrl: result.data.url,
      token: process.env.NOTION_API_TOKEN,
    })

    response.json(toPublicNotionImportPreview(preview))
  } catch (error) {
    next(error)
  }
})

const notionExportBody = express.raw({ type: () => true, limit: '180mb' })

function notionArchiveName(request) {
  const raw = String(request.headers['x-resummo-file-name'] || 'notion-export.zip')
  const safe = [...raw]
    .map((character) => (character === '/' || character === '\\' || character.charCodeAt(0) < 32 ? '_' : character))
    .join('')
    .trim()
    .slice(0, 180)
  return safe || 'notion-export.zip'
}

function requireZipBody(request) {
  if (!Buffer.isBuffer(request.body) || request.body.length === 0) {
    throw validationError('Selecciona el ZIP original exportado desde Notion.')
  }
  return request.body
}

export function assertNotionExportImportAllowed({ replaceEditorial = false, databaseUrl = process.env.DATABASE_URL } = {}) {
  if (replaceEditorial) getLocalDatabaseTarget(databaseUrl)
}

router.post('/import/notion-export/preview', notionExportBody, async (request, response, next) => {
  try {
    const { preview } = await buildNotionExportPreview(requireZipBody(request), {
      archiveName: notionArchiveName(request),
      client: prisma,
    })
    response.json(preview)
  } catch (error) {
    next(error)
  }
})

router.post('/import/notion-export/confirm', notionExportBody, async (request, response, next) => {
  try {
    const replaceEditorial = String(request.headers['x-resummo-replace-editorial'] || '').toLowerCase() === 'true'
    assertNotionExportImportAllowed({ replaceEditorial })
    const result = await importNotionExportBuffer(requireZipBody(request), {
      archiveName: notionArchiveName(request),
      client: prisma,
      replaceEditorial,
    })
    response.status(201).json({
      ...result,
      message: 'Export de Notion importado como borrador. Ningún Topic ni Article fue publicado automáticamente.',
    })
  } catch (error) {
    next(error)
  }
})

async function loadArticleImportReferenceData() {
  const [topics, existingArticles] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, slug: true, title: true } }),
    prisma.article.findMany({ select: { id: true, slug: true } }),
  ])

  return { topics, existingArticles }
}

function toPublicArticleImportPreview(preview) {
  return {
    status: preview.status,
    errors: preview.errors,
    warnings: preview.warnings,
    duplicate: preview.duplicate,
    article: preview.article
      ? {
          topicTitle: preview.article.topicTitle,
          slug: preview.article.slug,
          title: preview.article.title,
          summary: preview.article.summary,
          readTimeMinutes: preview.article.readTimeMinutes,
          tags: preview.article.tags,
          status: preview.article.status,
          editorial: preview.article.editorial,
        }
      : null,
  }
}

router.post('/import/articles/preview', async (request, response, next) => {
  try {
    const { format, content } = request.body ?? {}
    if (format !== 'markdown') {
      throw validationError('Solo se soporta formato Markdown en esta fase')
    }

    const referenceData = await loadArticleImportReferenceData()
    const preview = validateArticleMarkdownDocument(content, referenceData)
    response.json(toPublicArticleImportPreview(preview))
  } catch (error) {
    next(error)
  }
})

router.post('/import/articles/confirm', async (request, response, next) => {
  try {
    const { format, content } = request.body ?? {}
    if (format !== 'markdown') {
      throw validationError('Solo se soporta formato Markdown en esta fase')
    }

    const referenceData = await loadArticleImportReferenceData()
    const preview = validateArticleMarkdownDocument(content, referenceData)
    if (preview.status !== 'VALID') {
      return response.status(400).json(toPublicArticleImportPreview(preview))
    }
    if (preview.duplicate) {
      return response.status(409).json(toPublicArticleImportPreview(preview))
    }

    const createData = mapArticlePreviewToCreateData(preview)
    const article = await prisma.$transaction(async (transaction) => {
      const existingArticle = await transaction.article.findUnique({
        where: { slug: createData.slug },
        select: { id: true },
      })
      if (existingArticle) {
        const error = new Error('Ya existe un artículo con este slug')
        error.statusCode = 409
        throw error
      }

      return transaction.article.create({
        data: createData,
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          topic: { select: { title: true } },
        },
      })
    }, { isolationLevel: 'Serializable' })

    response.status(201).json({
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        status: article.status,
        topicTitle: article.topic.title,
      },
      message: 'Artículo importado como borrador. Requiere revisión y publicación explícitas.',
    })
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

    // En modo Flashcard no exigimos opciones obligatorias.
    // Solo las procesamos si vinieran (por retrocompatibilidad con TSVs viejos).

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
            type: 'FLASHCARD',
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
    type: 'FLASHCARD',
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
