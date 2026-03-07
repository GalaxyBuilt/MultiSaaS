// backend/src/controllers/projectsController.ts
// MultiSaaS — Projects Controller
// Handles all project-related API logic with mock data fallbacks

import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Mock Data (used when DB is not seeded) ───────────────────────────────────

const MOCK_PROJECTS = [
  {
    id: 'mock-1',
    name: 'FormFlow',
    slug: 'formflow',
    description: 'Drag-and-drop form builder with analytics and conditional logic.',
    website: 'https://formflow.example.com',
    status: 'ACTIVE',
    currency: 'USD',
    createdAt: '2024-01-15T00:00:00.000Z',
    _meta: { mrr: 5180, arr: 62160, customers: 102, growth: 4.2 },
  },
  {
    id: 'mock-2',
    name: 'InboxZen',
    slug: 'inboxzen',
    description: 'AI-powered email management and priority inbox for teams.',
    website: 'https://inboxzen.example.com',
    status: 'ACTIVE',
    currency: 'USD',
    createdAt: '2023-09-01T00:00:00.000Z',
    _meta: { mrr: 10940, arr: 131280, customers: 248, growth: 7.8 },
  },
  {
    id: 'mock-3',
    name: 'ShipTrackr',
    slug: 'shiptrackr',
    description: 'Real-time shipment tracking and logistics dashboard for e-commerce.',
    website: 'https://shiptrackr.example.com',
    status: 'ACTIVE',
    currency: 'USD',
    createdAt: '2024-03-10T00:00:00.000Z',
    _meta: { mrr: 3340, arr: 40080, customers: 63, growth: 2.1 },
  },
]

function generateMonthlyRevenue(baseAmount: number, months = 12) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    const growth = 1 + i * 0.03
    return {
      id: `rev-${i}`,
      date: d.toISOString(),
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      subscription: Math.round(baseAmount * growth),
      oneTime: Math.round(baseAmount * 0.08 * (0.7 + Math.random() * 0.6)),
      total: Math.round(baseAmount * growth * 1.08),
    }
  })
}

function generateMonthlyExpenses(baseAmount: number, months = 12) {
  const now = new Date()
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    return {
      id: `exp-${i}`,
      date: d.toISOString(),
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      infrastructure: Math.round(baseAmount * 0.4),
      marketing: Math.round(baseAmount * 0.3 * (0.8 + Math.random() * 0.4)),
      software: Math.round(baseAmount * 0.2),
      misc: Math.round(baseAmount * 0.1),
      total: Math.round(baseAmount * (0.95 + Math.random() * 0.1)),
    }
  })
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: { where: { userId: req.user!.id } },
        metrics: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 1 },
      },
    })

    if (projects.length === 0) {
      // Return mock data if DB is empty
      return res.json({ data: MOCK_PROJECTS, source: 'mock' })
    }

    return res.json({ data: projects, source: 'db' })
  } catch (error) {
    // Fallback to mock data on DB error
    res.json({ data: MOCK_PROJECTS, source: 'mock' })
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    // Check mock data first if id starts with 'mock-'
    if (id.startsWith('mock-')) {
      const mock = MOCK_PROJECTS.find((p) => p.id === id)
      if (!mock) return res.status(404).json({ error: 'Project not found' })
      return res.json({ data: mock, source: 'mock' })
    }

    const project = await prisma.project.findFirst({
      where: { id, members: { some: { userId: req.user!.id } } },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        metrics: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 6 },
        integrations: true,
      },
    })

    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json({ data: project, source: 'db' })
  } catch (error) {
    next(error)
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, slug, description, website, currency } = req.body

    const exists = await prisma.project.findUnique({ where: { slug } })
    if (exists) return res.status(409).json({ error: 'Slug already taken' })

    const project = await prisma.project.create({
      data: {
        name,
        slug,
        description,
        website,
        currency: currency || 'USD',
        members: {
          create: { userId: req.user!.id, role: 'OWNER' },
        },
      },
    })

    res.status(201).json({ data: project })
  } catch (error) {
    next(error)
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { name, description, website, status } = req.body

    const project = await prisma.project.update({
      where: { id },
      data: { name, description, website, status },
    })

    res.json({ data: project })
  } catch (error) {
    next(error)
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    await prisma.project.delete({ where: { id } })
    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export async function getProjectRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { months = '12' } = req.query

    if (id.startsWith('mock-')) {
      const mock = MOCK_PROJECTS.find((p) => p.id === id)
      if (!mock) return res.status(404).json({ error: 'Project not found' })

      const data = generateMonthlyRevenue(mock._meta.mrr, Number(months))
      const totalRevenue = data.reduce((s, r) => s + r.total, 0)
      const currentMrr = data[data.length - 1].subscription

      return res.json({
        data: { monthly: data, summary: { totalRevenue, currentMrr, arr: currentMrr * 12 } },
        source: 'mock',
      })
    }

    const entries = await prisma.revenueEntry.findMany({
      where: { projectId: id },
      orderBy: { date: 'desc' },
      take: Number(months) * 5,
    })

    res.json({ data: entries, source: 'db' })
  } catch (error) {
    next(error)
  }
}

export async function getProjectExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { months = '12' } = req.query

    if (id.startsWith('mock-')) {
      const mock = MOCK_PROJECTS.find((p) => p.id === id)
      if (!mock) return res.status(404).json({ error: 'Project not found' })

      const data = generateMonthlyExpenses(mock._meta.mrr * 0.25, Number(months))
      const totalExpenses = data.reduce((s, e) => s + e.total, 0)

      return res.json({
        data: { monthly: data, summary: { totalExpenses, avgMonthly: Math.round(totalExpenses / data.length) } },
        source: 'mock',
      })
    }

    const entries = await prisma.expenseEntry.findMany({
      where: { projectId: id },
      orderBy: { date: 'desc' },
      take: Number(months) * 5,
    })

    res.json({ data: entries, source: 'db' })
  } catch (error) {
    next(error)
  }
}

export async function getProjectMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params

    if (id.startsWith('mock-')) {
      const mock = MOCK_PROJECTS.find((p) => p.id === id)
      if (!mock) return res.status(404).json({ error: 'Project not found' })

      const monthly = generateMonthlyRevenue(mock._meta.mrr, 12)
      const expenses = generateMonthlyExpenses(mock._meta.mrr * 0.25, 12)

      return res.json({
        data: {
          mrr: mock._meta.mrr,
          arr: mock._meta.arr,
          customers: mock._meta.customers,
          mrrGrowth: mock._meta.growth,
          monthly: monthly.map((m, i) => ({
            month: m.month,
            revenue: m.total,
            expenses: expenses[i].total,
            profit: m.total - expenses[i].total,
            mrr: m.subscription,
          })),
        },
        source: 'mock',
      })
    }

    const metrics = await prisma.monthlyMetric.findMany({
      where: { projectId: id },
      orderBy: [{ year: 'asc' }, { month: 'asc' }],
      take: 12,
    })

    res.json({ data: metrics, source: 'db' })
  } catch (error) {
    next(error)
  }
}
