import express from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: request.user.id },
      include: {
        topic: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    const answers = await prisma.studyAnswer.findMany({
      where: { session: { userId: request.user.id } },
    })

    const totalAnswered = answers.length
    const correctCount = answers.filter((answer) => answer.isCorrect && !answer.usedHint).length
    const hintedCorrectCount = answers.filter((answer) => answer.isCorrect && answer.usedHint).length
    const incorrectCount = answers.filter((answer) => !answer.isCorrect).length
    const accuracy = totalAnswered === 0
      ? 0
      : Math.round(((correctCount + hintedCorrectCount) / totalAnswered) * 100)

    response.json({
      summary: {
        totalAnswered,
        correctCount,
        hintedCorrectCount,
        incorrectCount,
        accuracy,
      },
      sessions: sessions.map((session) => ({
        id: session.id,
        topicTitle: session.topic.title,
        status: session.status,
        totalQuestions: session.totalQuestions,
        answeredQuestions: session.currentQuestionIndex,
        correctCount: session.correctCount,
        incorrectCount: session.incorrectCount,
        hintedCorrectCount: session.hintedCorrectCount,
        updatedAt: session.updatedAt,
      })),
    })
  } catch (error) {
    next(error)
  }
})

export default router
