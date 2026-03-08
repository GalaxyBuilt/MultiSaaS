// src/types/index.ts

export interface User {
  id: string
  email: string
  name: string
  role: 'SUPERADMIN' | 'MEMBER'
  avatarUrl?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
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
  members?: ProjectMember[]
  metrics?: MonthlyMetric[]
}

export interface ProjectMember {
  id: string
  userId: string
  projectId: string
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER'
  user?: User
}

export interface MonthlyMetric {
  id: string
  projectId: string
  year: number
  month: number
  mrr: number
  arr: number
  totalRevenue: number
  subscriptionRevenue: number
  oneTimeRevenue: number
  totalRefunds: number
  totalExpenses: number
  netProfit: number
  grossMargin: number
  newCustomers: number
  churnedCustomers: number
  activeCustomers: number
  churnRate: number
  arpu: number
  cashBalance: number
  burnRate: number
  runway: number
}

export interface RevenueEntry {
  id: string
  projectId: string
  amount: number
  amountDecimal: number
  currency: string
  type: 'SUBSCRIPTION' | 'ONE_TIME' | 'REFUND' | 'UPGRADE' | 'DOWNGRADE' | 'CREDIT' | 'CHARGEBACK'
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'DISPUTED'
  description?: string
  source?: string
  externalId?: string
  customerId?: string
  customerEmail?: string
  subscriptionId?: string
  date: string
}

export interface ExpenseEntry {
  id: string
  projectId: string
  amount: number
  currency: string
  category: 'INFRASTRUCTURE' | 'MARKETING' | 'SALARIES' | 'SOFTWARE' | 'LEGAL' | 'SUPPORT' | 'BANKING' | 'TAXES' | 'R_AND_D' | 'MISC'
  description: string
  vendor?: string
  date: string
  recurring: boolean
}

export interface Integration {
  id: string
  provider: 'STRIPE' | 'PAYPAL' | 'PADDLE' | 'BREX' | 'MERCURY' | 'WISE' | 'PLAID' | 'QUICKBOOKS' | 'XERO'
  status: 'PENDING' | 'ACTIVE' | 'ERROR' | 'DISCONNECTED' | 'SYNCING'
  displayName?: string
  accountId?: string
  lastSyncedAt?: string
  errorMessage?: string
  metadata?: Record<string, any>
}

export interface AIInsight {
  id: string
  projectId: string
  type: 'COST_OPTIMIZATION' | 'REVENUE_ALERT' | 'CHURN_ALERT' | 'CASH_ALLOCATION' | 'FORECAST' | 'ANOMALY' | 'MILESTONE' | 'GENERAL'
  title: string
  body: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS'
  isRead: boolean
  isDismissed: boolean
  generatedAt: string
}

export interface AIConfig {
  id: string
  provider: 'OPENAI' | 'ANTHROPIC' | 'MISTRAL' | 'COHERE' | 'OLLAMA' | 'CUSTOM'
  model: string
  isDefault: boolean
  createdAt: string
}

export interface BankAccount {
  id: string
  provider: string
  accountId: string
  accountName: string
  accountType: string
  currency: string
  balanceCurrent: number
  balanceAvailable: number
  lastUpdatedAt: string
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
    totalCash: number
    totalRunway: number
  }
  projects: ProjectSummary[]
  mrrTrend: { month: string; mrr: number; arr: number }[]
  revenueBreakdown: { name: string; value: number; color: string }[]
  expenseBreakdown: { category: string; amount: number; pct: number; color: string }[]
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

export interface Notification {
  id: string
  title: string
  body: string
  type: string
  channel: string
  isRead: boolean
  createdAt: string
}

export interface SyncLog {
  id: string
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED'
  recordsSynced: number
  errorMessage?: string
  startedAt: string
  completedAt?: string
}

export type ApiResponse<T> = { data: T; source?: string }
