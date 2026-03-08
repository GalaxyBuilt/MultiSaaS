# 🚀 MultiSaaS v2 — Production SaaS Management Engine

> **Track, analyze, and manage all your SaaS projects in one place.**
> Live integrations. AI-assisted insights. Real banking data. Free & open-source.

By [@GalaxyBuilt](https://x.com/GalaxyBuilt) on X

---

## What's New in v2

| Feature | v1 (Skeleton) | v2 (Production Engine) |
|---|---|---|
| Data | Mock only | **Live API data** |
| Payment integrations | Stub | **Stripe, PayPal, Paddle** |
| Banking | None | **Mercury, Brex, Wise** |
| AI insights | None | **Model-agnostic AI agent layer** |
| Metrics | Pre-generated | **Real-time recalculated** |
| Notifications | None | **Email, Slack, Webhooks, In-app** |
| Webhooks | None | **Stripe + Paddle real-time events** |
| Background jobs | None | **Auto-sync every 6h, alerts hourly** |
| Ledger | None | **Double-entry bookkeeping** |
| Security | Basic | **AES-256 encryption, rate limits, audit log** |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 + Tailwind CSS + Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 + Prisma ORM |
| Auth | JWT (access 15m + refresh 7d) |
| Encryption | AES-256-GCM (all API keys at rest) |
| Jobs | node-cron (auto-sync, alerts) |
| Notifications | Nodemailer (SMTP) + Slack webhooks |
| Testing | Jest + Supertest |
| CI/CD | GitHub Actions |
| Container | Docker + docker-compose |

---

## 🚀 Quick Install

### Prerequisites
- Node.js 18+, PostgreSQL 15+, Git

### 1. Clone
```bash
git clone https://github.com/yourusername/multisaas.git
cd multisaas
```

### 2. Install deps
```bash
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Configure environment
```bash
cp backend/.env.example backend/.env
```

**Required variables:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/multisaas_db"
JWT_SECRET="minimum-32-character-random-string"
ENCRYPTION_KEY="$(openssl rand -hex 32)"
```

### 4. Database
```bash
cd db
npx prisma migrate dev --name init
npx ts-node seeds/seed.ts   # creates admin user only, no mock data
```

### 5. Run
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Or Docker:**
```bash
docker-compose -f docker/docker-compose.yaml up --build
```

---

## 🔌 Connecting SaaS Payment Dashboards

### Stripe
1. Go to **Stripe Dashboard → Developers → API keys**
2. Copy your **Secret key** (`sk_live_...` or `sk_test_...`)
3. In MultiSaaS: **Project → Integrations → Connect Stripe → paste key**
4. MultiSaaS will auto-register a webhook and begin syncing all charges, subscriptions, and refunds

**API call:**
```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/stripe/connect \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "sk_live_..."}'
```

### PayPal
1. Go to **PayPal Developer Dashboard → My Apps → Create App**
2. Copy **Client ID** and **Client Secret**
3. Connect in MultiSaaS: **Project → Integrations → Connect PayPal**

```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/paypal/connect \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"clientId": "...", "clientSecret": "..."}'
```

Set `PAYPAL_ENV=live` in `.env` for production.

### Paddle
1. Go to **Paddle Dashboard → Developer Tools → Authentication**
2. Create an API key and copy your **webhook secret**
3. Connect in MultiSaaS

```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/paddle/connect \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiKey": "...", "webhookSecret": "..."}'
```

Set `PADDLE_ENV=live` for production.

### Manual Sync
```bash
# Trigger a full sync for any provider
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/stripe/sync \
  -H "Authorization: Bearer $TOKEN"
```

Auto-sync runs every 6 hours via the background scheduler.

---

## 🏦 Connecting Banking (Fiat Accounts)

### Mercury
1. Go to **Mercury Dashboard → Settings → API**
2. Create a new API key (read-only recommended)

```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/mercury/connect \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiKey": "..."}'
```

### Brex
1. **Brex Dashboard → Developers → Create Token** (read-only scope)

```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/brex/connect \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiKey": "..."}'
```

### Wise
1. **Wise → Account Settings → API tokens → Create**

```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/integrations/wise/connect \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiKey": "..."}'
```

---

## 🤖 Configuring AI Agents

MultiSaaS supports any AI provider. Users configure their own API keys — stored encrypted with AES-256.

### Supported Providers

| Provider | Models | Setup |
|---|---|---|
| OpenAI | gpt-4o, gpt-4-turbo, gpt-3.5-turbo | api.openai.com |
| Anthropic | claude-3-5-sonnet-20241022, claude-3-haiku | anthropic.com |
| Mistral | mistral-large, mixtral-8x7b | mistral.ai |
| Ollama | llama3, mixtral, phi3 (local) | localhost:11434 |
| Custom | Any OpenAI-compatible endpoint | your endpoint |

### Add AI Provider (via API)
```bash
curl -X POST http://localhost:4000/api/ai/config \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "provider": "OPENAI",
    "apiKey": "sk-...",
    "model": "gpt-4o",
    "isDefault": true
  }'
```

### Generate Insights
```bash
# Available types: GENERAL, COST_OPTIMIZATION, CASH_ALLOCATION,
#                  CHURN_ALERT, REVENUE_ALERT, FORECAST

curl -X POST http://localhost:4000/api/ai/projects/{projectId}/insights/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "COST_OPTIMIZATION"}'
```

### Auto-detect alerts
```bash
curl -X POST http://localhost:4000/api/ai/projects/{projectId}/insights/auto \
  -H "Authorization: Bearer $TOKEN"
```

Auto-alerts run daily at 8am UTC via the scheduler.

---

## 🔔 Notifications & Alerts

### Set up email alerts
Add to `.env`:
```env
SMTP_HOST=smtp.resend.com
SMTP_PASS=your-resend-key
ALERT_EMAIL=you@yourdomain.com
```

### Set up Slack alerts
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

### Create a project alert
```bash
curl -X POST http://localhost:4000/api/projects/{projectId}/alerts \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "type": "HIGH_CHURN",
    "threshold": 5,
    "condition": "gt",
    "channels": ["email", "slack"]
  }'
```

**Alert types:** `LOW_MRR`, `HIGH_CHURN`, `EXPENSE_SPIKE`, `LOW_CASH`, `RUNWAY_LOW`

---

## 📡 API Reference (v2)

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Login → tokens |
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Invalidate token |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project detail |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/revenue` | Revenue entries |
| GET | `/api/projects/:id/expenses` | Expense entries |
| GET | `/api/projects/:id/metrics` | Monthly metrics |

### Integrations
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/:id/integrations` | List connected integrations |
| POST | `/api/projects/:id/integrations/stripe/connect` | Connect Stripe |
| POST | `/api/projects/:id/integrations/paypal/connect` | Connect PayPal |
| POST | `/api/projects/:id/integrations/paddle/connect` | Connect Paddle |
| POST | `/api/projects/:id/integrations/mercury/connect` | Connect Mercury |
| POST | `/api/projects/:id/integrations/brex/connect` | Connect Brex |
| POST | `/api/projects/:id/integrations/wise/connect` | Connect Wise |
| POST | `/api/projects/:id/integrations/:provider/sync` | Trigger sync |
| DELETE | `/api/projects/:id/integrations/:provider` | Disconnect |
| GET | `/api/projects/:id/integrations/:provider/logs` | Sync logs |

### AI
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/ai/config` | Get AI configs |
| POST | `/api/ai/config` | Add AI provider |
| DELETE | `/api/ai/config/:id` | Remove AI config |
| GET | `/api/ai/projects/:id/insights` | List insights |
| POST | `/api/ai/projects/:id/insights/generate` | Generate insight |
| POST | `/api/ai/projects/:id/insights/auto` | Run auto-alerts |
| PATCH | `/api/ai/insights/:id/read` | Mark as read |
| PATCH | `/api/ai/insights/:id/dismiss` | Dismiss |

### Dashboard
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/global` | Global portfolio dashboard |

### Webhooks (no auth)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/webhooks/stripe/:projectId` | Stripe webhook receiver |
| POST | `/api/webhooks/paddle/:projectId` | Paddle webhook receiver |

---

## 🐳 Docker

```bash
docker-compose -f docker/docker-compose.yaml up --build
```

Services: PostgreSQL + Backend (4000) + Frontend (3000)

---

## 🚢 Deployment

### Railway / Render / Fly.io
1. Set all env vars from `.env.example`
2. Push to GitHub
3. Connect repo to your platform
4. Set build command: `cd backend && npm run build`
5. Set start command: `node dist/server.js`

### Generate ENCRYPTION_KEY
```bash
openssl rand -hex 32
```

### Database (production)
Use **Supabase**, **Neon**, or **Railway Postgres** for managed PostgreSQL.

---

## 📄 License

MIT — free to use, fork, and deploy.

> Built by [@GalaxyBuilt](https://x.com/GalaxyBuilt) on X
