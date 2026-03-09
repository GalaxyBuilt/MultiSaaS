'use client'

import { AlertCircle, RefreshCcw } from 'lucide-react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <html lang="en">
            <body className="bg-background text-text antialiased">
                <div className="min-h-screen flex items-center justify-center p-6">
                    <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
                        <div className="w-24 h-24 rounded-3xl bg-red-400/10 flex items-center justify-center text-red-400 mx-auto">
                            <AlertCircle size={48} />
                        </div>

                        <div className="space-y-3">
                            <h1 className="font-display font-black text-4xl tracking-tight">
                                Critical System Error
                            </h1>
                            <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
                                The application encountered a critical failure. Our engineers have been notified.
                            </p>
                        </div>

                        <div className="bg-surface2/30 border border-border/50 rounded-2xl p-4 text-left font-mono text-xs">
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2 text-center">Diagnostics</p>
                            <p className="text-red-400 break-all">{error.message}</p>
                        </div>

                        <button
                            onClick={() => reset()}
                            className="w-full btn-primary py-4 rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-3 group"
                        >
                            <RefreshCcw size={20} className="group-active:rotate-180 transition-transform duration-500" />
                            <span className="text-base font-bold">Restart Application</span>
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
