// src/lib/api.ts — MultiSaaS Production API Client

import axios, { AxiosInstance } from 'axios'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || true // Force demo for now

import * as mockData from './mock-data'

// ─── Axios Instance ───────────────────────────────────────────────────────────

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach access token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken })
        localStorage.setItem('accessToken', data.data.accessToken)
        localStorage.setItem('refreshToken', data.data.refreshToken)
        original.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    if (IS_DEMO) return { data: { data: { user: { name: 'Demo User', email: 'demo@multisaas.dev' }, accessToken: 'mock-at', refreshToken: 'mock-rt' } } }
    return api.post('/auth/login', { email, password })
  },
  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),
  logout: (refreshToken: string) =>
    IS_DEMO ? Promise.resolve() : api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: async () => {
    if (IS_DEMO) return { data: { data: mockData.MOCK_PROJECTS } }
    return api.get('/projects')
  },
  get: async (id: string) => {
    if (IS_DEMO) return { data: { data: mockData.MOCK_PROJECTS.find(p => p.id === id) || mockData.MOCK_PROJECTS[0] } }
    return api.get(`/projects/${id}`)
  },
  create: (data: { name: string; slug: string; description?: string; website?: string; currency?: string }) =>
    api.post('/projects', data),
  update: (id: string, data: Partial<{ name: string; description: string; website: string; status: string }>) =>
    api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  revenue: (id: string, params?: { months?: number; page?: number; limit?: number }) =>
    api.get(`/projects/${id}/revenue`, { params }),
  expenses: (id: string, params?: { months?: number; page?: number; limit?: number }) =>
    api.get(`/projects/${id}/expenses`, { params }),
  metrics: (id: string) => api.get(`/projects/${id}/metrics`),
  addExpense: (id: string, data: any) => api.post(`/projects/${id}/expenses`, data),
  addRevenue: (id: string, data: any) => api.post(`/projects/${id}/revenue`, data),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  global: async () => {
    if (IS_DEMO) return { data: { data: mockData.MOCK_DASHBOARD } }
    return api.get('/dashboard/global')
  },
}

// ─── Integrations (Payment) ───────────────────────────────────────────────────

export const integrationsApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/integrations`),
  connectStripe: (projectId: string, secretKey: string) =>
    api.post(`/projects/${projectId}/integrations/stripe/connect`, { secretKey }),
  connectPayPal: (projectId: string, clientId: string, clientSecret: string) =>
    api.post(`/projects/${projectId}/integrations/paypal/connect`, { clientId, clientSecret }),
  connectPaddle: (projectId: string, apiKey: string, webhookSecret: string) =>
    api.post(`/projects/${projectId}/integrations/paddle/connect`, { apiKey, webhookSecret }),
  connectMercury: (projectId: string, apiKey: string) =>
    api.post(`/projects/${projectId}/integrations/mercury/connect`, { apiKey }),
  connectBrex: (projectId: string, apiKey: string) =>
    api.post(`/projects/${projectId}/integrations/brex/connect`, { apiKey }),
  connectWise: (projectId: string, apiKey: string) =>
    api.post(`/projects/${projectId}/integrations/wise/connect`, { apiKey }),
  sync: (projectId: string, provider: string) =>
    api.post(`/projects/${projectId}/integrations/${provider}/sync`),
  disconnect: (projectId: string, provider: string) =>
    api.delete(`/projects/${projectId}/integrations/${provider}`),
  syncLogs: (projectId: string, provider: string) =>
    api.get(`/projects/${projectId}/integrations/${provider}/logs`),
}

// ─── Plaid ────────────────────────────────────────────────────────────────────

export const plaidApi = {
  getLinkToken: (projectId: string) =>
    api.post(`/plaid/projects/${projectId}/link-token`),
  getUpdateLinkToken: (projectId: string) =>
    api.post(`/plaid/projects/${projectId}/link-token/update`),
  exchange: (projectId: string, publicToken: string, metadata: any) =>
    api.post(`/plaid/projects/${projectId}/exchange`, { publicToken, metadata }),
  sync: (projectId: string) =>
    api.post(`/plaid/projects/${projectId}/sync`),
  balances: (projectId: string) =>
    api.get(`/plaid/projects/${projectId}/balances`),
  disconnect: (projectId: string) =>
    api.delete(`/plaid/projects/${projectId}`),
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export const aiApi = {
  getConfigs: () => api.get('/ai/config'),
  addConfig: (data: { provider: string; apiKey: string; model: string; isDefault?: boolean; metadata?: any }) =>
    api.post('/ai/config', data),
  deleteConfig: (id: string) => api.delete(`/ai/config/${id}`),
  getInsights: async (projectId: string, unread?: boolean) => {
    if (IS_DEMO) return { data: { data: mockData.MOCK_INSIGHTS } }
    return api.get(`/ai/projects/${projectId}/insights`, { params: { unread } })
  },
  generate: (projectId: string, type: string) =>
    api.post(`/ai/projects/${projectId}/insights/generate`, { type }),
  autoAlerts: (projectId: string) =>
    api.post(`/ai/projects/${projectId}/insights/auto`),
  markRead: (id: string) => api.patch(`/ai/insights/${id}/read`),
  dismiss: (id: string) => api.patch(`/ai/insights/${id}/dismiss`),
}

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: async () => {
    if (IS_DEMO) return { data: { data: mockData.MOCK_NOTIFICATIONS } }
    return api.get('/notifications')
  },
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function fmt(n: number, currency = 'USD') {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
}

export function fmtFull(n: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

export function fmtPct(n: number) { return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%` }
export function fmtNum(n: number) { return new Intl.NumberFormat('en-US').format(n) }
