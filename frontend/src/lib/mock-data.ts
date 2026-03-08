// src/lib/mock-data.ts — MultiSaaS Demo Data

import type { GlobalDashboard, Project, MonthlyMetric, Notification, AIInsight } from '@/types'

export const MOCK_PROJECTS: Project[] = [
    {
        id: 'p1',
        name: 'BlogBanana AI',
        slug: 'blog-banana',
        description: 'AI-powered content generation for modern blogs.',
        website: 'blogbanana.ai',
        status: 'ACTIVE',
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: [
            {
                id: 'm1', projectId: 'p1', year: 2026, month: 3,
                mrr: 12450, arr: 149400, totalRevenue: 12450, subscriptionRevenue: 11000, oneTimeRevenue: 1450,
                totalRefunds: 0, totalExpenses: 1200, netProfit: 11250, grossMargin: 92,
                newCustomers: 45, churnedCustomers: 8, activeCustomers: 412,
                churnRate: 2.1, arpu: 30, cashBalance: 45000, burnRate: 0, runway: 24
            } as MonthlyMetric
        ]
    },
    {
        id: 'p2',
        name: 'Txchyon',
        slug: 'txchyon',
        description: 'Next-gen compute for edge applications.',
        website: 'txchyon.io',
        status: 'ACTIVE',
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: [
            {
                id: 'm2', projectId: 'p2', year: 2026, month: 3,
                mrr: 8900, arr: 106800, totalRevenue: 8900, subscriptionRevenue: 8900, oneTimeRevenue: 0,
                totalRefunds: 0, totalExpenses: 2100, netProfit: 6800, grossMargin: 88,
                newCustomers: 12, churnedCustomers: 3, activeCustomers: 184,
                churnRate: 1.8, arpu: 48, cashBalance: 120000, burnRate: 0, runway: 18
            } as MonthlyMetric
        ]
    },
    {
        id: 'p3',
        name: 'EverRank',
        slug: 'everrank',
        description: 'Automated SEO auditing and backlink tracking.',
        website: 'everrank.dev',
        status: 'ACTIVE',
        currency: 'USD',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metrics: [
            {
                id: 'm3', projectId: 'p3', year: 2026, month: 3,
                mrr: 4200, arr: 50400, totalRevenue: 4200, subscriptionRevenue: 3800, oneTimeRevenue: 400,
                totalRefunds: 0, totalExpenses: 400, netProfit: 3800, grossMargin: 95,
                newCustomers: 8, churnedCustomers: 4, activeCustomers: 89,
                churnRate: 4.5, arpu: 47, cashBalance: 15000, burnRate: 0, runway: 36
            } as MonthlyMetric
        ]
    }
]

export const MOCK_DASHBOARD: GlobalDashboard = {
    summary: {
        totalMrr: 25550,
        totalArr: 306600,
        totalRevenueLtm: 285000,
        totalExpensesLtm: 73000,
        totalProfit: 212000,
        totalCustomers: 685,
        avgMrrGrowth: 12.4,
        projectCount: 3,
        totalCash: 180000,
        totalRunway: 24
    },
    projects: MOCK_PROJECTS.map(p => ({
        id: p.id,
        name: p.name,
        mrr: p.metrics?.[0].mrr || 0,
        arr: p.metrics?.[0].arr || 0,
        customers: p.metrics?.[0].activeCustomers || 0,
        mrrGrowth: 4.7,
        profitMargin: p.metrics?.[0].grossMargin || 0,
        status: p.status
    })),
    mrrTrend: [
        { month: 'Oct', mrr: 18200, arr: 218400 },
        { month: 'Nov', mrr: 19500, arr: 234000 },
        { month: 'Dec', mrr: 21000, arr: 252000 },
        { month: 'Jan', mrr: 22800, arr: 273600 },
        { month: 'Feb', mrr: 24100, arr: 289200 },
        { month: 'Mar', mrr: 25550, arr: 306600 },
    ],
    revenueBreakdown: [
        { name: 'BlogBanana AI', value: 12450, color: '#7c6aff' },
        { name: 'Txchyon', value: 8900, color: '#00e5cc' },
        { name: 'EverRank', value: 4200, color: '#f5a623' },
    ],
    expenseBreakdown: [
        { category: 'Infrastructure', amount: 32000, pct: 44, color: '#7c6aff' },
        { category: 'Marketing', amount: 21000, pct: 29, color: '#00e5cc' },
        { category: 'Salaries', amount: 15000, pct: 20, color: '#f5a623' },
        { category: 'Software', amount: 5000, pct: 7, color: '#ff6b6b' },
    ]
}

export const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'n1',
        title: 'Sync Complete',
        body: 'BlogBanana AI transactions synced successfully from Stripe.',
        type: 'SYNC_COMPLETE',
        channel: 'in_app',
        isRead: false,
        createdAt: new Date().toISOString()
    },
    {
        id: 'n2',
        title: 'New Insight',
        body: 'EverRank churn rate increased by 1.2% this month.',
        type: 'INSIGHT',
        channel: 'in_app',
        isRead: true,
        createdAt: new Date(Date.now() - 86400000).toISOString()
    }
]

export const MOCK_INSIGHTS: AIInsight[] = [
    {
        id: 'i1',
        projectId: 'p1',
        type: 'GENERAL',
        title: 'Traffic Surge',
        body: 'BlogBanana AI traffic increased 22% this week. Consider scaling your infrastructure.',
        severity: 'SUCCESS',
        isRead: false,
        isDismissed: false,
        generatedAt: new Date().toISOString()
    },
    {
        id: 'i2',
        projectId: 'p3',
        type: 'CHURN_ALERT',
        title: 'Churn Risk',
        body: 'Churn risk detected in EverRank users from the "Pro" plan. 4 users are inactive.',
        severity: 'WARNING',
        isRead: false,
        isDismissed: false,
        generatedAt: new Date().toISOString()
    }
]
