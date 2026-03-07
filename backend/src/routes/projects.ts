// backend/src/routes/projects.ts
// MultiSaaS — Projects API
// GET /api/projects, POST, PUT, DELETE + revenue/expenses per project

import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectRevenue,
  getProjectExpenses,
  getProjectMetrics,
} from '../controllers/projectsController'

const router = Router()

// All project routes require authentication
router.use(authenticate)

// ─── Project CRUD ─────────────────────────────────────────────────────────────
router.get('/', getProjects)
router.post('/', createProject)
router.get('/:id', getProject)
router.put('/:id', updateProject)
router.delete('/:id', deleteProject)

// ─── Project Data ─────────────────────────────────────────────────────────────
router.get('/:id/revenue', getProjectRevenue)
router.get('/:id/expenses', getProjectExpenses)
router.get('/:id/metrics', getProjectMetrics)

export default router
