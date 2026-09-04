# EchoSphere: Production Deployment & War Room Evaluation Guide

This guide details how to deploy **EchoSphere** for hackathon evaluation on **Vercel** (frontend / serverless), **Railway** (backend / containerized), or both in a decoupled architecture. It also covers the **Zero-Downtime Localhost Fallback** to guarantee 100% operational uptime.

---

## Architecture Summary

EchoSphere is an ambient, agentic SRE Incident Commander powered by Agora Conversational AI, Deepgram Nova-3 STT, and MiniMax TTS over low-latency WebRTC streams.

```
                      ┌──────────────────────────────────────────────┐
                      │       Agora Conversational AI Engine         │
                      │  (WebRTC Audio In/Out + Turn & Barge-In)     │
                      └───────┬──────────────────────────────▲───────┘
                              │                              │
                    [Managed Deepgram STT]          [Managed MiniMax TTS]
                              │                              │
                              ▼                              │
              ┌────────────────────────────────┐             │
              │   Reasoning & Tool-Call Agent  │             │
              │     (Agora / OpenAI LLM)       │             │
              └───────────────┬────────────────┘             │
                              │                              │
            ┌─────────────────┴─────────────────┐            │
            ▼                                   ▼            │
 [HolmesGPT Diagnostic Tools]          [Incident State Ledger]│
  ├─ check_database_health()            ├─ Confirmed Facts   │
  ├─ check_ingress_controller()         ├─ Unverified Hypotheses
  └─ stage_hotfix_patch()               └─ Contradiction Alerts
            │                                   │            │
            ▼                                   ▼            │
    [Staged Hotfix Action]            [Agora RTM / WebSocket]│
            │                                   │            │
            │                                   ▼            │
            │                         [Next.js Dashboard]    │
            │                          (Live War Room UI)    │
            │                                   │            │
            ▼                                   │            │
  ┌───────────────────────────────────────────┐ │            │
  │     Human-in-the-Loop (HITL) Barrier      │◄┘            │
  │  - Voice Passkey: "EchoSphere, authorize" ├──────────────┘
  │  - UI Action: 1-Click Approval Capsule    │
  └─────────────────────┬─────────────────────┘
                        │ (Authorized)
                        ▼
           [Remediation Webhook Execution]
          (Port 8080 -> 8000 / Route Restored)
```

---

## Deployment Options

### Option A: Unified Vercel Deployment (Recommended)
Because Next.js 16 App Router bundles both the React frontend and serverless API route handlers (`/api/*`), deploying the entire repository directly to Vercel provides the simplest, fastest, and most reliable setup.

* **Frontend**: Hosted on Vercel Edge/Serverless.
* **Backend API**: Handled by Vercel Serverless Functions (`app/api/*`).
* **Protocol**: Automatic HTTPS + WSS.

### Option B: Decoupled Deployment (Vercel Frontend + Railway Backend)
If you prefer running the backend API routes on a continuous Node container on Railway:
* **Frontend (Vercel)**: Set `NEXT_PUBLIC_API_URL=https://<your-railway-app>.up.railway.app`
* **Backend (Railway)**: Set `CORS_ALLOWED_ORIGIN=https://<your-vercel-app>.vercel.app`

---

## Required Environment Variables

Configure these variables in your Vercel Project Settings and/or Railway Service Variables:

| Variable Name | Required | Environment | Description |
|---|---|---|---|
| `NEXT_PUBLIC_AGORA_APP_ID` | **Yes** | Client & Server | Agora Project App ID (from [Agora Console](https://console.agora.io/)). |
| `AGORA_APP_ID` | Optional | Server | Fallback alias for Agora App ID. |
| `AGORA_APP_CERTIFICATE` | **Yes** | Server Only | Agora Project App Certificate (from Agora Console). **Never expose to client.** |
| `NEXT_AGORA_APP_CERTIFICATE` | Optional | Server Only | Legacy fallback alias for Agora App Certificate. |
| `NEXT_PUBLIC_API_URL` | Optional | Client | Set to your Railway backend URL if using decoupled architecture. **Leave blank for relative `/api` on Vercel or localhost.** |
| `NEXT_PUBLIC_WS_URL` | Optional | Client | Custom WebSocket transport URL. Defaults to current host if omitted. |
| `CORS_ALLOWED_ORIGIN` | Optional | Server (Railway) | The Vercel frontend URL allowed to call the backend (e.g. `https://echosphere.vercel.app`). `localhost` is always whitelisted automatically. |
| `FRONTEND_URL` | Optional | Server (Railway) | Alternative alias for allowed frontend origin. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Optional | Client | Clerk authentication publishable key. |
| `CLERK_SECRET_KEY` | Optional | Server | Clerk authentication secret key. |
| `NEXT_PUBLIC_CONVEX_URL` | Optional | Client | Convex cloud deployment URL. |

---

## Step-by-Step Vercel Deployment

### Method 1: Via Vercel Web Dashboard (Recommended)

1. **Push your code**:
   Ensure your branch is pushed to GitHub:
   ```bash
   git push origin agent-engine-fixes
   ```
2. **Import Project**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your Git repository (`agora_knotic` or `echosphere`).
   - Select Framework Preset: **Next.js**.
3. **Configure Build Settings**:
   - **Build Command**: `pnpm build` (or leave default Next.js preset).
   - **Install Command**: `pnpm install`.
   - **Output Directory**: Leave empty / default.
4. **Add Environment Variables**:
   Under **Environment Variables**, add:
   - `NEXT_PUBLIC_AGORA_APP_ID`: `<your_agora_app_id>`
   - `AGORA_APP_CERTIFICATE`: `<your_agora_app_certificate>`
   - `NEXT_PUBLIC_CONVEX_URL`: `https://enchanted-pony-120.convex.cloud` (or your Convex URL)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: `<your_clerk_key>` (if Clerk is enabled)
   - `CLERK_SECRET_KEY`: `<your_clerk_secret>` (if Clerk is enabled)
5. **Deploy**:
   Click **Deploy**. Once built, Vercel will assign a public URL (e.g. `https://echosphere.vercel.app`).

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not present
npm install -g vercel

# Link and deploy
vercel

# Add production environment variables
vercel env add NEXT_PUBLIC_AGORA_APP_ID
vercel env add AGORA_APP_CERTIFICATE

# Deploy to production
vercel --prod
```

---

## Step-by-Step Railway Deployment

### Method 1: Via Railway Web Dashboard

1. Go to [railway.app/new](https://railway.app/new).
2. Select **Deploy from GitHub repo** and choose this repository and branch (`agent-engine-fixes`).
3. Railway automatically detects `railway.json` and the multi-stage `Dockerfile`.
4. **Configure Service Variables**:
   Add the following variables:
   - `AGORA_APP_ID`: `<your_agora_app_id>`
   - `AGORA_APP_CERTIFICATE`: `<your_agora_app_certificate>`
   - `CORS_ALLOWED_ORIGIN`: `https://<your-vercel-domain>.vercel.app`
   - `PORT`: `3000` (Railway automatically binds this)
5. **Generate Domain**:
   In your Railway Service Settings → **Networking**, click **Generate Domain** (e.g. `echosphere-backend.up.railway.app`).

### Method 2: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Set environment variables
railway variables set AGORA_APP_ID="<your_app_id>" AGORA_APP_CERTIFICATE="<your_cert>"

# Deploy
railway up
```

---

## Localhost Development & Emergency Failover

EchoSphere is engineered with **Dual-Mode Parity**. If Vercel or Railway is unreachable during a live demonstration or judging session, you can fall back to local development instantly with **zero code modifications**:

1. **Start the local server**:
   ```bash
   pnpm dev
   ```
2. **Open in browser**:
   Navigate to [http://localhost:3000](http://localhost:3000).
3. **Why it works**:
   - When `NEXT_PUBLIC_API_URL` is empty, `getApiUrl()` falls back to relative `/api/...`, executing API requests against your local server.
   - Backend CORS automatically permits `http://localhost:3000` and `http://127.0.0.1:3000`.
   - WebRTC secure context checks recognize `localhost` as secure, enabling complete microphone and webcam access.

---

## How Judges Can Test the Live War Room

Follow these steps to experience the complete Incident Commander flow:

### 1. Pre-Call Hardware Check
1. Open the public War Room URL in Chrome, Edge, or Brave.
2. The **Pre-Call View** will display:
   - Active Incident Banner: `#INC-8921 (SEV-1)`
   - Hardware preview: Ensure microphone level meter detects your voice.
   - Camera preview: Verify local video feed.
3. Click **"Join War Room"** or **"Launch War Room"**.

### 2. Live Conversational AI Incident Commander
1. Once connected, the central visualizer will pulse to indicate active WebRTC connection to the Agora Conversational AI agent.
2. **Speak to EchoSphere**:
   - Say: *"EchoSphere, what is the status of the current outage?"*
   - Or: *"EchoSphere, did the database crash?"*
3. **Observe the Contradiction Engine**:
   - The agent will cross-reference your verbal hypothesis with real-time AWS RDS telemetry.
   - It will explain that RDS PostgreSQL is operating at 2.1% CPU with only 14 connections, marking the statement as a **Contradiction** in the live state ledger.

### 3. HolmesGPT Telemetry & Root Cause Isolation
1. Verbalize: *"EchoSphere, run an ingress routing audit."*
2. Or click the circular **Terminal** button in the bottom dock.
3. HolmesGPT completes an automated scan of Kubernetes ingress controllers, isolating the root cause:
   - **Port Configuration Mismatch**: `ingress-nginx/auth-service` routes upstream traffic to port `8080`, while the container listens on port `8000` (causing HTTP 502 Bad Gateway).

### 4. Human-in-the-Loop (HITL) Guardrail & Remediation
1. The **HITL Guardrail Card** stages the hotfix manifest patch:
   - `actionId`: `act_hotfix_8080_8000`
   - Target: `ingress/auth-svc` (Restore targetPort from 8080 -> 8000).
2. Click **"Authorize Remediation Hotfix"** (or use the voice passkey: *"EchoSphere, authorize patch"*).
3. The remediation webhook executes via `/api/remediate`, returning a 200 OK resolution and updating the state ledger to `RESOLVED`.

### 5. State Ledger & Post-Incident Review (PIR)
1. Click the **Document** button in the bottom dock to toggle the full RTM State Ledger drawer.
2. Review the chronological record of Confirmed Facts, Suppressed Contradictions, and Executed Actions with speaker attribution and millisecond timestamps.
3. Click **"End Conversation"** (red phone icon) to conclude the session and generate the Post-Incident Review.

---

## Verification Commands Reference

Run these commands in `/home/boris/Projects/agora/.worktrees/agent-engine-ops` to verify system health before pushing:

```bash
# Doctor environment check
pnpm run doctor

# ESLint audit
pnpm run lint

# TypeScript compilation
pnpm run typecheck

# API route contract validation
pnpm run verify:api

# Next.js production build
pnpm run build

# Integrated verification suite
pnpm run verify
```
