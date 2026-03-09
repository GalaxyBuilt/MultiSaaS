import Link from 'next/link'
import { Search, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
            <div className="max-w-md w-full space-y-8 text-center animate-fade-in">
                <div className="relative inline-block">
                    <div className="w-24 h-24 rounded-3xl bg-accent/10 flex items-center justify-center text-accent mx-auto">
                        <Search size={48} />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="font-display font-black text-4xl text-text tracking-tight">
                        Page not found
                    </h1>
                    <p className="text-muted text-sm leading-relaxed max-w-xs mx-auto">
                        We couldn't find the page you're looking for. It might have been moved or deleted.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-4">
                    <Link
                        href="/dashboard"
                        className="btn-primary py-3 rounded-xl shadow-lg shadow-accent/20 flex items-center justify-center gap-2 group"
                    >
                        <Home size={18} />
                        <span>Go to Dashboard</span>
                    </Link>

                    <Link
                        href="/"
                        className="btn-ghost py-3 rounded-xl border border-border/50 text-muted hover:text-text flex items-center justify-center gap-2 transition-all"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Landing</span>
                    </Link>
                </div>

                <div className="pt-8 border-t border-border/50">
                    <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-muted uppercase tracking-widest">
                        <Link href="/projects" className="hover:text-accent transition-colors">Projects</Link>
                        <Link href="/banking" className="hover:text-accent transition-colors">Banking</Link>
                        <Link href="/settings/ai" className="hover:text-accent transition-colors">AI Settings</Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
