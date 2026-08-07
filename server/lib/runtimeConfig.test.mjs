import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveJwtSecret, resolveRuntimeConfig } from './runtimeConfig.js'

test('uses the development fallback only outside production', () => {
  assert.equal(resolveJwtSecret({ NODE_ENV: 'development' }), 'development-secret-change-me')
})

test('rejects missing or weak JWT secrets in production', () => {
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'production' }),
    /JWT_SECRET debe estar configurado/,
  )
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'change-this-secret' }),
    /JWT_SECRET debe estar configurado/,
  )
  assert.throws(
    () => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short-secret' }),
    /JWT_SECRET debe estar configurado/,
  )
})

test('accepts an explicit strong JWT secret in production', () => {
  const secret = 'resummo-production-test-secret-with-40-characters'
  assert.equal(resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: secret }), secret)
})

test('keeps demo credentials disabled outside development', () => {
  assert.deepEqual(
    resolveRuntimeConfig({
      NODE_ENV: 'production',
      PRIVATE_MVP_ACCESS: 'true',
      SHOW_DEMO_CREDENTIALS: 'true',
    }),
    {
      nodeEnvironment: 'production',
      privateMvpAccess: true,
      showDemoCredentials: false,
    },
  )
})
