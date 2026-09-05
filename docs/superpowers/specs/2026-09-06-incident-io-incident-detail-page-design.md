# Incident.io-Style Incident Detail Page (`/incidents/[id]`) Design Specification

> **Status:** Draft for Review  
> **Target Branch:** `feat/frontend`  
> **Target Worktree:** `/home/boris/Projects/agora/.worktrees/frontend`  
> **Repository Root Policy:** `/home/boris/Projects/agora` is strictly **read-only**. All changes occur in the active worktree.  
> **Visual References:**  
> - [`incident_homepage_screenshot.png`](file:///home/boris/.gemini/antigravity/brain/ed62894b-d760-4d45-b0be-c8904caa3515/incident_homepage_screenshot.png) (Incident INC-274 Homepage)  
> - [`incident_followups_screenshot.png`](file:///home/boris/.gemini/antigravity/brain/ed62894b-d760-4d45-b0be-c8904caa3515/incident_followups_screenshot.png) (Incident INC-45 Follow-ups & Lifecycle)  
> - [`incident_active_lifecycle_screenshot.png`](file:///home/boris/.gemini/antigravity/brain/ed62894b-d760-4d45-b0be-c8904caa3515/incident_active_lifecycle_screenshot.png) (Active Lifecycle States)  

---

## 1. Executive Summary & Goal

Replicate incident.io's authentic **Incident Homepage** as a dedicated full page at `/incidents/[id]` (e.g. `/incidents/7134` or `/incidents/INC-7134`).

Clicking any row in [`components/incidents/IncidentsTable.tsx`](file:///home/boris/Projects/agora/.worktrees/frontend/components/incidents/IncidentsTable.tsx) will navigate directly to `/incidents/[id]`. The page features incident.io's exact layout:
1. **Top Header:** Breadcrumb (`Incidents / INC-7134`), title with inline edit trigger, `Subscribe`, and `•••` action menu.
2. **Lifecycle Stepper & Metadata Strip:** Horizontal stepper (`Investigating > Fixing > Monitoring > Resolved`), severity badge (`Minor`, `Major`, `Critical`), incident type (`Default`), and duration counter (`Lasted 2h 36m` / live ticker).
3. **Summary Card:** High-visibility problem, impact, causes, and mitigation breakdown.
4. **Tabbed Content Stream:** `Overview`, `Timeline`, `Actions`, `Follow-ups`, `Alerts`, and `Debrief` tabs.
5. **Timeline Feed (Main Column):** Chronological event stream with milestone icons (PR deployed, incident declared, commander assigned, severity updates, Slack pinned messages, war room ledger events).
6. **Attributes & Responders Sidebar (Right Column):** Lead roles, Slack channel link (`#incident-7134`), Jira integration link, War Room video bridge (`Calls ⓘ` with `+` action), post-mortem status, and custom fields.
7. **Severity Classification:** Standardize severities across the application to **Minor**, **Major**, and **Critical** with backwards compatibility for legacy `SEV0`–`SEV3` data.

---

## 2. Evidence-Backed Design Rules

- **Full-Page Route [CONFIRMED]:** incident.io ships a full-page view at `/incidents/<id>` under the persistent sidebar, not a slide-over drawer.
- **Tabs [CONFIRMED]:** Horizontal tab list (`Updates`, `Timeline`, `Actions`, `Follow-ups`, `Alerts`, `Attachments`, `Pulse`) located below the summary card.
- **Static Badges [CONFIRMED]:** All badges use static solid color dots/icons. No CSS `animate-ping` pulsing dots are used in incident.io.
- **Severity Tiers [CONFIRMED]:** Standard tiers are `Minor`, `Major`, and `Critical`.
- **Status Sequence [CONFIRMED]:** Active flow is `Investigating → Fixing → Monitoring → Resolved`.
- **Tailwind CSS Styling [APPROXIMATED FROM VISUAL INSPECTION]:** All Tailwind utility classes cited in this document are approximations designed to faithfully match the margins, padding, typography, border radii, and color palettes observed in the visual reference screenshots.

---

## 3. Architecture & Routing

### 3.1 Route Layout: `app/incidents/[id]/page.tsx`
- Server component with dynamic param `params: Promise<{ id: string }>`.
- Wraps inside [`IncidentsPageLayout.tsx`](file:///home/boris/Projects/agora/.worktrees/frontend/components/incidents/IncidentsPageLayout.tsx) to maintain the persistent [`RootlySidebar.tsx`](file:///home/boris/Projects/agora/.worktrees/frontend/components/dashboard/RootlySidebar.tsx) on desktop and drawer navigation on mobile.
- Clean normalized ID resolution: Accepts `#7134`, `7134`, `INC-7134`, or document ID.

### 3.2 Navigation from Catalog
In [`components/incidents/IncidentsTable.tsx`](file:///home/boris/Projects/agora/.worktrees/frontend/components/incidents/IncidentsTable.tsx):
- Clicking anywhere on an incident table row calls `router.push('/incidents/' + cleanId)`.
- The rightmost column's "Enter War Room" button continues to navigate directly to `/war-room?incident=<id>&sev=<severity>`.

---

## 4. Component Structure & Hierarchy

```
app/incidents/[id]/
  ├── page.tsx                           # Dynamic route entry point & metadata
components/incidents/detail/
  ├── IncidentDetailPage.tsx             # Root client container (Convex reactive + offline fallback)
  ├── IncidentDetailHeader.tsx           # Breadcrumb, H1 Title, Subscribe, Action menu
  ├── IncidentLifecycleStepper.tsx       # Horizontal stepper, Severity badge, Duration pill
  ├── IncidentSummaryCard.tsx            # Problem, Impact, Causes, Mitigation breakdown
  ├── IncidentDetailTabs.tsx             # Tab header (Timeline, Actions, Follow-ups, Debrief)
  ├── IncidentTimelineView.tsx           # Vertical chronological event stream with milestone icons
  ├── IncidentActionsView.tsx            # Live incident checklist with interactive toggles
  ├── IncidentFollowUpsView.tsx          # Post-incident issue tracker tasks with priority pills
  └── IncidentDetailSidebar.tsx          # People, Comms, Calls (+ War Room), Custom fields
```

---

## 5. UI Layout & Visual Specifications

### 5.1 Top Header (`IncidentDetailHeader.tsx`)
- **Breadcrumb:** Soft salmon square icon with flame (`bg-rose-100 text-rose-600 rounded-lg p-1.5`), label `Incidents /` linking back to `/incidents`.
- **Title:** `INC - 7134 <Title>` in `text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100`.
  - Hover reveals a subtle edit pencil (`h-4 w-4 text-zinc-400`); clicking enables inline title editing.
- **Top Actions:**
  - `Subscribe` button (`border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-2xs`).
  - `•••` More actions dropdown (Copy incident link, Export to Markdown, Delete/Resolve).

### 5.2 Lifecycle Stepper & Metadata Strip (`IncidentLifecycleStepper.tsx`)
- Floating card (`bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-4`).
- **Horizontal Stepper:**
  - `Investigating` ➔ `Fixing` ➔ `Monitoring` ➔ `Resolved`.
  - Inactive steps: `text-zinc-400 text-xs font-medium`.
  - Active step: `text-zinc-900 dark:text-zinc-100 font-semibold flex items-center gap-1.5` with static red bullseye dot (`⦿`).
  - Resolved step: `text-emerald-600 font-semibold flex items-center gap-1.5` with static green circle check (`⊙`).
  - Interactive status dropdown: clicking the active step opens a dropdown allowing operators to transition status immediately.
- **Severity Badge:**
  - `Critical`: `border-red-200 bg-red-50 text-red-700` with 3-bar signal icon in red.
  - `Major`: `border-amber-200 bg-amber-50 text-amber-800` with 3-bar signal icon in amber.
  - `Minor`: `border-blue-200 bg-blue-50 text-blue-700` with 3-bar signal icon in blue.
  - Interactive: Clicking opens dropdown to escalate/de-escalate severity.
- **Duration Pill:**
  - Static clock icon + duration string (e.g. `Lasted 2h 36m` if resolved, or live elapsed counter `Active 42m`).

### 5.3 Summary Card (`IncidentSummaryCard.tsx`)
- Clean white card (`bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-6 shadow-2xs space-y-3 text-sm`).
- 4 bold prompt sections matching incident.io:
  - **Problem:** Description of observed failure across environments.
  - **Impact:** Description of customer/business degradation.
  - **Causes:** Known or hypothesized root cause.
  - **Steps to mitigate:** Actions taken or scheduled to resolve the incident.

### 5.4 Tabs & Main Feed Column (`IncidentDetailTabs.tsx` & `IncidentTimelineView.tsx`)
- Tab bar with border-bottom:
  - `Timeline` (Default active, black/white underline indicator).
  - `Actions` (with count badge e.g. `2`).
  - `Follow - ups` (with purple sparkle icon).
  - `Debrief` (link to post-mortem).
- Right-aligned controls across tabs:
  - Date & timezone indicator (e.g. `Saturday 6th September`, `Times shown in UTC`).
  - `↕ Expand all` toggle.
  - `✎ Edit` button opening timeline editor modal.
- **Timeline Feed Layout:**
  - Continuous vertical line on left with milestone icons:
    - Pink bookmark: `PR deployed`
    - Yellow flame: `Incident reported in triage`
    - Purple user: `<Name> became the Incident Lead`
    - Cyan pin: `Slack message pinned`
    - Blue bars: `Severity upgraded from Minor → Major`
    - Green circle: `Incident resolved and closed`
  - Relative duration notes (`2 hours later...`).
  - Support for War Room ledger entries (`FACT`, `HYPOTHESIS`, `CONTRADICTION`, `ACTION`) from Convex `ledger_events`.

### 5.5 Right Attributes Sidebar (`IncidentDetailSidebar.tsx`)
Width: `w-full lg:w-80 shrink-0 space-y-6`:
- **People Card:**
  - `Incident Lead`: Avatar + name (with reassign dropdown).
  - `Reporter`: Avatar + name.
  - `Active participants`: Overlapping circular avatars.
- **Communications Card:**
  - `# View Slack channel` with official multi-color Slack hash icon.
  - `◇ View Jira incident` with Jira issue key badge.
- **Calls / War Room Hub [CONFIRMED]:**
  - Label: `Calls ⓘ` with `+` action button.
  - Button: "Enter War Room" linking to `/war-room?incident=<id>&sev=<severity>` with green live indicator dot.
- **Post-Mortem Card:**
  - `📄 View Post-Mortem` (or `+ Add Post-Mortem`) linking to `/post-mortem/[id]`.
  - Status pill: `• In progress` (peach background, static orange dot).
- **Custom Fields Card:**
  - `Affected team`: e.g. `Engineering`.
  - `Impact`: e.g. `Increased errors`.
  - `Reviewer`: e.g. `Ashley Sawatsky`.

---

## 6. Severity System Migration

To match incident.io:
1. Update `IncidentSeverity` type:
   ```typescript
   export type IncidentSeverity = 'Critical' | 'Major' | 'Minor' | string;
   ```
2. Normalization helper mapping legacy data:
   - `SEV0` / `SEV1` ➔ `Critical`
   - `SEV2` ➔ `Major`
   - `SEV3` ➔ `Minor`
3. Update filters in [`components/incidents/IncidentsFilterBar.tsx`](file:///home/boris/Projects/agora/.worktrees/frontend/components/incidents/IncidentsFilterBar.tsx) to filter on `Critical`, `Major`, `Minor`.
4. Update creation form in [`components/dashboard/CreateIncidentModal.tsx`](file:///home/boris/Projects/agora/.worktrees/frontend/components/dashboard/CreateIncidentModal.tsx) to offer `Critical`, `Major`, and `Minor` radio/pills.

---

## 7. Data Layer & Convex Mutations

### 7.1 Reactive Queries & Mutations in `convex/incidents.ts`:
- `getIncident({ incidentId: string })`: Fetch single incident with all attributes.
- `updateIncidentStatus({ incidentId, status })`: Mutate status and record lifecycle event.
- `updateIncidentSeverity({ incidentId, severity })`: Mutate severity and record escalation event.
- `updateIncidentLead({ incidentId, lead })`: Reassign incident commander.
- `updateIncidentSummary({ incidentId, problem, impact, causes, mitigation })`: Update structured summary.
- `listLedgerEvents({ incidentId })`: Existing query for war room speech ledger facts/hypotheses.

### 7.2 Offline Resiliency:
- If Convex is unavailable or not configured, the page seamlessly falls back to pre-seeded reference data matching incidents `#7134`, `#7126`, `#7125`, `#7124`, `#7123`, `#7119`, `#7115`.
- Mutations update local optimistic state so interactive dropdowns and checklists remain fully functional during development and verification.

---

## 8. Verification & Done Criteria

1. **Static Type Safety:** `pnpm run typecheck` passes with 0 errors.
2. **Lint Cleanliness:** `pnpm run lint` passes with 0 errors/warnings.
3. **API Contracts:** `pnpm run verify:api` passes.
4. **Build & Prerender:** `pnpm run build` succeeds; `/incidents/[id]` prerenders or server-renders cleanly.
5. **Visual Audit:** Static dots, accurate tabs (`Timeline`, `Actions`, `Follow-ups`), incident.io spacing, and `Minor`/`Major`/`Critical` severities.
6. **Worktree Isolation:** `/home/boris/Projects/agora` remains completely read-only.
