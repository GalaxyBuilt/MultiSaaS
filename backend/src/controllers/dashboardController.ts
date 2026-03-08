// backend/src/controllers/dashboardController.ts
// MultiSaaS — Global Dashboard Controller
// GET /api/dashboard/global — aggregated metrics across all projects

import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Mock Global Dashboard Data ───────────────────────────────────────────────

const MOCK_GLOBAL = {
  summary: {
    totalMrr: 19460,
    totalArr: 233520,
    totalRevenueLtm: 198840,
    totalExpensesLtm: 54200,
    totalProfit: 144640,
    totalCustomers: 413,
    avgMrrGrowth: 4.7,
    projectCount: 3,
  },
  projects: [
    {
      id: 'mock-1',
      name: 'FormFlow',
      mrr: 5180,
      arr: 62160,
      customers: 102,
      mrrGrowth: 4.2,
      profitMargin: 72,
      status: 'ACTIVE',
    },
    {
      id: 'mock-2',
      name: 'InboxZen',
      mrr: 10940,
      arr: 131280,
      customers: 248,
      mrrGrowth: 7.8,
      profitMargin: 78,
      status: 'ACTIVE',
    },
    {
      id: 'mock-3',
      name: 'ShipTrackr',
      mrr: 3340,
      arr: 40080,
      customers: 63,
      mrrGrowth: 2.1,
      profitMargin: 68,
      status: 'ACTIVE',
    },
  ],
  mrrTrend: generateMrrTrend(),
  revenueBreakdown: [
    { name: 'FormFlow', value: 5180, color: '#6366f1' },
    { name: 'InboxZen', value: 10940, color: '#22d3ee' },
    { name: 'ShipTrackr', value: 3340, color: '#f59e0b' },
  ],
  expenseBreakdown: [
    { category: 'Infrastructure', amount: 14800 },
    { category: 'Marketing', amount: 19600 },
    { category: 'Software', amount: 13200 },
    { category: 'Misc', amount: 6600 },
  ],
}

function generateMrrTrend() {
  const base = [14200, 14900, 15600, 16100, 16800, 17200, 17800, 18100, 18600, 19000, 19200, 19460]
  const now = new Date()
  return base.map((mrr, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return {
      month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
      mrr,
      arr: mrr * 12,
    }
  })
}

// ─── Controller ───────────────────────────────────────────────────────────────

export async function getGlobalDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id

    const projects = await prisma.project.findMany({
      where: { members: { some: { userId } } },
      include: {
        metrics: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
        },
      },
    })

    if (projects.length === 0) {
      return res.json({ data: MOCK_GLOBAL, source: 'mock' })
    }

    // Aggregate real data
    let totalMrr = 0
    let totalCustomers = 0

    const projectSummaries = projects.map((p: any) => {
      const latest = p.metrics[0]
      totalMrr += latest?.mrr || 0
      totalCustomers += latest?.activeCustomers || 0

      return {
        id: p.id,
        name: p.name,
        mrr: latest?.mrr || 0,
        arr: latest?.arr || 0,
        customers: latest?.activeCustomers || 0,
        status: p.status,
      }
    })

    res.json({
      data: {
        summary: {
          totalMrr,
          totalArr: totalMrr * 12,
          totalCustomers,
          projectCount: projects.length,
        },
        projects: projectSummaries,
      },
      source: 'db',
    })
  } catch (error) {
    // Fallback to mock
    res.json({ data: MOCK_GLOBAL, source: 'mock' })
  }
}
