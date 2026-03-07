// packages/shared-types/src/index.ts
// MultiSaaS — Shared TypeScript Interfaces

export interface User {
  id: string
  email: string
  name: string
  role: 'OWNER' | 'ADMIN' | 'VIEWER'
  avatarUrl?: string
}

export interface Project {
  id: string
  name: string
  slug: string
  description?: string
  logo?: string
  website?: string
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED'
  currency: string
  createdAt: string
  updatedAt: string
  _meta?: ProjectMeta
}

export interface ProjectMeta {
  mrr: number
  arr: number
  customers: number
  mrrGrowth: number
}

export interface RevenueEntry {
  id: string
  projectId: string
  amount: number
  currency: string
  type: 'SUBSCRIPTION' | 'ONE_TIME' | 'REFUND' | 'UPGRADE' | 'DOWNGRADE'
  description?: string
  source?: string
  date: string
}

export interface ExpenseEntry {
  id: string
  projectId: string
  amount: number
  currency: string
  category: 'INFRASTRUCTURE' | 'MARKETING' | 'SALARIES' | 'SOFTWARE' | 'LEGAL' | 'SUPPORT' | 'MISC'
  description: string
  vendor?: string
  date: string
  recurring: boolean
}

export interface MonthlyMetric {
  projectId: string
  year: number
  month: number
  mrr: number
  arr: number
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  newCustomers: number
  churnedCustomers: number
  activeCustomers: number
}

export interface GlobalDashboard {
  summary: {
    totalMrr: number
    totalArr: number
    totalRevenueLtm: number
    totalExpensesLtm: number
    totalProfit: number
    totalCustomers: number
    avgMrrGrowth: number
    projectCount: number
  }
  projects: ProjectSummary[]
  mrrTrend: MrrTrendPoint[]
  revenueBreakdown: RevenueBreakdownItem[]
  expenseBreakdown: ExpenseBreakdownItem[]
}

export interface ProjectSummary {
  id: string
  name: string
  mrr: number
  arr: number
  customers: number
  mrrGrowth: number
  profitMargin: number
  status: string
}

export interface MrrTrendPoint {
  month: string
  mrr: number
  arr: number
}

export interface RevenueBreakdownItem {
  name: string
  value: number
  color: string
}

export interface ExpenseBreakdownItem {
  category: string
  amount: number
}

export interface ApiResponse<T> {
  data: T
  source: 'db' | 'mock'
  error?: string
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}
