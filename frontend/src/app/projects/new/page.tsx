'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { PageHeader, Card } from '@/components/ui'
import { Plus, Globe, Tag, DollarSign, ShieldCheck, ChevronRight, Rocket } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'

export default function NewProjectPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        currency: 'USD',
        description: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        // Mock creation
        setTimeout(() => {
            toast.success('Project created! Demo data is being synced...')
            setLoading(false)
            router.push('/projects')
        }, 1500)
    }

    return (
        <DashboardLayout>
            <div className="p-6 max-w-3xl mx-auto">
                <PageHeader
                    title="Connect New Project"
                    subtitle="Register a new SaaS product to your portfolio tracking"
                />

                <div className="mt-8">
                    {/* Stepper */}
                    <div className="flex items-center gap-4 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center gap-2">
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                                    step >= i ? "bg-accent text-white" : "bg-surface2 text-muted"
                                )}>
                                    {i}
                                </div>
                                {i < 3 && <div className={clsx("w-12 h-px", step > i ? "bg-accent" : "bg-border")} />}
                            </div>
                        ))}
                    </div>

                    <Card className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {step === 1 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/5 border border-accent/10">
                                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white">
                                            <Tag size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-bold text-sm">Project Basics</h4>
                                            <p className="text-xs text-muted">Tell us the name and identity of your SaaS.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label">Project Name</label>
                                            <input
                                                className="input h-11"
                                                placeholder="e.g. Acme Analytics"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="label">Main Website</label>
                                            <div className="relative">
                                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                                                <input
                                                    className="input h-11 pl-10"
                                                    placeholder="acme.xyz"
                                                    value={formData.website}
                                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            disabled={!formData.name}
                                            className="btn-primary w-full py-3 flex items-center justify-center gap-2 group"
                                        >
                                            Next Step
                                            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex items-center gap-3 mb-6 p-4 rounded-xl bg-accent/5 border border-accent/10">
                                        <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-white">
                                            <DollarSign size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-display font-bold text-sm">Finances & Data</h4>
                                            <p className="text-xs text-muted">Configure currency and initial revenue tracking.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="label">Base Currency</label>
                                            <select className="input h-11 bg-surface cursor-pointer">
                                                <option>USD ($)</option>
                                                <option>EUR (€)</option>
                                                <option>GBP (£)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Short Description</label>
                                            <textarea
                                                className="input min-h-[100px] py-3 text-sm"
                                                placeholder="A brief overview of what this product does..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setStep(1)}
                                            className="btn-ghost flex-1 py-3 text-sm font-bold border border-border/50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(3)}
                                            className="btn-primary flex-[2] py-3 flex items-center justify-center gap-2 group"
                                        >
                                            Final Confirmation
                                            <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-6 animate-fade-in text-center py-4">
                                    <div className="w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center text-emerald-400 mx-auto mb-4">
                                        <ShieldCheck size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-xl text-text">Ready to Launch?</h3>
                                        <p className="text-muted text-sm mt-2 max-w-xs mx-auto">
                                            Everything looks great! Once confirmed, we'll initialize the project and start the data synchronization process.
                                        </p>
                                    </div>

                                    <div className="pt-6 space-y-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn-primary w-full py-4 flex items-center justify-center gap-2 shadow-xl shadow-accent/20"
                                        >
                                            <Rocket size={20} />
                                            <span>{loading ? 'Initializing...' : 'Confirm & Create Project'}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep(2)}
                                            className="btn-ghost text-xs text-muted hover:text-text font-bold"
                                        >
                                            I need to change something
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
