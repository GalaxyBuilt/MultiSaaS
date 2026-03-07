// db/seeds/seed.ts
// MultiSaaS — Seed Script
// Generates 3 mock SaaS projects with realistic data

import { PrismaClient, Role, RevenueType, ExpenseCategory, ProjectStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function dateMonthsAgo(months: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d
}

// ─── Main Seed ────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding MultiSaaS database...\n')

  // Clear existing data
  await prisma.monthlyMetric.deleteMany()
  await prisma.revenueEntry.deleteMany()
  await prisma.expenseEntry.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.integration.deleteMany()
  await prisma.project.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  // ─── Users ──────────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('password123', 10)

  const alice = await prisma.user.create({
    data: {
      email: 'alice@multisaas.dev',
      passwordHash,
      name: 'Alice Founder',
      role: Role.OWNER,
    },
  })

  const bob = await prisma.user.create({
    data: {
      email: 'bob@multisaas.dev',
      passwordHash,
      name: 'Bob Admin',
      role: Role.ADMIN,
    },
  })

  const carol = await prisma.user.create({
    data: {
      email: 'carol@multisaas.dev',
      passwordHash,
      name: 'Carol Viewer',
      role: Role.VIEWER,
    },
  })

  console.log(`✅ Created 3 users (alice, bob, carol) — password: password123`)

  // ─── Project 1: FormFlow ────────────────────────────────────────────────────

  const formflow = await prisma.project.create({
    data: {
      name: 'FormFlow',
      slug: 'formflow',
      description: 'Drag-and-drop form builder with analytics and conditional logic.',
      website: 'https://formflow.example.com',
      status: ProjectStatus.ACTIVE,
      currency: 'USD',
      members: {
        create: [
          { userId: alice.id, role: Role.OWNER },
          { userId: bob.id, role: Role.ADMIN },
          { userId: carol.id, role: Role.VIEWER },
        ],
      },
    },
  })

  // ─── Project 2: InboxZen ────────────────────────────────────────────────────

  const inboxzen = await prisma.project.create({
    data: {
      name: 'InboxZen',
      slug: 'inboxzen',
      description: 'AI-powered email management and priority inbox for teams.',
      website: 'https://inboxzen.example.com',
      status: ProjectStatus.ACTIVE,
      currency: 'USD',
      members: {
        create: [
          { userId: alice.id, role: Role.OWNER },
          { userId: bob.id, role: Role.VIEWER },
        ],
      },
    },
  })

  // ─── Project 3: ShipTrackr ──────────────────────────────────────────────────

  const shiptrackr = await prisma.project.create({
    data: {
      name: 'ShipTrackr',
      slug: 'shiptrackr',
      description: 'Real-time shipment tracking and logistics dashboard for e-commerce.',
      website: 'https://shiptrackr.example.com',
      status: ProjectStatus.ACTIVE,
      currency: 'USD',
      members: {
        create: [
          { userId: alice.id, role: Role.OWNER },
          { userId: carol.id, role: Role.ADMIN },
        ],
      },
    },
  })

  console.log(`✅ Created 3 projects: FormFlow, InboxZen, ShipTrackr`)

  // ─── Revenue & Expense Seeding ──────────────────────────────────────────────

  const projectSeeds = [
    {
      project: formflow,
      monthlyRevBase: 4200,
      monthlyExpBase: 1100,
      customers: 87,
    },
    {
      project: inboxzen,
      monthlyRevBase: 8900,
      monthlyExpBase: 2400,
      customers: 210,
    },
    {
      project: shiptrackr,
      monthlyRevBase: 2800,
      monthlyExpBase: 900,
      customers: 54,
    },
  ]

  for (const seed of projectSeeds) {
    const { project, monthlyRevBase, monthlyExpBase, customers } = seed

    // Seed 12 months of metrics
    for (let m = 11; m >= 0; m--) {
      const growth = 1 + (11 - m) * 0.04
      const mrr = Math.round(monthlyRevBase * growth + randomBetween(-200, 200))
      const totalExpenses = Math.round(monthlyExpBase * growth + randomBetween(-100, 100))
      const arr = mrr * 12
      const netProfit = mrr - totalExpenses
      const d = dateMonthsAgo(m)

      await prisma.monthlyMetric.create({
        data: {
          projectId: project.id,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          mrr,
          arr,
          totalRevenue: mrr + randomBetween(100, 600),
          totalExpenses,
          netProfit,
          newCustomers: randomBetween(5, 25),
          churnedCustomers: randomBetween(1, 5),
          activeCustomers: Math.round(customers * growth),
        },
      })

      // Revenue entries for this month
      await prisma.revenueEntry.createMany({
        data: [
          {
            projectId: project.id,
            amount: mrr,
            type: RevenueType.SUBSCRIPTION,
            description: 'Monthly subscription revenue',
            source: 'stripe',
            date: d,
          },
          {
            projectId: project.id,
            amount: randomBetween(100, 600),
            type: RevenueType.ONE_TIME,
            description: 'One-time setup / consulting',
            source: 'manual',
            date: d,
          },
        ],
      })

      // Expense entries for this month
      await prisma.expenseEntry.createMany({
        data: [
          {
            projectId: project.id,
            amount: Math.round(totalExpenses * 0.4),
            category: ExpenseCategory.INFRASTRUCTURE,
            description: 'AWS / Vercel hosting',
            vendor: 'AWS',
            date: d,
            recurring: true,
          },
          {
            projectId: project.id,
            amount: Math.round(totalExpenses * 0.3),
            category: ExpenseCategory.MARKETING,
            description: 'Paid ads and SEO tools',
            vendor: 'Google Ads',
            date: d,
            recurring: false,
          },
          {
            projectId: project.id,
            amount: Math.round(totalExpenses * 0.2),
            category: ExpenseCategory.SOFTWARE,
            description: 'SaaS tools and subscriptions',
            vendor: 'Various',
            date: d,
            recurring: true,
          },
          {
            projectId: project.id,
            amount: Math.round(totalExpenses * 0.1),
            category: ExpenseCategory.MISC,
            description: 'Miscellaneous operating costs',
            vendor: null,
            date: d,
            recurring: false,
          },
        ],
      })
    }

    console.log(`  ✅ Seeded 12 months of data for ${project.name}`)
  }

  // ─── Mock Integrations ──────────────────────────────────────────────────────

  await prisma.integration.createMany({
    data: [
      {
        projectId: formflow.id,
        provider: 'STRIPE',
        status: 'ACTIVE',
        metadata: { accountId: 'acct_mock_formflow', livemode: false },
      },
      {
        projectId: inboxzen.id,
        provider: 'STRIPE',
        status: 'ACTIVE',
        metadata: { accountId: 'acct_mock_inboxzen', livemode: false },
      },
      {
        projectId: shiptrackr.id,
        provider: 'PAYPAL',
        status: 'PENDING',
        metadata: { merchantId: 'merchant_mock_shiptrackr' },
      },
    ],
  })

  console.log(`\n✅ Seeded integrations`)
  console.log('\n🎉 Database seeding complete!\n')
  console.log('Demo credentials:')
  console.log('  alice@multisaas.dev / password123  (Owner)')
  console.log('  bob@multisaas.dev   / password123  (Admin)')
  console.log('  carol@multisaas.dev / password123  (Viewer)')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
