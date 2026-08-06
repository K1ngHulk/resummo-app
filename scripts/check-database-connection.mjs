import 'dotenv/config'
import { prisma } from '../server/lib/prisma.js'

function getDatabaseTarget() {
  const value = String(process.env.DATABASE_URL || '')
  if (!value) return 'NONE'

  try {
    const url = new URL(value)
    if (['localhost', '127.0.0.1'].includes(url.hostname)) return 'LOCAL'
    if (url.hostname.includes('supabase')) return 'SUPABASE-MASKED'
    return 'REMOTE-MASKED'
  } catch {
    return 'INVALID'
  }
}

function sanitizeMessage(message) {
  return String(message || 'Error de conexión')
    .replace(/postgres\.[a-z0-9]+/gi, 'postgres.[REDACTED]')
    .replace(/[a-z0-9]{20}\.supabase\.co/gi, '[PROJECT].supabase.co')
    .replace(/postgresql:\/\/[^\s]+/gi, '[DATABASE_URL_REDACTED]')
    .slice(0, 260)
}

async function main() {
  const target = getDatabaseTarget()
  if (target === 'NONE' || target === 'INVALID') {
    throw new Error(`DATABASE_TARGET=${target}`)
  }

  const userCount = await prisma.user.count()
  console.log(`[database-check] PASS target=${target} users=${userCount}`)
}

main()
  .catch((error) => {
    console.error(`[database-check] FAIL target=${getDatabaseTarget()} message=${sanitizeMessage(error.message)}`)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
