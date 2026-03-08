// frontend/src/components/PlaidLink.tsx
// MultiSaaS — Plaid Link Button Component

import React, { useState, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { api } from '../lib/api'

interface Props {
    projectId: string
    onSuccess?: (institutionName: string) => void
    onExit?: () => void
    mode?: 'connect' | 'update'   // 'update' = re-auth flow
    className?: string
    children?: React.ReactNode
}

export default function PlaidLinkButton({
    projectId,
    onSuccess,
    onExit,
    mode = 'connect',
    className,
    children,
}: Props) {
    const [linkToken, setLinkToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch a link token from your backend when button is clicked
    const fetchLinkToken = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const endpoint = mode === 'update'
                ? `/plaid/projects/${projectId}/link-token/update`
                : `/plaid/projects/${projectId}/link-token`

            const res = await api.post(endpoint)
            setLinkToken(res.data.data.linkToken)
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to initialize Plaid')
        } finally {
            setLoading(false)
        }
    }, [projectId, mode])

    // Plaid Link callbacks
    const handleSuccess = useCallback(async (publicToken: string, metadata: any) => {
        setLoading(true)
        setError(null)
        try {
            await api.post(`/plaid/projects/${projectId}/exchange`, {
                publicToken,
                metadata: {
                    institution: metadata.institution,
                    accounts: metadata.accounts,
                },
            })
            onSuccess?.(metadata.institution?.name || 'Bank')
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to connect bank')
        } finally {
            setLoading(false)
            setLinkToken(null)
        }
    }, [projectId, onSuccess])

    const handleExit = useCallback(() => {
        setLinkToken(null)
        onExit?.()
    }, [onExit])

    const { open, ready } = usePlaidLink({
        token: linkToken,
        onSuccess: handleSuccess,
        onExit: handleExit,
    })

    // Open Plaid Link as soon as we have a token
    const handleClick = useCallback(async () => {
        if (!linkToken) {
            await fetchLinkToken()
        } else if (ready) {
            open()
        }
    }, [linkToken, ready, open, fetchLinkToken])

    // Auto-open when token arrives
    if (linkToken && ready && !loading) {
        open()
    }

    return (
        <div>
            <button
                onClick={handleClick}
                disabled={loading}
                className={className || 'px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors'}
            >
                {loading ? 'Connecting...' : children || (mode === 'update' ? 'Reconnect Bank' : 'Connect a Bank')}
            </button>
            {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
        </div>
    )
}
