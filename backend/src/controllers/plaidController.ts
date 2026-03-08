// backend/src/controllers/plaidController.ts
// MultiSaaS — Plaid Controller

import { Request, Response, NextFunction } from 'express'
import { plaidService } from '../services/plaid.service'

export async function createLinkToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params
        const linkToken = await plaidService.createLinkToken(req.user!.id, projectId)
        res.json({ data: { linkToken } })
    } catch (err: any) {
        res.status(500).json({ error: `Failed to create link token: ${err.message}` })
    }
}

export async function createUpdateLinkToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params
        const linkToken = await plaidService.createUpdateLinkToken(req.user!.id, projectId)
        res.json({ data: { linkToken } })
    } catch (err: any) {
        res.status(500).json({ error: `Failed to create update link token: ${err.message}` })
    }
}

export async function exchangeToken(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params
        const { publicToken, metadata } = req.body

        if (!publicToken) return res.status(400).json({ error: 'publicToken required' })
        if (!metadata?.institution) return res.status(400).json({ error: 'metadata.institution required' })

        await plaidService.exchangePublicToken(projectId, publicToken, metadata)

        res.json({
            message: `${metadata.institution.name} connected successfully. Syncing transactions in the background.`,
        })
    } catch (err: any) {
        res.status(400).json({ error: `Plaid exchange failed: ${err.message}` })
    }
}

export async function syncTransactions(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params
        const result = await plaidService.syncTransactions(projectId)
        res.json({ message: 'Sync complete', data: result })
    } catch (err: any) {
        res.status(500).json({ error: `Sync failed: ${err.message}` })
    }
}

export async function getLiveBalances(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params
        const balances = await plaidService.getLiveBalances(projectId)
        res.json({ data: balances })
    } catch (err: any) {
        res.status(500).json({ error: `Failed to fetch balances: ${err.message}` })
    }
}

export async function disconnectPlaid(req: Request, res: Response, next: NextFunction) {
    try {
        const { projectId } = req.params
        await plaidService.disconnect(projectId)
        res.json({ message: 'Plaid disconnected and access revoked' })
    } catch (err: any) {
        res.status(500).json({ error: `Disconnect failed: ${err.message}` })
    }
}

export async function plaidWebhook(req: Request, res: Response) {
    const { projectId } = req.params
    try {
        // Plaid sends JSON — parse body (already parsed by express.json)
        await plaidService.handleWebhook(projectId, req.body)
        res.json({ received: true })
    } catch (err: any) {
        console.error('[Plaid Webhook]', err.message)
        res.status(400).json({ error: err.message })
    }
}
