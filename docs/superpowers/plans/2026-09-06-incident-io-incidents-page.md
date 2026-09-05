# Incident.io-Style Incidents Page & Ecosphere Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated `/incidents` directory page replicating incident.io's table layout, filters, and spacing adapted to Ecosphere branding, with direct sidebar navigation.

**Architecture:** A modular React 19 / Next.js 16 App Router interface at `app/incidents/page.tsx` backed by Convex reactive queries (`listAllIncidents`, `listActiveIncidents`) with offline fallback, shadcn/ui components (`Badge`, `DropdownMenu`, `Button`, `Tooltip`), and Magic UI animated counters.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Convex, Lucide Icons, shadcn/ui, Magic UI (`motion`).

**Spec:** [`docs/superpowers/specs/2026-09-06-incident-io-incidents-page-design.md`](file:///home/boris/Projects/agora/.worktrees/frontend/docs/superpowers/specs/2026-09-06-incident-io-incidents-page-design.md)

## Global Constraints

- Keep the repository root `/home/boris/Projects/agora` read-only; all code changes occur in `/home/boris/Projects/agora/.worktrees/frontend`.
- Never break existing Agora WebRTC / RTM token flows or hook lifecycles.
- Maintain strict TypeScript (`tsc --noEmit`) and ESLint compliance without disabling rules.
- Follow conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).
- Keep offline fallback data so the page renders reliably if the Convex network connection is unavailable.

---

### Task 1: Convex Backend `listAllIncidents` Query

**Files:**
- Modify: `convex/incidents.ts`

**Interfaces:**
- Consumes: `convex/schema.ts` (`incidents` table)
- Produces:
  - `listAllIncidents`: Query returning all incidents ordered by creation time descending

- [ ] **Step 1: Add listAllIncidents query to convex/incidents.ts**

```typescript
export const listAllIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").order("desc").collect();
  },
});
```

- [ ] **Step 2: Run typecheck to verify Convex query compiles**

Run: `pnpm run typecheck`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add convex/incidents.ts
git commit -m "feat(convex): add listAllIncidents query"
```

---

### Task 2: Sidebar Direct Link to `/incidents`

**Files:**
- Modify: `components/dashboard/RootlySidebar.tsx`

**Interfaces:**
- Consumes: `RootlySidebar.tsx` navigation items list
- Produces: `Incidents` navigation item pointing to `/incidents` with active route detection and active count pill

- [ ] **Step 1: Update Incidents item in RootlySidebar.tsx**

Change `href: '/#incidents'` to `href: '/incidents'`. Ensure `isItemActive('/incidents')` correctly marks the sidebar link active when on `/incidents` or nested subroutes. Add dynamic active incident count badge.

- [ ] **Step 2: Run lint and typecheck**

Run: `pnpm run lint && pnpm run typecheck`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/RootlySidebar.tsx
git commit -m "feat(ui): update sidebar navigation with direct incidents link"
```

---

### Task 3: Incidents Table Components

**Files:**
- Create: `components/incidents/IncidentsEmptyState.tsx`
- Create: `components/incidents/IncidentsTable.tsx`

**Interfaces:**
- Consumes: `ActiveIncidentItem` interface, shadcn `Badge`, Lucide icons (`Video`, `ExternalLink`, `ShieldAlert`, `Clock`, `User`)
- Produces:
  - `IncidentsTable`: Render table columns (Incident ID + Title + Slack channel, Severity badge, Status badge with live indicator dot, Commander lead with avatar, Created time, War Room action button)
  - `IncidentsEmptyState`: Clean empty state when search/filter returns zero matches

- [ ] **Step 1: Create components/incidents/IncidentsEmptyState.tsx**

Build friendly empty state with an icon, "No incidents found" heading, helpful description, and "Reset filters" action button.

- [ ] **Step 2: Create components/incidents/IncidentsTable.tsx**

Build responsive table conforming to incident.io layout:
- Header row with uppercase muted labels: `INCIDENT`, `SEVERITY`, `STATUS`, `LEAD`, `CREATED`, `ACTIONS`
- Row hover states with smooth transition
- Severity pill with color dot (SEV0 Red, SEV1 Rose, SEV2 Amber, SEV3 Indigo)
- Status badge with active indicator
- Quick War Room button linking to `/war-room?incident=<id>&sev=<severity>`

- [ ] **Step 3: Run lint and typecheck**

Run: `pnpm run lint && pnpm run typecheck`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/incidents/IncidentsEmptyState.tsx components/incidents/IncidentsTable.tsx
git commit -m "feat(ui): create incident.io-style incidents table components"
```

---

### Task 4: Filter Bar and View Tabs Component

**Files:**
- Create: `components/incidents/IncidentsFilterBar.tsx`

**Interfaces:**
- Consumes: shadcn `DropdownMenu`, Lucide icons (`Search`, `SlidersHorizontal`, `ArrowUpDown`, `Check`)
- Produces:
  - `IncidentsFilterBar`: View tabs (`Active`, `All`, `Resolved`), Search input, Severity filter, Status filter, and Sort order selector

- [ ] **Step 1: Create components/incidents/IncidentsFilterBar.tsx**

Implement:
- Segmented view tabs: `Active` (with count), `All`, `Resolved`
- Real-time search input with clear button (`⌘K` style placeholder)
- Severity dropdown (`All Severities`, `SEV0`, `SEV1`, `SEV2`, `SEV3`)
- Status dropdown (`All Statuses`, `Investigating`, `Fixing`, `Monitoring`, `Resolved`)
- Sort dropdown (`Newest First`, `Oldest First`, `Highest Severity`)

- [ ] **Step 2: Run lint and typecheck**

Run: `pnpm run lint && pnpm run typecheck`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/incidents/IncidentsFilterBar.tsx
git commit -m "feat(ui): add incidents view tabs and filter bar"
```

---

### Task 5: Incidents Header & Main Directory Container

**Files:**
- Create: `components/incidents/IncidentsHeader.tsx`
- Create: `components/incidents/IncidentsDirectory.tsx`

**Interfaces:**
- Consumes: `IncidentsHeader`, `IncidentsFilterBar`, `IncidentsTable`, `CreateIncidentModal`, Convex queries `api.incidents.listAllIncidents` / `api.incidents.listActiveIncidents`
- Produces:
  - `IncidentsHeader`: Title with Magic UI `NumberTicker`, "+ Declare Incident" primary button
  - `IncidentsDirectory`: State manager coordinating filters, pagination, Convex reactivity, and offline fallback

- [ ] **Step 1: Create components/incidents/IncidentsHeader.tsx**

Build top header with "Incidents" heading, live animated `<NumberTicker>` total count pill, and "+ Declare Incident" button.

- [ ] **Step 2: Create components/incidents/IncidentsDirectory.tsx**

Compose `IncidentsHeader`, `IncidentsFilterBar`, `IncidentsTable`, and `CreateIncidentModal`. Integrate Convex queries with offline fallback data matching the 5 reference incidents.

- [ ] **Step 3: Run lint and typecheck**

Run: `pnpm run lint && pnpm run typecheck`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/incidents/IncidentsHeader.tsx components/incidents/IncidentsDirectory.tsx
git commit -m "feat(ui): assemble incidents directory with declare incident modal"
```

---

### Task 6: Dedicated Route & Verification

**Files:**
- Create: `app/incidents/page.tsx`

**Interfaces:**
- Consumes: `RootlySidebar`, `IncidentsDirectory`
- Produces: Full incident directory page at `/incidents`

- [ ] **Step 1: Create app/incidents/page.tsx**

Assemble the layout with `RootlySidebar` on the left and `IncidentsDirectory` in the main content container.

- [ ] **Step 2: Run full verification suite**

Run: `pnpm run lint && pnpm run typecheck && pnpm run verify:api && pnpm run build`  
Expected: All checks PASS with 0 errors and `/incidents` prerenders cleanly.

- [ ] **Step 3: Commit**

```bash
git add app/incidents/page.tsx
git commit -m "feat(page): create dedicated /incidents route"
```
