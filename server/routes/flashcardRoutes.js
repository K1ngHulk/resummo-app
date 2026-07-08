import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Obtener flashcards a estudiar de un topic
router.get('/:topicId', requireAuth, async (request, response, next) => {
  try {
    const { topicId } = request.params
    const userId = request.user.id

    // Traer todas las flashcards del topic
    const questions = await prisma.question.findMany({
      where: {
        topicId,
        type: 'FLASHCARD',
        status: 'PUBLISHED'
      },
    })

    if (questions.length === 0) {
      return response.json({ flashcards: [], completed: true })
    }

    // Traer progreso de flashcards del usuario
    const progress = await prisma.userFlashcardProgress.findMany({
      where: {
        userId,
        questionId: { in: questions.map(q => q.id) }
      }
    })

    const progressMap = new Map(progress.map(p => [p.questionId, p]))
    const now = new Date()

    // Filtrar flashcards:
    // 1. Nuevas (no están en progressMap)
    // 2. Para revisar (están en progressMap y nextReviewDate <= now)
    const toStudy = questions.filter(q => {
      const p = progressMap.get(q.id)
      if (!p) return true // Nueva
      return new Date(p.nextReviewDate) <= now // Para revisión
    })

    // Shuffle para variedad
    toStudy.sort(() => Math.random() - 0.5)

    response.json({
      flashcards: toStudy,
      completed: toStudy.length === 0
    })
  } catch (error) {
    next(error)
  }
})

// Enviar respuesta (SM-2)
router.post('/:questionId/review', requireAuth, async (request, response, next) => {
  try {
    const { questionId } = request.params
    const { difficulty } = request.body // 1 (Difícil/Again), 2 (Bien/Good), 3 (Fácil/Easy)
    const userId = request.user.id

    if (![1, 2, 3].includes(difficulty)) {
      return response.status(400).json({ message: 'Dificultad inválida' })
    }

    let progress = await prisma.userFlashcardProgress.findUnique({
      where: {
        userId_questionId: { userId, questionId }
      }
    })

    if (!progress) {
      progress = await prisma.userFlashcardProgress.create({
        data: {
          userId,
          questionId,
          easeFactor: 2.5,
          intervalDays: 0,
          consecutiveCorrect: 0,
        }
      })
    }

    let { easeFactor, intervalDays, consecutiveCorrect } = progress

    // Algoritmo simplificado basado en SM-2
    if (difficulty === 1) { // Difícil (repite pronto)
      consecutiveCorrect = 0
      intervalDays = 0 // Repetir hoy/mañana
      easeFactor = Math.max(1.3, easeFactor - 0.2)
    } else if (difficulty === 2) { // Bien
      consecutiveCorrect += 1
      if (consecutiveCorrect === 1) intervalDays = 1
      else if (consecutiveCorrect === 2) intervalDays = 6
      else intervalDays = Math.round(intervalDays * easeFactor)
    } else if (difficulty === 3) { // Fácil
      consecutiveCorrect += 1
      easeFactor = easeFactor + 0.15
      if (consecutiveCorrect === 1) intervalDays = 4
      else intervalDays = Math.round(intervalDays * easeFactor * 1.3)
    }

    const nextReviewDate = new Date()
    nextReviewDate.setDate(nextReviewDate.getDate() + intervalDays)

    const updated = await prisma.userFlashcardProgress.update({
      where: { id: progress.id },
      data: {
        easeFactor,
        intervalDays,
        consecutiveCorrect,
        nextReviewDate
      }
    })

    response.json({ success: true, nextReviewDate: updated.nextReviewDate })
  } catch (error) {
    next(error)
  }
})

export default router
