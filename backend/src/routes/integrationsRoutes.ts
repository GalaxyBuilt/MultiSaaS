// backend/src/routes/integrations.ts
import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import * as integrationsController from '../controllers/integrationsController'

const router = Router()

router.use(authenticate)

router.get('/:projectId/integrations', integrationsController.getIntegrations)
router.post('/:projectId/integrations/stripe/connect', integrationsController.connectStripe)
router.post('/:projectId/integrations/paypal/connect', integrationsController.connectPayPal)
router.post('/:projectId/integrations/paddle/connect', integrationsController.connectPaddle)
router.post('/:projectId/integrations/mercury/connect', integrationsController.connectMercury)
router.post('/:projectId/integrations/brex/connect', integrationsController.connectBrex)
router.post('/:projectId/integrations/wise/connect', integrationsController.connectWise)

router.post('/:projectId/integrations/:provider/sync', integrationsController.syncIntegration)
router.delete('/:projectId/integrations/:provider', integrationsController.disconnectIntegration)
router.get('/:projectId/integrations/:provider/logs', integrationsController.getSyncLogs)

// Webhooks (unauthenticated)
router.post('/webhooks/stripe/:projectId', integrationsController.stripeWebhook)
router.post('/webhooks/paddle/:projectId', integrationsController.paddleWebhook)

export default router
