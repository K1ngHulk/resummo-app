import express from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const query = String(request.query.query || '').trim().toLowerCase()
    const topics = await prisma.topic.findMany({
      include: {
        articles: {
          orderBy: { title: 'asc' },
          include: {
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
        articleCount: topic.articles.length,
        articles: topic.articles.map((article) => ({
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          readTimeMinutes: article.readTimeMinutes,
          tags: article.tags,
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
    const topic = await prisma.topic.findUnique({
      where: { slug: request.params.slug },
      include: {
        articles: {
          orderBy: { title: 'asc' },
        },
        _count: {
          select: { questions: true },
        },
      },
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

export default router
