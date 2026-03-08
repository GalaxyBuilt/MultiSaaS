// backend/src/services/integrations/paypal.service.ts
// MultiSaaS — PayPal Live Integration
// Uses PayPal REST API v2 — OAuth2 client credentials flow

import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { decrypt, encrypt } from '../../utils/crypto'
import { metricsService } from '../metrics.service'

const prisma = new PrismaClient()

const PAYPAL_BASE = process.env.PAYPAL_ENV === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com'

export class PayPalService {
  // ─── OAuth Token ──────────────────────────────────────────────────────────────

  private async getAccessToken(clientId: string, clientSecret: string): Promise<string> {
    const res = await axios.post(
      `${PAYPAL_BASE}/v1/oauth2/token`,
      'grant_type=client_credentials',
      {
        auth: { username: clientId, password: clientSecret },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    )
    return res.data.access_token
  }

  private async getAuthHeaders(clientId: string, clientSecret: string) {
    const token = await this.getAccessToken(clientId, clientSecret)
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  }

  // ─── Connect ──────────────────────────────────────────────────────────────────

  async connect(projectId: string, clientId: string, clientSecret: string): Promise<void> {
    // Validate credentials
    const token = await this.getAccessToken(clientId, clientSecret)

    // Get merchant info
    const infoRes = await axios.get(`${PAYPAL_BASE}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => ({ data: {} }))

    const credentials = JSON.stringify({ clientId, clientSecret })

    await prisma.integration.upsert({
      where: { projectId_provider: { projectId, provider: 'PAYPAL' } },
      update: {
        status: 'ACTIVE',
        accessToken: encrypt(credentials),
        accountId: infoRes.data.user_id || clientId,
        displayName: infoRes.data.name || 'PayPal Account',
        metadata: { email: infoRes.data.email, env: process.env.PAYPAL_ENV || 'sandbox' },
        errorMessage: null,
      },
      create: {
        projectId,
        provider: 'PAYPAL',
        status: 'ACTIVE',
        accessToken: encrypt(credentials),
        accountId: clientId,
        displayName: 'PayPal Account',
        metadata: { env: process.env.PAYPAL_ENV || 'sandbox' },
      },
    })
  }

  // ─── Sync Transactions ────────────────────────────────────────────────────────

  async syncAll(projectId: string): Promise<{ synced: number }> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PAYPAL' } },
    })
    if (!integration?.accessToken) throw new Error('PayPal not connected')

    const creds = JSON.parse(decrypt(integration.accessToken))
    const headers = await this.getAuthHeaders(creds.clientId, creds.clientSecret)

    const syncLog = await prisma.syncLog.create({
      data: { integrationId: integration.id, status: 'FAILED' },
    })

    let synced = 0

    try {
      // Sync transactions for last 90 days (PayPal limit per call)
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 90)

      let page = 1
      let hasNextPage = true

      while (hasNextPage) {
        const res = await axios.get(`${PAYPAL_BASE}/v2/reporting/transactions`, {
          headers,
          params: {
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            transaction_status: 'S', // Successful
            fields: 'all',
            page_size: 500,
            page,
          },
        })

        const { transaction_details, total_pages } = res.data

        for (const txn of transaction_details || []) {
          const info = txn.transaction_info
          const amount = parseFloat(info.transaction_amount?.value || '0')
          if (amount <= 0) continue // skip refunds/fees in this pass

          await prisma.revenueEntry.upsert({
            where: {
              externalId_source: {
                externalId: info.transaction_id,
                source: 'paypal',
              },
            } as any,
            update: {},
            create: {
              projectId,
              amount: Math.round(amount * 100),
              amountDecimal: amount,
              currency: info.transaction_amount?.currency_code || 'USD',
              type: info.transaction_event_code?.startsWith('T00') ? 'SUBSCRIPTION' : 'ONE_TIME',
              status: 'COMPLETED',
              description: info.transaction_subject || info.transaction_note || 'PayPal Payment',
              source: 'paypal',
              externalId: info.transaction_id,
              customerEmail: txn.payer_info?.email_address,
              date: new Date(info.transaction_initiation_date),
              metadata: {
                eventCode: info.transaction_event_code,
                feeAmount: info.fee_amount?.value,
              },
            },
          }).catch(() => {})

          synced++
        }

        page++
        hasNextPage = page <= total_pages
      }

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
}

export const paypalService = new PayPalService()
