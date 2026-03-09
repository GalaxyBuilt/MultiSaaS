'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, Globe, TrendingUp, Users, DollarSign, ExternalLink, Settings, MoreHorizontal, CheckCircle2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, PageLoading, Card, StatCard, Badge } from '@/components/ui'
import { MrrChart, DonutChart } from '@/components/charts'
import { projectsApi, fmt } from '@/lib/api'
import type { Project } from '@/types'
import * as mockData from '@/lib/mock-data'

export function ProjectDetailClient({ id }: { id: string }) {
    // Find project in mock data (fallback if API not connected)
    const mockProj = mockData.MOCK_PROJECTS.find(p => p.id === id) || mockData.MOCK_PROJECTS[0]

    const { data: project, isLoading } = useQuery({
        queryKey: ['project', id],
        queryFn: () => projectsApi.get(id).then(r => r.data.data as Project),
        initialData: mockProj,
    })

    if (isLoading) return <DashboardLayout><PageLoading /></DashboardLayout>
    if (!project) return <DashboardLayout><div className="p-20 text-center text-text">Project not found</div></DashboardLayout>

    const latest = project.metrics?.[0]
    const p = project

    return (
        <DashboardLayout>
            <div className="p-6 space-y-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-fade-in">
                    <div className="space-y-4">
                        <Link href="/projects" className="flex items-center gap-2 text-xs font-bold text-muted hover:text-accent transition-colors group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span>Back to Projects</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-2xl font-display font-black text-accent shadow-xl shadow-accent/5">
                                {p.name[0]}
                            </div>
                            <div>
                                <h1 className="font-display font-black text-3xl text-text tracking-tight">{p.name}</h1>
                                <div className="flex items-center gap-3 mt-1.5">
                                    <Badge variant="green">ACTIVE</Badge>
                                    <Link href={`https://${p.website}`} target="_blank" className="text-sm text-muted hover:text-accent flex items-center gap-1 transition-colors">
                                        <Globe size={13} />
                                        {p.website}
                                        <ExternalLink size={11} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="btn-ghost p-3 rounded-xl border border-border/50 text-muted hover:text-text">
                            <Settings size={20} />
                        </button>
                        <button className="btn-primary py-3 px-6 shadow-lg shadow-accent/20 flex items-center gap-2">
                            <span>Sync Data</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                    <StatCard label="MRR" value={fmt(latest?.mrr || 0)} delta={4.7} deltaLabel="mo/mo" color="#7c6aff" />
                    <StatCard label="Active Customers" value={(latest?.activeCustomers || 0).toLocaleString()} delta={2.1} color="#f5a623" />
                    <StatCard label="Churn Rate" value={`${latest?.churnRate || 0}%`} delta={-0.4} color="#ff6b6b" />
                    <StatCard label="Gross Margin" value={`${latest?.grossMargin || 0}%`} color="#00d68f" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <div className="lg:col-span-2 space-y-6">
                        <Card title="Monthly Recurring Revenue" className="p-0 overflow-hidden">
                            <div className="p-6">
                                <MrrChart data={mockData.MOCK_DASHBOARD.mrrTrend} height={280} />
                            </div>
                        </Card>

                        <div className="grid sm:grid-cols-2 gap-6">
                            <Card title="Revenue Breakdown">
                                <div className="p-6">
                                    <DonutChart
                                        data={[
                                            { name: 'Subscriptions', value: latest?.subscriptionRevenue || 0, color: '#7c6aff' },
                                            { name: 'One-time', value: latest?.oneTimeRevenue || 0, color: '#00e5cc' },
                                        ]}
                                        height={180}
                                    />
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-xs py-1 border-b border-border/30">
                                            <span className="text-muted">Subscription</span>
                                            <span className="font-bold text-text">{fmt(latest?.subscriptionRevenue || 0)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs py-1">
                                            <span className="text-muted">One-time Addons</span>
                                            <span className="font-bold text-text">{fmt(latest?.oneTimeRevenue || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            <Card title="Customer Health">
                                <div className="p-6 space-y-6">
                                    <div className="text-center py-4 bg-surface2/30 rounded-2xl border border-border/50">
                                        <p className="text-xs font-bold text-muted uppercase tracking-widest mb-1">ARPU</p>
                                        <p className="text-2xl font-display font-black text-text">{fmt(latest?.arpu || 0)}</p>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-400/10 flex items-center justify-center text-emerald-400">
                                                <Users size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-bold text-text">Customer Retention</span>
                                                    <span className="text-xs text-emerald-400 font-bold">98.2%</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-400" style={{ width: '98%' }} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                                                <TrendingUp size={16} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-xs font-bold text-text">Referral Velocity</span>
                                                    <span className="text-xs text-accent font-bold">High</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-surface2 rounded-full overflow-hidden">
                                                    <div className="h-full bg-accent" style={{ width: '82%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card title="AI Performance Audit">
                            <div className="p-5 space-y-5">
                                <div className="space-y-3">
                                    {[
                                        { text: 'Gross margin is 4% above industry average.', status: 'positive' },
                                        { text: 'Churn risk detected in "Enterprise" segment.', status: 'warning' },
                                        { text: 'Payment failure rate is within healthy limits.', status: 'positive' },
                                    ].map((insight, i) => (
                                        <div key={i} className="flex gap-3 text-xs leading-relaxed">
                                            <CheckCircle2 size={14} className={insight.status === 'positive' ? 'text-emerald-400' : 'text-amber-400'} />
                                            <span className="text-muted">{insight.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full py-2.5 rounded-xl bg-surface2 border border-border/50 text-xs font-bold text-text hover:bg-border transition-colors">
                                    View Full Audit Report
                                </button>
                            </div>
                        </Card>

                        <Card title="Quick Actions">
                            <div className="p-2 grid grid-cols-1 gap-1">
                                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface2 transition-colors text-sm font-medium text-muted hover:text-text">
                                    <DollarSign size={16} /> Update Pricing Plans
                                </button>
                                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface2 transition-colors text-sm font-medium text-muted hover:text-text">
                                    <MoreHorizontal size={16} /> Export CSV Metrics
                                </button>
                                <button className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface2 transition-colors text-sm font-medium text-muted hover:text-red-400">
                                    <Settings size={16} /> Archive Project
                                </button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
