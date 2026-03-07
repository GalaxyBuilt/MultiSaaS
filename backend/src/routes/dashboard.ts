import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { getGlobalDashboard } from '../controllers/dashboardController'

const router = Router()

// Global dashboard requires authentication
router.get('/global', authenticate, getGlobalDashboard)

export default router
