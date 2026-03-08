'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowUpRight, TrendingUp, Users, DollarSign, Wallet } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatCard, PageHeader, PageLoading, Card } from '@/components/ui'
import { MrrChart, DonutChart, ProgressBar } from '@/components/charts'
import { dashboardApi, projectsApi, fmt, fmtFull, fmtPct } from '@/lib/api'
import type { GlobalDashboard, Project, MonthlyMetric } from '@/types'
import { clsx } from 'clsx'
import * as mockData from '@/lib/mock-data'

export default function DashboardPage() {
    const { data: globalData, isLoading: loadingGlobal } = useQuery({
        queryKey: ['dashboard-global'],
        queryFn: () => dashboardApi.global().then(r => r.data.data as GlobalDashboard),
        initialData: mockData.MOCK_DASHBOARD,
        refetchInterval: 300_000,
    })

    const { data: projectsData, isLoading: loadingProjects } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectsApi.list().then(r => r.data.data as Project[]),
        initialData: mockData.MOCK_PROJECTS,
    })

    const loading = loadingGlobal || loadingProjects
    const g = globalData
    const projects = projectsData || []

    const COLORS = ['#7c6aff', '#00e5cc', '#f5a623', '#ff6b6b', '#00d68f']

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Portfolio Overview"
                    subtitle="Aggregated metrics across all your SaaS projects"
                />

                {/* Stat grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total MRR" value={fmt(g?.summary.totalMrr || 0)}
                        delta={g?.summary.avgMrrGrowth} deltaLabel="avg growth" color="#7c6aff" loading={loading} />
                    <StatCard label="Total ARR" value={fmt(g?.summary.totalArr || 0)}
                        color="#00e5cc" loading={loading} />
                    <StatCard label="Total Customers" value={(g?.summary.totalCustomers || 0).toLocaleString()}
                        color="#f5a623" loading={loading} />
                    <StatCard label="Net Profit (LTM)" value={fmt(g?.summary.totalProfit || 0)}
                        sub={`${Math.round(((g?.summary.totalProfit || 0) / (g?.summary.totalRevenueLtm || 1)) * 100)}% margin`}
                        color="#00d68f" loading={loading} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Total Cash" value={fmt(g?.summary.totalCash || 0)}
                        sub="across all accounts" loading={loading} />
                    <StatCard label="Projects" value={String(g?.summary.projectCount || 0)}
                        sub="active" loading={loading} />
                    <StatCard label="Revenue LTM" value={fmt(g?.summary.totalRevenueLtm || 0)}
                        loading={loading} />
                    <StatCard label="Expenses LTM" value={fmt(g?.summary.totalExpensesLtm || 0)}
                        color="#ff6b6b" loading={loading} />
                </div>

                {/* MRR Trend + Revenue Split */}
                <div className="grid lg:grid-cols-3 gap-5">
                    <Card title="MRR Growth — 12 Months" className="lg:col-span-2">
                        <div className="p-5">
                            {loading ? (
                                <div className="h-56 bg-surface2 rounded-lg animate-pulse" />
                            ) : (
                                <MrrChart data={g?.mrrTrend || []} height={220} />
                            )}
                        </div>
                    </Card>

                    <Card title="Revenue by Project">
                        <div className="p-5">
                            {loading ? (
                                <div className="h-44 bg-surface2 rounded-lg animate-pulse" />
                            ) : (
                                <>
                                    <DonutChart data={g?.revenueBreakdown || []} height={160} />
                                    <div className="space-y-2 mt-3">
                                        {(g?.revenueBreakdown || []).map((item, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs">
                                                <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                                                <span className="text-muted flex-1">{item.name}</span>
                                                <span className="font-mono text-text">{fmt(item.value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Projects table */}
                <Card title="All Projects">
                    {loading ? (
                        <div className="p-6 space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface2 rounded animate-pulse" />)}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-muted text-sm mb-3">No projects yet</p>
                            <Link href="/projects/new" className="btn-primary py-2 px-4 text-sm">Create your first project</Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        {['Project', 'MRR', 'ARR', 'Customers', 'Growth', 'Margin', 'Status', ''].map(h => (
                                            <th key={h} className="text-left px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider first:pl-5">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.map((p, i) => {
                                        const latest = p.metrics?.[0]
                                        const color = COLORS[i % COLORS.length]
                                        return (
                                            <tr key={p.id} className="border-b border-border/50 hover:bg-surface2/50 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                                            style={{ background: `${color}15`, color }}>
                                                            {p.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-display font-bold text-text text-sm">{p.name}</p>
                                                            {p.website && <p className="text-xs text-muted">{p.website.replace('https://', '')}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 font-mono text-accent font-semibold text-sm">
                                                    {fmt(latest?.mrr || 0)}
                                                </td>
                                                <td className="px-5 py-3.5 font-mono text-sm text-text">
                                                    {fmt(latest?.arr || 0)}
                                                </td>
                                                <td className="px-5 py-3.5 font-mono text-sm text-text">
                                                    {(latest?.activeCustomers || 0).toLocaleString()}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm">
                                                    {latest ? (
                                                        <span className={clsx('font-bold font-mono', (latest.mrr || 0) > 0 ? 'text-emerald-400' : 'text-muted')}>
                                                            +{((latest.mrr || 0) * 0.047).toFixed(1)}%
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-5 py-3.5 text-sm font-mono text-emerald-400">
                                                    {latest ? `${latest.grossMargin.toFixed(0)}%` : '—'}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={clsx('badge', p.status === 'ACTIVE' ? 'badge-green' : 'badge-gray')}>
                                                        {p.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <Link href={`/projects/${p.id}`}
                                                        className="text-muted hover:text-accent transition-colors">
                                                        <ArrowUpRight size={15} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>

                {/* Expense breakdown */}
                {g?.expenseBreakdown && g.expenseBreakdown.length > 0 && (
                    <Card title="Expense Breakdown (LTM)">
                        <div className="p-5 space-y-3">
                            {g.expenseBreakdown.map((e, i) => (
                                <ProgressBar key={i} label={e.category} value={e.amount}
                                    max={g.summary.totalExpensesLtm} amount={fmt(e.amount)} color={e.color} />
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    )
}
