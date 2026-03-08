'use client'

import { clsx } from 'clsx'

interface ProgressBarProps {
    label: string
    value: number
    max: number
    amount: string
    color?: string
}

export function ProgressBar({ label, value, max, amount, color = '#7c6aff' }: ProgressBarProps) {
    const percentage = Math.min(100, Math.round((value / max) * 100))

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-muted">{label}</span>
                <span className="text-text">{amount}</span>
            </div>
            <div className="h-2 w-full bg-surface2 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                    }}
                />
            </div>
        </div>
    )
}
