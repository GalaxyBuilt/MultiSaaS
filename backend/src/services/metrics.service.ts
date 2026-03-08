// backend/src/services/metrics.service.ts
// MultiSaaS — Metrics Aggregation Engine
// Recalculates MRR, ARR, churn, margins from real revenue/expense data

import { PrismaClient } from '@prisma/client'
import { stripeService } from './stripe.service'
import { Router } from 'express'
import { authenticate } from '../middleware/auth'

const prisma = new PrismaClient()

export class MetricsService {
  // ─── Full Recalculation for a Project ────────────────────────────────────────

  async recalculate(projectId: string): Promise<void> {
    // Get all months with data
    const earliest = await prisma.revenueEntry.findFirst({
      where: { projectId },
      orderBy: { date: 'asc' },
    })
    if (!earliest) return

    const start = new Date(earliest.date)
    const end = new Date()
    end.setDate(1)

    let cursor = new Date(start.getFullYear(), start.getMonth(), 1)

    while (cursor <= end) {
      await this.calculateMonth(projectId, cursor.getFullYear(), cursor.getMonth() + 1)
      cursor.setMonth(cursor.getMonth() + 1)
    }
  }

  async calculateMonth(projectId: string, year: number, month: number): Promise<void> {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59)

    const [revenueEntries, expenseEntries, bankAccounts] = await Promise.all([
      prisma.revenueEntry.findMany({
        where: { projectId, date: { gte: startDate, lte: endDate } },
      }),
      prisma.expenseEntry.findMany({
        where: { projectId, date: { gte: startDate, lte: endDate } },
      }),
      prisma.bankAccount.findMany({ where: { projectId } }),
    ])

    // Revenue breakdown
    const subscriptionRevenue = revenueEntries
      .filter(r => r.type === 'SUBSCRIPTION' && r.status === 'COMPLETED')
      .reduce((s, r) => s + r.amountDecimal, 0)

    const oneTimeRevenue = revenueEntries
      .filter(r => r.type === 'ONE_TIME' && r.status === 'COMPLETED')
      .reduce((s, r) => s + r.amountDecimal, 0)

    const totalRefunds = revenueEntries
      .filter(r => r.type === 'REFUND')
      .reduce((s, r) => s + Math.abs(r.amountDecimal), 0)

    const totalRevenue = subscriptionRevenue + oneTimeRevenue - totalRefunds

    // Expense total
    const totalExpenses = expenseEntries.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalRevenue - totalExpenses
    const grossMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    // MRR — from active subscriptions this month
    const activeSubs = revenueEntries.filter(r => r.type === 'SUBSCRIPTION' && r.status === 'COMPLETED')
    const mrr = activeSubs.reduce((s, r) => s + r.amountDecimal, 0)
    const arr = mrr * 12

    // Customer counts — approximate from unique customerIds
    const uniqueCustomers = new Set(
      revenueEntries.filter(r => r.customerId).map(r => r.customerId!)
    )
    const activeCustomers = uniqueCustomers.size

    // Churn approximation (compare to prev month)
    const prevMonthDate = new Date(year, month - 2, 1)
    const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59)
    const prevRevenue = await prisma.revenueEntry.findMany({
      where: { projectId, date: { gte: prevMonthDate, lte: prevMonthEnd }, type: 'SUBSCRIPTION' },
    })
    const prevCustomers = new Set(prevRevenue.filter(r => r.customerId).map(r => r.customerId!))
    const churnedCustomers = [...prevCustomers].filter(id => !uniqueCustomers.has(id)).length
    const newCustomers = [...uniqueCustomers].filter(id => !prevCustomers.has(id)).length
    const churnRate = prevCustomers.size > 0 ? (churnedCustomers / prevCustomers.size) * 100 : 0

    // ARPU
    const arpu = activeCustomers > 0 ? mrr / activeCustomers : 0

    // Cash & runway
    const cashBalance = bankAccounts.reduce((s, a) => s + a.balanceCurrent, 0)
    const burnRate = totalExpenses // monthly burn
    const runway = burnRate > 0 ? cashBalance / burnRate : 999

    await prisma.monthlyMetric.upsert({
      where: { projectId_year_month: { projectId, year, month } },
      update: {
        mrr, arr, totalRevenue, subscriptionRevenue, oneTimeRevenue, totalRefunds,
        totalExpenses, netProfit, grossMargin,
        newCustomers, churnedCustomers, activeCustomers, churnRate,
        arpu, cashBalance, burnRate, runway,
        updatedAt: new Date(),
      },
      create: {
        projectId, year, month,
        mrr, arr, totalRevenue, subscriptionRevenue, oneTimeRevenue, totalRefunds,
        totalExpenses, netProfit, grossMargin,
        newCustomers, churnedCustomers, activeCustomers, churnRate,
        arpu, cashBalance, burnRate, runway,
      },
    })
  }
}

export const metricsService = new MetricsService()
