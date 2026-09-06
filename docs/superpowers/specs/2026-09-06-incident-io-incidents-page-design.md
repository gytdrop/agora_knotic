# Incident.io-Style Incidents Page & Ecosphere Navigation Spec

**Date**: 2026-09-06  
**Topic**: Incident.io Incidents Directory & Navigation  
**Target Worktree**: `/home/boris/Projects/agora/.worktrees/frontend`  
**Branch**: `feat/frontend`  

---

## 1. Executive Summary

This specification defines the design and implementation of a dedicated **Incidents Page** (`/incidents`) inspired by the production-grade UI of **incident.io**, customized with **Ecosphere** design aesthetics (Agora cyan/emerald accents, glowing status indicators, and adaptive light/dark theme support).

The sidebar navigation provides a direct link to **Incidents** without nesting under dropdown menus. The page features a view bar (Active, All, Resolved), comprehensive multi-attribute filters (Search, Severity, Status, Sort), a responsive tabular list matching incident.io's spacing and typography, quick action entry into the Agora War Room, and full reactive integration with the Convex backend.

---

## 2. Architecture & Route Structure

### 2.1 Routing Hierarchy

```
app/
├── page.tsx                      # Dashboard root (metrics, active incident cards, heatmap)
├── incidents/
│   └── page.tsx                  # Dedicated Incidents directory & table view (/incidents)
├── war-room/
│   └── page.tsx                  # Live Agora WebRTC meeting room (/war-room)
└── components/
    ├── dashboard/
    │   └── RootlySidebar.tsx     # Global sidebar with direct "Incidents" link & active counter
    └── incidents/
        ├── IncidentsDirectory.tsx    # Container managing view state, filters, and Convex data
        ├── IncidentsHeader.tsx       # Title, live count ticker, and "Declare Incident" CTA
        ├── IncidentsFilterBar.tsx    # View tabs (Active/All/Resolved), search bar, and filter dropdowns
        ├── IncidentsTable.tsx        # High-density data table with sortable columns
        └── IncidentsEmptyState.tsx   # Friendly empty state when filters yield zero records
```

---

## 3. Visual Styling & Design System

### 3.1 Design Tokens (Ecosphere & incident.io Hybrid)

* **Canvas & Surface**:
  * Light Mode (Default): `#F7F7F8` (`bg-[#f7f7f8]`), panel surfaces in `#FFFFFF` with borders in `border-zinc-200`.
  * Dark Mode: `#0F172A` / `#161618` matching `app/incident.png`.
* **Brand Accents**:
  * Primary Action: Indigo/Purple gradient `from-purple-600 to-indigo-600` for CTA and active highlights.
  * Agora Engine: Cyan `#06b6d4` and Emerald `#10b981` indicators for real-time WebRTC audio/video sync.
* **Severity Badging**:
  * `SEV0`: `bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/60`
  * `SEV1`: `bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60`
  * `SEV2`: `bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60`
  * `SEV3`: `bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900/60`
* **Status Indicators**:
  * `Investigating`: Pulsing yellow dot + `Investigating` badge
  * `Fixing`: Animated blue dot + `Fixing` badge
  * `Monitoring`: Green dot + `Monitoring` badge
  * `Resolved`: Muted gray checkmark + `Resolved` badge

---

## 4. Component Specifications

### 4.1 Global Sidebar Navigation (`RootlySidebar.tsx`)
* Top-level item: **Incidents** (`/incidents`) with `Flame` icon.
* Active state: Left purple border (`border-purple-600`), light purple background (`bg-purple-50`), purple text (`text-purple-700 font-semibold`).
* Badge: Dynamic active incident count badge fetched from Convex.

### 4.2 Incidents Header (`IncidentsHeader.tsx`)
* Left: Page title `Incidents` + Magic UI `<NumberTicker>` active count pill.
* Right:
  * Primary Button: `✨ Declare Incident` (opens `CreateIncidentModal`).
  * Secondary Actions: Export CSV and View Settings dropdowns.

### 4.3 Filter Bar (`IncidentsFilterBar.tsx`)
* **View Tabs**:
  * `Active`: Filtered to non-resolved incidents (`status !== 'RESOLVED'`).
  * `All`: Complete incident ledger.
  * `Resolved`: Filtered to resolved incidents (`status === 'RESOLVED'`).
* **Search Input**: Live client-side search across incident ID, title, summary, and lead.
* **Dropdown Filters**:
  * Severity: All, SEV0, SEV1, SEV2, SEV3
  * Status: All, Investigating, Fixing, Monitoring, Resolved
  * Sort: Newest First (default), Oldest First, Severity (High to Low)

### 4.4 Incidents Table (`IncidentsTable.tsx`)
* **Table Columns**:
  1. **Incident**:
     * Monospace ID: `#7134`
     * Title: Bold, clickable link
     * Slack tag: `#incident-7134` with Slack icon
  2. **Severity**: Pill badge with color-coded dot indicator
  3. **Status**: Pulsing live status chip
  4. **Lead**: User avatar initials pill + Commander name
  5. **Created**: Formatted relative time ("1h ago", "Yesterday")
  6. **Actions**:
     * `War Room`: Video icon button routing directly to `/war-room?incident=<id>&sev=<severity>`
     * Row click: Direct navigation to incident detail view
* **Pagination Footer**: `Showing X to Y of Z incidents`.

---

## 5. Backend & Data Integration

* **Convex Backend** (`convex/incidents.ts`):
  * Consumes `listActiveIncidents` and adds `listAllIncidents` query returning all records with sorting and status metadata.
  * Supports `createIncident` mutation.
* **Offline Resilience**:
  * Retains full offline fallback data set matching reference incidents if Convex is disconnected or initial query is loading.

---

## 6. Verification & Quality Gates

1. **Lint & Strict Types**:
   * `pnpm run lint`: Zero ESLint warnings or errors.
   * `pnpm run typecheck`: Strict TypeScript pass with 0 errors.
2. **API Contracts**:
   * `pnpm run verify:api`: Validates all API route contracts.
3. **Build**:
   * `pnpm run build`: Production compilation verifies static/dynamic routes.
