import { z } from 'zod'
import { comparePassword, hashPassword, signToken } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/requireAuth.js'
import express from 'express'

const router = express.Router()

const authSchema = z.object({
  firstName: z.string().trim().min(2).max(50).optional(),
  lastName: z.string().trim().min(2).max(50).optional(),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(100),
})

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    fullName: `${user.firstName} ${user.lastName}`,
    initials: `${user.firstName[0] || ''}${user.lastName[0] || ''}`.toUpperCase(),
  }
}

router.post('/register', async (request, response, next) => {
  try {
    const parsed = authSchema.extend({
      firstName: z.string().trim().min(2).max(50),
      lastName: z.string().trim().min(2).max(50),
    }).parse(request.body)

    const existingUser = await prisma.user.findUnique({ where: { email: parsed.email } })

    if (existingUser) {
      const error = new Error('Ya existe una cuenta con ese correo')
      error.statusCode = 409
      throw error
    }

    const passwordHash = await hashPassword(parsed.password)
    const user = await prisma.user.create({
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email,
        passwordHash,
      },
    })

    response.status(201).json({
      token: signToken(user),
      user: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (request, response, next) => {
  try {
    const parsed = authSchema.pick({ email: true, password: true }).parse(request.body)
    const user = await prisma.user.findUnique({ where: { email: parsed.email } })

    if (!user || !(await comparePassword(parsed.password, user.passwordHash))) {
      const error = new Error('Correo o password invalidos')
      error.statusCode = 401
      throw error
    }

    response.json({
      token: signToken(user),
      user: sanitizeUser(user),
    })
  } catch (error) {
    next(error)
  }
})

router.get('/me', requireAuth, async (request, response) => {
  response.json({ user: sanitizeUser(request.user) })
})

export default router
