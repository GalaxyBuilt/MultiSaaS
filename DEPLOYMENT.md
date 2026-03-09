# ☁️ Cloudflare Pages Deployment Guide

To get MultiSaaS live on `multisaas.xyz` for $0, follow these exact settings in the Cloudflare Dashboard.

## 1. Create a New Project
- Go to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
- Select the `MultiSaaS` repository.

## 🚨 IF YOUR BUILD FAILED WITH "Cannot find cwd: /out"
This means you swapped the fields! Cloudflare is trying to "start" the build inside a folder that doesn't exist yet.

**To fix it:**
1.  Go to **Settings** > **Build & deployments** > **Configure methods and paths**.
2.  Ensure **Root directory** is `frontend`.
3.  Ensure **Build output directory** is `out`.

## 2. Global Build Settings (EXACT FIELDS)
| Dashboard Field | Value to Enter |
| :--- | :--- |
| **Framework preset** | `Next.js` |
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Build output directory** | `out` |

## 3. Environment Variables
Add this variable under **Settings** > **Environment variables** to ensure the demo data loads:
- `NEXT_PUBLIC_DEMO_MODE` = `true`

## 4. Domain Setup
- Add `multisaas.xyz` in the **Custom Domains** tab.

---

### Why the build might have failed before:
1. **Root Directory**: If Cloudflare tries to build from the repo root, it tries to build the backend (which requires a database connection) and fails.
2. **Static Export**: Without `output: 'export'`, Next.js tries to run a Node server, which Cloudflare Pages only supports via specific Worker plugins. Static export is the "Bulletproof" way.
3. **Image Optimization**: Standard `next/image` requires a server. We've enabled `unoptimized: true` to make it work on static hosting.
