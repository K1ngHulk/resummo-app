import fs from 'node:fs/promises'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function safetyError(message) {
  const error = new Error(message)
  error.statusCode = 400
  error.code = 'LOCAL_DATABASE_REQUIRED'
  return error
}

export function getLocalDatabaseTarget(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw safetyError('DATABASE_URL no está configurada.')
  let parsed
  try { parsed = new URL(databaseUrl) } catch { throw safetyError('DATABASE_URL no es válida.') }
  const localHosts = new Set(['127.0.0.1', 'localhost', '::1'])
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol) || !localHosts.has(parsed.hostname)) {
    throw safetyError('La operación editorial destructiva solo está permitida contra PostgreSQL local.')
  }
  const database = parsed.pathname.replace(/^\//, '')
  if (!database || database !== 'resummo') {
    throw safetyError('La base local autorizada para este flujo debe llamarse resummo.')
  }
  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database,
    user: decodeURIComponent(parsed.username || 'postgres'),
    password: decodeURIComponent(parsed.password || ''),
  }
}

export async function getEditorialContentCounts(client) {
  const [users, topics, articles, questions, questionOptions, articleProgress, flashcardProgress, sessions, sessionQuestions, answers, activities] = await Promise.all([
    client.user.count(),
    client.topic.count(),
    client.article.count(),
    client.question.count(),
    client.questionOption.count(),
    client.userArticleProgress.count(),
    client.userFlashcardProgress.count(),
    client.studySession.count(),
    client.studySessionQuestion.count(),
    client.studyAnswer.count(),
    client.recentActivity.count(),
  ])
  return { users, topics, articles, questions, questionOptions, articleProgress, flashcardProgress, sessions, sessionQuestions, answers, activities }
}

function backupStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
}

function run(command, args, options = {}) {
  return spawnSync(command, args, { windowsHide: true, encoding: 'utf8', ...options })
}

export async function createLocalDatabaseBackup({
  databaseUrl = process.env.DATABASE_URL,
  containerName = process.env.RESUMMO_DB_CONTAINER,
  backupDir = process.env.RESUMMO_BACKUP_DIR || path.resolve(process.cwd(), 'backups', 'local-import'),
} = {}) {
  const target = getLocalDatabaseTarget(databaseUrl)
  await fs.mkdir(backupDir, { recursive: true })
  const stamp = backupStamp()
  const fileName = `resummo-before-editorial-reset-${stamp}.dump`
  const outputPath = path.join(backupDir, fileName)

  if (containerName) {
    const containerPath = `/tmp/${fileName}`
    const dump = run('docker.exe', ['exec', containerName, 'pg_dump', '-U', target.user, '-d', target.database, '-Fc', '-f', containerPath])
    if (dump.status === 0) {
      const copy = run('docker.exe', ['cp', `${containerName}:${containerPath}`, outputPath])
      run('docker.exe', ['exec', containerName, 'rm', '-f', containerPath])
      if (copy.status === 0) {
        const stat = await fs.stat(outputPath)
        if (stat.size > 0) return { fileName, sizeBytes: stat.size }
      }
    }
  }

  const env = {
    ...process.env,
    PGHOST: target.host,
    PGPORT: target.port,
    PGDATABASE: target.database,
    PGUSER: target.user,
    PGPASSWORD: target.password,
  }
  const direct = run('pg_dump.exe', ['-Fc', '-f', outputPath], { env })
  if (direct.status !== 0) {
    const error = new Error('No se pudo crear el backup local; el reset editorial fue cancelado antes de borrar datos.')
    error.statusCode = 500
    error.code = 'LOCAL_BACKUP_FAILED'
    throw error
  }
  const stat = await fs.stat(outputPath)
  if (stat.size <= 0) throw new Error('El backup local quedó vacío; no se borró contenido editorial.')
  return { fileName, sizeBytes: stat.size }
}

export async function deleteEditorialContent(client) {
  const deleted = {}
  deleted.activities = (await client.recentActivity.deleteMany()).count
  deleted.articleProgress = (await client.userArticleProgress.deleteMany()).count
  deleted.flashcardProgress = (await client.userFlashcardProgress.deleteMany()).count
  deleted.answers = (await client.studyAnswer.deleteMany()).count
  deleted.sessionQuestions = (await client.studySessionQuestion.deleteMany()).count
  deleted.sessions = (await client.studySession.deleteMany()).count
  deleted.questionOptions = (await client.questionOption.deleteMany()).count
  deleted.questions = (await client.question.deleteMany()).count
  deleted.articles = (await client.article.deleteMany()).count
  deleted.topics = (await client.topic.deleteMany()).count
  return deleted
}

export async function resetEditorialContent(client, { createBackup = true } = {}) {
  getLocalDatabaseTarget()
  const before = await getEditorialContentCounts(client)
  const backup = createBackup ? await createLocalDatabaseBackup() : null
  const deleted = await client.$transaction((transaction) => deleteEditorialContent(transaction), { isolationLevel: 'Serializable' })
  const after = await getEditorialContentCounts(client)
  if (after.users !== before.users) throw new Error('El reset editorial alteró usuarios y fue abortado de forma inesperada.')
  return { before, after, deleted, backup }
}
