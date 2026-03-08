// backend/src/services/notifications/notifications.service.ts
// MultiSaaS — Notification & Alert Engine
// Email, Slack webhooks, in-app notifications

import axios from 'axios'
import nodemailer from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Email Transport ──────────────────────────────────────────────────────────

function getMailer() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS,
    },
  })
}

// ─── Alert Evaluation ─────────────────────────────────────────────────────────

export async function evaluateAlerts(projectId: string): Promise<void> {
  const alerts = await prisma.alert.findMany({ where: { projectId, isActive: true } })
  if (alerts.length === 0) return

  const now = new Date()
  const metric = await prisma.monthlyMetric.findFirst({
    where: { projectId, year: now.getFullYear(), month: now.getMonth() + 1 },
  })
  if (!metric) return

  const project = await prisma.project.findUnique({ where: { id: projectId } })

  const metricMap: Record<string, number> = {
    LOW_MRR: metric.mrr,
    HIGH_CHURN: metric.churnRate,
    EXPENSE_SPIKE: metric.totalExpenses,
    LOW_CASH: metric.cashBalance,
    RUNWAY_LOW: metric.runway || 999,
  }

  for (const alert of alerts) {
    const value = metricMap[alert.type] ?? 0
    const threshold = alert.threshold ?? 0

    let triggered = false
    if (alert.condition === 'lt') triggered = value < threshold
    else if (alert.condition === 'gt') triggered = value > threshold
    else if (alert.condition === 'eq') triggered = value === threshold

    if (!triggered) continue

    // Throttle: don't fire more than once per 24 hours
    if (alert.lastFiredAt && (now.getTime() - alert.lastFiredAt.getTime()) < 86400000) continue

    const message = alert.message || buildAlertMessage(alert.type, value, threshold, project?.name)

    // Fire channels
    for (const channel of alert.channels) {
      if (channel === 'email') await sendEmailAlert(projectId, message, alert.type)
      if (channel === 'slack') await sendSlackAlert(projectId, message)
      if (channel === 'webhook') await sendWebhookAlert(projectId, { type: alert.type, value, threshold, message })
    }

    // Create in-app notification
    await createInAppNotification(projectId, alert.type, message)

    await prisma.alert.update({ where: { id: alert.id }, data: { lastFiredAt: now } })
  }
}

function buildAlertMessage(type: string, value: number, threshold: number, project?: string): string {
  const messages: Record<string, string> = {
    LOW_MRR: `⚠️ ${project}: MRR dropped to $${value.toFixed(0)} (threshold: $${threshold})`,
    HIGH_CHURN: `🚨 ${project}: Churn rate is ${value.toFixed(1)}% (threshold: ${threshold}%)`,
    EXPENSE_SPIKE: `💸 ${project}: Monthly expenses hit $${value.toFixed(0)} (threshold: $${threshold})`,
    LOW_CASH: `🔴 ${project}: Cash balance is $${value.toFixed(0)} (threshold: $${threshold})`,
    RUNWAY_LOW: `⏳ ${project}: Runway is ${value.toFixed(1)} months (threshold: ${threshold} months)`,
  }
  return messages[type] || `Alert triggered for ${project}: ${type}`
}

async function sendEmailAlert(projectId: string, message: string, type: string): Promise<void> {
  if (!process.env.SMTP_PASS || !process.env.ALERT_EMAIL) return

  const mailer = getMailer()
  await mailer.sendMail({
    from: process.env.SMTP_FROM || 'alerts@multisaas.dev',
    to: process.env.ALERT_EMAIL,
    subject: `MultiSaaS Alert: ${type}`,
    html: `<p>${message}</p><p><a href="${process.env.FRONTEND_URL}/dashboard">View Dashboard →</a></p>`,
  }).catch(err => console.error('[Email] Alert failed:', err.message))
}

async function sendSlackAlert(projectId: string, message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl) return

  await axios.post(webhookUrl, { text: message }).catch(err =>
    console.error('[Slack] Alert failed:', err.message)
  )
}

async function sendWebhookAlert(projectId: string, payload: any): Promise<void> {
  const webhooks = await prisma.webhook.findMany({ where: { projectId, isActive: true } })

  for (const webhook of webhooks) {
    const body = JSON.stringify({ event: 'alert.triggered', projectId, ...payload, timestamp: new Date().toISOString() })
    const signature = require('crypto')
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex')

    await axios.post(webhook.url, body, {
      headers: { 'Content-Type': 'application/json', 'X-MultiSaaS-Signature': signature },
      timeout: 10000,
    }).catch(err => console.error(`[Webhook] ${webhook.url} failed:`, err.message))
  }
}

async function createInAppNotification(projectId: string, type: string, body: string): Promise<void> {
  const members = await prisma.projectMember.findMany({
    where: { projectId, role: { in: ['ADMIN'] } },
  })

  await prisma.notification.createMany({
    data: members.map(m => ({
      userId: m.userId,
      title: `Alert: ${type.replace(/_/g, ' ')}`,
      body,
      type: 'ALERT',
      channel: 'in_app',
    })),
  })
}

// ─── Notifications Router ─────────────────────────────────────────────────────

import { Router } from 'express'
import { authenticate } from '../../middleware/auth'

export const notificationsRouter = Router()
notificationsRouter.use(authenticate)

notificationsRouter.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json({ data: notifications })
  } catch (err) { next(err) }
})

notificationsRouter.patch('/:id/read', async (req, res, next) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json({ message: 'Marked as read' })
  } catch (err) { next(err) }
})

notificationsRouter.post('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user!.id }, data: { isRead: true } })
    res.json({ message: 'All marked as read' })
  } catch (err) { next(err) }
})
