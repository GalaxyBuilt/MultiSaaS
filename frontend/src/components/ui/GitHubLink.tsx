'use client'

import Link from 'next/link'
import { Github } from 'lucide-react'

export function GitHubLink() {
    return (
        <Link
            href="https://github.com/galaxybuilt"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-surface2 hover:bg-border transition-colors text-muted hover:text-text flex items-center justify-center"
            aria-label="GitHub"
        >
            <Github className="w-4 h-4" />
        </Link>
    )
}
