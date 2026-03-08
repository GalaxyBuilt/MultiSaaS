// backend/src/routes/ai.ts
import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { PrismaClient } from '@prisma/client'
import { aiService } from '../services/ai/ai.service'
import { encrypt } from '../utils/crypto'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticate)

// ─── AI Config (per user) ─────────────────────────────────────────────────────

// GET /api/ai/config
router.get('/config', async (req, res, next) => {
  try {
    const configs = await prisma.aIConfig.findMany({
      where: { userId: req.user!.id },
      select: { id: true, provider: true, model: true, isDefault: true, createdAt: true },
      // Never return apiKey
    })
    res.json({ data: configs })
  } catch (err) { next(err) }
})

// POST /api/ai/config
router.post('/config', async (req, res, next) => {
  try {
    const { provider, apiKey, model, isDefault, metadata } = req.body
    if (!provider || !apiKey || !model) return res.status(400).json({ error: 'provider, apiKey, model required' })

    if (isDefault) {
      await prisma.aIConfig.updateMany({ where: { userId: req.user!.id }, data: { isDefault: false } })
    }

    const config = await prisma.aIConfig.create({
      data: {
        userId: req.user!.id,
        provider,
        apiKey: encrypt(apiKey),
        model,
        isDefault: isDefault || false,
        metadata,
      },
      select: { id: true, provider: true, model: true, isDefault: true, createdAt: true },
    })
    res.status(201).json({ data: config })
  } catch (err) { next(err) }
})

// DELETE /api/ai/config/:id
router.delete('/config/:id', async (req, res, next) => {
  try {
    await prisma.aIConfig.delete({ where: { id: req.params.id, userId: req.user!.id } })
    res.json({ message: 'AI config deleted' })
  } catch (err) { next(err) }
})

// ─── Insights ─────────────────────────────────────────────────────────────────

// GET /api/ai/projects/:projectId/insights
router.get('/projects/:projectId/insights', async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { unread } = req.query

    const insights = await prisma.aIInsight.findMany({
      where: {
        projectId,
        isDismissed: false,
        ...(unread === 'true' ? { isRead: false } : {}),
      },
      orderBy: { generatedAt: 'desc' },
      take: 20,
    })
    res.json({ data: insights })
  } catch (err) { next(err) }
})

// POST /api/ai/projects/:projectId/insights/generate
router.post('/projects/:projectId/insights/generate', async (req, res, next) => {
  try {
    const { projectId } = req.params
    const { type = 'GENERAL' } = req.body

    const insight = await aiService.createAndSaveInsight(projectId, req.user!.id, type)
    res.status(201).json({ data: insight })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// POST /api/ai/projects/:projectId/insights/auto
router.post('/projects/:projectId/insights/auto', async (req, res, next) => {
  try {
    const { projectId } = req.params
    await aiService.runAutoAlerts(projectId, req.user!.id)
    res.json({ message: 'Auto alerts generated' })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
})

// PATCH /api/ai/insights/:id/read
router.patch('/insights/:id/read', async (req, res, next) => {
  try {
    await prisma.aIInsight.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json({ message: 'Marked as read' })
  } catch (err) { next(err) }
})

// PATCH /api/ai/insights/:id/dismiss
router.patch('/insights/:id/dismiss', async (req, res, next) => {
  try {
    await prisma.aIInsight.update({ where: { id: req.params.id }, data: { isDismissed: true } })
    res.json({ message: 'Dismissed' })
  } catch (err) { next(err) }
})

export default router
