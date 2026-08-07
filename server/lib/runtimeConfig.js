const developmentJwtSecret = 'development-secret-change-me'

const rejectedProductionSecrets = new Set([
  developmentJwtSecret,
  'change-this-secret',
  'resummo-local-demo-only-change-me',
])

export function isEnvFlagEnabled(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase())
}

export function resolveJwtSecret(environment = process.env) {
  const nodeEnvironment = String(environment.NODE_ENV || 'development').trim().toLowerCase()
  const configuredSecret = String(environment.JWT_SECRET || '').trim()

  if (nodeEnvironment === 'production') {
    if (
      !configuredSecret ||
      configuredSecret.length < 32 ||
      rejectedProductionSecrets.has(configuredSecret)
    ) {
      throw new Error(
        'JWT_SECRET debe estar configurado con al menos 32 caracteres seguros antes de iniciar en producción.',
      )
    }
  }

  return configuredSecret || developmentJwtSecret
}

export function resolveRuntimeConfig(environment = process.env) {
  return {
    nodeEnvironment: String(environment.NODE_ENV || 'development').trim().toLowerCase(),
    privateMvpAccess: isEnvFlagEnabled(environment.PRIVATE_MVP_ACCESS),
    showDemoCredentials:
      String(environment.NODE_ENV || 'development').trim().toLowerCase() === 'development' &&
      isEnvFlagEnabled(environment.SHOW_DEMO_CREDENTIALS),
  }
}
