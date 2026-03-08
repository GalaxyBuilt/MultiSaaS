'use client'
// src/components/layout/DashboardLayout.tsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  LayoutDashboard, FolderKanban, CreditCard, Brain,
  Settings, LogOut, Bell, Plus, ChevronDown, Building2,
  TrendingUp, Wallet, X, Menu
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/lib/store'
import { authApi, projectsApi, notificationsApi } from '@/lib/api'
import type { Project, Notification } from '@/types'
import { ThemeToggle, TwitterLink } from '@/components/ui'
import toast from 'react-hot-toast'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const mainNav: NavItem[] = [
  { href: '/dashboard', label: 'Global Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/projects', label: 'All Projects', icon: FolderKanban, exact: true },
  { href: '/banking', label: 'Banking', icon: Building2 },
  { href: '/settings/ai', label: 'AI Settings', icon: Brain },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, clearAuth, refreshToken } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data.data as Project[]),
  })

  const { data: notifData, refetch: refetchNotifs } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list().then(r => r.data.data as Notification[]),
    refetchInterval: 60_000,
  })

  const unreadCount = notifData?.filter(n => !n.isRead).length || 0
  const projects = projectsData || []

  async function handleLogout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch { }
    clearAuth()
    router.push('/auth/login')
  }

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  const Sidebar = (
    <aside className="flex flex-col h-full w-60 bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-black text-white text-base flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c6aff, #00e5cc)' }}>M</div>
        <span className="font-display font-bold text-white text-lg">MultiSaaS</span>
        <button className="ml-auto lg:hidden text-muted hover:text-white" onClick={() => setSidebarOpen(false)}>
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* Main nav */}
        <div>
          <p className="section-title px-2 mb-2">Overview</p>
          <nav className="space-y-0.5">
            {mainNav.map(item => (
              <Link key={item.href} href={item.href}
                className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive(item.href, item.exact)
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-white hover:bg-surface2'
                )}
                onClick={() => setSidebarOpen(false)}>
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Projects */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="section-title">Projects</p>
            <Link href="/projects/new" className="text-muted hover:text-accent transition-colors">
              <Plus size={14} />
            </Link>
          </div>
          <nav className="space-y-0.5">
            {projects.map((p, i) => {
              const colors = ['#7c6aff', '#00e5cc', '#f5a623', '#ff6b6b', '#00d68f']
              const color = colors[i % colors.length]
              return (
                <Link key={p.id} href={`/projects/${p.id}`}
                  className={clsx('flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group',
                    pathname.startsWith(`/projects/${p.id}`)
                      ? 'bg-surface2 text-white'
                      : 'text-muted hover:text-white hover:bg-surface2'
                  )}
                  onClick={() => setSidebarOpen(false)}>
                  <div className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: `${color}20`, color }}>
                    {p.name[0]}
                  </div>
                  <span className="truncate">{p.name}</span>
                  <div className="w-1.5 h-1.5 rounded-full ml-auto flex-shrink-0"
                    style={{ background: p.status === 'ACTIVE' ? '#00d68f' : '#6b6b8a' }} />
                </Link>
              )
            })}
            {projects.length === 0 && (
              <Link href="/projects/new"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted hover:text-accent transition-colors border border-dashed border-border hover:border-accent/30">
                <Plus size={12} /> Add your first project
              </Link>
            )}
          </nav>
        </div>
      </div>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c6aff, #00e5cc)' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-muted hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-col flex-shrink-0">{Sidebar}</div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 flex flex-col">{Sidebar}</div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-border bg-surface flex-shrink-0">
          <button className="lg:hidden text-muted hover:text-white" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <TwitterLink />
            <ThemeToggle />

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen) refetchNotifs() }}
                className="relative btn-ghost p-2 rounded-lg">
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl shadow-black/30 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-display font-bold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={() => notificationsApi.markAllRead().then(() => refetchNotifs())}
                        className="text-xs text-accent hover:text-accent/80">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {(notifData || []).length === 0 ? (
                      <p className="text-center text-muted text-sm py-8">No notifications</p>
                    ) : (notifData || []).slice(0, 10).map(n => (
                      <div key={n.id}
                        className={clsx('px-4 py-3 border-b border-border/50 hover:bg-surface2 transition-colors cursor-pointer',
                          !n.isRead && 'bg-accent/5')}
                        onClick={() => notificationsApi.markRead(n.id).then(() => refetchNotifs())}>
                        <div className="flex items-start gap-2">
                          {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 flex-shrink-0" />}
                          <div className={!n.isRead ? '' : 'pl-3.5'}>
                            <p className="text-sm font-semibold text-white">{n.title}</p>
                            <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/projects/new" className="btn-primary py-1.5 px-3 text-xs hidden sm:inline-flex">
              <Plus size={13} /> New Project
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
