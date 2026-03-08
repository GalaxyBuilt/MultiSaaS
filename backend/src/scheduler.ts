// backend/src/jobs/scheduler.ts
// MultiSaaS — Background Job Scheduler
// Auto-syncs integrations and evaluates alerts on a schedule

import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { stripeService } from './services/stripe.service'
import { paypalService } from './services/paypal.service'
import { paddleService } from './services/paddle.service'
import { metricsService } from './services/metrics.service'
import { evaluateAlerts } from './services/notifications.service'
import { aiService } from './services/ai.service'

const prisma = new PrismaClient()

export const startScheduler = () => {
  console.log('[Scheduler] Background jobs initialization requested')
}

// ─── Auto-Sync All Active Integrations (every 6 hours) ───────────────────────

cron.schedule('0 */6 * * *', async () => {
  console.log('[Scheduler] Starting integration sync sweep...')

  const integrations = await prisma.integration.findMany({
    where: { status: 'ACTIVE' },
    select: { projectId: true, provider: true },
  })

  for (const { projectId, provider } of integrations) {
    try {
      if (provider === 'STRIPE') await stripeService.syncAll(projectId)
      if (provider === 'PAYPAL') await paypalService.syncAll(projectId)
      if (provider === 'PADDLE') await paddleService.syncAll(projectId)
      console.log(`[Scheduler] Synced ${provider} for project ${projectId}`)
    } catch (err) {
      console.error(`[Scheduler] Sync failed ${provider}/${projectId}:`, (err as Error).message)
    }
  }
})

// ─── Recalculate Metrics (every 2 hours) ─────────────────────────────────────

cron.schedule('0 */2 * * *', async () => {
  console.log('[Scheduler] Recalculating metrics...')

  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })

  for (const { id } of projects) {
    await metricsService.recalculate(id).catch(err =>
      console.error(`[Scheduler] Metrics failed for ${id}:`, err.message)
    )
  }
})

// ─── Evaluate Alerts (every hour) ────────────────────────────────────────────

cron.schedule('0 * * * *', async () => {
  console.log('[Scheduler] Evaluating alerts...')

  const projects = await prisma.project.findMany({
    where: { status: 'ACTIVE' },
    select: { id: true },
  })

  for (const { id } of projects) {
    await evaluateAlerts(id).catch(err =>
      console.error(`[Scheduler] Alert evaluation failed for ${id}:`, err.message)
    )
  }
})

// ─── Auto AI Insights (daily at 8am UTC) ─────────────────────────────────────

cron.schedule('0 8 * * *', async () => {
  console.log('[Scheduler] Generating daily AI insights...')

  const members = await prisma.projectMember.findMany({
    where: { role: 'ADMIN' },
    include: { project: { select: { id: true, status: true } } },
    distinct: ['projectId'],
  })

  for (const member of members) {
    if (member.project.status !== 'ACTIVE') continue
    await aiService.runAutoAlerts(member.projectId, member.userId).catch(err =>
      console.error(`[Scheduler] AI insights failed for ${member.projectId}:`, err.message)
    )
  }
})

console.log('[Scheduler] Background jobs initialized')
