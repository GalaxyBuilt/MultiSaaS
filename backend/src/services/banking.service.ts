// backend/src/services/banking/banking.service.ts
// MultiSaaS — Banking Integrations
// Mercury, Brex, Wise — read-only balance + transaction sync

import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { decrypt, encrypt } from '../utils/crypto'
import { metricsService } from './metrics.service'
import { paddleService } from './paddle.service'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────
// MERCURY BANK
// https://docs.mercury.com/reference
// ─────────────────────────────────────────────────────────────

export class MercuryService {
  private readonly BASE = 'https://backend.mercury.com/api/v1'

  async connect(projectId: string | null, apiKey: string): Promise<void> {
    const headers = { Authorization: `Bearer ${apiKey}` }

    // Validate and fetch accounts
    const res = await axios.get(`${this.BASE}/accounts`, { headers })
    const accounts = res.data?.accounts || []

    for (const acct of accounts) {
      await prisma.bankAccount.upsert({
        where: { provider_accountId: { provider: 'mercury', accountId: acct.id } } as any,
        update: {
          balanceCurrent: acct.currentBalance,
          balanceAvailable: acct.availableBalance,
          lastUpdatedAt: new Date(),
        },
        create: {
          projectId,
          provider: 'mercury',
          accountId: acct.id,
          accountName: acct.name,
          accountType: acct.type,
          currency: acct.currency || 'USD',
          balanceCurrent: acct.currentBalance,
          balanceAvailable: acct.availableBalance,
          metadata: { routingNumber: acct.routingNumber, status: acct.status },
        },
      })

      // Store encrypted API key against the account
      await prisma.integration.upsert({
        where: { projectId_provider: { projectId: projectId || 'global', provider: 'MERCURY' } } as any,
        update: { status: 'ACTIVE', accessToken: encrypt(apiKey), errorMessage: null },
        create: {
          projectId: projectId || '',
          provider: 'MERCURY',
          status: 'ACTIVE',
          accessToken: encrypt(apiKey),
          accountId: accounts[0]?.id,
          displayName: 'Mercury',
        },
      })
    }
  }

  async syncTransactions(accountId: string, apiKey: string): Promise<number> {
    const headers = { Authorization: `Bearer ${apiKey}` }
    let synced = 0

    const res = await axios.get(`${this.BASE}/account/${accountId}/transactions`, {
      headers,
      params: { limit: 500 },
    })

    const bankAccount = await prisma.bankAccount.findFirst({
      where: { provider: 'mercury', accountId },
    })
    if (!bankAccount) return 0

    for (const txn of res.data?.transactions || []) {
      await prisma.bankTransaction.upsert({
        where: { externalId: txn.id },
        update: { pending: txn.status === 'pending' },
        create: {
          accountId: bankAccount.id,
          externalId: txn.id,
          amount: Math.abs(txn.amount),
          currency: 'USD',
          description: txn.bankDescription || txn.externalMemo,
          merchant: txn.counterpartyName,
          type: txn.amount > 0 ? 'credit' : 'debit',
          date: new Date(txn.createdAt),
          pending: txn.status === 'pending',
          metadata: { kind: txn.kind, failedAt: txn.failedAt },
        },
      }).catch(() => { })
      synced++
    }

    // Update current balance
    await prisma.bankAccount.update({
      where: { id: bankAccount.id },
      data: { lastUpdatedAt: new Date() },
    })

    return synced
  }
}

// ─────────────────────────────────────────────────────────────
// BREX
// https://developer.brex.com/docs
// ─────────────────────────────────────────────────────────────

export class BrexService {
  private readonly BASE = 'https://platform.brexapis.com'

  async connect(projectId: string | null, apiKey: string): Promise<void> {
    const headers = { Authorization: `Bearer ${apiKey}` }

    const [accountsRes, balancesRes] = await Promise.all([
      axios.get(`${this.BASE}/v2/accounts/cash`, { headers }),
      axios.get(`${this.BASE}/v2/accounts/cash/primary/statements`, { headers }),
    ])

    const acct = accountsRes.data?.primary_account

    await prisma.bankAccount.upsert({
      where: { provider_accountId: { provider: 'brex', accountId: acct?.id || 'brex_primary' } } as any,
      update: {
        balanceCurrent: acct?.current_balance?.amount / 100 || 0,
        balanceAvailable: acct?.available_balance?.amount / 100 || 0,
        lastUpdatedAt: new Date(),
      },
      create: {
        projectId,
        provider: 'brex',
        accountId: acct?.id || 'brex_primary',
        accountName: 'Brex Cash',
        accountType: 'checking',
        currency: acct?.current_balance?.currency || 'USD',
        balanceCurrent: acct?.current_balance?.amount / 100 || 0,
        balanceAvailable: acct?.available_balance?.amount / 100 || 0,
        metadata: { routingNumber: acct?.routing_number },
      },
    })

    await prisma.integration.upsert({
      where: { projectId_provider: { projectId: projectId || 'global', provider: 'BREX' } } as any,
      update: { status: 'ACTIVE', accessToken: encrypt(apiKey), errorMessage: null },
      create: {
        projectId: projectId || '',
        provider: 'BREX',
        status: 'ACTIVE',
        accessToken: encrypt(apiKey),
        displayName: 'Brex',
      },
    })
  }

  async syncTransactions(projectId: string | null, apiKey: string): Promise<number> {
    const headers = { Authorization: `Bearer ${apiKey}` }
    let synced = 0

    const account = await prisma.bankAccount.findFirst({ where: { provider: 'brex' } })
    if (!account) return 0

    let cursor: string | undefined
    let hasMore = true

    while (hasMore) {
      const params: any = { limit: 100 }
      if (cursor) params.cursor = cursor

      const res = await axios.get(`${this.BASE}/v2/transactions/cash`, { headers, params })
      const { items, next_cursor } = res.data

      for (const txn of items || []) {
        await prisma.bankTransaction.upsert({
          where: { externalId: txn.id },
          update: {},
          create: {
            accountId: account.id,
            externalId: txn.id,
            amount: Math.abs(txn.amount / 100),
            currency: txn.currency || 'USD',
            description: txn.description,
            merchant: txn.merchant?.raw_descriptor,
            type: txn.amount > 0 ? 'credit' : 'debit',
            date: new Date(txn.posted_at || txn.initiated_at_date),
            metadata: { category: txn.category, status: txn.status },
          },
        }).catch(() => { })
        synced++
      }

      cursor = next_cursor
      hasMore = !!cursor
    }

    return synced
  }
}

// ─────────────────────────────────────────────────────────────
// WISE (formerly TransferWise)
// https://docs.wise.com/api-docs/api-reference
// ─────────────────────────────────────────────────────────────

export class WiseService {
  private readonly BASE = 'https://api.wise.com'

  private getHeaders(apiKey: string) {
    return { Authorization: `Bearer ${apiKey}` }
  }

  async connect(projectId: string | null, apiKey: string): Promise<void> {
    const headers = this.getHeaders(apiKey)

    const profileRes = await axios.get(`${this.BASE}/v1/profiles`, { headers })
    const businessProfile = profileRes.data?.find((p: any) => p.type === 'business') || profileRes.data?.[0]

    const balancesRes = await axios.get(`${this.BASE}/v4/profiles/${businessProfile.id}/balances?types=STANDARD`, { headers })

    for (const balance of balancesRes.data || []) {
      await prisma.bankAccount.upsert({
        where: { provider_accountId: { provider: 'wise', accountId: String(balance.id) } } as any,
        update: {
          balanceCurrent: balance.amount.value,
          balanceAvailable: balance.amount.value,
          lastUpdatedAt: new Date(),
        },
        create: {
          projectId,
          provider: 'wise',
          accountId: String(balance.id),
          accountName: `Wise ${balance.currency}`,
          accountType: 'multi-currency',
          currency: balance.currency,
          balanceCurrent: balance.amount.value,
          balanceAvailable: balance.amount.value,
          metadata: { profileId: businessProfile.id },
        },
      })
    }

    await prisma.integration.upsert({
      where: { projectId_provider: { projectId: projectId || 'global', provider: 'WISE' } } as any,
      update: { status: 'ACTIVE', accessToken: encrypt(apiKey), accountId: String(businessProfile.id), errorMessage: null },
      create: {
        projectId: projectId || '',
        provider: 'WISE',
        status: 'ACTIVE',
        accessToken: encrypt(apiKey),
        accountId: String(businessProfile.id),
        displayName: 'Wise',
      },
    })
  }

  async getBalances(profileId: string, apiKey: string): Promise<any[]> {
    const res = await axios.get(
      `${this.BASE}/v4/profiles/${profileId}/balances?types=STANDARD`,
      { headers: this.getHeaders(apiKey) }
    )
    return res.data || []
  }

  async syncTransactions(profileId: string, balanceId: string, currency: string, apiKey: string): Promise<number> {
    const headers = this.getHeaders(apiKey)
    const account = await prisma.bankAccount.findFirst({
      where: { provider: 'wise', accountId: balanceId },
    })
    if (!account) return 0

    const since = new Date()
    since.setDate(since.getDate() - 90)

    const res = await axios.get(
      `${this.BASE}/v1/profiles/${profileId}/balance-movements`,
      { headers, params: { currency, intervalStart: since.toISOString(), intervalEnd: new Date().toISOString(), type: 'TRANSACTION' } }
    )

    let synced = 0
    for (const txn of res.data?.transactions || []) {
      await prisma.bankTransaction.upsert({
        where: { externalId: String(txn.referenceNumber) },
        update: {},
        create: {
          accountId: account.id,
          externalId: String(txn.referenceNumber),
          amount: Math.abs(txn.amount.value),
          currency: txn.amount.currency,
          description: txn.details?.description || txn.type,
          type: txn.amount.value > 0 ? 'credit' : 'debit',
          date: new Date(txn.date),
          metadata: { type: txn.type, runningBalance: txn.runningBalance },
        },
      }).catch(() => { })
      synced++
    }

    return synced
  }
}

export const mercuryService = new MercuryService()
export const brexService = new BrexService()
export const wiseService = new WiseService()
