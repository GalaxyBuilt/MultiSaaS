// backend/src/services/banking/plaid.service.ts
// MultiSaaS — Plaid Integration
// Connects any bank via Plaid Link — accounts, balances, transactions

import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid'
import { PrismaClient } from '@prisma/client'
import { decrypt, encrypt } from '../../utils/crypto'
import { metricsService } from '../metrics.service'

const prisma = new PrismaClient()

function getPlaidClient() {
  const config = new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV as 'sandbox' | 'development' | 'production' || 'sandbox'],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID!,
        'PLAID-SECRET': process.env.PLAID_SECRET!,
      },
    },
  })
  return new PlaidApi(config)
}

export class PlaidService {

  // ─── Step 1: Create Link Token (sent to frontend to open Plaid Link UI) ──────

  async createLinkToken(userId: string, projectId: string): Promise<string> {
    const plaid = getPlaidClient()

    const response = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'MultiSaaS',
      products: [Products.Transactions, Products.Auth],
      country_codes: [CountryCode.Us, CountryCode.Gb, CountryCode.Ca, CountryCode.Eu],
      language: 'en',
      webhook: `${process.env.API_BASE_URL}/api/webhooks/plaid/${projectId}`,
      transactions: {
        days_requested: 730, // 2 years of history
      },
    })

    return response.data.link_token
  }

  // ─── Step 2: Exchange public token (called after user completes Plaid Link) ───

  async exchangePublicToken(
    projectId: string,
    publicToken: string,
    metadata: { institution: { name: string; institution_id: string }; accounts: any[] }
  ): Promise<void> {
    const plaid = getPlaidClient()

    // Exchange for permanent access token
    const exchangeRes = await plaid.itemPublicTokenExchange({ public_token: publicToken })
    const { access_token, item_id } = exchangeRes.data

    // Store encrypted access token
    await prisma.integration.upsert({
      where: { projectId_provider: { projectId, provider: 'PLAID' } },
      update: {
        status: 'ACTIVE',
        accessToken: encrypt(access_token),
        accountId: item_id,
        displayName: metadata.institution.name,
        metadata: {
          institutionId: metadata.institution.institution_id,
          institutionName: metadata.institution.name,
          accounts: metadata.accounts.map(a => ({ id: a.id, name: a.name, type: a.type, subtype: a.subtype })),
        },
        errorMessage: null,
      },
      create: {
        projectId,
        provider: 'PLAID',
        status: 'ACTIVE',
        accessToken: encrypt(access_token),
        accountId: item_id,
        displayName: metadata.institution.name,
        metadata: {
          institutionId: metadata.institution.institution_id,
          institutionName: metadata.institution.name,
          accounts: metadata.accounts.map(a => ({ id: a.id, name: a.name, type: a.type, subtype: a.subtype })),
        },
      },
    })

    // Fetch and store all connected accounts
    await this.syncAccounts(projectId, access_token, plaid)

    // Kick off initial transaction sync
    await this.syncTransactions(projectId)
  }

  // ─── Sync Accounts ────────────────────────────────────────────────────────────

  private async syncAccounts(projectId: string, accessToken: string, plaid: PlaidApi): Promise<void> {
    const res = await plaid.accountsGet({ access_token: accessToken })

    for (const acct of res.data.accounts) {
      await prisma.bankAccount.upsert({
        where: {
          provider_accountId: { provider: 'plaid', accountId: acct.account_id },
        } as any,
        update: {
          balanceCurrent: acct.balances.current || 0,
          balanceAvailable: acct.balances.available || acct.balances.current || 0,
          lastUpdatedAt: new Date(),
        },
        create: {
          projectId,
          provider: 'plaid',
          accountId: acct.account_id,
          accountName: acct.name,
          accountType: `${acct.type}/${acct.subtype || ''}`,
          currency: acct.balances.iso_currency_code || 'USD',
          balanceCurrent: acct.balances.current || 0,
          balanceAvailable: acct.balances.available || acct.balances.current || 0,
          metadata: {
            mask: acct.mask,
            officialName: acct.official_name,
            type: acct.type,
            subtype: acct.subtype,
            verificationStatus: acct.verification_status,
          },
        },
      })
    }
  }

  // ─── Sync Transactions (cursor-based incremental) ─────────────────────────────

  async syncTransactions(projectId: string): Promise<{ added: number; modified: number; removed: number }> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PLAID' } },
    })
    if (!integration?.accessToken) throw new Error('Plaid not connected for this project')

    const accessToken = decrypt(integration.accessToken)
    const plaid = getPlaidClient()

    const syncLog = await prisma.syncLog.create({
      data: { integrationId: integration.id, status: 'FAILED' },
    })

    let cursor = integration.syncCursor || undefined
    let added = 0, modified = 0, removed = 0
    let hasMore = true

    try {
      while (hasMore) {
        const res = await plaid.transactionsSync({
          access_token: accessToken,
          cursor,
          count: 500,
          options: { include_personal_finance_category: true },
        })

        const { added: newTxns, modified: modTxns, removed: removedTxns, next_cursor, has_more } = res.data

        // Handle added transactions
        for (const txn of newTxns) {
          const bankAccount = await prisma.bankAccount.findFirst({
            where: { provider: 'plaid', accountId: txn.account_id },
          })
          if (!bankAccount) continue

          await prisma.bankTransaction.upsert({
            where: { externalId: txn.transaction_id },
            update: {
              pending: txn.pending,
              description: txn.name,
              merchant: txn.merchant_name || txn.name,
              category: txn.personal_finance_category?.primary,
            },
            create: {
              accountId: bankAccount.id,
              externalId: txn.transaction_id,
              amount: Math.abs(txn.amount),
              currency: txn.iso_currency_code || 'USD',
              description: txn.name,
              merchant: txn.merchant_name || txn.name,
              // Plaid: positive = money OUT (debit), negative = money IN (credit)
              type: txn.amount > 0 ? 'debit' : 'credit',
              category: txn.personal_finance_category?.primary || txn.category?.[0],
              date: new Date(txn.date),
              pending: txn.pending,
              metadata: {
                plaidTxnId: txn.transaction_id,
                paymentChannel: txn.payment_channel,
                categoryDetailed: txn.personal_finance_category?.detailed,
                logoUrl: txn.logo_url,
                website: txn.website,
                counterparties: txn.counterparties,
              },
            },
          }).catch(() => {})
          added++
        }

        // Handle modified
        for (const txn of modTxns) {
          await prisma.bankTransaction.updateMany({
            where: { externalId: txn.transaction_id },
            data: {
              amount: Math.abs(txn.amount),
              pending: txn.pending,
              description: txn.name,
            },
          }).catch(() => {})
          modified++
        }

        // Handle removed (e.g. pending cleared)
        for (const txn of removedTxns) {
          await prisma.bankTransaction.deleteMany({
            where: { externalId: txn.transaction_id },
          }).catch(() => {})
          removed++
        }

        cursor = next_cursor
        hasMore = has_more
      }

      // Save the cursor for next incremental sync
      await prisma.integration.update({
        where: { id: integration.id },
        data: { syncCursor: cursor, status: 'ACTIVE', lastSyncedAt: new Date(), errorMessage: null },
      })

      // Refresh account balances
      await this.syncAccounts(projectId, accessToken, plaid)

      // Recalculate project metrics with new cash data
      await metricsService.recalculate(projectId)

      await prisma.syncLog.update({
        where: { id: syncLog.id },
        data: { status: 'SUCCESS', recordsSynced: added + modified, completedAt: new Date() },
      })
    } catch (err) {
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

    return { added, modified, removed }
  }

  // ─── Get Live Balances ────────────────────────────────────────────────────────

  async getLiveBalances(projectId: string): Promise<any[]> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PLAID' } },
    })
    if (!integration?.accessToken) throw new Error('Plaid not connected')

    const plaid = getPlaidClient()
    const res = await plaid.accountsBalanceGet({
      access_token: decrypt(integration.accessToken),
    })

    // Update stored balances
    for (const acct of res.data.accounts) {
      await prisma.bankAccount.updateMany({
        where: { provider: 'plaid', accountId: acct.account_id },
        data: {
          balanceCurrent: acct.balances.current || 0,
          balanceAvailable: acct.balances.available || acct.balances.current || 0,
          lastUpdatedAt: new Date(),
        },
      })
    }

    return res.data.accounts.map(a => ({
      accountId: a.account_id,
      name: a.name,
      type: a.type,
      subtype: a.subtype,
      balanceCurrent: a.balances.current,
      balanceAvailable: a.balances.available,
      currency: a.balances.iso_currency_code,
      mask: a.mask,
    }))
  }

  // ─── Handle Webhook ───────────────────────────────────────────────────────────

  async handleWebhook(projectId: string, body: any): Promise<void> {
    const { webhook_type, webhook_code, item_id } = body

    console.log(`[Plaid Webhook] ${webhook_type}/${webhook_code} for item ${item_id}`)

    if (webhook_type === 'TRANSACTIONS') {
      switch (webhook_code) {
        case 'SYNC_UPDATES_AVAILABLE':
        case 'DEFAULT_UPDATE':
        case 'INITIAL_UPDATE':
        case 'HISTORICAL_UPDATE':
          // New transactions available — trigger incremental sync
          await this.syncTransactions(projectId).catch(err =>
            console.error('[Plaid] Webhook sync failed:', err.message)
          )
          break
        case 'TRANSACTIONS_REMOVED':
          await this.syncTransactions(projectId).catch(console.error)
          break
      }
    }

    if (webhook_type === 'ITEM') {
      switch (webhook_code) {
        case 'ERROR':
          await prisma.integration.updateMany({
            where: { projectId, provider: 'PLAID' },
            data: { status: 'ERROR', errorMessage: body.error?.error_message || 'Plaid item error' },
          })
          break
        case 'PENDING_EXPIRATION':
          await prisma.integration.updateMany({
            where: { projectId, provider: 'PLAID' },
            data: { errorMessage: 'Plaid access token expiring — user must re-authenticate' },
          })
          break
        case 'USER_PERMISSION_REVOKED':
          await prisma.integration.updateMany({
            where: { projectId, provider: 'PLAID' },
            data: { status: 'DISCONNECTED', accessToken: null },
          })
          break
      }
    }
  }

  // ─── Create Update Mode Link Token (for re-auth / expired tokens) ────────────

  async createUpdateLinkToken(userId: string, projectId: string): Promise<string> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PLAID' } },
    })
    if (!integration?.accessToken) throw new Error('No existing Plaid connection found')

    const plaid = getPlaidClient()

    const res = await plaid.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'MultiSaaS',
      access_token: decrypt(integration.accessToken), // update mode
      country_codes: [CountryCode.Us, CountryCode.Gb, CountryCode.Ca, CountryCode.Eu],
      language: 'en',
    })

    return res.data.link_token
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────────

  async disconnect(projectId: string): Promise<void> {
    const integration = await prisma.integration.findUnique({
      where: { projectId_provider: { projectId, provider: 'PLAID' } },
    })

    if (integration?.accessToken) {
      // Remove access at Plaid's end
      const plaid = getPlaidClient()
      await plaid.itemRemove({
        access_token: decrypt(integration.accessToken),
      }).catch(err => console.warn('[Plaid] Item remove failed:', err.message))
    }

    await prisma.integration.update({
      where: { projectId_provider: { projectId, provider: 'PLAID' } },
      data: { status: 'DISCONNECTED', accessToken: null, syncCursor: null, errorMessage: null },
    })
  }
}

export const plaidService = new PlaidService()
