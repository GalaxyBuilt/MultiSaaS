'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, Card, StatCard } from '@/components/ui'
import { Building2, Wallet, ArrowUpRight, ArrowDownRight, CreditCard, Landmark, History } from 'lucide-react'
import { fmt } from '@/lib/api'
import { clsx } from 'clsx'
import * as mockData from '@/lib/mock-data'

export default function BankingPage() {
    const g = mockData.MOCK_DASHBOARD.summary

    const ACCOUNTS = [
        { name: 'Mercury Main', type: 'Checking', balance: 142500, status: 'CONNECTED', lastSync: '2m ago', color: '#7c6aff' },
        { name: 'Wise Business', type: 'Global', balance: 37500, status: 'CONNECTED', lastSync: '1h ago', color: '#00e5cc' },
        { name: 'Stripe Payouts', type: 'Pending', balance: 12400, status: 'SYNCING', lastSync: 'Just now', color: '#6366f1' },
    ]

    const TRANSACTIONS = [
        { id: 1, name: 'AWS Cloud Services', category: 'Infrastructure', amount: -2450.00, date: 'Today', type: 'EXPENSE' },
        { id: 2, name: 'Stripe Payout', category: 'Revenue', amount: 8940.25, date: 'Yesterday', type: 'INCOME' },
        { id: 3, name: 'Vercel Inc.', category: 'Software', amount: -45.00, date: 'Yesterday', type: 'EXPENSE' },
        { id: 4, name: 'GitHub Copilot', category: 'Software', amount: -19.00, date: 'Mar 5', type: 'EXPENSE' },
        { id: 5, name: 'Google Workspace', category: 'Software', amount: -120.00, date: 'Mar 4', type: 'EXPENSE' },
    ]

    return (
        <DashboardLayout>
            <div className="p-6 space-y-6 max-w-7xl mx-auto">
                <PageHeader
                    title="Banking & Treasury"
                    subtitle="Real-time cash oversight across all your connected accounts"
                    actions={
                        <button className="btn-primary py-2 px-4 flex items-center gap-2">
                            <Landmark size={18} />
                            <span>Connect Bank</span>
                        </button>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard label="Total Treasury" value={fmt(g.totalCash)} color="#7c6aff" sub="Total liquidity" />
                    <StatCard label="Monthly Burn" value={fmt(g.totalExpensesLtm / 12)} color="#ff6b6b" sub="Average monthly spend" />
                    <StatCard label="Runway" value={`${g.totalRunway} mo`} color="#00e5cc" sub="at current burn rate" />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Accounts */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="section-title px-1 flex items-center gap-2">
                            <CreditCard size={14} />
                            Connected Accounts
                        </h3>
                        {ACCOUNTS.map((acc, i) => (
                            <Card key={i} className="p-4 group cursor-pointer hover:border-accent/30 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                                        style={{ background: `${acc.color}15`, color: acc.color }}>
                                        <Building2 size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-display font-bold text-text group-hover:text-accent transition-colors">{acc.name}</p>
                                        <p className="text-xs text-muted mt-0.5">{acc.type} • {acc.lastSync}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-bold text-text">{fmt(acc.balance)}</p>
                                        <span className="text-[10px] font-bold text-emerald-400">ACTIVE</span>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>

                    {/* Transactions */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="section-title px-1 flex items-center gap-2">
                            <History size={14} />
                            Recent Activity
                        </h3>
                        <Card>
                            <div className="divide-y divide-border/50">
                                {TRANSACTIONS.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-surface2/30 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className={clsx(
                                                "w-10 h-10 rounded-full flex items-center justify-center border transition-colors",
                                                tx.type === 'INCOME' ? "bg-emerald-400/10 border-emerald-400/20 text-emerald-400" : "bg-red-400/10 border-red-400/20 text-red-400"
                                            )}>
                                                {tx.type === 'INCOME' ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-display font-bold text-text text-sm group-hover:text-accent transition-colors">{tx.name}</p>
                                                <p className="text-xs text-muted mt-0.5">{tx.category} • {tx.date}</p>
                                            </div>
                                        </div>
                                        <div className={clsx(
                                            "font-mono font-bold text-sm",
                                            tx.type === 'INCOME' ? "text-emerald-400" : "text-text"
                                        )}>
                                            {tx.type === 'INCOME' ? '+' : ''}{tx.amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-surface2/30 text-center">
                                <button className="text-xs font-bold text-muted hover:text-accent transition-colors">View All Transactions</button>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
