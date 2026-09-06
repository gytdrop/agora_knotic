# War Room UI Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the Incident War Room into a clean Zoom/Microsoft Teams dark mode collaboration interface with a decluttered video canvas, dynamic incident header, floating control dock, and a 5-tool sidebar (Chat, People, Updates, Actions with relocated HITL Guardrail, and AI Brief).

**Architecture:** Decompose the War Room into modular units: `IncidentHeader` for dynamic incident breadcrumbs and metadata; `VideoGrid` for pure participant video and AI sphere (HITL card removed); `WarRoomSidebar` housing 5 dedicated tabs (`ChatTab`, `PeopleTab`, `UpdatesTab`, `ActionsTab` containing `HitlGuardrailCard` + `StateLedgerPanel`, and `AiBriefTab`); `FloatingControlDock` for suspended bottom meeting controls; and `ConversationComponent` coordinating state.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Agora RTC/RTM.

**Spec:** `docs/superpowers/specs/2026-09-06-war-room-ui-rework-design.md`

## Global Constraints
- Target directory: `/home/boris/Projects/agora/.worktrees/agent-engine-ops` (`agent-engine-fixes` branch).
- Repository root `/home/boris/Projects/agora` is strictly read-only.
- Maintain React StrictMode guards (`isReady`) and hook ownership (`useJoin`, `useLocalMicrophoneTrack`).
- Adhere to Zoom dark mode styling: matte zinc surfaces (`#121214`, `#18181b`, `#202124`), zero neon glare, soft semantic indicators.
- Preserve existing RTM ledger parsing and HITL remediation webhook flow.

---

### Task 1: War Room Data Models & Type Definitions

**Files:**
- Create: `types/war-room.ts`
- Modify: `types/conversation.ts`

**Interfaces:**
- Consumes: Existing `LedgerItem` from `types/conversation.ts`
- Produces: `IncidentMetadata`, `WarRoomToolTab`, `WarRoomChatMessage`, `IncidentTimelineEvent`

- [ ] **Step 1: Write type definitions for the War Room tools and dynamic incident**

```typescript
// types/war-room.ts
import type { LedgerItem } from './conversation';

export type WarRoomToolTab = 'chat' | 'people' | 'updates' | 'actions' | 'ai-brief';

export interface IncidentMetadata {
  incidentId: string;
  title: string;
  severity: string;
  status: 'INVESTIGATING' | 'STAGED' | 'RESOLVED';
  startTimeMs: number;
}

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

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  source: string;
}
```

- [ ] **Step 2: Export War Room types from `types/conversation.ts`**

Re-export `types/war-room.ts` from `types/conversation.ts` for backward compatibility with existing imports.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add types/war-room.ts types/conversation.ts
git commit -m "feat(types): add War Room tools and incident data models"
```

---

### Task 2: Dynamic Incident Header (Zoom Dark Mode)

**Files:**
- Modify: `components/war-room/IncidentHeader.tsx`

**Interfaces:**
- Consumes: `IncidentMetadata`
- Produces: Updated `IncidentHeader` component with dynamic breadcrumbs, dark-mode muted `P1` pill, live MTTR clock, and participant counter.

- [ ] **Step 1: Update `IncidentHeader.tsx` implementation**

Implement:
- Dynamic props: `incidentId`, `title`, `severity`, `participantCount`, `isConnected`, `speechMuted`.
- Breadcrumb navigation: `Ecosphere` icon `>` `Incidents` `>` `{incidentId}` `>` `War Room`.
- Soft muted dark-red severity pill (`bg-rose-950/50 border border-rose-800/60 text-rose-300`).
- Dynamic incident title in clean zinc typography (`text-zinc-100 font-medium text-sm`).
- Live ticking MTTR clock, pulsing `Live` badge, and `8 in call` participant indicator.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/war-room/IncidentHeader.tsx
git commit -m "feat(war-room): update IncidentHeader with dynamic metadata and Zoom dark mode"
```

---

### Task 3: Declutter Video Grid (Pure Video Canvas)

**Files:**
- Modify: `components/war-room/VideoGrid.tsx`

**Interfaces:**
- Consumes: `Participant`, Agora WebRTC tracks/streams
- Produces: `VideoGrid` component without `HitlGuardrailCard`, presenting clean 2×2 or dynamic participant grid with frosted bottom-left name pills.

- [ ] **Step 1: Extract `HitlGuardrailCard` from `VideoGrid.tsx`**

Remove the embedded `HitlGuardrailCard` card from the video grid array.
Configure grid layout to cleanly display:
- Local participant (webcam or initial avatar) with green audio wave / speaking border.
- EchoSphere AI Sentinel with rotating vector sphere.
- Remote WebRTC peer tiles.

- [ ] **Step 2: Polish video tile card surfaces**

- Set uniform border `border-zinc-800/80` and background `bg-[#18181b]`.
- Position bottom-left frosted glass pill: `Name (Role)` and audio visualizer icon.
- Retain subtitle overlay bubbles inside video tiles for live transcribed speech.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/war-room/VideoGrid.tsx
git commit -m "feat(war-room): declutter VideoGrid to pure participant video canvas"
```

---

### Task 4: Modular Sidebar Tool Tabs (Chat, People, Updates, Actions, AI Brief)

**Files:**
- Create: `components/war-room/tabs/ChatTab.tsx`
- Create: `components/war-room/tabs/PeopleTab.tsx`
- Create: `components/war-room/tabs/UpdatesTab.tsx`
- Create: `components/war-room/tabs/ActionsTab.tsx`
- Create: `components/war-room/tabs/AiBriefTab.tsx`

**Interfaces:**
- Consumes: `WarRoomChatMessage`, `IncidentTimelineEvent`, `LedgerItem`, `HitlGuardrailCard`
- Produces: 5 individual tool tab view components

- [ ] **Step 1: Create `ChatTab.tsx`**

Implement chat feed with message list (user avatars, sender names, timestamps, message text, and attachments) and bottom interactive message input dock with emoji, attachment, mention, and send button.

- [ ] **Step 2: Create `PeopleTab.tsx`**

Implement in-call participant roster listing:
- Lead SRE (You)
- EchoSphere AI (Incident Commander Assistant)
- Remote WebRTC Peers
With role pills, connection state, and mute icons.

- [ ] **Step 3: Create `UpdatesTab.tsx`**

Implement chronological incident event timeline displaying alert triggers, MTTR milestones, and diagnostic triggers.

- [ ] **Step 4: Create `ActionsTab.tsx`**

Relocate `HitlGuardrailCard` into `ActionsTab.tsx` alongside `StateLedgerPanel` (Conversation Parsing).
Includes filter pills for `All`, `Facts`, `Hypotheses`, `Contradictions`.

- [ ] **Step 5: Create `AiBriefTab.tsx`**

Implement direct prompt & conversational interface with EchoSphere AI to query incident blast radius, ask for summaries, and view automated diagnostic findings.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add components/war-room/tabs/
git commit -m "feat(war-room): create 5 modular sidebar tool tabs"
```

---

### Task 5: War Room Sidebar Container (`WarRoomSidebar.tsx`)

**Files:**
- Create: `components/war-room/WarRoomSidebar.tsx`
- Modify: `components/war-room/index.ts`

**Interfaces:**
- Consumes: All 5 tab views from `components/war-room/tabs/`
- Produces: `WarRoomSidebar` collapsible component with top 5-tool tab bar and close button.

- [ ] **Step 1: Implement `WarRoomSidebar.tsx`**

Build the main sidebar container:
- Top header: `War Room Tools`, `• Live` green badge, and `✕` close button.
- 5 tool buttons with icons: `Chat` (`MessageSquare`), `People` (`Users`), `Updates` (`Megaphone`), `Actions` (`Zap`), `AI Brief` (`Sparkles`).
- Tab switching logic with smooth transition.
- Renders the corresponding tab component based on `activeTab`.

- [ ] **Step 2: Update `components/war-room/index.ts`**

Export `WarRoomSidebar` and the tab views.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/war-room/WarRoomSidebar.tsx components/war-room/index.ts
git commit -m "feat(war-room): implement WarRoomSidebar with 5-tool tab switcher"
```

---

### Task 6: Floating Control Dock (`FloatingControlDock.tsx`)

**Files:**
- Create: `components/war-room/FloatingControlDock.tsx`
- Modify: `components/war-room/index.ts`

**Interfaces:**
- Consumes: Mic, camera, screen share state, participant count, active sidebar tab
- Produces: `FloatingControlDock` component

- [ ] **Step 1: Implement `FloatingControlDock.tsx`**

Build floating pill dock suspended above bottom viewport:
- Translucent dark glassmorphism: `backdrop-blur-xl bg-zinc-950/80 border border-zinc-800/80 rounded-2xl`.
- Centered controls:
  - `Mute` / `Unmute` (Mic toggle)
  - `Stop Video` / `Start Video` (Camera toggle)
  - `Share` (Screen share in emerald green accent)
  - `Participants` (Users icon with participant count badge; clicking opens sidebar to `People` tab)
  - `Chat` (Chat bubble icon with unread badge; clicking opens sidebar to `Chat` tab)
  - `React` (Heart reactions popover)
  - `Record` (Record dot toggle)
  - `More` (··· menu)
  - `Leave` (Red high-contrast leave button)

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/war-room/FloatingControlDock.tsx components/war-room/index.ts
git commit -m "feat(war-room): implement FloatingControlDock component"
```

---

### Task 7: ConversationComponent Integration & Dynamic Data Wiring

**Files:**
- Modify: `components/ConversationComponent.tsx`

**Interfaces:**
- Consumes: All updated War Room components (`IncidentHeader`, `VideoGrid`, `WarRoomSidebar`, `FloatingControlDock`)
- Produces: Complete, seamless War Room call experience with dynamic incident metadata.

- [ ] **Step 1: Wire dynamic incident metadata in `ConversationComponent.tsx`**

Extract `incidentId`, `title`, and `severity` dynamically from search params and session storage with graceful fallback defaults (`#INC-8921`, `Payment service latency and failures`, `P1`).

- [ ] **Step 2: Wire sidebar tab state and dock integration**

Add state for:
- `activeSidebarTab`: `'chat' | 'people' | 'updates' | 'actions' | 'ai-brief'` (default: `'actions'`)
- `isSideDrawerOpen`: boolean (default: `true`)
- Replace old static footer with `FloatingControlDock`.
- Replace `ConversationParsingPanel` with `WarRoomSidebar`.

- [ ] **Step 3: Verify TypeScript compiles and lint passes**

Run: `pnpm run typecheck && pnpm run lint`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/ConversationComponent.tsx
git commit -m "feat(war-room): integrate dynamic header, clean grid, sidebar tools, and floating dock"
```

---

### Task 8: Verification & Build Certification

**Files:**
- None (Verification of all touched files)

- [ ] **Step 1: Run TypeScript typecheck**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 2: Run linter**

Run: `pnpm run lint`
Expected: PASS

- [ ] **Step 3: Verify API contracts**

Run: `pnpm run verify:api`
Expected: PASS

- [ ] **Step 4: Run full production build**

Run: `pnpm run build`
Expected: PASS (Build succeeds without errors)

- [ ] **Step 5: Commit any final touch-ups**

```bash
git commit -m "chore(war-room): certify War Room UI rework build"
```
