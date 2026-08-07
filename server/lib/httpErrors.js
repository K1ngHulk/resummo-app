import { ZodError } from 'zod'

function getExplicitStatus(error) {
  const candidate = Number(error?.statusCode ?? error?.status)
  return Number.isInteger(candidate) && candidate >= 400 && candidate <= 599
    ? candidate
    : null
}

export function normalizeHttpError(error, nodeEnvironment = process.env.NODE_ENV) {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      message: 'Datos inválidos.',
      shouldLog: false,
    }
  }

  const explicitStatus = getExplicitStatus(error)
  if (explicitStatus) {
    if (explicitStatus === 400 && error instanceof SyntaxError) {
      return {
        statusCode: 400,
        message: 'JSON inválido.',
        shouldLog: false,
      }
    }

    if (explicitStatus < 500) {
      return {
        statusCode: explicitStatus,
        message: String(error?.message || 'Solicitud inválida.'),
        shouldLog: false,
      }
    }
  }

  const isProduction = String(nodeEnvironment || '').trim().toLowerCase() === 'production'
  return {
    statusCode: explicitStatus || 500,
    message: isProduction
      ? 'Error interno del servidor.'
      : String(error?.message || 'Error interno del servidor.'),
    shouldLog: true,
  }
}
