import 'dotenv/config'
import { prisma } from '../server/lib/prisma.js'
import {
  getEditorialContentCounts,
  getLocalDatabaseTarget,
  resetEditorialContent,
} from '../server/lib/localEditorialReset.js'

function fail(message) {
  console.error(`[resummo-reset] ${message}`)
  process.exitCode = 1
}

async function main() {
  if (process.argv[2] !== '--confirm' || process.argv[3] !== 'RESET_EDITORIAL_CONTENT') {
    fail('Uso: npm.cmd run db:reset-editorial -- --confirm RESET_EDITORIAL_CONTENT')
    return
  }

  const target = getLocalDatabaseTarget()
  const before = await getEditorialContentCounts(prisma)
  console.log('[resummo-reset] Base local confirmada:', `${target.host}:${target.port}/${target.database}`)
  console.log('[resummo-reset] Filas antes:', JSON.stringify(before))

  const result = await resetEditorialContent(prisma)
  console.log('[resummo-reset] Backup:', result.backup?.fileName || 'no creado')
  console.log('[resummo-reset] Filas eliminadas:', JSON.stringify(result.deleted))
  console.log('[resummo-reset] Filas después:', JSON.stringify(result.after))
}

main()
  .catch((error) => fail(error?.message || 'El reset editorial falló.'))
  .finally(async () => {
    await prisma.$disconnect()
  })
