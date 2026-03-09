'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Search, Filter, ArrowUpRight, Globe, Shield, Calendar } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, PageLoading, Card, Badge, StatCard } from '@/components/ui'
import { projectsApi, fmt } from '@/lib/api'
import type { Project } from '@/types'
import { clsx } from 'clsx'
import * as mockData from '@/lib/mock-data'

export default function ProjectsPage() {
    const { data: projectsData, isLoading } = useQuery({
        queryKey: ['projects'],
        queryFn: () => projectsApi.list().then(r => r.data.data as Project[]),
        initialData: mockData.MOCK_PROJECTS,
    })

    const projects = projectsData || []
    const COLORS = ['#7c6aff', '#00e5cc', '#f5a623', '#ff6b6b', '#00d68f']

    if (isLoading) return <DashboardLayout><PageLoading /></DashboardLayout>

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <PageHeader
                    title="All Projects"
                    subtitle="Manage and track your entire SaaS portfolio"
                    actions={
                        <Link href="/projects/new" className="btn-primary py-2 px-4 shadow-lg shadow-accent/20 flex items-center gap-2">
                            <Plus size={18} />
                            <span>Add Project</span>
                        </Link>
                    }
                />

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input
                            placeholder="Search projects..."
                            className="input pl-10 h-11 bg-surface/50 border-border/50 focus:border-accent/50"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 h-11 bg-surface border border-border/50 rounded-xl text-muted text-sm hover:text-text hover:border-border transition-all">
                        <Filter size={16} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 h-11 bg-surface border border-border/50 rounded-xl text-muted text-sm hover:text-text hover:border-border transition-all">
                        <span>Sort: MRR</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {projects.map((p, i) => {
                        const latest = p.metrics?.[0]
                        const color = COLORS[i % COLORS.length]

                        return (
                            <Link key={p.id} href={`/projects/${p.id}`} className="group">
                                <Card className="p-5 hover:border-accent/30 transition-all hover:shadow-xl hover:shadow-accent/5">
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                        {/* Project Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-display font-black flex-shrink-0 transition-transform group-hover:scale-105"
                                                style={{ background: `${color}15`, color: color }}>
                                                {p.name[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-display font-bold text-lg text-text group-hover:text-accent transition-colors truncate">
                                                    {p.name}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <Globe size={13} />
                                                        {p.website}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-border" />
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={13} />
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:gap-12 lg:px-12 lg:border-l lg:border-r border-border/50">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">MRR</p>
                                                <p className="font-mono font-bold text-accent">{fmt(latest?.mrr || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Growth</p>
                                                <p className="font-mono font-bold text-emerald-400">+{((latest?.mrr || 0) * 0.047).toFixed(1)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Churn</p>
                                                <p className="font-mono font-bold text-text">{latest?.churnRate || 0}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Margin</p>
                                                <p className="font-mono font-bold text-emerald-400">{latest?.grossMargin || 0}%</p>
                                            </div>
                                        </div>

                                        {/* Status & Action */}
                                        <div className="flex items-center justify-between lg:justify-end gap-6 min-w-[140px]">
                                            <Badge variant={p.status === 'ACTIVE' ? 'green' : 'gray'}>
                                                {p.status}
                                            </Badge>
                                            <div className="w-10 h-10 rounded-xl bg-surface2 border border-border flex items-center justify-center text-muted group-hover:text-accent group-hover:border-accent/30 transition-all">
                                                <ArrowUpRight size={18} />
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>

                {projects.length === 0 && (
                    <div className="py-20 text-center card bg-surface/30 border-dashed">
                        <Shield className="mx-auto text-muted mb-4" size={40} />
                        <h3 className="font-display font-bold text-lg text-text">No projects found</h3>
                        <p className="text-muted text-sm mt-1 max-w-xs mx-auto">
                            Connect your first SaaS project to start tracking your portfolio's performance.
                        </p>
                        <Link href="/projects/new" className="btn-primary mt-6 inline-flex py-2.5 px-6">
                            Connect New Project
                        </Link>
                    </div>
                )}
            </div>
        </DashboardLayout>
    )
}
