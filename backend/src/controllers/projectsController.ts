// backend/src/controllers/projectsController.ts
// MultiSaaS — Projects Controller
// Handles all project-related API logic

import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper to generate a URL-safe slug from a string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/[^\w-]+/g, '')     // Remove all non-word chars
    .replace(/--+/g, '-')       // Replace multiple - with single -
}

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const projects = await prisma.project.findMany({
      where: {
        members: { some: { userId: req.user!.id } },
      },
      include: {
        _count: { select: { members: true, integrations: true } },
      },
    })
    res.json({ data: projects })
  } catch (err) { next(err) }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        members: { some: { userId: req.user!.id } },
      },
      include: {
        members: { include: { user: { select: { name: true, email: true } } } },
        integrations: { select: { provider: true, status: true, lastSyncedAt: true } },
      },
    })
    if (!project) return res.status(404).json({ error: 'Project not found' })
    res.json({ data: project })
  } catch (err) { next(err) }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, website, currency } = req.body
    if (!name) return res.status(400).json({ error: 'Project name is required' })

    const project = await prisma.project.create({
      data: {
        name,
        slug: slugify(name) + '-' + Math.floor(Math.random() * 10000),
        website,
        currency: currency || 'USD',
        members: {
          create: { userId: req.user!.id, role: 'OWNER' as any },
        },
      },
    })
    res.status(201).json({ data: project })
  } catch (err) { next(err) }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, website, currency, timezone } = req.body
    const updateData: any = { website, currency, timezone }
    if (name) {
      updateData.name = name
      updateData.slug = slugify(name) + '-' + Math.floor(Math.random() * 1000)
    }

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: updateData,
    })
    res.json({ data: project })
  } catch (err) { next(err) }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.project.delete({
      where: { id: req.params.id },
    })
    res.json({ message: 'Project deleted successfully' })
  } catch (err) { next(err) }
}

// ─── Project Data ─────────────────────────────────────────────────────────────

export async function getProjectRevenue(req: Request, res: Response, next: NextFunction) {
  try {
    const revenue = await prisma.revenueEntry.findMany({
      where: { projectId: req.params.id },
      orderBy: { date: 'desc' },
      take: 100,
    })
    res.json({ data: revenue })
  } catch (err) { next(err) }
}

export async function getProjectExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const expenses = await prisma.expenseEntry.findMany({
      where: { projectId: req.params.id },
      orderBy: { date: 'desc' },
      take: 100,
    })
    res.json({ data: expenses })
  } catch (err) { next(err) }
}

export async function getProjectMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const { id: projectId } = req.params
    const { year, month } = req.query

    const where: any = { projectId }
    if (year) where.year = parseInt(year as string)
    if (month) where.month = parseInt(month as string)

    const metrics = await prisma.monthlyMetric.findMany({
      where,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 24,
    })
    res.json({ data: metrics })
  } catch (err) { next(err) }
}
