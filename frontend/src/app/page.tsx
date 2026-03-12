'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, LayoutDashboard, Zap, Shield, Globe, Star, Github, GitFork, Sparkles, Layout, Layers, Bot, Menu, X } from 'lucide-react'
import { ThemeToggle, TwitterLink, GitHubLink } from '@/components/ui'
import { useAuthStore } from '@/lib/store'
import { clsx } from 'clsx'

export default function LandingPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleDemoLogin = () => {
    setMobileMenuOpen(false)
    router.push('/auth/login?demo=true')
  }

  return (
    <div className="min-h-screen bg-bg selection:bg-accent/30 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => router.push('/')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-110 border border-border">
              <img src="/hd-logo.jpg" alt="Galaxy" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-black text-text text-2xl tracking-tight">MultiSaaS</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-sm font-bold text-muted hover:text-text transition-colors">The Problem</a>
            <a href="#features" className="text-sm font-bold text-muted hover:text-text transition-colors">Features</a>
            <a href="#open-source" className="text-sm font-bold text-muted hover:text-text transition-colors">Open Source</a>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <TwitterLink />
              <ThemeToggle />
            </div>
            <button onClick={handleDemoLogin} className="btn-secondary hidden md:flex">Demo Login</button>
            <Link href="https://github.com/GalaxyBuilt/MultiSaaS" target="_blank" className="btn-primary hidden sm:flex">
              <Github size={18} /> <span>Star on GitHub</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-muted hover:text-text transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu overlay */}
        <div className={clsx(
          "fixed inset-0 top-20 z-40 bg-bg/95 backdrop-blur-xl md:hidden transition-all duration-300 ease-in-out border-t border-border",
          mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
          <div className="flex flex-col p-6 space-y-8 h-full">
            <nav className="flex flex-col space-y-6">
              <a href="#problem" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-text hover:text-accent transition-colors">The Problem</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-text hover:text-accent transition-colors">Features</a>
              <a href="#open-source" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-text hover:text-accent transition-colors">Open Source</a>
            </nav>

            <div className="pt-8 border-t border-border space-y-4">
              <button
                onClick={handleDemoLogin}
                className="btn-primary w-full py-4 text-lg justify-center flex items-center gap-2"
              >
                View Live Demo <ArrowRight size={20} />
              </button>
              <div className="flex items-center justify-between px-4 py-2 bg-surface rounded-xl border border-border">
                <span className="text-sm font-bold text-muted">Theme & Social</span>
                <div className="flex items-center gap-4">
                  <TwitterLink />
                  <ThemeToggle />
                </div>
              </div>
            </div>

            <div className="mt-auto pb-12">
              <Link
                href="https://github.com/GalaxyBuilt/MultiSaaS"
                target="_blank"
                className="flex items-center justify-center gap-3 p-4 rounded-xl bg-surface border border-border hover:border-accent transition-all animate-pulse-subtle"
              >
                <Github size={20} />
                <span className="font-display font-black">Star us on GitHub</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-accent/20 blur-[120px] rounded-full -z-10 opacity-50" />

        <div className="max-w-4xl mx-auto text-center space-y-8 relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest animate-fade-in shadow-lg shadow-accent/5">
            <Sparkles size={12} fill="currentColor" /> Open Source & Ready to Fork
          </div>

          <h1 className="font-display font-black text-5xl md:text-7xl text-text leading-[1.1] tracking-tight">
            Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-[#00e5cc]">SaaS Empire</span> From One Place.
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto leading-relaxed">
            Stop juggling spreadsheets. Track revenue, growth, and metrics across all your SaaS products in one unified control panel.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button onClick={handleDemoLogin} className="btn-primary px-8 py-4 text-lg w-full sm:w-auto shadow-xl shadow-accent/20">
              View Live Demo <ArrowRight size={20} />
            </button>
            <Link href="https://github.com/GalaxyBuilt/MultiSaaS" target="_blank" className="btn-secondary px-8 py-4 text-lg w-full sm:w-auto">
              <GitFork size={20} /> Fork the Repo
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="pt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto opacity-70 group hover:opacity-100 transition-opacity">
            <div className="text-center">
              <p className="text-2xl font-black text-text">$25.5K</p>
              <p className="text-[10px] font-bold uppercase text-muted tracking-widest">Total MRR</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-text">685</p>
              <p className="text-[10px] font-bold uppercase text-muted tracking-widest">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-text">12.4%</p>
              <p className="text-[10px] font-bold uppercase text-muted tracking-widest">Avg Growth</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-text">3</p>
              <p className="text-[10px] font-bold uppercase text-muted tracking-widest">Active Projects</p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-24 px-4 bg-surface/50 border-y border-border">
        <div className="max-w-5xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em]">The Problem</h2>
            <h3 className="font-display font-black text-3xl md:text-5xl text-text leading-tight">
              Founder life is <span className="text-muted italic underline decoration-accent/30">chaos</span>.
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <div className="card p-8 space-y-4 border-red-500/10 hover:border-red-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400">
                <Layers size={20} />
              </div>
              <h4 className="font-display font-bold text-xl text-text">Dashboard Fragmentation</h4>
              <p className="text-muted leading-relaxed">
                Juggling Stripe, PayPal, Paddle, and manual spreadsheets just to see if you're profitable. Most founders manage tools across 5+ tabs.
              </p>
            </div>
            <div className="card p-8 space-y-4 border-yellow-500/10 hover:border-yellow-500/20 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Zap size={20} />
              </div>
              <h4 className="font-display font-bold text-xl text-text">Delayed Insights</h4>
              <p className="text-muted leading-relaxed">
                Realizing churn spiked or traffic dropped weeks too late because you didn't check the specific tool for that project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em]">The Solution</h2>
              <h3 className="font-display font-black text-4xl md:text-5xl text-text leading-[1.1]">
                One dashboard. <br /><span className="text-accent underline decoration-accent/30">All</span> your SaaS.
              </h3>
            </div>
            <p className="text-lg text-muted leading-relaxed">
              MultiSaaS pulls your financial, user, and traffic data into a single, high-performance control panel. Build once, scale everything.
            </p>
            <ul className="space-y-4">
              {[
                "Unified MRR & ARR tracking",
                "Cross-project customer analytics",
                "Inter-project cost optimization",
                "AI-powered growth recommendations"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-text">
                  <CheckCircle2 size={18} className="text-accent flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-accent/20 blur-[60px] rounded-full group-hover:bg-accent/30 transition-colors duration-500" />
            <div className="card border-border2/50 shadow-2xl overflow-hidden relative rotate-2 group-hover:rotate-0 transition-transform duration-700">
              <img
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
                alt="MultiSaaS Dashboard View"
                className="w-full h-full object-cover opacity-90"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 bg-surface/30">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Features</h2>
            <h3 className="font-display font-black text-3xl md:text-5xl text-text">Engineered for Founders</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Layout, title: "Portfolio Analytics", desc: "Aggregated views across every product you own. See the big picture instantly." },
              { icon: Bot, title: "AI-Powered Insights", desc: "Automated analysis of your churn risk, traffic surges, and growth opportunities." },
              { icon: Shield, title: "Bank-Grade Security", desc: "Scaffolded with AES-256 encryption. Your API keys are your business." },
              { icon: Zap, title: "Planned Integrations", desc: "Ready-to-plug adapters for Stripe, PayPal, Paddle, and Plaid." },
              { icon: Globe, title: "Multi-Currency Ready", desc: "Global SaaS management with automatic currency normalization." },
              { icon: Star, title: "Open Source Freedom", desc: "100% forkable. Modify the UI, add connectors, make it yours." }
            ].map((f, i) => (
              <div key={i} className="card p-8 group hover:bg-surface2 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                  <f.icon size={24} />
                </div>
                <h4 className="font-display font-bold text-xl text-text mb-3">{f.title}</h4>
                <p className="text-muted leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section id="open-source" className="py-32 px-4 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="max-w-4xl mx-auto text-center space-y-10 relative">
          <Github size={64} className="mx-auto text-accent/20 mb-8" />
          <h2 className="font-display font-black text-4xl md:text-6xl text-text tracking-tight">
            Built for the Community.
          </h2>
          <p className="text-xl text-muted leading-relaxed max-w-2xl mx-auto">
            MultiSaaS is fully open-source. Fork it to build your own dashboard, contribute new integrations, or just star it to support the mission.
          </p>

          <div className="flex flex-wrap justify-center gap-6 pt-4">
            <Link href="https://github.com/GalaxyBuilt/MultiSaaS" target="_blank" className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border hover:border-accent group transition-all">
              <Star className="text-yellow-400 group-hover:scale-110 transition-transform" size={20} fill="currentColor" />
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-muted tracking-widest">Star on</p>
                <p className="font-display font-black text-text">GitHub</p>
              </div>
            </Link>
            <Link href="https://github.com/GalaxyBuilt/MultiSaaS/fork" target="_blank" className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border hover:border-accent group transition-all">
              <GitFork className="text-accent group-hover:scale-110 transition-transform" size={20} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-muted tracking-widest">Fork the</p>
                <p className="font-display font-black text-text">Repository</p>
              </div>
            </Link>
            <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-surface border border-border cursor-default grayscale opacity-50">
              <CheckCircle2 className="text-accent" size={20} />
              <div className="text-left">
                <p className="text-xs font-bold uppercase text-muted tracking-widest">Contributors</p>
                <p className="font-display font-black text-text">Joined</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-4 max-w-xs text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                <img src="/hd-logo.jpg" alt="Galaxy" className="w-full h-full object-cover" />
              </div>
              <span className="font-display font-black text-text text-xl tracking-tight">MultiSaaS</span>
            </div>
            <p className="text-sm text-muted leading-relaxed">
              The unified SaaS control panel. Open source, community-driven, and founder-focused.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase text-muted tracking-widest">Demo</h5>
              <ul className="space-y-2 text-sm">
                <li><button onClick={handleDemoLogin} className="hover:text-accent transition-colors">Live Dashboard</button></li>
                <li><Link href="/auth/login" className="hover:text-accent transition-colors">Admin Portal</Link></li>
                <li><Link href="/auth/register" className="hover:text-accent transition-colors">Create Account</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase text-muted tracking-widest">Social</h5>
              <div className="flex items-center gap-3">
                <TwitterLink />
                <GitHubLink />
              </div>
              <ul className="space-y-2 text-sm mt-4">
                <li><Link href="https://github.com/GalaxyBuilt/MultiSaaS" target="_blank" className="hover:text-accent transition-colors">GitHub Repo</Link></li>
                <li><Link href="https://x.com/GalaxyBuilt" target="_blank" className="hover:text-accent transition-colors">Twitter Feed</Link></li>
              </ul>
            </div>
            <div className="space-y-4 hidden sm:block">
              <h5 className="text-xs font-bold uppercase text-muted tracking-widest">Project</h5>
              <ul className="space-y-2 text-sm">
                <li><Link href="#" className="hover:text-accent transition-colors">Architecture</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">Contributing</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">License</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-16 mt-16 border-t border-border/50 text-center">
          <p className="text-xs text-muted font-bold tracking-widest uppercase mb-2">
            Developed by <a href="https://galaxybuilt.dev" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">GalaxyBuilt</a>
          </p>
          <p className="text-[10px] text-muted tracking-widest">
            View the <a href="https://github.com/GalaxyBuilt/MultiSaaS" target="_blank" className="hover:text-text transition-colors">MultiSaaS open-source project</a> — © 2026
          </p>
        </div>
      </footer>
    </div>
  )
}
