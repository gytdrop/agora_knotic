# Rootly Landing Page & War Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the root landing page into a Rootly-style incident management dashboard featuring left sidebar navigation with an engineering "War Room" option, active incident feed, activity heatmap, and a dedicated `/war-room` route for Agora meetings.

**Architecture:** Split the application cleanly into an incident operations dashboard shell at `/` and a dedicated WebRTC meeting route at `/war-room`. The dashboard connects reactively to Convex for active incidents with robust offline fallback data matching the reference design.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Convex Backend, Agora RTC/RTM.

**Spec:** [`docs/superpowers/specs/2026-09-05-rootly-landing-page-war-room-design.md`](file:///home/boris/Projects/agora/.worktrees/frontend/docs/superpowers/specs/2026-09-05-rootly-landing-page-war-room-design.md)

## Global Constraints

- Never break existing Agora WebRTC / RTM token flows or hook lifecycles.
- Keep the repository root `/home/boris/Projects/agora` read-only; all edits occur in `/home/boris/Projects/agora/.worktrees/frontend`.
- Maintain strict TypeScript (`tsc --noEmit`) and ESLint compliance without disabling rules.
- Follow conventional commits (`feat:`, `fix:`, `docs:`, `chore:`).

---

### Task 1: Convex Incident Schema & Seed Functions

**Files:**
- Modify: `convex/incidents.ts`
- Test: Run verification check via `tsx` or test script

**Interfaces:**
- Consumes: `convex/schema.ts` (`incidents` table)
- Produces:
  - `listActiveIncidents`: `query` returning active incidents
  - `seedDefaultIncidents`: `mutation` seeding the 5 default incidents (#7134, #7126, #7125, #7124, #7123)
  - `createIncident`: `mutation` adding a new incident

- [ ] **Step 1: Update convex/incidents.ts with listActiveIncidents, seedDefaultIncidents, and createIncident**

Add functions to `convex/incidents.ts`:
```typescript
export const listActiveIncidents = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("incidents").order("desc").collect();
    return all.filter((inc) => inc.status !== "RESOLVED");
  },
});

export const seedDefaultIncidents = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("incidents").first();
    if (existing) return;

    const defaults = [
      {
        incidentId: "#7134",
        title: "Alluring Muse",
        severity: "SEV2",
        status: "ACTIVE",
        rootCause: "No summary for this incident",
        createdAt: Date.now() - 3600 * 1000, // 1h ago
      },
      {
        incidentId: "#7126",
        title: "Code Deployment Error Leads to Service Degradation",
        severity: "SEV0",
        status: "ACTIVE",
        rootCause: "A recent deployment of new code to the production environment inadvertently introduced an error...",
        createdAt: Date.now() - 22 * 3600 * 1000, // 22h ago
      },
      {
        incidentId: "#7125",
        title: "Memory Leak in Main Application Server",
        severity: "SEV1",
        status: "ACTIVE",
        rootCause: "Users reported unusual slowdowns and service interruptions traced back to a memory leak...",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7124",
        title: "Security Vulnerability Discovered in Auth Module",
        severity: "SEV2",
        status: "ACTIVE",
        rootCause: "A significant security flaw was identified within the authentication module of our core platform...",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7123",
        title: "Unexpected Database Downtime After Upgrade",
        severity: "SEV3",
        status: "ACTIVE",
        rootCause: "During a routine update, a critical database unexpectedly went offline, leading to widespread...",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
    ];

    for (const item of defaults) {
      await ctx.db.insert("incidents", item);
    }
  },
});

export const createIncident = mutation({
  args: {
    title: v.string(),
    severity: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const count = (await ctx.db.query("incidents").collect()).length;
    const incidentId = `#${7135 + count}`;
    return await ctx.db.insert("incidents", {
      incidentId,
      title: args.title,
      severity: args.severity,
      status: "ACTIVE",
      rootCause: args.summary || "No summary for this incident",
      createdAt: Date.now(),
    });
  },
});
```

- [ ] **Step 2: Run typecheck to verify Convex types pass**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add convex/incidents.ts
git commit -m "feat(convex): add active incident queries and seed mutations"
```

---

### Task 2: Dedicated War Room Route Setup

**Files:**
- Create: `app/war-room/page.tsx`
- Modify: `components/war-room/PreCallHeader.tsx`

**Interfaces:**
- Consumes: `components/war-room/PreCallView.tsx`, `components/ConversationComponent.tsx`, `/api/generate-agora-token`, `/api/stop-conversation`
- Produces: Complete meeting flow at `/war-room` with back navigation to `/`

- [ ] **Step 1: Add "Back to Dashboard" navigation to PreCallHeader.tsx**

Update `components/war-room/PreCallHeader.tsx` to add a link button:
```tsx
<Link
  href="/"
  className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
>
  <ArrowLeft className="h-3.5 w-3.5" />
  <span>Dashboard</span>
</Link>
```

- [ ] **Step 2: Create app/war-room/page.tsx with the full PreCall and Agora meeting lifecycle**

Move the meeting orchestrator from `components/LandingPage.tsx` into `app/war-room/page.tsx`, wrapped in `<Suspense>` to handle query parameters (e.g., `channel`, `incident`).

- [ ] **Step 3: Run typecheck to verify the new route builds cleanly**

Run: `pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/war-room/page.tsx components/war-room/PreCallHeader.tsx
git commit -m "feat(war-room): create dedicated war room route and back navigation"
```

---

### Task 3: Rootly Sidebar Navigation Component

**Files:**
- Create: `components/dashboard/RootlySidebar.tsx`

**Interfaces:**
- Consumes: Lucide icons (`Home`, `Flame`, `FileText`, `CheckCircle2`, `Video`, `Shield`, `Wrench`, `BarChart3`, `Sparkles`, `Workflow`, `Settings`, `Puzzle`, `Search`, `ChevronDown`, `Plus`)
- Produces: `RootlySidebar` component with active styling and **War Room** link (`/war-room`)

- [ ] **Step 1: Implement components/dashboard/RootlySidebar.tsx**

Build the left navigation bar matching the Rootly design:
- Logo: Asterisk icon + `rootly`
- Organization dropdown: "Acme, Inc." with circular color avatar
- Quick search trigger (`⌘K`)
- Core menu: Dashboard (active state), Incidents, Retrospectives, Action Items
- **War Room**: Video icon with red `Live` pulse badge, linking to `/war-room`
- Secondary menu: Alerts, Maintenance, Metrics
- Section divider
- Rootly AI (with `New` pill), Workflows, Configuration, Integrations
- Footer: User profile ("Ashley Sawatsky") and `✨ Create Incident` gradient button

- [ ] **Step 2: Run typecheck and lint**

Run: `pnpm run lint && pnpm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/RootlySidebar.tsx
git commit -m "feat(ui): add rootly sidebar with war room navigation link"
```

---

### Task 4: Top Header & Create Incident Modal

**Files:**
- Create: `components/dashboard/RootlyHeader.tsx`
- Create: `components/dashboard/CreateIncidentModal.tsx`

**Interfaces:**
- Consumes: Convex mutation `createIncident` (with local fallback)
- Produces:
  - `RootlyHeader`: Top greeting, search bar, and "Create Incident" action
  - `CreateIncidentModal`: Accessible modal with title, severity selection, and submit handler

- [ ] **Step 1: Implement CreateIncidentModal.tsx**

Build dialog with fields:
- Incident Title (input)
- Severity (`SEV0`, `SEV1`, `SEV2`, `SEV3` radio/pill selector)
- Summary description (textarea)
- Actions: Cancel & "Create Incident"

- [ ] **Step 2: Implement RootlyHeader.tsx**

Build top bar:
- User avatar + `Good Afternoon Ashley 👋`
- Search input with placeholder `Search Incidents...`
- `Create Incident` button triggering modal

- [ ] **Step 3: Run typecheck and lint**

Run: `pnpm run lint && pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/RootlyHeader.tsx components/dashboard/CreateIncidentModal.tsx
git commit -m "feat(ui): add rootly top header and create incident modal"
```

---

### Task 5: Active Incident Cards & Insights Heatmap

**Files:**
- Create: `components/dashboard/ActiveIncidentCards.tsx`
- Create: `components/dashboard/IncidentInsightsHeatmap.tsx`

**Interfaces:**
- Consumes: Convex query `listActiveIncidents` / `seedDefaultIncidents`
- Produces:
  - `ActiveIncidentCards`: Header with count, 5s ticker, filter tabs, responsive grid of incident cards with severity pills, Slack icons, and "Join War Room" button
  - `IncidentInsightsHeatmap`: 52-week activity calendar grid with purple shading and annual metrics

- [ ] **Step 1: Implement ActiveIncidentCards.tsx**

Include fallback default items:
- `#7134 Alluring Muse` (`SEV2`, Active 1h)
- `#7126 Code Deployment Error Leads to Se...` (`SEV0`, Active 22h)
- `#7125 Memory Leak in Main Application S...` (`SEV1`, Active 22h)
- `#7124 Security Vulnerability Discovered in...` (`SEV2`, Active 22h)
- `#7123 Unexpected Database Downtime Af...` (`SEV3`, Active 22h)
Add "Enter War Room" action on card hover linking to `/war-room?incident=${id}`.

- [ ] **Step 2: Implement IncidentInsightsHeatmap.tsx**

Build 52-week calendar grid:
- Months header: `Mar`, `Apr`, `May`, `Jun`, `Jul`, `Aug`, `Sep`, `Oct`, `Nov`, `Dec`, `Jan`, `Feb`, `Mar`
- Cells with varying purple intensities (`#7C3AED`)
- Stats card on the right: Total Incidents (34), MTTR (24m), Open Actions (12)

- [ ] **Step 3: Run typecheck and lint**

Run: `pnpm run lint && pnpm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/ActiveIncidentCards.tsx components/dashboard/IncidentInsightsHeatmap.tsx
git commit -m "feat(ui): add active incident cards feed and activity heatmap"
```

---

### Task 6: Assemble Root Landing Page & Verification

**Files:**
- Create: `components/dashboard/IncidentDashboard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `RootlySidebar`, `RootlyHeader`, `ActiveIncidentCards`, `IncidentInsightsHeatmap`, `CreateIncidentModal`
- Produces: Seamless Rootly landing page experience at `/`

- [ ] **Step 1: Create IncidentDashboard.tsx**

Compose `RootlySidebar`, `RootlyHeader`, `ActiveIncidentCards`, `IncidentInsightsHeatmap`, and `CreateIncidentModal` inside a flexible dashboard container.

- [ ] **Step 2: Update app/page.tsx to render IncidentDashboard**

Replace the old landing page view with `IncidentDashboard`.

- [ ] **Step 3: Run full verification suite**

Run: `pnpm run lint && pnpm run typecheck && pnpm run verify:api`
Expected: All checks PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/IncidentDashboard.tsx app/page.tsx
git commit -m "feat(page): assemble full rootly dashboard landing page"
```
