import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { resolveJwtSecret } from './runtimeConfig.js'

const jwtSecret = resolveJwtSecret()
const jwtExpiresIn = '7d'

export function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  )
}

export function verifyToken(token) {
  return jwt.verify(token, jwtSecret)
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}
