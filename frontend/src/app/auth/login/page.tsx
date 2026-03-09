'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { ThemeToggle, TwitterLink, GitHubLink, PageLoading } from '@/components/ui'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setAuth } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (searchParams.get('demo') === 'true') {
            setEmail('admin@multisaas.dev')
            setPassword('changeme123')
        }
    }, [searchParams])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!email || !password) return toast.error('Please fill in all fields')
        setLoading(true)
        try {
            // Simulated login for demo credentials to ensure zero-friction demo
            if (email === 'admin@multisaas.dev' && password === 'changeme123') {
                await new Promise(r => setTimeout(r, 800))
                setAuth(
                    { id: 'demo-user', name: 'Demo Administrator', email: 'admin@multisaas.dev', role: 'SUPERADMIN' },
                    'demo-access-token',
                    'demo-refresh-token'
                )
                toast.success('Welcome to the MultiSaaS Demo!')
                router.push('/dashboard')
                return
            }

            const res = await authApi.login(email, password)
            const { user, accessToken, refreshToken } = res.data.data
            setAuth(user, accessToken, refreshToken)
            toast.success(`Welcome back, ${user.name}!`)
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[400px] animate-fade-in text-text">
            {/* Logo */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
                    <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 border border-border">
                        <img src="/galaxy-logo.jpeg" alt="Galaxy" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-display font-bold text-xl text-text">MultiSaaS</span>
                </Link>
                <p className="text-muted text-sm font-medium">Sign in to your account</p>
            </div>

            <div className="card p-6 shadow-xl shadow-black/20">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="label">Email</label>
                        <input className="input" type="email" placeholder="you@company.com"
                            value={email} onChange={e => setEmail(e.target.value)} autoFocus />
                    </div>
                    <div>
                        <label className="label">Password</label>
                        <input className="input" type="password" placeholder="••••••••"
                            value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <button type="submit" className="btn-primary w-full py-2.5 mt-2 shadow-lg shadow-accent/20" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-sm text-muted mt-5 font-medium">
                    No account?{' '}
                    <Link href="/auth/register" className="text-accent hover:text-accent/80 font-bold transition-colors">
                        Create one free
                    </Link>
                </p>
            </div>

            {/* Demo hint */}
            <div className="mt-4 p-3.5 rounded-xl border border-border bg-surface/50 text-xs font-mono text-muted text-center backdrop-blur-sm">
                <span className="text-accent font-bold">Demo:</span> admin@multisaas.dev / changeme123
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'radial-gradient(ellipse at 30% 50%, rgba(124,106,255,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,229,204,0.05) 0%, transparent 50%), var(--bg)' }}>

            <div className="absolute top-4 right-4 flex items-center gap-2">
                <GitHubLink />
                <TwitterLink />
                <ThemeToggle />
            </div>

            <Suspense fallback={<PageLoading />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
