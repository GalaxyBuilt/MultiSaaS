'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertCircle, RefreshCcw, Home, ChevronLeft } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('GalaxyBuilt App Error:', error)
    }, [error])

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
                <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-3xl bg-red-400/10 flex items-center justify-center text-red-400 mx-auto">
                        <AlertCircle size={48} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-background border-2 border-red-400 flex items-center justify-center text-red-400">
                        <span className="text-[10px] font-bold">!</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="font-display font-black text-4xl text-text tracking-tight">
                        Something went wrong
                    </h1>
                    <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
                        An unexpected error occurred. Don't worry, your data is safe. Let's try to get you back on track.
                    </p>
                </div>

                <div className="bg-surface2/30 border border-border/50 rounded-2xl p-4 text-left">
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Error Detail</p>
                    <p className="font-mono text-xs text-red-400 break-all leading-normal line-clamp-2">
                        {error.message || 'Unknown internal error'}
                    </p>
                    {error.digest && (
                        <p className="mt-2 text-[10px] text-muted font-mono">ID: {error.digest}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={() => reset()}
                        className="btn-primary py-3 rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 group"
                    >
                        <RefreshCcw size={18} className="group-active:rotate-180 transition-transform duration-500" />
                        <span>Try again</span>
                    </button>

                    <Link
                        href="/dashboard"
                        className="btn-ghost py-3 rounded-xl border border-border/50 text-muted hover:text-text flex items-center justify-center gap-2 transition-all"
                    >
                        <Home size={18} />
                        <span>Return Dashboard</span>
                    </Link>
                </div>

                <div className="pt-8 border-t border-border/50">
                    <p className="text-xs text-muted flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        System status: Operational
                    </p>
                </div>
            </div>
        </div>
    )
}
