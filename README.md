# 🚀 MultiSaaS

**One Unified Dashboard to Manage Your Entire SaaS Portfolio.**

MultiSaaS is a production-ready, open-source dashboard designed for founders who manage multiple SaaS products. Stop juggling spreadsheets and disparate Stripe tabs—track your MRR, growth, traffic, and AI-powered insights for all your projects in one unified control panel.

![MultiSaaS Demo](https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop)

## ✨ Features

- 📊 **Portfolio Overview**: Aggregated MRR, ARR, and growth metrics across all products.
- 📁 **Project Management**: Deep dives into individual SaaS health and KPIs.
- 🤖 **AI Insights**: Automated analysis of churn risk, traffic trends, and growth opportunities.
- 💳 **Scaffolded Integrations**: Ready-to-use patterns for Stripe, PayPal, Paddle, and Plaid.
- 🌐 **Multi-Currency Support**: Unified financial tracking across global markets.
- 💎 **Premium UI**: Built with Next.js 14, TailwindCSS, and a high-performance design system.

> [!IMPORTANT]
> **DEMO VERSION ONLY**: This repository is currently configured for a **zero-friction demonstration**. It uses mock data and simulated authentication by default. Before using this in production, you **must** follow the "Connecting Real Data" section below.

## 🛡️ Security Best Practices

To protect your SaaS portfolio and sensitive financial data, follow these non-negotiables:

1.  **Never Commit `.env` Files**: Ensure `.env`, `.env.local`, and any file containing secrets are added to your `.gitignore`. We have provided `.env.example` templates—use these to share structure, never secrets.
2.  **Rotate API Keys**: If you accidentally commit a Stripe, Plaid, or OpenAI key, revoke it immediately through the provider's dashboard.
3.  **Environment Secrets**: When deploying (to Vercel, Railway, etc.), use the platform's native Environment Variable management instead of uploading files.
4.  **Backend Validation**: Never trust client-side financial calculations. Always verify payment hashes and webhook signatures on the backend.

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS, Recharts, Lucide.
- **Backend (Scaffolded)**: Node.js, Express, Prisma, PostgreSQL.
- **Deployment**: Optimized for Cloudflare Pages (Frontend) and Railway/Heroku (Backend).

## 🚀 Quick Start (Demo Mode)

The project runs in **Demo Mode** by default, using mock data so you can see the power of MultiSaaS without setting up a database or API keys.

```bash
# Clone the repository
git clone https://github.com/GalaxyBuilt/MultiSaaS.git

# Navigate to frontend
cd multisaas/frontend

# Install dependencies
npm install

# Run the project
npm run dev
```

Visit `https://multisaas.xyz` to see the live demo.

## 🔧 Connecting Real Data

To turn this into a real SaaS management system:

1.  **Backend Setup**: Navigate to `/backend`, set up your `.env` with a PostgreSQL URL, and run `npx prisma migrate dev`.
2.  **API Keys**: Update `frontend/.env.local` to point to your backend URL.
3.  **Integrations**: Plug your API keys into the scaffolded clients in `frontend/src/lib/integrations/`.

## 🍴 Contributing

We ❤️ contributors! Whether you're adding a new integration, fixing a bug, or improving the UI, please check our [CONTRIBUTING.md](./CONTRIBUTING.md).

1. Fork the repo.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## ⭐ Show Your Support

If you find this project useful, please consider giving it a ⭐ on GitHub to help others find it!

---

Built with ❤️ by [GalaxyBuilt](https://github.com/GalaxyBuilt) — © 2026
