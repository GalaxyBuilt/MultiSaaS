# 🚀 MultiSaaS — Open-Source SaaS Portfolio Tracker

> **Track multiple SaaS projects in one place. Free, open-source, built for founders.**

Created by [@GalaxyBuilt](https://x.com/GalaxyBuilt) on X

---

## What is MultiSaaS?

MultiSaaS is a **free, self-hosted dashboard** for indie founders and SaaS operators to manage, track, and analyze all their SaaS products from a single platform. Monitor MRR, ARR, expenses, revenue, and user growth across all your projects — no vendor lock-in, no subscription required.

---

## ✨ Features

- 📊 **Global Dashboard** — Aggregated metrics across all your SaaS projects
- 💰 **Revenue Tracking** — Subscription + one-time payments per project
- 📉 **Expense Tracking** — Categorized expenses with ledger view
- 📈 **MRR / ARR Charts** — Monthly Recurring Revenue and Annual Run Rate
- 👥 **User Management** — Roles, authentication, JWT-based sessions
- 🔌 **Integration-Ready** — Stripe, PayPal, banking APIs (future)
- 🤖 **AI-Agent Ready** — Hooks prepared for AI insights (future)
- 🐳 **Docker Support** — One-command local setup

---

## 🛠 Recommended Tech Stack

| Layer        | Technology                          |
|-------------|--------------------------------------|
| Frontend     | React 18 + Next.js 14 + Tailwind CSS |
| Backend      | Node.js + Express (or NestJS)        |
| Database     | PostgreSQL + Prisma ORM              |
| Auth         | JWT (access + refresh tokens)        |
| API          | REST + optional GraphQL              |
| Charts       | Recharts                             |
| Testing      | Jest + React Testing Library         |
| CI/CD        | GitHub Actions                       |
| Container    | Docker + docker-compose              |

---

## 📁 Project Structure

```
multisaas/
├── frontend/               # Next.js / React app
│   └── src/
│       ├── pages/          # Route pages
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # API client, utilities
│       └── types/          # TypeScript types
├── backend/                # Express API
│   └── src/
│       ├── routes/         # Route definitions
│       ├── controllers/    # Business logic
│       ├── middleware/      # Auth, validation
│       └── services/       # Data layer / integrations
├── db/                     # Prisma schema + migrations
│   ├── schema.prisma
│   ├── seeds/              # Seed scripts
│   └── migrations/
├── packages/               # Shared code (monorepo)
│   ├── shared-types/       # TypeScript interfaces
│   └── ui-components/      # Shared UI components
├── docker/                 # Docker configs
├── tests/                  # Test suites
├── scripts/                # DB seed, migration helpers
├── .github/workflows/      # CI/CD
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/multisaas.git
cd multisaas
```

### 2. Install dependencies
```bash
npm install        # root deps
cd frontend && npm install
cd ../backend && npm install
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your DB credentials and JWT secret
```

### 4. Set up database
```bash
cd db
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Run locally
```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Visit: **http://localhost:3000**

### 6. Or use Docker
```bash
docker-compose up --build
```

---

## 🐳 Docker Setup

```bash
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- PostgreSQL: localhost:5432

---

## 🧪 Testing

```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# All tests
npm run test:all
```

---

## 🔌 Planned Integrations

- [ ] Stripe — live revenue sync
- [ ] PayPal — payment tracking
- [ ] Plaid — bank account connection
- [ ] OpenAI — AI insights & forecasting
- [ ] Slack — notifications

---

## 🤝 Contributing

PRs welcome! Please read `CONTRIBUTING.md` before submitting.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

> Built with ❤️ by [@GalaxyBuilt](https://x.com/GalaxyBuilt) on X
