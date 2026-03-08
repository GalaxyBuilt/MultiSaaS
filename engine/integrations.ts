// backend/src/routes/integrations.ts
// MultiSaaS — Integration connect/sync/disconnect endpoints

import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  connectStripe, connectPayPal, connectPaddle,
  connectMercury, connectBrex, connectWise,
  syncIntegration, disconnectIntegration,
  getIntegrations, getSyncLogs,
  stripeWebhook, paddleWebhook,
} from '../controllers/integrationsController'

const router = Router()

// Webhooks (no auth — validated by signature)
router.post('/webhooks/stripe/:projectId', stripeWebhook)
router.post('/webhooks/paddle/:projectId', paddleWebhook)

router.use(authenticate)

// Payment integrations
router.get('/projects/:projectId/integrations', getIntegrations)
router.post('/projects/:projectId/integrations/stripe/connect', connectStripe)
router.post('/projects/:projectId/integrations/paypal/connect', connectPayPal)
router.post('/projects/:projectId/integrations/paddle/connect', connectPaddle)

// Banking integrations
router.post('/projects/:projectId/integrations/mercury/connect', connectMercury)
router.post('/projects/:projectId/integrations/brex/connect', connectBrex)
router.post('/projects/:projectId/integrations/wise/connect', connectWise)

// Sync & management
router.post('/projects/:projectId/integrations/:provider/sync', syncIntegration)
router.delete('/projects/:projectId/integrations/:provider', disconnectIntegration)
router.get('/projects/:projectId/integrations/:provider/logs', getSyncLogs)

export default router
