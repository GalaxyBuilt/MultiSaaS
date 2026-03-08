// backend/src/routes/plaid.ts
// MultiSaaS — Plaid API routes

import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  createLinkToken,
  exchangeToken,
  syncTransactions,
  getLiveBalances,
  createUpdateLinkToken,
  disconnectPlaid,
  plaidWebhook,
} from '../controllers/plaidController'

const router = Router()

// Webhook — no auth, verified by Plaid signature
router.post('/webhooks/plaid/:projectId', plaidWebhook)

router.use(authenticate)

// POST /api/plaid/projects/:projectId/link-token
// Frontend calls this first to get a link_token for Plaid Link UI
router.post('/plaid/projects/:projectId/link-token', createLinkToken)

// POST /api/plaid/projects/:projectId/link-token/update
// Re-auth flow for expired/broken connections
router.post('/plaid/projects/:projectId/link-token/update', createUpdateLinkToken)

// POST /api/plaid/projects/:projectId/exchange
// Called after user completes Plaid Link — exchanges public_token for access_token
router.post('/plaid/projects/:projectId/exchange', exchangeToken)

// POST /api/plaid/projects/:projectId/sync
// Manually trigger incremental transaction sync
router.post('/plaid/projects/:projectId/sync', syncTransactions)

// GET /api/plaid/projects/:projectId/balances
// Get live account balances from Plaid
router.get('/plaid/projects/:projectId/balances', getLiveBalances)

// DELETE /api/plaid/projects/:projectId
// Disconnect Plaid and revoke access token
router.delete('/plaid/projects/:projectId', disconnectPlaid)

export default router
