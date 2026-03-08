// backend/src/services/integrations/stripe.service.ts
// MultiSaaS — Stripe Live Integration
// Syncs subscriptions, charges, refunds, and customer data

import Stripe from 'stripe'
import { PrismaClient } from '@prisma/client'
import { decrypt, encrypt } from '../../utils/crypto'
import { metricsService } from '../metrics.service'

const prisma = new PrismaClient()

export class StripeService {
  private getClient(secretKey: string): Stripe {
    return new Stripe(secretKey, { apiVersion: '2024-06-20', typescript: true })
  }

  // ─── Connect & Validate ──────────────────────────────────────────────────────

  async connect(projectId: string, secretKey: string): Promise<{ accountId: string; name: string }> {
    const stripe = this.getClient(secretKey)

    // Validate key and get account info
    const account = await stripe.accounts.retrieve()
    const balance = await stripe.balance.retrieve()

    await prisma.integration.upsert({
      where: { projectId_provider: { projectId, provider: 'STRIPE' } },
      update: {
        status: 'ACTIVE',
        accessToken: encrypt(secretKey),
        accountId: account.id,
        displayName: account.business_profile?.name || account.email || 'Stripe Account',
        metadata: {
          email: account.email,
          country: account.country,
          currency: account.default_currency,
          chargesEnabled: account.charges_enabled,
          balance: balance.available,
        },
        errorMessage: null,
      },
      create: {
        projectId,
        provider: 'STRIPE',
        status: 'ACTIVE',
        accessToken: encrypt(secretKey),
        accountId: account.id,
        displayName: account.business_profile?.name || account.email || 'Stripe Account',
        metadata: { email: account.email, country: account.country },
      },
    })

    // Register webhook
    await this.registerWebhook(projectId, stripe)

    return { accountId: account.id, name: account.business_profile?.name || account.email || '' }
  }

  // ─── Webhook Registration ─────────────────────────────────────────────────────

  private async registerWebhook(projectId: string, stripe: Stripe) {
    const webhookUrl = `${process.env.API_BASE_URL}/api/webhooks/stripe/${projectId}`
    try {
      const webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: [
          'payment_intent.succeeded',
          'payment_intent.payment_failed',
          'charge.refunded',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_succeeded',
          'invoice.payment_failed',
        ],
      })

      await prisma.integration.update({
        where: { projectId_provider: { projectId, provider: 'STRIPE' } },
        data: {
          webhookSecret: encrypt(webhook.secret!),
          webhookId: webhook.id,
        },
      })
    } catch (err) {
      console.warn('[Stripe] Webhook registration failed (may already exist):', (err as Error).message)
    }
  }

  // ─── Full Historical Sync ─────────────────────────────────────────────────────

  async syncAll(projectId: string): Promise<{ synced: number; errors: number }> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'STRIPE' } },
    })
    if (!integration || !integration.accessToken) throw new Error('Stripe not connected')

    const secretKey = decrypt(integration.accessToken)
    const stripe = this.getClient(secretKey)

    await prisma.integration.update({
      where: { id: integration.id },
      data: { status: 'SYNCING' },
    })

    const syncLog = await prisma.syncLog.create({
      data: { integrationId: integration.id, status: 'FAILED', startedAt: new Date() },
    })

    let synced = 0
    let errors = 0

    try {
      // Sync charges (one-time + subscription payments)
      synced += await this.syncCharges(projectId, stripe, integration.syncCursor)

      // Sync subscriptions for MRR calculation
      synced += await this.syncSubscriptions(projectId, stripe)

      // Sync refunds
      synced += await this.syncRefunds(projectId, stripe)

      // Recalculate monthly metrics
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
      errors++
      const msg = (err as Error).message
      await prisma.integration.update({
        where: { id: integration.id },
        data: { status: 'ERROR', errorMessage: msg },
      })
      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'FAILED', errorMessage: msg, completedAt: new Date() },
      })
      throw err
    }

    return { synced, errors }
  }

  // ─── Sync Charges ─────────────────────────────────────────────────────────────

  private async syncCharges(projectId: string, stripe: Stripe, cursor?: string | null): Promise<number> {
    let count = 0
    let hasMore = true
    let startingAfter: string | undefined = cursor || undefined

    while (hasMore) {
      const charges = await stripe.charges.list({
        limit: 100,
        starting_after: startingAfter,
        expand: ['data.invoice', 'data.customer'],
      })

      for (const charge of charges.data) {
        if (charge.status !== 'succeeded') continue

        const isSubscription = !!(charge.invoice as Stripe.Invoice)?.subscription
        const customer = charge.customer as Stripe.Customer

        await prisma.revenueEntry.upsert({
          where: { externalId_source: { externalId: charge.id, source: 'stripe' } } as any,
          update: {},
          create: {
            projectId,
            amount: charge.amount,
            amountDecimal: charge.amount / 100,
            currency: charge.currency.toUpperCase(),
            type: isSubscription ? 'SUBSCRIPTION' : 'ONE_TIME',
            status: 'COMPLETED',
            description: charge.description || (isSubscription ? 'Stripe Subscription Payment' : 'Stripe Charge'),
            source: 'stripe',
            externalId: charge.id,
            customerId: typeof charge.customer === 'string' ? charge.customer : charge.customer?.id,
            customerEmail: customer?.email || null,
            subscriptionId: (charge.invoice as Stripe.Invoice)?.subscription as string || null,
            date: new Date(charge.created * 1000),
            metadata: {
              stripeChargeId: charge.id,
              paymentMethod: charge.payment_method_details?.type,
              receiptUrl: charge.receipt_url,
            },
          },
        }).catch(() => {}) // skip duplicates

        count++
        startingAfter = charge.id
      }

      hasMore = charges.has_more
    }

    return count
  }

  // ─── Sync Subscriptions ────────────────────────────────────────────────────────

  private async syncSubscriptions(projectId: string, stripe: Stripe): Promise<number> {
    let count = 0
    let hasMore = true
    let startingAfter: string | undefined

    while (hasMore) {
      const subs = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        status: 'all',
      })

      for (const sub of subs.data) {
        // Store subscription metadata for MRR calculation
        await prisma.revenueEntry.upsert({
          where: { externalId_source: { externalId: `sub_${sub.id}`, source: 'stripe' } } as any,
          update: {
            status: sub.status === 'active' ? 'COMPLETED' : 'FAILED',
            metadata: {
              stripeSubId: sub.id,
              status: sub.status,
              planAmount: sub.items.data[0]?.price?.unit_amount,
              planInterval: sub.items.data[0]?.price?.recurring?.interval,
              cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
            },
          },
          create: {
            projectId,
            amount: sub.items.data[0]?.price?.unit_amount || 0,
            amountDecimal: (sub.items.data[0]?.price?.unit_amount || 0) / 100,
            currency: sub.currency.toUpperCase(),
            type: 'SUBSCRIPTION',
            status: sub.status === 'active' ? 'COMPLETED' : 'FAILED',
            description: `Stripe Subscription — ${sub.items.data[0]?.price?.nickname || sub.id}`,
            source: 'stripe',
            externalId: `sub_${sub.id}`,
            customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
            subscriptionId: sub.id,
            date: new Date(sub.created * 1000),
            periodStart: new Date(sub.current_period_start * 1000),
            periodEnd: new Date(sub.current_period_end * 1000),
            metadata: { status: sub.status, planInterval: sub.items.data[0]?.price?.recurring?.interval },
          },
        }).catch(() => {})

        count++
        startingAfter = sub.id
      }

      hasMore = subs.has_more
    }

    return count
  }

  // ─── Sync Refunds ─────────────────────────────────────────────────────────────

  private async syncRefunds(projectId: string, stripe: Stripe): Promise<number> {
    let count = 0
    const refunds = await stripe.refunds.list({ limit: 100 })

    for (const refund of refunds.data) {
      await prisma.revenueEntry.upsert({
        where: { externalId_source: { externalId: refund.id, source: 'stripe' } } as any,
        update: {},
        create: {
          projectId,
          amount: -(refund.amount),
          amountDecimal: -(refund.amount / 100),
          currency: refund.currency.toUpperCase(),
          type: 'REFUND',
          status: 'REFUNDED',
          description: refund.reason || 'Stripe Refund',
          source: 'stripe',
          externalId: refund.id,
          date: new Date(refund.created * 1000),
          metadata: { chargeId: refund.charge, reason: refund.reason },
        },
      }).catch(() => {})
      count++
    }

    return count
  }

  // ─── Handle Incoming Webhook ──────────────────────────────────────────────────

  async handleWebhook(projectId: string, payload: string, signature: string): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'STRIPE' } },
    })
    if (!integration?.webhookSecret || !integration.accessToken) return

    const webhookSecret = decrypt(integration.webhookSecret)
    const secretKey = decrypt(integration.accessToken)
    const stripe = this.getClient(secretKey)

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch {
      throw new Error('Invalid Stripe webhook signature')
    }

    // Process real-time events
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await this.syncCharges(projectId, stripe, null)
        await metricsService.recalculate(projectId)
        break
      case 'customer.subscription.deleted':
        await metricsService.recalculate(projectId)
        break
      case 'charge.refunded':
        await this.syncRefunds(projectId, stripe)
        break
    }
  }

  // ─── Get Live MRR from Stripe ─────────────────────────────────────────────────

  async getLiveMRR(projectId: string): Promise<number> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'STRIPE' } },
    })
    if (!integration?.accessToken) return 0

    const stripe = this.getClient(decrypt(integration.accessToken))
    let mrr = 0

    const subs = await stripe.subscriptions.list({ status: 'active', limit: 100 })
    for (const sub of subs.data) {
      const price = sub.items.data[0]?.price
      if (!price) continue
      const amount = (price.unit_amount || 0) / 100
      const interval = price.recurring?.interval
      if (interval === 'month') mrr += amount
      else if (interval === 'year') mrr += amount / 12
      else if (interval === 'week') mrr += amount * 4.33
    }

    return Math.round(mrr * 100) / 100
  }
}

export const stripeService = new StripeService()
