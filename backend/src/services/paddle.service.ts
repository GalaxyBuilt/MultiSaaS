// backend/src/services/integrations/paddle.service.ts
// MultiSaaS — Paddle Billing Integration (Paddle Billing API v1)

import axios from 'axios'
import crypto from 'crypto'
import { PrismaClient } from '@prisma/client'
import { decrypt, encrypt } from '../utils/crypto'
import { metricsService } from './metrics.service'

const prisma = new PrismaClient()

const PADDLE_BASE = process.env.PADDLE_ENV === 'live'
  ? 'https://api.paddle.com'
  : 'https://sandbox-api.paddle.com'

export class PaddleService {
  private getHeaders(apiKey: string) {
    return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
  }

  async connect(projectId: string, apiKey: string, webhookSecret: string): Promise<void> {
    const headers = this.getHeaders(apiKey)

    // Validate by fetching business info
    const res = await axios.get(`${PADDLE_BASE}/businesses`, { headers })
    const business = res.data?.data?.[0]

    await prisma.integration.upsert({
      where: { projectId_provider: { projectId, provider: 'PADDLE' } },
      update: {
        status: 'ACTIVE',
        accessToken: encrypt(apiKey),
        webhookSecret: encrypt(webhookSecret),
        accountId: business?.id,
        displayName: business?.name || 'Paddle Account',
        metadata: { env: process.env.PADDLE_ENV || 'sandbox' },
        errorMessage: null,
      },
      create: {
        projectId,
        provider: 'PADDLE',
        status: 'ACTIVE',
        accessToken: encrypt(apiKey),
        webhookSecret: encrypt(webhookSecret),
        accountId: business?.id,
        displayName: business?.name || 'Paddle Account',
        metadata: { env: process.env.PADDLE_ENV || 'sandbox' },
      },
    })
  }

  async syncAll(projectId: string): Promise<{ synced: number }> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PADDLE' } },
    })
    if (!integration?.accessToken) throw new Error('Paddle not connected')

    const apiKey = decrypt(integration.accessToken)
    const headers = this.getHeaders(apiKey)
    let synced = 0

    const syncLog = await prisma.syncLog.create({
      data: { integrationId: integration.id, status: 'FAILED' },
    })

    try {
      // Sync transactions
      let after: string | null = null
      let hasMore = true

      while (hasMore) {
        const params: any = { per_page: 200, status: 'completed' }
        if (after) params.after = after

        const res = await axios.get(`${PADDLE_BASE}/transactions`, { headers, params })
        const { data, meta } = res.data

        for (const txn of data || []) {
          const details = txn.details?.totals
          if (!details) continue

          const amount = parseFloat(details.subtotal || '0')

          await prisma.revenueEntry.upsert({
            where: { externalId_source: { externalId: txn.id, source: 'paddle' } } as any,
            update: {},
            create: {
              projectId,
              amount: Math.round(amount * 100),
              amountDecimal: amount,
              currency: txn.currency_code || 'USD',
              type: txn.subscription_id ? 'SUBSCRIPTION' : 'ONE_TIME',
              status: 'COMPLETED',
              description: `Paddle ${txn.subscription_id ? 'Subscription' : 'Transaction'} ${txn.id}`,
              source: 'paddle',
              externalId: txn.id,
              subscriptionId: txn.subscription_id,
              customerEmail: txn.customer?.email,
              date: new Date(txn.created_at),
              metadata: {
                paddleTxnId: txn.id,
                productId: txn.items?.[0]?.product?.id,
                tax: details.tax,
                fee: details.fee,
              },
            },
          }).catch(() => { })

          synced++
        }

        after = meta?.pagination?.next ? meta.pagination.next.split('after=')[1] : null
        hasMore = !!after
      }

      // Sync subscriptions for MRR
      await this.syncSubscriptions(projectId, apiKey, headers)
      await metricsService.recalculate(projectId)

      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ACTIVE', lastSyncedAt: new Date(), errorMessage: null },
      })
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'SUCCESS', recordsSynced: synced, completedAt: new Date() },
      })
    } catch (err) {
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ERROR', errorMessage: (err as Error).message },
      })
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'FAILED', errorMessage: (err as Error).message, completedAt: new Date() },
      })
      throw err
    }

    return { synced }
  }

  private async syncSubscriptions(projectId: string, apiKey: string, headers: any) {
    const res = await axios.get(`${PADDLE_BASE}/subscriptions`, {
      headers,
      params: { status: 'active', per_page: 200 },
    })

    for (const sub of res.data?.data || []) {
      const item = sub.items?.[0]
      if (!item) continue
      const price = item.price
      const unitAmount = parseFloat(price?.unit_price?.amount || '0')

      await prisma.revenueEntry.upsert({
        where: { externalId_source: { externalId: `paddle_sub_${sub.id}`, source: 'paddle' } } as any,
        update: { metadata: { status: sub.status } },
        create: {
          projectId,
          amount: Math.round(unitAmount * 100),
          amountDecimal: unitAmount,
          currency: sub.currency_code || 'USD',
          type: 'SUBSCRIPTION',
          status: sub.status === 'active' ? 'COMPLETED' : 'PENDING',
          description: `Paddle Subscription — ${price?.description || sub.id}`,
          source: 'paddle',
          externalId: `paddle_sub_${sub.id}`,
          subscriptionId: sub.id,
          customerEmail: sub.customer?.email,
          date: new Date(sub.created_at),
          periodStart: new Date(sub.current_billing_period?.starts_at),
          periodEnd: new Date(sub.current_billing_period?.ends_at),
          metadata: { status: sub.status, billingCycle: price?.billing_cycle },
        },
      }).catch(() => { })
    }
  }

  async handleWebhook(projectId: string, payload: string, signature: string): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PADDLE' } },
    })
    if (!integration?.webhookSecret) return

    const secret = decrypt(integration.webhookSecret)

    // Paddle webhook signature verification
    const [ts, h1] = signature.split(';').map(s => s.split('=')[1])
    const expected = crypto.createHmac('sha256', secret).update(`${ts}:${payload}`).digest('hex')
    if (expected !== h1) throw new Error('Invalid Paddle webhook signature')

    const event = JSON.parse(payload)

    if (['transaction.completed', 'subscription.activated', 'subscription.canceled'].includes(event.event_type)) {
      await this.syncAll(projectId)
    }
  }
}

export const paddleService = new PaddleService()
