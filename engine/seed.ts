// db/seeds/seed.ts — MultiSaaS v2
// Creates only an admin user. All real data comes from live API integrations.

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding MultiSaaS v2...\n')

  const passwordHash = await bcrypt.hash('changeme123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@multisaas.dev' },
    update: {},
    create: {
      email: 'admin@multisaas.dev',
      passwordHash,
      name: 'Admin',
      role: 'MEMBER',
      emailVerified: true,
    },
  })

  console.log(`✅ Admin user created: admin@multisaas.dev / changeme123`)
  console.log(`\n⚠️  IMPORTANT: Change this password immediately after first login.\n`)
  console.log(`Next steps:`)
  console.log(`  1. Log in at http://localhost:3000`)
  console.log(`  2. Create your first SaaS project`)
  console.log(`  3. Connect Stripe/PayPal/Paddle under Project → Integrations`)
  console.log(`  4. Add an AI provider under Settings → AI`)
  console.log(`  5. Trigger your first sync and let the metrics engine run\n`)
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
