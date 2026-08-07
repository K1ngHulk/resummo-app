import assert from 'node:assert/strict'
import test from 'node:test'
import { z } from 'zod'
import { normalizeHttpError } from './httpErrors.js'

test('maps Zod validation errors to a safe 400 response', () => {
  const parsed = z.object({ email: z.string().email() }).safeParse({ email: 'invalid' })
  assert.equal(parsed.success, false)

  assert.deepEqual(normalizeHttpError(parsed.error, 'production'), {
    statusCode: 400,
    message: 'Datos inválidos.',
    shouldLog: false,
  })
})

test('keeps explicit client-facing business errors', () => {
  const error = new Error('Recurso no encontrado')
  error.statusCode = 404

  assert.deepEqual(normalizeHttpError(error, 'production'), {
    statusCode: 404,
    message: 'Recurso no encontrado',
    shouldLog: false,
  })
})

test('does not expose malformed JSON parser details', () => {
  const error = new SyntaxError('Unexpected token at position 1')
  error.status = 400

  assert.deepEqual(normalizeHttpError(error, 'production'), {
    statusCode: 400,
    message: 'JSON inválido.',
    shouldLog: false,
  })
})

test('hides unexpected production errors but preserves development detail', () => {
  const error = new Error('database host and internal query details')

  assert.deepEqual(normalizeHttpError(error, 'production'), {
    statusCode: 500,
    message: 'Error interno del servidor.',
    shouldLog: true,
  })

  assert.deepEqual(normalizeHttpError(error, 'development'), {
    statusCode: 500,
    message: 'database host and internal query details',
    shouldLog: true,
  })
})
