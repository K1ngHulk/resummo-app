import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

function parseArticleBody(body) {
  return body
    .split('## ')
    .map((section) => section.trim())
    .filter(Boolean)
    .map((section, index) => {
      const [title, ...contentParts] = section.split('\n')
      return {
        id: `${index + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        title: title.trim(),
        body: contentParts.join('\n').trim(),
      }
    })
}

router.get('/:slug', requireAuth, async (request, response, next) => {
  try {
    const article = await prisma.article.findUnique({
      where: { slug: request.params.slug, status: 'PUBLISHED' },
      include: {
        topic: true,
        progresses: {
          where: { userId: request.user.id },
          take: 1,
        },
      },
    })

    if (!article) {
      const error = new Error('Articulo no encontrado')
      error.statusCode = 404
      throw error
    }

    const relatedArticles = await prisma.article.findMany({
      where: {
        topicId: article.topicId,
        NOT: { id: article.id },
        status: 'PUBLISHED',
      },
      orderBy: { createdAt: 'asc' },
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        tags: true,
      },
    })

    const relatedQuestionCount = await prisma.question.count({
      where: { articleId: article.id, status: 'PUBLISHED' },
    })

    response.json({
      article: {
        id: article.id,
        slug: article.slug,
        title: article.title,
        summary: article.summary,
        topic: {
          slug: article.topic.slug,
          title: article.topic.title,
        },
        readTimeMinutes: article.readTimeMinutes,
        tags: article.tags,
        sections: parseArticleBody(article.body),
        progress: article.progresses[0] || null,
        relatedArticles,
        relatedQuestionCount,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:slug/progress', requireAuth, async (request, response, next) => {
  try {
    const parsed = z.object({
      status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']),
      progressPercent: z.number().int().min(0).max(100).default(0),
    }).parse(request.body)

    const article = await prisma.article.findUnique({ where: { slug: request.params.slug, status: 'PUBLISHED' } })

    if (!article) {
      const error = new Error('Articulo no encontrado')
      error.statusCode = 404
      throw error
    }

    const progress = await prisma.userArticleProgress.upsert({
      where: {
        userId_articleId: {
          userId: request.user.id,
          articleId: article.id,
        },
      },
      update: {
        status: parsed.status,
        progressPercent: parsed.progressPercent,
        lastViewedAt: new Date(),
        completedAt: parsed.status === 'COMPLETED' ? new Date() : null,
      },
      create: {
        userId: request.user.id,
        articleId: article.id,
        status: parsed.status,
        progressPercent: parsed.progressPercent,
        lastViewedAt: new Date(),
        completedAt: parsed.status === 'COMPLETED' ? new Date() : null,
      },
    })

    await prisma.recentActivity.create({
      data: {
        userId: request.user.id,
        articleId: article.id,
        type: 'ARTICLE_VIEWED',
        title: article.title,
        path: `/learning/library/article?slug=${article.slug}`,
      },
    })

    response.json({ progress })
  } catch (error) {
    next(error)
  }
})

export default router
