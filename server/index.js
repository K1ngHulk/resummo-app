import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import authRoutes from './routes/authRoutes.js'
import articleRoutes from './routes/articleRoutes.js'
import dashboardRoutes from './routes/dashboardRoutes.js'
import progressRoutes from './routes/progressRoutes.js'
import practiceSessionRoutes from './routes/practiceSessionRoutes.js'
import topicRoutes from './routes/topicRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3001)
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: corsOrigin, credentials: true }))
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'resummo-api' })
})

app.use('/api/auth', authRoutes)
app.use('/api/topics', topicRoutes)
app.use('/api/articles', articleRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/progress', progressRoutes)
app.use('/api/practice-sessions', practiceSessionRoutes)
app.use('/api/admin', adminRoutes)

app.use((error, _request, response, next) => {
  console.error(error)
  void next

  if (response.headersSent) {
    return
  }

  response.status(error.statusCode || 500).json({
    message: error.message || 'Error interno del servidor',
  })
})

app.listen(port, () => {
  console.log(`Resummo API escuchando en http://localhost:${port}`)
})
