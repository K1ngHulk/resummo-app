import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { normalizeHttpError } from './lib/httpErrors.js'
import { prisma } from './lib/prisma.js'
import { resolveRuntimeConfig } from './lib/runtimeConfig.js'
import authRoutes from './routes/authRoutes.js'
import articleRoutes from './routes/articleRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import practiceSessionRoutes from './routes/practiceSessionRoutes.js'
import topicRoutes from './routes/topicRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import adminContentRoutes from './routes/adminContentRoutes.js'
import flashcardRoutes from './routes/flashcardRoutes.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'
const runtimeConfig = resolveRuntimeConfig()

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_request, response) => {
  response.json({
    ok: true,
    service: 'resummo-api',
    config: {
      privateMvpAccess: runtimeConfig.privateMvpAccess,
      showDemoCredentials: runtimeConfig.showDemoCredentials,
    },
  })
})

app.get('/api/ready', async (_request, response) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    response.json({
      ok: true,
      service: 'resummo-api',
      dependencies: { database: 'ready' },
    })
  } catch {
    response.status(503).json({
      ok: false,
      service: 'resummo-api',
      dependencies: { database: 'unavailable' },
    })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/topics', topicRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/practice-sessions', practiceSessionRoutes)
app.use('/api/study/flashcards', flashcardRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/admin/content', adminContentRoutes)

app.use('/api', (_request, response) => {
  response.status(404).json({ message: 'Ruta no encontrada.' })
})

app.use((error, _request, response, next) => {
  void next

  if (response.headersSent) {
    return
  }

  const normalizedError = normalizeHttpError(error, runtimeConfig.nodeEnvironment)
  if (normalizedError.shouldLog) {
    if (runtimeConfig.nodeEnvironment === 'production') {
      console.error('[resummo-api] unexpected server error', {
        name: error?.name || 'Error',
      })
    } else {
      console.error(error)
    }
  }

  response.status(normalizedError.statusCode).json({
    message: normalizedError.message,
  })
})

app.listen(port, () => {
  console.log(`Resummo API escuchando en http://localhost:${port}`)
})
