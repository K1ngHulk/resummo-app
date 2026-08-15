import 'dotenv/config'
import path from 'node:path'
import cors from 'cors'
import express from 'express'
import { checkContentAssetStore, ensureContentAssetStore, loadContentAsset } from './lib/contentAssetStore.js'
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
const productionDistDirectory = path.resolve(process.cwd(), 'dist')

app.disable('x-powered-by')
app.use((request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (request.path.startsWith('/api/auth')) {
    response.setHeader('Cache-Control', 'no-store')
  }

  next()
})
app.use(cors({ origin: corsOrigin, credentials: true }))
app.get('/content-assets/:fileName', async (request, response, next) => {
  try {
    const asset = await loadContentAsset(request.params.fileName)
    if (!asset) {
      response.status(404).end()
      return
    }
    response.setHeader('Content-Type', asset.mimeType)
    response.setHeader(
      'Cache-Control',
      runtimeConfig.nodeEnvironment === 'production'
        ? 'public, max-age=31536000, immutable'
        : 'no-cache',
    )
    response.send(asset.data)
  } catch (error) {
    next(error)
  }
})
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
  const dependencies = { database: 'unavailable', storage: 'unavailable' }

  try {
    await prisma.$queryRaw`SELECT 1`
    dependencies.database = 'ready'
  } catch {
    // Keep the dependency unavailable without exposing connection details.
  }

  try {
    const storage = await checkContentAssetStore()
    if (storage.ready) dependencies.storage = 'ready'
  } catch {
    // Keep the dependency unavailable without exposing bridge details.
  }

  const ready = dependencies.database === 'ready' && dependencies.storage === 'ready'
  response.status(ready ? 200 : 503).json({
    ok: ready,
    service: 'resummo-api',
    dependencies,
  })
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

if (runtimeConfig.nodeEnvironment === 'production') {
  app.use(express.static(productionDistDirectory, {
    dotfiles: 'deny',
    index: false,
    maxAge: '1h',
    setHeaders(response, filePath) {
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    },
  }))

  app.use((request, response, next) => {
    if (request.method !== 'GET' || path.extname(request.path)) {
      next()
      return
    }

    response.setHeader('Cache-Control', 'no-cache')
    response.sendFile(path.join(productionDistDirectory, 'index.html'), (error) => {
      if (error) next(error)
    })
  })
}

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

async function startServer() {
  await ensureContentAssetStore()
  app.listen(port, '0.0.0.0', () => {
    console.log(`Resummo escuchando en el puerto ${port}`)
  })
}

startServer().catch((error) => {
  console.error('[resummo-api] startup dependency failed', {
    name: error?.name || 'Error',
  })
  process.exitCode = 1
})
