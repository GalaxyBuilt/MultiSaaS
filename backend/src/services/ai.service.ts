// backend/src/services/ai/ai.service.ts
// MultiSaaS — Model-Agnostic AI Agent Layer
// Supports OpenAI, Anthropic, Mistral, Cohere, Ollama, Custom endpoints

import axios from 'axios'
import { PrismaClient } from '@prisma/client'
import { decrypt } from '../utils/crypto'

const prisma = new PrismaClient()

// ─── AI Provider Adapters ─────────────────────────────────────────────────────

interface AIMessage { role: 'system' | 'user' | 'assistant'; content: string }
interface AIResponse { text: string; tokensUsed?: number }

async function callOpenAI(apiKey: string, model: string, messages: AIMessage[]): Promise<AIResponse> {
  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    { model, messages, temperature: 0.3, max_tokens: 1500 },
    { headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' } }
  )
  return {
    text: res.data.choices[0].message.content,
    tokensUsed: res.data.usage?.total_tokens,
  }
}

async function callAnthropic(apiKey: string, model: string, messages: AIMessage[]): Promise<AIResponse> {
  const system = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model, max_tokens: 1500, system, messages: userMessages },
    { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
  )
  return { text: res.data.content[0].text, tokensUsed: res.data.usage?.input_tokens + res.data.usage?.output_tokens }
}

async function callMistral(apiKey: string, model: string, messages: AIMessage[]): Promise<AIResponse> {
  const res = await axios.post(
    'https://api.mistral.ai/v1/chat/completions',
    { model, messages, temperature: 0.3, max_tokens: 1500 },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  return { text: res.data.choices[0].message.content }
}

async function callOllama(endpoint: string, model: string, messages: AIMessage[]): Promise<AIResponse> {
  const res = await axios.post(
    `${endpoint}/api/chat`,
    { model, messages, stream: false },
    { timeout: 60000 }
  )
  return { text: res.data.message.content }
}

async function callCustom(endpoint: string, apiKey: string, model: string, messages: AIMessage[]): Promise<AIResponse> {
  const res = await axios.post(
    endpoint,
    { model, messages },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  )
  return { text: res.data.choices?.[0]?.message?.content || res.data.content || JSON.stringify(res.data) }
}

// ─── Main AI Service ──────────────────────────────────────────────────────────

export class AIService {
  private async getConfig(userId: string) {
    return prisma.aIConfig.findFirst({
      where: { userId, isDefault: true },
    })
  }

  private async dispatch(config: any, messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = config.apiKey ? decrypt(config.apiKey) : ''
    const { provider, model, metadata } = config

    switch (provider) {
      case 'OPENAI': return callOpenAI(apiKey, model, messages)
      case 'ANTHROPIC': return callAnthropic(apiKey, model, messages)
      case 'MISTRAL': return callMistral(apiKey, model, messages)
      case 'OLLAMA': return callOllama(metadata?.endpoint || 'http://localhost:11434', model, messages)
      case 'CUSTOM': return callCustom(metadata?.endpoint, apiKey, model, messages)
      default: throw new Error(`Unsupported AI provider: ${provider}`)
    }
  }

  // ─── Build Context from Real Data ──────────────────────────────────────────────

  private async buildProjectContext(projectId: string): Promise<string> {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const [project, latestMetric, prevMetric, recentRevenue, recentExpenses, bankAccounts] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.monthlyMetric.findFirst({ where: { projectId, year: currentYear, month: currentMonth }, }),
      prisma.monthlyMetric.findFirst({ where: { projectId, year: currentMonth === 1 ? currentYear - 1 : currentYear, month: currentMonth === 1 ? 12 : currentMonth - 1 } }),
      prisma.revenueEntry.findMany({ where: { projectId }, orderBy: { date: 'desc' }, take: 30 }),
      prisma.expenseEntry.findMany({ where: { projectId }, orderBy: { date: 'desc' }, take: 30 }),
      prisma.bankAccount.findMany({ where: { projectId } }),
    ])

    const expenseByCategory: Record<string, number> = {}
    for (const e of recentExpenses) {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount
    }

    const totalCash = bankAccounts.reduce((s, a) => s + a.balanceCurrent, 0)

    return `
PROJECT: ${project?.name} (${project?.status})
CURRENCY: ${project?.currency}
REPORTING PERIOD: ${currentMonth}/${currentYear}

=== CURRENT METRICS ===
MRR: $${latestMetric?.mrr?.toFixed(2) || 0}
ARR: $${latestMetric?.arr?.toFixed(2) || 0}
Active Customers: ${latestMetric?.activeCustomers || 0}
New Customers: ${latestMetric?.newCustomers || 0}
Churned Customers: ${latestMetric?.churnedCustomers || 0}
Churn Rate: ${latestMetric?.churnRate?.toFixed(2) || 0}%
ARPU: $${latestMetric?.arpu?.toFixed(2) || 0}
Total Revenue (month): $${latestMetric?.totalRevenue?.toFixed(2) || 0}
Total Expenses (month): $${latestMetric?.totalExpenses?.toFixed(2) || 0}
Net Profit (month): $${latestMetric?.netProfit?.toFixed(2) || 0}
Gross Margin: ${latestMetric?.grossMargin?.toFixed(1) || 0}%
Burn Rate: $${latestMetric?.burnRate?.toFixed(2) || 0}/month
Runway: ${latestMetric?.runway?.toFixed(1) || 'unknown'} months

=== VS PRIOR MONTH ===
Prior MRR: $${prevMetric?.mrr?.toFixed(2) || 0}
MRR Growth: ${prevMetric?.mrr ? (((latestMetric?.mrr || 0) - prevMetric.mrr) / prevMetric.mrr * 100).toFixed(1) : 'N/A'}%
Prior Churn Rate: ${prevMetric?.churnRate?.toFixed(2) || 0}%

=== EXPENSE BREAKDOWN (last 30 days) ===
${Object.entries(expenseByCategory).map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`).join('\n')}

=== RECENT REVENUE (last 10 transactions) ===
${recentRevenue.slice(0, 10).map(r => `${r.date.toISOString().split('T')[0]} | ${r.type} | $${r.amountDecimal.toFixed(2)} | ${r.source}`).join('\n')}

=== CASH POSITIONS ===
Total Cash: $${totalCash.toFixed(2)}
${bankAccounts.map(a => `${a.accountName} (${a.provider}): $${a.balanceCurrent.toFixed(2)}`).join('\n')}
    `.trim()
  }

  // ─── Generate Insight ────────────────────────────────────────────────────────

  async generateInsight(projectId: string, userId: string, type: string): Promise<string> {
    const config = await this.getConfig(userId)
    if (!config) throw new Error('No AI provider configured. Go to Settings → AI to add one.')

    const context = await this.buildProjectContext(projectId)

    const prompts: Record<string, string> = {
      COST_OPTIMIZATION: `You are a SaaS CFO advisor. Analyze the following project data and identify the top 3-5 specific cost optimization opportunities. Be concrete with estimated savings.`,
      CASH_ALLOCATION: `You are a SaaS financial strategist. Based on the project's revenue and cash position, recommend how to allocate the current cash balance across operating costs, growth, runway reserve, and founder distributions. Give specific percentages and amounts.`,
      CHURN_ALERT: `You are a SaaS growth analyst. Analyze the churn rate and customer data. Identify warning signs, root causes, and provide 3 actionable recommendations to reduce churn.`,
      REVENUE_ALERT: `You are a SaaS revenue analyst. Analyze revenue trends, MRR growth, and any anomalies. Provide a clear assessment and 3 specific actions to improve revenue.`,
      FORECAST: `You are a SaaS financial modeler. Based on current MRR, growth rate, churn, and burn rate, provide a 6-month financial forecast with best case, base case, and worst case scenarios.`,
      GENERAL: `You are a SaaS business advisor. Provide a concise executive summary of this project's financial health with 3-5 prioritized action items.`,
    }

    const systemPrompt = prompts[type] || prompts.GENERAL

    const messages: AIMessage[] = [
      { role: 'system', content: `${systemPrompt}\n\nRespond in clear, actionable language. Use dollar amounts and percentages. Keep response under 400 words. Format with clear sections.` },
      { role: 'user', content: `Here is the current project data:\n\n${context}\n\nProvide your analysis and recommendations.` },
    ]

    const response = await this.dispatch(config, messages)
    return response.text
  }

  // ─── Save Insight to DB ───────────────────────────────────────────────────────

  async createAndSaveInsight(
    projectId: string,
    userId: string,
    type: string,
    severity: string = 'INFO'
  ): Promise<any> {
    const body = await this.generateInsight(projectId, userId, type)

    const config = await this.getConfig(userId)

    const titles: Record<string, string> = {
      COST_OPTIMIZATION: 'Cost Optimization Opportunities',
      CASH_ALLOCATION: 'Cash Allocation Recommendation',
      CHURN_ALERT: 'Churn Analysis & Action Plan',
      REVENUE_ALERT: 'Revenue Trend Analysis',
      FORECAST: '6-Month Financial Forecast',
      GENERAL: 'Executive Summary',
    }

    return prisma.aIInsight.create({
      data: {
        projectId,
        aiConfigId: config?.id,
        type: type as any,
        title: titles[type] || 'AI Insight',
        body,
        severity: severity as any,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
  }

  // ─── Auto-detect Alerts ───────────────────────────────────────────────────────

  async runAutoAlerts(projectId: string, userId: string): Promise<void> {
    const now = new Date()
    const metric = await prisma.monthlyMetric.findFirst({
      where: { projectId, year: now.getFullYear(), month: now.getMonth() + 1 },
    })
    if (!metric) return

    const tasks: Array<{ condition: boolean; type: string; severity: string }> = [
      { condition: metric.churnRate > 10, type: 'CHURN_ALERT', severity: 'CRITICAL' },
      { condition: metric.churnRate > 5, type: 'CHURN_ALERT', severity: 'WARNING' },
      { condition: !!metric.runway && metric.runway < 3, type: 'CASH_ALLOCATION', severity: 'CRITICAL' },
      { condition: !!metric.runway && metric.runway < 6, type: 'CASH_ALLOCATION', severity: 'WARNING' },
      { condition: metric.mrr < (metric.arr / 12) * 0.9, type: 'REVENUE_ALERT', severity: 'WARNING' },
    ]

    for (const task of tasks) {
      if (!task.condition) continue
      // Check if we already generated this insight this week
      const existing = await prisma.aIInsight.findFirst({
        where: {
          projectId,
          type: task.type as any,
          generatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      })
      if (!existing) {
        await this.createAndSaveInsight(projectId, userId, task.type, task.severity).catch(console.error)
      }
    }
  }
}

export const aiService = new AIService()
