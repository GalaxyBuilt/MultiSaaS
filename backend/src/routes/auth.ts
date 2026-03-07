// backend/src/routes/auth.ts
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { generateTokens } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'email, password, and name are required' })
    }

    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists) return res.status(409).json({ error: 'Email already registered' })

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, role: true },
    })

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role })
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.status(201).json({ data: { user, ...tokens } })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Demo shortcut for mock users
    const MOCK_USERS: Record<string, any> = {
      'alice@multisaas.dev': { id: 'mock-user-alice', email: 'alice@multisaas.dev', name: 'Alice Founder', role: 'OWNER' },
      'bob@multisaas.dev': { id: 'mock-user-bob', email: 'bob@multisaas.dev', name: 'Bob Admin', role: 'ADMIN' },
      'carol@multisaas.dev': { id: 'mock-user-carol', email: 'carol@multisaas.dev', name: 'Carol Viewer', role: 'VIEWER' },
    }

    if (MOCK_USERS[email] && password === 'password123') {
      const user = MOCK_USERS[email]
      const tokens = generateTokens(user)
      return res.json({ data: { user, ...tokens, source: 'mock' } })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const tokens = generateTokens({ id: user.id, email: user.email, role: user.role })
    res.json({
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        ...tokens,
      },
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/refresh
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' })

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' })
    }

    const tokens = generateTokens({
      id: stored.user.id,
      email: stored.user.email,
      role: stored.user.role,
    })

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { id: stored.id } })
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: stored.user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    res.json({ data: tokens })
  } catch (error) {
    next(error)
  }
})

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {})
  }
  res.json({ message: 'Logged out successfully' })
})

export default router
