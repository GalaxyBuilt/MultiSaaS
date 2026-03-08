// backend/src/app.ts
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'

import authRoutes from './routes/auth'
import projectRoutes from './routes/projects'
import dashboardRoutes from './routes/dashboard'
import integrationRoutes from './routes/integrationsRoutes'
import aiRoutes from './controllers/aiController'
import plaidRoutes from './routes/plaidRoutes'
import { notificationsRouter } from './services/notifications.service'
import { errorHandler } from './middleware/errorHandler'
import { notFound } from './middleware/notFound'

const app = express()

// ─── Security ──────────────────────────────────────────────────────────────────

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Raw body for webhook signature verification
app.use('/api/webhooks', express.raw({ type: 'application/json' }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
})
app.use('/api', limiter)

// ─── Routes ───────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/integrations', integrationRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/plaid', plaidRoutes)
app.use('/api/notifications', notificationsRouter)

// ─── Error Handling ───────────────────────────────────────────────────────────

app.use(notFound)
app.use(errorHandler)

export default app
