'use client'

import { clsx } from 'clsx'
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react'

// --- StatCard ---
interface StatCardProps {
    label: string
    value: string
    sub?: string
    delta?: number | string
    deltaLabel?: string
    color?: string
    loading?: boolean
    className?: string
}

export function StatCard({ label, value, sub, delta, deltaLabel, color, loading, className }: StatCardProps) {
    const isPositive = typeof delta === 'number' ? delta >= 0 : true

    return (
        <div className={clsx('stat-card group', className)}>
            <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: `linear-gradient(90deg, ${color || '#7c6aff'}, transparent)` }} />

            <p className="section-title mb-3">{label}</p>

            {loading ? (
                <div className="h-8 w-24 bg-surface2 rounded animate-pulse" />
            ) : (
                <p className="font-display font-black text-2xl tracking-tight" style={{ color: color || 'var(--text)' }}>
                    {value}
                </p>
            )}

            <div className="flex items-center gap-2 mt-2">
                {delta !== undefined && (
                    <span className={clsx('flex items-center gap-0.5 text-xs font-bold', isPositive ? 'text-emerald-400' : 'text-red-400')}>
                        {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                        {typeof delta === 'number' ? `${isPositive ? '+' : ''}${delta.toFixed(1)}%` : delta}
                    </span>
                )}
                {sub && <span className="text-xs text-muted">{sub}</span>}
                {deltaLabel && <span className="text-xs text-muted">{deltaLabel}</span>}
            </div>
        </div>
    )
}

// --- PageHeader ---
interface PageHeaderProps {
    title: string
    subtitle?: string
    actions?: React.ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-6">
            <div>
                <h1 className="font-display font-black text-2xl text-text tracking-tight">{title}</h1>
                {subtitle && <p className="text-muted text-sm mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0 ml-4">{actions}</div>}
        </div>
    )
}

// --- EmptyState ---
interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    action?: React.ReactNode
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-surface2 border border-border flex items-center justify-center mb-4">
                <Icon size={24} className="text-muted" />
            </div>
            <h3 className="font-display font-bold text-text text-lg mb-2">{title}</h3>
            <p className="text-muted text-sm max-w-xs mb-6">{description}</p>
            {action}
        </div>
    )
}

// --- Badge ---
interface BadgeProps {
    children: React.ReactNode
    variant?: 'green' | 'red' | 'yellow' | 'blue' | 'gray'
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
    return <span className={`badge badge-${variant}`}>{children}</span>
}

// --- LoadingSpinner ---
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
    return (
        <div className={clsx('rounded-full border-2 border-border2 border-t-accent animate-spin', sizes[size])} />
    )
}

export function PageLoading() {
    return (
        <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
        </div>
    )
}

// --- Card ---
export function Card({ children, className, title, action }: {
    children: React.ReactNode
    className?: string
    title?: string
    action?: React.ReactNode
}) {
    return (
        <div className={clsx('card', className)}>
            {(title || action) && (
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
                    {title && <h3 className="font-display font-bold text-sm text-text">{title}</h3>}
                    {action}
                </div>
            )}
            {children}
        </div>
    )
}

// --- StatusDot ---
export function StatusDot({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ACTIVE: 'bg-emerald-400',
        SYNCING: 'bg-blue-400 animate-pulse',
        ERROR: 'bg-red-400',
        DISCONNECTED: 'bg-muted',
        PENDING: 'bg-yellow-400',
        PAUSED: 'bg-yellow-400',
        ARCHIVED: 'bg-muted',
    }
    return <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', colors[status] || 'bg-muted')} />
}

export * from './ThemeToggle'
export * from './TwitterLink'
export * from './GitHubLink'
