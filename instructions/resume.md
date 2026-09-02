# Tech Stack & Team Ownership

**Environment:** Next.js (App Router), React 18, Tailwind CSS, pnpm, Node 20+.  
**Integrations:** Agora Conversational AI (RTC for voice, RTM for real-time messaging/transcripts).

## Team Role Matrix

| Member | Role | Assigned Territory | Core Objectives | Strict Boundaries |
| --- | --- | --- | --- | --- |
| **Akthar** | Frontend & UI Lead | `app/page.tsx`, `components/war-room/*` | Build enterprise dark-mode UI, subtle participant grid, live parsing side-drawer, and wire the HITL guardrail card to `/api/remediate`. Record demo script. | Do not alter WebRTC connection logic or backend agent prompt configurations. |
| **Ashrith** | Voice & RTC Lead | `lib/agora.ts`, `lib/conversation.ts`, `components/ConversationComponent.tsx` | Manage WebRTC streams (<300ms latency), capture Agora RTM transcript deltas, tune AEC/VAD, and expose state hooks for frontend consumption. | Do not build visual React components or write diagnostic tool logic. |
| **Kartikey** | Agent Engine Lead | `app/api/invite-agent/*`, `app/api/remediate/*`, `invite-agent-config.ts` | Enforce 95% silence directive in prompt, map outputs to structured tags, build HolmesGPT diagnostic mock, and construct the 200 OK remediation API. | Do not touch frontend styling, layout assembly, or WebRTC signaling files. |

## File Ownership Tree (`echosphere-knotic/`)

```
echosphere-knotic/
├── .env.local                               <-- SHARED (Identical credentials for all 3)
│
├── app/
│   ├── api/
│   │   ├── generate-agora-token/route.ts   <-- ASHRITH (WebRTC Token Auth)
│   │   ├── stop-conversation/route.ts       <-- ASHRITH (Session Lifecycle)
│   │   ├── invite-agent/route.ts            <-- KARTIKEY (Agent VAD & Pipeline)
│   │   └── remediate/route.ts               <-- KARTIKEY (HITL Remediation Hook)
│   ├── layout.tsx                           <-- UNTOUCHED
│   └── page.tsx                             <-- AKTHAR (War Room Assembly)
│
├── components/
│   ├── ConversationComponent.tsx           <-- ASHRITH (Microphone & RTM Client)
│   ├── QuickstartPreCallCard.tsx            <-- AKTHAR (Pre-Call Screen)
│   └── war-room/
│       ├── IncidentHeader.tsx              <-- AKTHAR (SEV-1 Badge & MTTR Clock)
│       ├── VideoGrid.tsx                   <-- AKTHAR (Muted Feeds & Speaking Ring)
│       ├── StateLedgerPanel.tsx            <-- AKTHAR (Live Parsed Facts/Hypotheses)
│       ├── ConversationParsingPanel.tsx    <-- AKTHAR (Minimizable Side Drawer)
│       └── HitlGuardrailCard.tsx           <-- AKTHAR (1-Click Patch Action Card)
│
├── lib/
│   ├── agora.ts                             <-- ASHRITH (RTC Client & Audio Ingestion)
│   ├── conversation.ts                      <-- ASHRITH (RTM Transcript Streamer)
│   └── mock-sre-engine.ts                   <-- KARTIKEY (HolmesGPT Cluster Diagnostics)
│
└── src/features/conversation/server/
    └── invite-agent-config.ts              <-- KARTIKEY (Incident Commander Prompt)
```
