import { verifyToken } from '../lib/auth.js'
import { prisma } from '../lib/prisma.js'

export async function requireAuth(request, _response, next) {
  try {
    const authorization = request.headers.authorization || ''
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null

    if (!token) {
      const error = new Error('Debes iniciar sesion para continuar')
      error.statusCode = 401
      throw error
    }

    const payload = verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    })

    if (!user) {
      const error = new Error('La sesion no es valida')
      error.statusCode = 401
      throw error
    }

    request.user = user
    next()
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 401
      error.message = 'La sesion no es valida'
    }

    next(error)
  }
}
