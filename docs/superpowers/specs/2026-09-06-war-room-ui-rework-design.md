# Design Specification: War Room UI Rework (Zoom & Microsoft Teams Aesthetic)

- **Date:** 2026-09-06
- **Status:** Approved by User
- **Target Workspace:** `/home/boris/Projects/agora/.worktrees/agent-engine-ops` (`agent-engine-fixes` branch)

---

## 1. Overview & Objectives

The goal of this redesign is to transform the Incident War Room interface from a crowded 3-column split view into an ultra-clean, aesthetic enterprise collaboration experience inspired by **Zoom Workplace** and **Microsoft Teams (Fluent 2 Dark)**.

### Core Objectives
1. **Declutter the Video Stage**: Extract the technical `HitlGuardrailCard` completely from the video grid. The main video stage is reserved strictly for human participants and the minimalist **EchoSphere AI** rotating sphere.
2. **Relocate HITL Guardrails into the Sidebar**: House the Human-in-the-Loop remediation capsule inside the right-hand **War Room Tools** sidebar under the **Actions** tool tab, adjacent to the real-time Conversation Parsing ledger.
3. **5-Tool Sidebar ("War Room Tools")**: Provide 5 dedicated tools in the collapsible right drawer:
   - 💬 **Chat**: Real-time team chat with text message feed, timestamps, avatars, and bottom input dock.
   - 👥 **People**: In-call participant directory with roles, connection states, and mute indicators.
   - 📢 **Updates**: Incident timeline displaying chronological milestones, alerts, and MTTR progress.
   - ⚡ **Actions**: Conversation Parsing (`[FACT]`, `[HYPOTHESIS]`, `[CONTRADICTION]`) + the **HITL Guardrail Capsule** (Staged Hotfix Manifest + 1-Click Hotfix execution).
   - ✨ **AI Brief**: Direct interactive chat and prompt interface with the EchoSphere AI incident agent.
4. **Dynamic Incident Title & Subheader**: Make incident ID, title, and severity fully dynamic based on the incident through which the war room was launched (via search params, session storage, or Convex incident document).
5. **Zoom Dark Mode Color Palette**: Neutral, matte zinc and charcoal surfaces (`#121214`, `#18181b`, `#202124`) with subtle borders and restrained semantic badges (no jarring neon or high-contrast glare).
6. **Floating Control Dock**: Suspended glassmorphic pill bar at bottom-center with media controls and automatic sidebar tab triggers.

---

## 2. Visual Architecture & Layout Map

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Ecosphere > Incidents > [INC-ID] > War Room    [P1] [Dynamic Title]  Live 00:28:14 👥8 │
├───────────────────────────────────────────────────────────────────┬────────────────────┤
│                                                                   │ War Room Tools  ✕ │
│                     VIDEO CANVAS (Pure Video)                     ├────────────────────┤
│                                                                   │[💬][👥][📢][⚡][✨]│
│  ┌──────────────────────────────┐ ┌─────────────────────────────┐ │ Chat People Upd Act AI │
│  │                              │ │                             │ ├────────────────────┤
│  │                              │ │                             │ │                    │
│  │       Local SRE Webcam       │ │        EchoSphere AI        │ │  ACTIVE TOOL TAB:  │
│  │                              │ │        (Vector Sphere)      │ │                    │
│  │                              │ │                             │ │  - Chat / Feed     │
│  │ [🟢 Aarav Sharma (Lead SRE)] │ │ [🔴 EchoSphere AI (Muted)]  │ │  - People Roster   │
│  └──────────────────────────────┘ └─────────────────────────────┘ │  - Incident Events │
│  ┌──────────────────────────────┐ ┌─────────────────────────────┐ │  - Actions & HITL  │
│  │                              │ │                             │ │  - AI Brief Chat   │
│  │      Remote WebRTC Peer 1    │ │     Remote WebRTC Peer 2    │ │                    │
│  │                              │ │                             │ │                    │
│  │ [🔴 Priya Mehta (SRE)]       │ │ [⚪ Daniel Kim (Backend)]   │ │                    │
│  └──────────────────────────────┘ └─────────────────────────────┘ │                    │
│                                                                   ├────────────────────┤
│        [ 🎙️ Mute | 📹 Video | 🟢 Share | 👥8 | 💬 | ❤️ | 🔴 Leave ]   │ [Input Dock (Chat)]│
└───────────────────────────────────────────────────────────────────┴────────────────────┘
```

---

## 3. Component Hierarchy & File Responsibilities

All changes are strictly contained within `/home/boris/Projects/agora/.worktrees/agent-engine-ops`:

### 1. `components/war-room/IncidentHeader.tsx`
- **Props**:
  - `incidentId`: string (dynamic, fallback `#INC-8921`)
  - `title`: string (dynamic, fallback `Payment service latency and failures`)
  - `severity`: string (dynamic, fallback `SEV-1` or `P1`)
  - `isConnected`: boolean
  - `speechMuted`: boolean
  - `participantCount`: number
- **Styling**:
  - Zoom dark mode header (`bg-[#18181b]/95 border-b border-zinc-800/80`).
  - Breadcrumb: `Ecosphere` icon + brand name `>` `Incidents` `>` `{incidentId}` `>` `War Room`.
  - Severity badge: Soft matte dark-red badge (`bg-rose-950/50 border border-rose-800/60 text-rose-300 font-medium`).
  - Title: Crisp typography with neutral zinc tones (e.g. text-zinc-100 font-medium text-sm).
  - Right controls: `Live` red dot badge, MTTR live clock (`00:28:14`), participant count pill, `View Incident ↗` button.

### 2. `components/war-room/VideoGrid.tsx`
- **Removed**: `HitlGuardrailCard` is completely extracted from the video canvas.
- **Layout**:
  - 1–2 participants: Balanced 2-tile side-by-side or stacked layout.
  - 3–4 participants: Clean 2×2 grid with uniform aspect ratio.
  - 5+ participants: Fluid responsive grid.
- **Video Cards**:
  - Rounded corners (`rounded-2xl`), subtle border (`border-zinc-800/80`), deep charcoal background.
  - Frosted glass participant pill in bottom-left (`backdrop-blur-md bg-zinc-950/70 border border-white/5`):
    - Name and Role (e.g. `Akthar (Lead SRE)`).
    - Audio status: animated green waveform indicator when speaking, or red muted icon when muted.
  - Active speaker indication: Smooth, subtle luminous border (`ring-2 ring-emerald-500/80 border-emerald-500/80`).
  - Subtitle speech overlays render non-intrusively as sleek floating badges inside the video tile.

### 3. `components/war-room/WarRoomSidebar.tsx` (replaces/extends `ConversationParsingPanel.tsx`)
- **Container**:
  - Fixed or collapsible drawer (`w-80 md:w-96 bg-[#18181b] border-l border-zinc-800/80`).
  - Header: `War Room Tools`, `• Live` green badge, and `✕` close button.
- **Tool Tabs Navigation**:
  - 5 tool buttons with icon + label:
    1. `Chat` (`MessageSquare`)
    2. `People` (`Users`)
    3. `Updates` (`Megaphone`)
    4. `Actions` (`Zap`)
    5. `AI Brief` (`Sparkles`)
  - Active tab highlighted with subtle indicator line and elevated surface (`bg-zinc-800 text-zinc-100`).

### 4. Sidebar Modular Tab Components:
- **`ChatTab.tsx`**:
  - Team chat messages feed with avatar monograms, names, timestamps, message text, and attachment cards (e.g. `Incident context`, `latency-spike.png`).
  - Bottom interactive dock: `Type a message...`, emoji button, paperclip attachment, `@` mention, and send button.
- **`PeopleTab.tsx`**:
  - Live list of all call participants (local user, AI agent, remote WebRTC peers).
  - Shows role tags (`Incident Commander`, `SRE Lead`, `AI Sentinel`), audio mute state, and camera status.
- **`UpdatesTab.tsx`**:
  - Chronological incident timeline:
    - `10:00 AM`: Incident triggered: P1 Payment service latency and failures.
    - `10:01 AM`: EchoSphere AI Sentinel active, ambient monitoring enabled.
    - `10:02 AM`: HolmesGPT cluster diagnostics active.
    - `10:05 AM`: Ingress prefix route mismatch isolated.
- **`ActionsTab.tsx`**:
  - **HITL Guardrail Capsule**:
    - Staged Hotfix Manifest card with isolated root cause.
    - Kubectl command preview (`kubectl patch ingress auth-svc...`).
    - `Authorize 1-Click Hotfix` button (triggers `/api/remediate`).
    - Post-remediation status (200 OK + View Post-Mortem link).
  - **Conversation Parsing Ledger (`StateLedgerPanel`)**:
    - Filter tabs: `All`, `Facts`, `Hypotheses`, `Contradictions`.
    - Live feed of parsed statements with speaker names and semantic badges.
- **`AiBriefTab.tsx`**:
  - Direct chat interface with EchoSphere AI.
  - Allows engineers to ask: *"What is the blast radius?"*, *"Summarize recent discussion"*, or *"Check ingress pod logs"*.

### 5. `components/war-room/FloatingControlDock.tsx`
- Suspended floating pill dock centered at bottom of viewport:
  - `Mute` / `Unmute` (Mic)
  - `Stop Video` / `Start Video` (Camera)
  - `Share` (Screen share with emerald accent)
  - `Participants` (Users icon with participant count badge; clicking switches sidebar to `People` tab)
  - `Chat` (Chat bubble icon with unread badge; clicking switches sidebar to `Chat` tab)
  - `React` (Reactions popover)
  - `Record` (Record toggle)
  - `More` (··· menu)
  - `Leave` (Red button to exit war room)

### 6. `components/ConversationComponent.tsx`
- Integrates the updated `IncidentHeader`, `VideoGrid`, `WarRoomSidebar`, and `FloatingControlDock`.
- Manages shared state:
  - `activeSidebarTab`: `'chat' | 'people' | 'updates' | 'actions' | 'ai-brief'`
  - `isSideDrawerOpen`: boolean
  - `chatMessages`: list of chat messages
  - `incidentMetadata`: `{ incidentId, title, severity }` parsed dynamically from query params/sessionStorage.

---

## 4. Data Models & Interface Contracts

```typescript
// Dynamic Incident Metadata
export interface IncidentMetadata {
  incidentId: string;
  title: string;
  severity: string;
  status: 'INVESTIGATING' | 'STAGED' | 'RESOLVED';
  startTimeMs: number;
}

// Sidebar Tool Tabs
export type WarRoomToolTab = 'chat' | 'people' | 'updates' | 'actions' | 'ai-brief';

// Chat Message Model
export interface WarRoomChatMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  avatarUrl?: string;
  timestamp: string;
  text: string;
  isAi?: boolean;
  attachment?: {
    type: 'incident_context' | 'image' | 'code';
    title: string;
    details?: string;
    imageUrl?: string;
  };
}

// Incident Timeline Update Item
export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  source: string;
}
```

---

## 5. Verification Plan

### Automated Verification
- Run TypeScript type checking: `pnpm run typecheck`
- Run Next.js linting: `pnpm run lint`
- Run API contracts check: `pnpm run verify:api`
- Run Next.js production build: `pnpm run build`

### Manual & Interactive Verification
- Verify that the video canvas displays only participants and the EchoSphere AI sphere (no technical code cards on stage).
- Verify the 5 sidebar tool tabs switch seamlessly (`Chat`, `People`, `Updates`, `Actions`, `AI Brief`).
- Verify that `Actions` contains the interactive HITL Guardrail card and the Conversation Parsing ledger.
- Verify clicking `Authorize 1-Click Hotfix` executes remediation and updates status to 200 OK.
- Verify sending a message in the `Chat` tab updates the feed.
- Verify that clicking `Chat` or `Participants` on the floating dock opens the sidebar directly to that tab.
- Verify dark mode color palette matches Zoom dark mode without high-contrast neon elements.
