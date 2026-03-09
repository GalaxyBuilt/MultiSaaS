import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: {
        default: 'MultiSaaS | The Unified Dashboard for SaaS Founders',
        template: '%s | MultiSaaS'
    },
    description: 'Manage multiple SaaS products from one place. Track MRR, churn, and growth with AI-powered insights for your entire portfolio.',
    keywords: ['SaaS', 'Dashboard', 'MRR Tracker', 'Founder Tools', 'Portfolio Management', 'AI Insights'],
    authors: [{ name: 'GalaxyBuilt' }],
    metadataBase: new URL('https://multisaas.xyz'),
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://multisaas.xyz',
        siteName: 'MultiSaaS',
        title: 'MultiSaaS | Manage Your SaaS Empire',
        description: 'One unified dashboard to track revenue, growth, and metrics across all your SaaS products.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'MultiSaaS Dashboard Preview',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MultiSaaS | The Founder\'s Control Panel',
        description: 'Stop juggling spreadsheets. Manage your entire SaaS portfolio in one unified dashboard.',
        images: ['/og-image.png'],
        creator: '@GalaxyBuilt',
    },
    robots: {
        index: true,
        follow: true,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={inter.className}>
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-DLE60TWMRZ"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());

                        gtag('config', 'G-DLE60TWMRZ');
                    `}
                </Script>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
