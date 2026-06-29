import express from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import { requireRole } from '../middleware/requireRole.js'

const router = express.Router()

router.get('/me', requireAuth, requireRole('EDITOR', 'ADMIN'), (request, response) => {
  response.json({
    message: 'Acceso administrativo concedido',
    user: {
      id: request.user.id,
      email: request.user.email,
      firstName: request.user.firstName,
      lastName: request.user.lastName,
      role: request.user.role,
    },
  })
})

export default router
