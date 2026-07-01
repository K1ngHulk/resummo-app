import express from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = express.Router()

const createSessionSchema = z.object({
  topicSlug: z.string().trim().min(1),
  questionCount: z.number().int().min(1).max(20).default(5),
  difficulty: z.number().int().min(1).max(5).optional(),
})

router.get('/', requireAuth, async (request, response, next) => {
  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId: request.user.id },
      include: {
        topic: true,
      },
      orderBy: { updatedAt: 'desc' },
    })

    response.json({
      sessions: sessions.map((session) => ({
        id: session.id,
        topicTitle: session.topic.title,
        status: session.status,
        totalQuestions: session.totalQuestions,
        answeredQuestions: session.currentQuestionIndex,
        path: `/learning/qbank/session?id=${session.id}`,
      })),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', requireAuth, async (request, response, next) => {
  try {
    const parsed = createSessionSchema.parse(request.body)
    const topic = await prisma.topic.findUnique({ where: { slug: parsed.topicSlug } })

    if (!topic || topic.status !== 'PUBLISHED') {
      const error = new Error('Tema no disponible para practica')
      error.statusCode = 404
      throw error
    }

    const questions = await prisma.question.findMany({
      where: {
        topicId: topic.id,
        status: 'PUBLISHED',
        ...(parsed.difficulty ? { difficulty: parsed.difficulty } : {}),
      },
      orderBy: [{ difficulty: 'asc' }, { createdAt: 'asc' }],
      take: parsed.questionCount,
    })

    if (questions.length === 0) {
      const error = new Error('No hay preguntas publicadas disponibles para esos filtros')
      error.statusCode = 400
      throw error
    }

    const session = await prisma.studySession.create({
      data: {
        userId: request.user.id,
        topicId: topic.id,
        totalQuestions: questions.length,
        questions: {
          create: questions.map((question, index) => ({
            questionId: question.id,
            order: index,
          })),
        },
      },
      include: {
        topic: true,
      },
    })

    await prisma.recentActivity.create({
      data: {
        userId: request.user.id,
        sessionId: session.id,
        type: 'SESSION_CREATED',
        title: `Sesion de ${topic.title}`,
        path: `/learning/qbank/session?id=${session.id}`,
      },
    })

    response.status(201).json({
      session: {
        id: session.id,
        topicTitle: session.topic.title,
        totalQuestions: session.totalQuestions,
        path: `/learning/qbank/session?id=${session.id}`,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', requireAuth, async (request, response, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: request.params.id,
        userId: request.user.id,
      },
      include: {
        topic: true,
        questions: {
          orderBy: { order: 'asc' },
          include: {
            question: {
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
              },
            },
            answer: true,
          },
        },
      },
    })

    if (!session) {
      const error = new Error('Sesion no encontrada')
      error.statusCode = 404
      throw error
    }

    const currentOrder = session.questions.findIndex((item) => !item.answer)
    const currentQuestionIndex = currentOrder === -1 ? session.questions.length - 1 : currentOrder

    response.json({
      session: {
        id: session.id,
        topicTitle: session.topic.title,
        status: session.status,
        progress: {
          current: Math.min(currentQuestionIndex + 1, session.questions.length),
          total: session.questions.length,
          answered: session.questions.filter((item) => item.answer).length,
        },
        correctCount: session.correctCount,
        incorrectCount: session.incorrectCount,
        hintedCorrectCount: session.hintedCorrectCount,
        questions: session.questions.map((item, index) => ({
          sessionQuestionId: item.id,
          questionId: item.question.id,
          order: index + 1,
          prompt: item.question.prompt,
          explanation: item.question.explanation,
          difficulty: item.question.difficulty,
          hint: item.question.hint,
          selectedOptionId: item.answer?.selectedOptionId || null,
          correctOptionId: item.question.options.find((option) => option.isCorrect)?.id || null,
          isCorrect: item.answer?.isCorrect || false,
          usedHint: item.answer?.usedHint || false,
          options: item.question.options.map((option) => ({
            id: option.id,
            label: option.label,
            text: option.text,
          })),
        })),
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/answers', requireAuth, async (request, response, next) => {
  try {
    const parsed = z.object({
      sessionQuestionId: z.string().trim().min(1),
      optionId: z.string().trim().min(1),
      usedHint: z.boolean().default(false),
    }).parse(request.body)

    const sessionQuestion = await prisma.studySessionQuestion.findFirst({
      where: {
        id: parsed.sessionQuestionId,
        sessionId: request.params.id,
        session: { userId: request.user.id },
      },
      include: {
        question: {
          include: {
            options: true,
          },
        },
        answer: true,
        session: true,
      },
    })

    if (!sessionQuestion) {
      const error = new Error('Pregunta de sesion no encontrada')
      error.statusCode = 404
      throw error
    }

    if (sessionQuestion.answer) {
      const error = new Error('Esta pregunta ya fue respondida')
      error.statusCode = 400
      throw error
    }

    const selectedOption = sessionQuestion.question.options.find((option) => option.id === parsed.optionId)

    if (!selectedOption) {
      const error = new Error('Opcion no valida')
      error.statusCode = 400
      throw error
    }

    const isCorrect = selectedOption.isCorrect
    const answeredCount = await prisma.studyAnswer.count({
      where: { sessionId: sessionQuestion.sessionId },
    })

    const answer = await prisma.studyAnswer.create({
      data: {
        sessionQuestionId: sessionQuestion.id,
        sessionId: sessionQuestion.sessionId,
        questionId: sessionQuestion.questionId,
        selectedOptionId: selectedOption.id,
        isCorrect,
        usedHint: parsed.usedHint,
      },
    })

    const nextAnsweredCount = answeredCount + 1
    await prisma.studySession.update({
      where: { id: sessionQuestion.sessionId },
      data: {
        currentQuestionIndex: nextAnsweredCount,
        correctCount: isCorrect && !parsed.usedHint ? { increment: 1 } : undefined,
        hintedCorrectCount: isCorrect && parsed.usedHint ? { increment: 1 } : undefined,
        incorrectCount: !isCorrect ? { increment: 1 } : undefined,
      },
    })

    await prisma.recentActivity.create({
      data: {
        userId: request.user.id,
        sessionId: sessionQuestion.sessionId,
        type: 'SESSION_ANSWERED',
        title: sessionQuestion.question.prompt,
        path: `/learning/qbank/session?id=${sessionQuestion.sessionId}`,
      },
    })

    response.json({
      answer,
      result: {
        isCorrect,
        explanation: sessionQuestion.question.explanation,
        hint: sessionQuestion.question.hint,
        correctOptionId: sessionQuestion.question.options.find((option) => option.isCorrect)?.id || null,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/finish', requireAuth, async (request, response, next) => {
  try {
    const session = await prisma.studySession.findFirst({
      where: {
        id: request.params.id,
        userId: request.user.id,
      },
    })

    if (!session) {
      const error = new Error('Sesion no encontrada')
      error.statusCode = 404
      throw error
    }

    const updatedSession = await prisma.studySession.update({
      where: { id: session.id },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
      },
    })

    await prisma.recentActivity.create({
      data: {
        userId: request.user.id,
        sessionId: session.id,
        type: 'SESSION_COMPLETED',
        title: `Sesion completada`,
        path: `/learning/qbank/session?id=${session.id}`,
      },
    })

    response.json({ session: updatedSession })
  } catch (error) {
    next(error)
  }
})

export default router
