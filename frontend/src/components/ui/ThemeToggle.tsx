'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light')

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
        if (savedTheme) {
            setTheme(savedTheme)
            document.documentElement.setAttribute('data-theme', savedTheme)
        }
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        document.documentElement.setAttribute('data-theme', newTheme)
    }

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface2 hover:bg-border transition-colors text-muted hover:text-text"
            aria-label="Toggle Theme"
        >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
    )
}
