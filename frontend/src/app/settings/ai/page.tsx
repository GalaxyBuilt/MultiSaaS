'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, Card, Badge } from '@/components/ui'
import { Brain, Sparkles, MessageSquare, Bot, AlertTriangle, CloudLightning, ShieldCheck, Zap } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import * as mockData from '@/lib/mock-data'
import { clsx } from 'clsx'

export default function AISettingsPage() {
    const insights = mockData.MOCK_INSIGHTS

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Intelligence Settings"
                    subtitle="Configure AI-powered insights and anomaly detection for your portfolio"
                    actions={
                        <button className="btn-primary py-2 px-4 shadow-lg shadow-accent/20 flex items-center gap-2">
                            <Zap size={17} />
                            <span>Run Audit</span>
                        </button>
                    }
                />

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Summary / Stats */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 bg-gradient-to-br from-accent/10 to-transparent border-accent/20">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/30">
                                    <Brain size={20} />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-text">AI Health Score</h3>
                                    <p className="text-xs text-muted mt-0.5">Updated just now</p>
                                </div>
                            </div>
                            <div className="text-4xl font-display font-black text-white mb-2">94<span className="text-xl text-accent">/100</span></div>
                            <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
                                <div className="h-full bg-accent rounded-full" style={{ width: '94%' }} />
                            </div>
                            <p className="text-xs text-muted mt-4 leading-relaxed line-clamp-2">
                                Your portfolio health is excellent. Churn risk detected in 1 project (EverRank).
                            </p>
                        </Card>

                        <div className="space-y-4">
                            <h3 className="section-title px-1">Integrations</h3>
                            <div className="space-y-2">
                                {[
                                    { name: 'OpenAI GPT-4o', status: 'CONNECTED', icon: Bot },
                                    { name: 'Claude 3.5 Sonnet', status: 'STANDBY', icon: CloudLightning },
                                    { name: 'Portfolio Guard', status: 'ACTIVE', icon: ShieldCheck },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border/50">
                                        <div className="flex items-center gap-3">
                                            <item.icon size={16} className="text-muted" />
                                            <span className="text-sm font-medium text-text">{item.name}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-accent px-2 py-1 rounded-md bg-accent/5">{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Feed / Settings */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="section-title flex items-center gap-2">
                                <Sparkles size={14} className="text-accent" />
                                Active System Insights
                            </h3>
                            <button className="text-xs font-bold text-muted hover:text-accent transition-colors underline underline-offset-4">Refresh Feed</button>
                        </div>

                        <div className="space-y-4">
                            {insights.map((insight) => (
                                <Card key={insight.id} className="p-0 overflow-hidden group">
                                    <div className="p-5 flex items-start gap-4">
                                        <div className={clsx(
                                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                                            insight.severity === 'WARNING' ? "bg-red-400/10 border-red-400/20 text-red-400" : "bg-emerald-400/10 border-emerald-400/20 text-emerald-400"
                                        )}>
                                            {insight.severity === 'WARNING' ? <AlertTriangle size={20} /> : <Zap size={20} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-display font-bold text-text group-hover:text-accent transition-colors">{insight.title}</h4>
                                                <span className="text-[10px] uppercase font-black text-muted tracking-tighter bg-surface2 px-1.5 py-0.5 rounded">NEW</span>
                                            </div>
                                            <p className="text-sm text-muted leading-relaxed line-clamp-2">
                                                {insight.body}
                                            </p>
                                            <div className="flex items-center gap-4 mt-4">
                                                <button className="text-xs font-bold text-accent hover:text-accent/80 transition-colors">Apply Recommendation</button>
                                                <button className="text-xs font-bold text-muted hover:text-text transition-colors">Dismiss</button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="pt-4 px-1">
                            <h3 className="section-title mb-4">Notification Hooks</h3>
                            <Card className="p-4 space-y-4">
                                {[
                                    { label: 'Weekly Performance Report', desc: 'Detailed summary of portfolio growth every Monday', active: true },
                                    { label: 'Significant Churn Alert', desc: 'Immediate alert if aggregate churn spikes above 5%', active: true },
                                    { label: 'Burn Rate Warning', desc: 'Alert when runway drops below critical threshold', active: false },
                                ].map((hook, i) => (
                                    <div key={i} className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-bold text-text">{hook.label}</p>
                                            <p className="text-xs text-muted mt-0.5">{hook.desc}</p>
                                        </div>
                                        <div className={clsx(
                                            "w-10 h-5 rounded-full relative transition-colors cursor-pointer",
                                            hook.active ? "bg-accent" : "bg-surface2"
                                        )}>
                                            <div className={clsx(
                                                "w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all",
                                                hook.active ? "right-1" : "left-1"
                                            )} />
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
