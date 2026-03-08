// backend/src/controllers/integrationsController.ts
import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { stripeService } from '../services/stripe.service'
import { paypalService } from '../services/paypal.service'
import { paddleService } from '../services/paddle.service'
import { mercuryService, brexService, wiseService } from '../services/banking.service'

const prisma = new PrismaClient()

export async function getIntegrations(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const integrations = await prisma.integration.findMany({
      where: { projectId },
      select: {
        id: true, provider: true, status: true, displayName: true,
        accountId: true, lastSyncedAt: true, errorMessage: true, metadata: true,
      },
    })
    res.json({ data: integrations })
  } catch (err) { next(err) }
}

export async function connectStripe(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const { secretKey } = req.body
    if (!secretKey?.startsWith('sk_')) return res.status(400).json({ error: 'Invalid Stripe secret key' })
    const result = await stripeService.connect(projectId, secretKey)
    res.json({ message: 'Stripe connected successfully', data: result })
  } catch (err: any) {
    res.status(400).json({ error: `Stripe connection failed: ${err.message}` })
  }
}

export async function connectPayPal(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const { clientId, clientSecret } = req.body
    if (!clientId || !clientSecret) return res.status(400).json({ error: 'clientId and clientSecret required' })
    await paypalService.connect(projectId, clientId, clientSecret)
    res.json({ message: 'PayPal connected successfully' })
  } catch (err: any) {
    res.status(400).json({ error: `PayPal connection failed: ${err.message}` })
  }
}

export async function connectPaddle(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const { apiKey, webhookSecret } = req.body
    if (!apiKey) return res.status(400).json({ error: 'apiKey required' })
    await paddleService.connect(projectId, apiKey, webhookSecret || '')
    res.json({ message: 'Paddle connected successfully' })
  } catch (err: any) {
    res.status(400).json({ error: `Paddle connection failed: ${err.message}` })
  }
}

export async function connectMercury(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const { apiKey } = req.body
    await mercuryService.connect(projectId, apiKey)
    res.json({ message: 'Mercury connected successfully' })
  } catch (err: any) {
    res.status(400).json({ error: `Mercury connection failed: ${err.message}` })
  }
}

export async function connectBrex(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const { apiKey } = req.body
    await brexService.connect(projectId, apiKey)
    res.json({ message: 'Brex connected successfully' })
  } catch (err: any) {
    res.status(400).json({ error: `Brex connection failed: ${err.message}` })
  }
}

export async function connectWise(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId } = req.params
    const { apiKey } = req.body
    await wiseService.connect(projectId, apiKey)
    res.json({ message: 'Wise connected successfully' })
  } catch (err: any) {
    res.status(400).json({ error: `Wise connection failed: ${err.message}` })
  }
}

export async function syncIntegration(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, provider } = req.params

    let result: any = {}
    switch (provider.toUpperCase()) {
      case 'STRIPE': result = await stripeService.syncAll(projectId); break
      case 'PAYPAL': result = await paypalService.syncAll(projectId); break
      case 'PADDLE': result = await paddleService.syncAll(projectId); break
      default: return res.status(400).json({ error: `Unknown provider: ${provider}` })
    }

    res.json({ message: `${provider} sync complete`, data: result })
  } catch (err: any) {
    res.status(500).json({ error: `Sync failed: ${err.message}` })
  }
}

export async function disconnectIntegration(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, provider } = req.params
    await prisma.integration.update({
      where: { projectId_provider: { projectId, provider: provider.toUpperCase() as any } },
      data: { status: 'DISCONNECTED', accessToken: null, refreshToken: null, webhookSecret: null },
    })
    res.json({ message: `${provider} disconnected` })
  } catch (err) { next(err) }
}

export async function getSyncLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { projectId, provider } = req.params
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: provider.toUpperCase() as any } },
    })
    if (!integration) return res.status(404).json({ error: 'Integration not found' })

    const logs = await prisma.syncLog.findMany({
      where: { integrationId: integration.id },
      orderBy: { startedAt: 'desc' },
      take: 20,
    })
    res.json({ data: logs })
  } catch (err) { next(err) }
}

export async function stripeWebhook(req: Request, res: Response) {
  const { projectId } = req.params
  const signature = req.headers['stripe-signature'] as string
  try {
    await stripeService.handleWebhook(projectId, req.body, signature)
    res.json({ received: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}

export async function paddleWebhook(req: Request, res: Response) {
  const { projectId } = req.params
  const signature = req.headers['paddle-signature'] as string
  try {
    await paddleService.handleWebhook(projectId, req.body.toString(), signature)
    res.json({ received: true })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
