'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { ThemeToggle, TwitterLink, GitHubLink } from '@/components/ui'

export default function RegisterPage() {
    const router = useRouter()
    const { setAuth } = useAuthStore()
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
    const [loading, setLoading] = useState(false)

    function set(field: string, value: string) {
        setForm(prev => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name || !form.email || !form.password) return toast.error('Please fill in all fields')
        if (form.password !== form.confirm) return toast.error('Passwords do not match')
        if (form.password.length < 8) return toast.error('Password must be at least 8 characters')

        setLoading(true)
        try {
            const res = await authApi.register(form.name, form.email, form.password)
            const { user, accessToken, refreshToken } = res.data.data
            setAuth(user, accessToken, refreshToken)
            toast.success('Account created! Welcome to MultiSaaS.')
            router.push('/dashboard')
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'radial-gradient(ellipse at 70% 30%, rgba(0,229,204,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 70%, rgba(124,106,255,0.06) 0%, transparent 50%), var(--bg)' }}>

            <div className="absolute top-4 right-4 flex items-center gap-2">
                <GitHubLink />
                <TwitterLink />
                <ThemeToggle />
            </div>

            <div className="w-full max-w-[400px] animate-fade-in text-text">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-black text-white text-lg transition-transform group-hover:scale-110"
                            style={{ background: 'linear-gradient(135deg, #7c6aff, #00e5cc)' }}>M</div>
                        <span className="font-display font-bold text-xl text-text">MultiSaaS</span>
                    </Link>
                    <p className="text-muted text-sm font-medium">Create your free account</p>
                </div>

                <div className="card p-6 shadow-xl shadow-black/20">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input className="input" placeholder="Alice Founder"
                                value={form.name} onChange={e => set('name', e.target.value)} autoFocus />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input className="input" type="email" placeholder="you@company.com"
                                value={form.email} onChange={e => set('email', e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Password</label>
                            <input className="input" type="password" placeholder="Min. 8 characters"
                                value={form.password} onChange={e => set('password', e.target.value)} />
                        </div>
                        <div>
                            <label className="label">Confirm Password</label>
                            <input className="input" type="password" placeholder="••••••••"
                                value={form.confirm} onChange={e => set('confirm', e.target.value)} />
                        </div>
                        <button type="submit" className="btn-primary w-full py-2.5 mt-2 shadow-lg shadow-accent/20" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted mt-5 font-medium">
                        Already have an account?{' '}
                        <Link href="/auth/login" className="text-accent hover:text-accent/80 font-bold transition-colors">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
