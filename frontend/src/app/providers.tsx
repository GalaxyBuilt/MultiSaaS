'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') || 'dark'
        document.documentElement.setAttribute('data-theme', savedTheme)
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            {mounted ? (
                <>
                    {children}
                    <Toaster position="bottom-right" toastOptions={{
                        style: {
                            background: 'var(--surface)',
                            color: 'var(--text)',
                            border: '1px solid var(--border)',
                        }
                    }} />
                </>
            ) : (
                <div style={{ visibility: 'hidden' }}>{children}</div>
            )}
        </QueryClientProvider>
    )
}
