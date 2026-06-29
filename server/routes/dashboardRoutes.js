import express from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const articleProgresses = await prisma.userArticleProgress.findMany({
      where: { userId: request.user.id },
      include: {
        article: {
          include: {
            topic: true,
          },
        },
      },
      orderBy: { lastViewedAt: 'desc' },
      take: 1,
    })

    const activeSession = await prisma.studySession.findFirst({
      where: {
        userId: request.user.id,
        status: 'ACTIVE',
      },
      include: {
        topic: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const recentArticles = await prisma.userArticleProgress.findMany({
      where: { userId: request.user.id },
      include: {
        article: true,
      },
      orderBy: { lastViewedAt: 'desc' },
      take: 4,
    })

    const answers = await prisma.studyAnswer.findMany({
      where: { session: { userId: request.user.id } },
    })

    const totalAnswered = answers.length
    const correctCount = answers.filter((answer) => answer.isCorrect && !answer.usedHint).length
    const hintedCorrectCount = answers.filter((answer) => answer.isCorrect && answer.usedHint).length
    const incorrectCount = answers.filter((answer) => !answer.isCorrect).length
    const score = totalAnswered === 0
      ? 0
      : Math.round(((correctCount + hintedCorrectCount) / totalAnswered) * 100)

    response.json({
      continueLearning: articleProgresses[0]
        ? {
            title: articleProgresses[0].article.title,
            topic: articleProgresses[0].article.topic.title,
            progress: articleProgresses[0].progressPercent,
            updatedAt: articleProgresses[0].lastViewedAt,
            path: `/learning/library/article?slug=${articleProgresses[0].article.slug}`,
          }
        : null,
      questionSession: activeSession
        ? {
            id: activeSession.id,
            title: activeSession.topic.title,
            answered: activeSession.currentQuestionIndex,
            total: activeSession.totalQuestions,
            path: `/learning/qbank/session?id=${activeSession.id}`,
          }
        : null,
      recentArticles: recentArticles.map((item) => ({
        id: item.article.id,
        title: item.article.title,
        path: `/learning/library/article?slug=${item.article.slug}`,
      })),
      progress: {
        totalAnswered,
        correctCount,
        hintedCorrectCount,
        incorrectCount,
        score,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
