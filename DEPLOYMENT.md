# ☁️ Cloudflare Pages Deployment Guide

To get MultiSaaS live on `multisaas.xyz` for $0, follow these exact settings in the Cloudflare Dashboard.

## 1. Create a New Project
- Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
- Select the `MultiSaaS` repository.

## 2. Build Settings (CRITICAL)
Next.js monorepos can be tricky. Use these exact paths:

- **Project name**: `multisaas`
- **Production branch**: `main`
- **Framework preset**: `Next.js`
- **Root directory**: `frontend`  <-- [IMPORTANT] POINT TO THE FRONTEND FOLDER
- **Build command**: `npm run build`
- **Build output directory**: `out` <-- [IMPORTANT] NEXT.JS STATIC EXPORT USES 'out'

## 3. Environment Variables
Add this variable to ensure the demo data loads correctly:
- `NEXT_PUBLIC_DEMO_MODE` = `true`

## 4. Domain Setup
- Once the build succeeds, go to the **Custom Domains** tab.
- Add `multisaas.xyz`.
- Cloudflare will automatically handle the SSL and DNS.

---

### Why the build might have failed before:
1. **Root Directory**: If Cloudflare tries to build from the repo root, it tries to build the backend (which requires a database connection) and fails.
2. **Static Export**: Without `output: 'export'`, Next.js tries to run a Node server, which Cloudflare Pages only supports via specific Worker plugins. Static export is the "Bulletproof" way.
3. **Image Optimization**: Standard `next/image` requires a server. We've enabled `unoptimized: true` to make it work on static hosting.
