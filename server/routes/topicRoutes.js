import express from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

function canUseEditorialLibrary(request) {
  return request.query.view === 'editorial'
    && (request.user.role === 'EDITOR' || request.user.role === 'ADMIN')
}

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const query = String(request.query.query || '').trim().toLowerCase()
    const editorialView = canUseEditorialLibrary(request)
    const visibleStatuses = editorialView ? ['DRAFT', 'PUBLISHED'] : ['PUBLISHED']
    const topics = await prisma.topic.findMany({
      where: {
        status: { in: visibleStatuses },
        OR: [
          { articles: { some: { status: { in: visibleStatuses } } } },
          { questions: { some: { status: 'PUBLISHED' } } },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        description: true,
        color: true,
        status: true,
        sourceType: true,
        articles: {
          where: { status: { in: visibleStatuses } },
          orderBy: { title: 'asc' },
          select: {
            id: true,
            slug: true,
            title: true,
            summary: true,
            readTimeMinutes: true,
            tags: true,
            status: true,
            sourceType: true,
            progresses: {
              where: { userId: request.user.id },
              select: {
                status: true,
                progressPercent: true,
                lastViewedAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            questions: {
              where: { status: 'PUBLISHED', type: 'MULTIPLE_CHOICE' },
            },
          },
        },
      },
      orderBy: { title: 'asc' },
    })

    const filteredTopics = query
      ? topics.filter((topic) => {
          const text = [
            topic.title,
            topic.summary,
            topic.description,
            ...topic.articles.flatMap((article) => [article.title, article.summary, ...article.tags]),
          ]
            .join(' ')
            .toLowerCase()

          return text.includes(query)
        })
      : topics

    response.json({
      topics: filteredTopics.map((topic) => ({
        id: topic.id,
        slug: topic.slug,
        title: topic.title,
        summary: topic.summary,
        description: topic.description,
        color: topic.color,
        status: topic.status,
        sourceType: topic.sourceType,
        articleCount: topic.articles.length,
        availableQuestionCount: topic._count.questions,
        articles: topic.articles.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          readTimeMinutes: article.readTimeMinutes,
          tags: article.tags,
          status: article.status,
          sourceType: article.sourceType,
          progress: article.progresses[0] || null,
        })),
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:slug', requireAuth, async (request, response, next) => {
  try {
    const editorialView = canUseEditorialLibrary(request)
    const visibleStatuses = editorialView ? ['DRAFT', 'PUBLISHED'] : ['PUBLISHED']
    const topic = await prisma.topic.findUnique({
      where: { slug: request.params.slug },
      include: {
        articles: {
          where: { status: { in: visibleStatuses } },
          orderBy: { title: 'asc' },
        },
        _count: {
          select: {
            questions: {
              where: { status: 'PUBLISHED', type: 'MULTIPLE_CHOICE' },
            },
          },
        },
      },
    })

    if (!topic || !visibleStatuses.includes(topic.status) || (topic.articles.length === 0 && topic._count.questions === 0)) {
      const error = new Error('Tema no encontrado')
      error.statusCode = 404
      throw error
    }

    response.json({ topic })
  } catch (error) {
    next(error)
  }
})

export default router
