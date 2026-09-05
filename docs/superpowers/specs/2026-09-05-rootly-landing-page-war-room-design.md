# Rootly-Style Incident Dashboard & War Room Integration Spec

**Date**: 2026-09-05  
**Topic**: Rootly Landing Page & War Room Navigation  
**Target Worktree**: `/home/boris/Projects/agora/.worktrees/frontend`  
**Branch**: `feat/frontend`  

---

## 1. Executive Summary

This specification defines the transformation of the root landing page (`app/page.tsx`) into a high-fidelity incident management dashboard inspired by Rootly. The design incorporates a comprehensive left-hand navigation sidebar, top greeting header, real-time active incident card feed, annual activity insights heatmap, and a dedicated **War Room** navigation item linking to an Agora-powered incident collaboration room (`/war-room`).

---

## 2. Architecture & Routing

### 2.1 Route Structure
* **`app/page.tsx` (`/`)**: Main landing page presenting the Rootly Incident Dashboard.
* **`app/war-room/page.tsx` (`/war-room`)**: Dedicated page for the incident meeting room, housing the pre-call hardware test ([`PreCallView`](file:///home/boris/Projects/agora/.worktrees/frontend/components/war-room/PreCallView.tsx)) and live Agora meeting session ([`ConversationComponent`](file:///home/boris/Projects/agora/.worktrees/frontend/components/ConversationComponent.tsx)).
* **`components/dashboard/`**: Directory containing modular components for the Rootly UI shell and widgets.

### 2.2 Component Hierarchy

```
app/page.tsx
└── DashboardShell
    ├── RootlySidebar
    │   ├── OrgSelector ("Acme, Inc.")
    │   ├── QuickSearch ("⌘K")
    │   ├── CoreNavItems (Dashboard, Incidents, Retrospectives, Action Items)
    │   ├── WarRoomNavItem (Camera icon + "Live" badge -> /war-room)
    │   ├── SecNavItems (Alerts, Maintenance, Metrics)
    │   ├── AiNavItems (Rootly AI, Workflows, Configuration, Integrations)
    │   ├── UserCard ("Ashley Sawatsky")
    │   └── CreateIncidentCTA
    │
    └── MainContent
        ├── RootlyHeader (Greeting, Search Input, Create Incident Button)
        ├── ActiveIncidentCards (Count ticker, filter tabs, SEV cards)
        ├── IncidentInsightsHeatmap (52-week activity matrix + stats)
        └── CreateIncidentModal (Convex-backed modal dialog)

app/war-room/page.tsx
├── AgoraProvider (Dynamic WebRTC client wrapper)
├── PreCallView (Mic/Camera checks & join button)
└── ConversationComponent (Live video grid, audio stream, agent state ledger)
```

---

## 3. Visual Styling & Component Specification

### 3.1 Design System & Palette
* **Canvas Background**: Crisp light background `#F9FAFB` (`bg-zinc-50`), border shades in `border-zinc-200`.
* **Brand Purple Gradient**: Rootly signature gradient `from-purple-600 to-indigo-600` for primary callouts, active indicator accents, and key buttons.
* **Severity Badging**:
  * `SEV0`: `bg-red-50 text-red-700 border-red-200`
  * `SEV1`: `bg-rose-50 text-rose-700 border-rose-200`
  * `SEV2`: `bg-amber-50 text-amber-800 border-amber-200`
  * `SEV3`: `bg-indigo-50 text-indigo-700 border-indigo-200`

### 3.2 Sidebar Navigation (`RootlySidebar.tsx`)
* **Width**: Fixed `w-64` (collapsible on mobile screens).
* **Logo**: Rootly flower/star mark + bold "rootly" wordmark.
* **Organization Switcher**: Displays "Acme, Inc." with a colored circular avatar and dropdown chevron.
* **Search Trigger**: Compact input trigger showing `Search` and shortcut badge `⌘K`.
* **Navigation Links**:
  * `Dashboard`: Active highlight (`bg-purple-50 text-purple-700 font-semibold border-l-4 border-purple-600`).
  * `Incidents`, `Retrospectives`, `Action Items`.
  * **`War Room`**: Icon: `Video` or `Radio`. Includes a subtle red indicator pill (`Live`) and links to `/war-room`.
  * `Alerts`, `Maintenance`, `Metrics`.
  * *Section Divider*
  * `Rootly AI`: Accompanied by a purple `New` badge.
  * `Workflows`, `Configuration`, `Integrations`.
* **Footer Area**:
  * User profile: Circular avatar, name "Ashley Sawatsky", and role menu trigger.
  * Primary Button: Gradient button with sparkle icon `Create Incident`.

### 3.3 Header Bar (`RootlyHeader.tsx`)
* **Greeting**: `Good Afternoon Ashley 👋` alongside user profile avatar.
* **Global Search**: Search bar with placeholder `"Search Incidents..."`.
* **Quick Action**: Solid purple button `"Create Incident"` opening the modal.

### 3.4 Active Incidents Section (`ActiveIncidentCards.tsx`)
* **Header Area**:
  * Title: `🔴 Active Incidents` with count badge (e.g. `5`).
  * Refresh indicator: `↻ Refreshes every 5s`.
  * Filters: Segmented pill controls for `Latest ▾`, `All Incidents`, and `My Incidents`.
* **Cards Grid**: Horizontal responsive grid rendering default or live incidents:
  1. `#7134 Alluring Muse` (SEV-2, Active 1h, summary placeholder).
  2. `#7126 Code Deployment Error Leads to Se...` (SEV-0, Active 22h, description snippet).
  3. `#7125 Memory Leak in Main Application S...` (SEV-1, Active 22h, description snippet).
  4. `#7124 Security Vulnerability Discovered in...` (SEV-2, Active 22h, description snippet).
  5. `#7123 Unexpected Database Downtime Af...` (SEV-3, Active 22h, description snippet).
* **Card Metadata**:
  * Top: Incident ID and truncated title.
  * Middle: Severity pill, Active dot indicator, and elapsed duration.
  * Bottom: Slack channel tag icon (`#incident-slack`) and hover action `"Enter War Room"` linking to `/war-room?incident=<id>`.
* **Footer Counter**: `Showing 1 to 5 of 5`.

### 3.5 Incident Insights Heatmap (`IncidentInsightsHeatmap.tsx`)
* 52-week activity calendar matrix across the months (`Mar` through `Mar`).
* Cells styled according to incident count (0 incidents: `bg-zinc-100`; 1-2: `bg-purple-200`; 3-4: `bg-purple-400`; 5+: `bg-purple-600`).
* Right-hand summary stats: Total Incidents YTD, Mean Time to Acknowledge (MTTA), and Mean Time to Resolution (MTTR).

---

## 4. Backend & Data Integration

### 4.1 Convex Backend (`convex/incidents.ts`)
* Schema: Uses the existing `incidents` table defined in [`convex/schema.ts`](file:///home/boris/Projects/agora/.worktrees/frontend/convex/schema.ts).
* Queries:
  * `listActiveIncidents`: Queries non-resolved incidents in real time.
* Mutations:
  * `seedDefaultIncidents`: Seeds the 5 incidents from the screenshot if the database table is empty.
  * `createIncident`: Inserts a new incident with title, severity level, description, and timestamp.

### 4.2 Offline & Seed Fallback
* When Convex environment variables are missing or during test execution, `ActiveIncidentCards` falls back gracefully to a hardcoded client-side array of the 5 incidents, preventing any crashes or blank states.

---

## 5. War Room Route (`app/war-room/page.tsx`)

### 5.1 Pre-Call & Meeting Lifecycle
* Inherits the proven WebRTC initialization and token flow:
  1. Checks mic and camera hardware in [`PreCallHardwarePreview`](file:///home/boris/Projects/agora/.worktrees/frontend/components/war-room/PreCallHardwarePreview.tsx).
  2. Clicking "Enter War Room" invokes `/api/generate-agora-token` for channel credentials.
  3. Swaps into [`ConversationComponent`](file:///home/boris/Projects/agora/.worktrees/frontend/components/ConversationComponent.tsx) displaying the live video grid, AI assistant sphere, and live state ledger.
* Navigation Bar: Includes a `"← Back to Dashboard"` link in [`PreCallHeader`](file:///home/boris/Projects/agora/.worktrees/frontend/components/war-room/PreCallHeader.tsx) to return to `/`.

---

## 6. Verification & Quality Gates

1. **Static Analysis**:
   * `pnpm run lint`: Zero ESLint errors or unused imports.
   * `pnpm run typecheck`: 100% strict TypeScript compliance across all new files.
2. **Contract & Regression Checks**:
   * `pnpm run verify:api`: Verifies that route contract checks pass.
3. **User Flow Verification**:
   * Validate Rootly dashboard layout against the reference screenshot.
   * Validate navigation to `/war-room` via sidebar "War Room" button.
   * Validate "Create Incident" modal submission.
