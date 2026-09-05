# Incident.io-Style Incident Detail Page (`/incidents/[id]`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replicate incident.io's authentic Incident Homepage at `/incidents/[id]` with reactive state, static indicator dots, unified 5-tab stream, internal Agora WebRTC War Room bridge, and standard `Minor`/`Major`/`Critical` severity classification.

**Architecture:** A dynamic Next.js App Router page (`app/incidents/[id]/page.tsx`) wrapping responsive layout components (`components/incidents/detail/*`). It connects reactively to Convex queries with seamless local fallback to pre-seeded incidents for zero-dependency offline resilience. Table row clicks in `IncidentsTable.tsx` route to the detail page while dedicated "Enter War Room" buttons continue directly into `/war-room`.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Convex, Lucide React, Agora WebRTC.

**Spec:** [`docs/superpowers/specs/2026-09-06-incident-io-incident-detail-page-design.md`](file:///home/boris/Projects/agora/.worktrees/frontend/docs/superpowers/specs/2026-09-06-incident-io-incident-detail-page-design.md)

## Global Constraints

- **Worktree Isolation:** All edits and commands must occur within `/home/boris/Projects/agora/.worktrees/frontend` on branch `feat/frontend`. The repository root `/home/boris/Projects/agora` is strictly **read-only**.
- **Static Indicators Only:** Badges and lifecycle dots must use static solid dots/icons (no `animate-ping`).
- **Severity Classification:** Standardize on `Minor`, `Major`, `Critical` with backwards compatibility for legacy `SEV0`–`SEV3`.
- **Unified Tabs:** Exactly 5 core tabs: `Updates`, `Timeline`, `Actions`, `Follow-ups`, `Alerts` (`Timeline` active by default).
- **War Room Reframing:** Section `Calls ⓘ` embeds our internal Agora WebRTC War Room (`/war-room?incident=<id>&sev=<severity>`) as an architectural deviation from incident.io's external Zoom/Meet link.
- **Verification Gates:** Zero errors on `pnpm run typecheck`, `pnpm run lint`, `pnpm run verify:api`, and `pnpm run build`.

---

### Task 1: Severity Model Migration & Normalization Helpers

**Files:**
- Create: `lib/incident-severity.ts`
- Create: `scripts/test-incident-severity-migration.ts`
- Modify: `components/incidents/IncidentsTable.tsx`
- Modify: `components/incidents/IncidentsFilterBar.tsx`
- Modify: `components/dashboard/CreateIncidentModal.tsx`

**Interfaces:**
- Consumes: Existing `IncidentSeverity` union type in `IncidentsTable.tsx`
- Produces: `normalizeSeverity(raw: string): 'Critical' | 'Major' | 'Minor'`, `getSeverityConfig(severity: string): SeverityConfig` supporting `Critical`, `Major`, `Minor`, and backwards compatibility with `SEV0`–`SEV3`.

- [ ] **Step 1: Write the failing severity test script**

Create `scripts/test-incident-severity-migration.ts`:
```typescript
import assert from 'node:assert';
import { normalizeSeverity, getSeverityConfig } from '../lib/incident-severity';

console.log('Testing Severity Migration & Normalization...');

// Normalization mappings
assert.strictEqual(normalizeSeverity('SEV0'), 'Critical');
assert.strictEqual(normalizeSeverity('SEV1'), 'Critical');
assert.strictEqual(normalizeSeverity('SEV2'), 'Major');
assert.strictEqual(normalizeSeverity('SEV3'), 'Minor');
assert.strictEqual(normalizeSeverity('Critical'), 'Critical');
assert.strictEqual(normalizeSeverity('Major'), 'Major');
assert.strictEqual(normalizeSeverity('Minor'), 'Minor');
assert.strictEqual(normalizeSeverity('unknown'), 'Minor');

// Config validation
const majorConfig = getSeverityConfig('Major');
assert.strictEqual(majorConfig.label, 'Major');
assert.strictEqual(majorConfig.barCount, 2);
assert.ok(majorConfig.badgeClasses.includes('amber'));

const critConfig = getSeverityConfig('Critical');
assert.strictEqual(critConfig.label, 'Critical');
assert.strictEqual(critConfig.barCount, 3);
assert.ok(critConfig.badgeClasses.includes('red'));

const minorConfig = getSeverityConfig('Minor');
assert.strictEqual(minorConfig.label, 'Minor');
assert.strictEqual(minorConfig.barCount, 1);
assert.ok(minorConfig.badgeClasses.includes('blue'));

console.log('PASS: Severity migration contracts verified.');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/test-incident-severity-migration.ts`  
Expected: FAIL with `Cannot find module '../lib/incident-severity'`

- [ ] **Step 3: Implement `lib/incident-severity.ts` and update consumer components**

Create `lib/incident-severity.ts`:
```typescript
export type IncidentSeverity = 'Critical' | 'Major' | 'Minor' | 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3' | string;

export interface SeverityConfig {
  label: 'Critical' | 'Major' | 'Minor';
  dotColor: string;
  badgeClasses: string;
  barCount: number;
}

export function normalizeSeverity(raw?: string): 'Critical' | 'Major' | 'Minor' {
  if (!raw) return 'Minor';
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean === 'SEV0' || clean === 'SEV1' || clean === 'CRITICAL') return 'Critical';
  if (clean === 'SEV2' || clean === 'MAJOR') return 'Major';
  if (clean === 'SEV3' || clean === 'MINOR' || clean === 'LOW') return 'Minor';
  return 'Minor';
}

export function getSeverityConfig(severity: string): SeverityConfig {
  const norm = normalizeSeverity(severity);
  switch (norm) {
    case 'Critical':
      return {
        label: 'Critical',
        dotColor: 'bg-red-500',
        badgeClasses: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        barCount: 3,
      };
    case 'Major':
      return {
        label: 'Major',
        dotColor: 'bg-amber-500',
        badgeClasses: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        barCount: 2,
      };
    case 'Minor':
    default:
      return {
        label: 'Minor',
        dotColor: 'bg-blue-500',
        badgeClasses: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
        barCount: 1,
      };
  }
}
```

Update `components/incidents/IncidentsTable.tsx`:
- Re-export `IncidentSeverity` and `getSeverityConfig` from `@/lib/incident-severity`.
- Update severity pill rendering to use 3-bar signal icon bars according to `barCount`.

Update `components/incidents/IncidentsFilterBar.tsx`:
- Change `SEVERITY_OPTIONS` to: `ALL`, `Critical`, `Major`, `Minor`.
- Filter incidents by `normalizeSeverity(inc.severity) === selectedSeverity`.

Update `components/dashboard/CreateIncidentModal.tsx`:
- Change `SEVERITY_OPTIONS` to `Critical`, `Major`, `Minor`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/test-incident-severity-migration.ts`  
Expected: PASS

- [ ] **Step 5: Run lint & typecheck and commit**

```bash
pnpm run typecheck && pnpm run lint
git add lib/incident-severity.ts scripts/test-incident-severity-migration.ts components/incidents/IncidentsTable.tsx components/incidents/IncidentsFilterBar.tsx components/dashboard/CreateIncidentModal.tsx
git commit -m "feat(incidents): migrate severity classification to Minor, Major, and Critical"
```

---

### Task 2: Convex Data Layer & Offline Dataset Adapter

**Files:**
- Create: `lib/incident-detail-data.ts`
- Create: `scripts/test-incident-data-layer.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/incidents.ts`

**Interfaces:**
- Consumes: Convex `incidents` and `ledger_events` tables
- Produces: Queries & mutations: `getIncident`, `updateIncidentStatus`, `updateIncidentSeverity`, `updateIncidentSummary`, `updateIncidentLead`; offline fallback helper `getFallbackIncident(id: string): IncidentDetailRecord`.

- [ ] **Step 1: Write test script for data layer and fallback adapter**

Create `scripts/test-incident-data-layer.ts`:
```typescript
import assert from 'node:assert';
import { getFallbackIncident, normalizeIncidentId } from '../lib/incident-detail-data';

console.log('Testing Incident Data Layer Fallback & Normalization...');

assert.strictEqual(normalizeIncidentId('#7134'), '#7134');
assert.strictEqual(normalizeIncidentId('7134'), '#7134');
assert.strictEqual(normalizeIncidentId('INC-7134'), '#7134');

const inc = getFallbackIncident('#7134');
assert.ok(inc);
assert.strictEqual(inc.incidentId, '#7134');
assert.strictEqual(inc.severity, 'Major');
assert.strictEqual(inc.status, 'INVESTIGATING');
assert.ok(inc.problem && inc.impact && inc.causes && inc.mitigation);
assert.ok(Array.isArray(inc.timelineEvents) && inc.timelineEvents.length > 0);

console.log('PASS: Data layer fallback contracts verified.');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx scripts/test-incident-data-layer.ts`  
Expected: FAIL with `Cannot find module '../lib/incident-detail-data'`

- [ ] **Step 3: Implement `lib/incident-detail-data.ts` and Convex schema/mutations**

Create `lib/incident-detail-data.ts` with rich seeded incident records (`#7134`, `#7126`, `#7125`, `#7124`, etc.) containing structured summary, timeline events, responders, Slack channels, and follow-ups.

Modify `convex/schema.ts`:
- Extend `incidents` table with optional fields: `lead`, `slackChannel`, `jiraKey`, `problem`, `impact`, `causes`, `mitigation`.

Modify `convex/incidents.ts`:
- Add mutations: `updateIncidentStatus`, `updateIncidentSeverity`, `updateIncidentSummary`, `updateIncidentLead`.
- Update `seedDefaultIncidents` to use `Critical`, `Major`, `Minor`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx scripts/test-incident-data-layer.ts`  
Expected: PASS

- [ ] **Step 5: Run lint & typecheck and commit**

```bash
pnpm run typecheck && pnpm run lint
git add lib/incident-detail-data.ts scripts/test-incident-data-layer.ts convex/schema.ts convex/incidents.ts
git commit -m "feat(incidents): extend schema mutations and add offline incident fallback adapter"
```

---

### Task 3: Incident Detail Header & Lifecycle Stepper

**Files:**
- Create: `components/incidents/detail/IncidentDetailHeader.tsx`
- Create: `components/incidents/detail/IncidentLifecycleStepper.tsx`

**Interfaces:**
- Consumes: `IncidentDetailRecord` attributes, `onUpdateStatus`, `onUpdateSeverity`, `onUpdateTitle`.
- Produces: Top header with breadcrumb, editable title, subscribe button, more menu; and floating lifecycle stepper with static status indicators (`⦿`), severity badge with 3-bar signal icon, and duration pill.

- [ ] **Step 1: Create `IncidentDetailHeader.tsx`**

Implement `IncidentDetailHeader.tsx`:
- Breadcrumb: `Incidents /` with soft salmon flame icon linking to `/incidents`.
- Title: `INC - <id> <Title>` with inline edit trigger.
- Actions: `Subscribe` button with bell icon, `•••` dropdown menu.

- [ ] **Step 2: Create `IncidentLifecycleStepper.tsx`**

Implement `IncidentLifecycleStepper.tsx`:
- Horizontal Stepper: `Investigating ➔ Fixing ➔ Monitoring ➔ Resolved`.
- Active stage indicator: Static red bullseye dot (`⦿`) with red text (no `animate-ping`).
- Severity Badge: `Major` (amber), `Critical` (red), `Minor` (blue) with 3 vertical bars icon. Interactive dropdown to escalate/de-escalate.
- Duration counter: Static clock icon + duration string.

- [ ] **Step 3: Run lint & typecheck and commit**

```bash
pnpm run typecheck && pnpm run lint
git add components/incidents/detail/IncidentDetailHeader.tsx components/incidents/detail/IncidentLifecycleStepper.tsx
git commit -m "feat(incidents): implement IncidentDetailHeader and IncidentLifecycleStepper"
```

---

### Task 4: Incident Summary Card & Right Attributes Sidebar

**Files:**
- Create: `components/incidents/detail/IncidentSummaryCard.tsx`
- Create: `components/incidents/detail/IncidentDetailSidebar.tsx`

**Interfaces:**
- Consumes: Incident structured summary (`problem`, `impact`, `causes`, `mitigation`), responder details, and Agora War Room URL parameters.
- Produces: 4-prompt summary card with edit pencil, and right sidebar cards: People, Comms (Slack & Jira), Calls & War Room Bridge, Post-Mortem, and Custom Fields.

- [ ] **Step 1: Create `IncidentSummaryCard.tsx`**

Implement `IncidentSummaryCard.tsx`:
- 4 bold sections matching incident.io: `Problem`, `Impact`, `Causes`, `Steps to mitigate`.
- Upper-right `Edit summary` pencil action enabling inline modal or text area editing.

- [ ] **Step 2: Create `IncidentDetailSidebar.tsx`**

Implement `IncidentDetailSidebar.tsx`:
- **People Card:** Lead avatar + name with reassign dropdown, reporter, active participant overlapping avatars.
- **Comms Card:** `# View Slack channel` with Slack icon, `◇ View Jira incident` with issue key.
- **Calls & War Room Hub [DELIBERATE DEVIATION]:** `Calls ⓘ` section header with `+ Add call`, featuring "Enter War Room" button linking to `/war-room?incident=<id>&sev=<severity>` with live indicator.
- **Post-Mortem Card:** `📄 View Post-Mortem` link + `• In progress` static status pill.
- **Custom Fields Card:** Affected team, Impact, Reviewer.

- [ ] **Step 3: Run lint & typecheck and commit**

```bash
pnpm run typecheck && pnpm run lint
git add components/incidents/detail/IncidentSummaryCard.tsx components/incidents/detail/IncidentDetailSidebar.tsx
git commit -m "feat(incidents): implement IncidentSummaryCard and IncidentDetailSidebar"
```

---

### Task 5: Incident Detail Tabs & Feed Views

**Files:**
- Create: `components/incidents/detail/IncidentDetailTabs.tsx`
- Create: `components/incidents/detail/IncidentTimelineView.tsx`
- Create: `components/incidents/detail/IncidentActionsView.tsx`
- Create: `components/incidents/detail/IncidentFollowUpsView.tsx`
- Create: `components/incidents/detail/IncidentUpdatesView.tsx`
- Create: `components/incidents/detail/IncidentAlertsView.tsx`

**Interfaces:**
- Consumes: Active tab selection, timeline events, speech ledger events, checklist actions, and follow-up items.
- Produces: 5-tab bar (`Updates`, `Timeline`, `Actions`, `Follow-ups`, `Alerts`) and view renderers.

- [ ] **Step 1: Create `IncidentDetailTabs.tsx`**

Implement `IncidentDetailTabs.tsx`:
- Horizontal tabs: `Updates`, `Timeline` (default active), `Actions` (with count badge), `Follow-ups` (with purple sparkle), `Alerts`.
- Right-aligned controls: Date & timezone string, `↕ Expand all` toggle, `✎ Edit` button.

- [ ] **Step 2: Create `IncidentTimelineView.tsx`**

Implement `IncidentTimelineView.tsx`:
- Vertical continuous line with milestone icons: flame (reported/triage), user (lead assignment), Slack pin, severity upgrade, resolution check.
- Time separator pills: `2 hours later...`.
- Integration of Convex `ledger_events` (speech intelligence `FACT`, `HYPOTHESIS`, `CONTRADICTION`, `ACTION` tags).

- [ ] **Step 3: Create `IncidentActionsView.tsx` and `IncidentFollowUpsView.tsx`**

Implement `IncidentActionsView.tsx`:
- Active incident checklist with interactive checkbox toggles.

Implement `IncidentFollowUpsView.tsx`:
- Post-incident issue tracker tasks with priority pills and status badges.

Implement `IncidentUpdatesView.tsx` and `IncidentAlertsView.tsx`:
- Clean placeholder/container feeds matching incident.io card styles.

- [ ] **Step 4: Run lint & typecheck and commit**

```bash
pnpm run typecheck && pnpm run lint
git add components/incidents/detail/IncidentDetailTabs.tsx components/incidents/detail/IncidentTimelineView.tsx components/incidents/detail/IncidentActionsView.tsx components/incidents/detail/IncidentFollowUpsView.tsx components/incidents/detail/IncidentUpdatesView.tsx components/incidents/detail/IncidentAlertsView.tsx
git commit -m "feat(incidents): implement tabs and feed views for incident detail"
```

---

### Task 6: Root Container, Dynamic Page Route & Navigation Wiring

**Files:**
- Create: `components/incidents/detail/IncidentDetailPage.tsx`
- Create: `app/incidents/[id]/page.tsx`
- Modify: `components/incidents/IncidentsPageLayout.tsx`
- Modify: `components/incidents/IncidentsTable.tsx`
- Modify: `components/incidents/index.ts`

**Interfaces:**
- Consumes: Next.js dynamic params `{ id: string }`, Convex reactive queries, fallback data.
- Produces: Full page at `/incidents/[id]` with persistent `RootlySidebar`, table row navigation to `/incidents/[id]`.

- [ ] **Step 1: Update `IncidentsPageLayout.tsx` to support `children`**

Modify `components/incidents/IncidentsPageLayout.tsx`:
- Add `children?: React.ReactNode` to `IncidentsPageLayoutProps`.
- If `children` is provided, render `children` inside `<main className="flex-1 w-full min-w-0">`. Otherwise render `<IncidentsDirectory />`.

- [ ] **Step 2: Create `IncidentDetailPage.tsx`**

Implement `components/incidents/detail/IncidentDetailPage.tsx`:
- Client container connecting to Convex `getIncident` and `listLedgerEvents`.
- Falls back to `getFallbackIncident(id)` if query returns null or Convex is unconfigured.
- Handles optimistic mutations for status, severity, lead, and summary.
- Renders: Header, Stepper, Summary Card, Tab bar, Active Tab View, and Right Sidebar.

- [ ] **Step 3: Create `app/incidents/[id]/page.tsx`**

Implement `app/incidents/[id]/page.tsx`:
```tsx
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IncidentsPageLayout } from '@/components/incidents/IncidentsPageLayout';
import { IncidentDetailPage } from '@/components/incidents/detail/IncidentDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Incident ${decodeURIComponent(id)} | Ecosphere`,
    description: `Incident details, real-time lifecycle, and response coordination for ${decodeURIComponent(id)}.`,
  };
}

export default async function IncidentPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <IncidentsPageLayout>
        <IncidentDetailPage incidentId={id} />
      </IncidentsPageLayout>
    </Suspense>
  );
}
```

- [ ] **Step 4: Update table row navigation in `IncidentsTable.tsx`**

Modify `components/incidents/IncidentsTable.tsx`:
- Update `handleRowClick`:
  ```typescript
  const handleRowClick = () => {
    onRowClick?.(incident);
    router.push(`/incidents/${encodeURIComponent(cleanId)}`);
  };
  ```
- Keep the rightmost "Enter War Room" action button pointing directly to `/war-room?incident=...`.

- [ ] **Step 5: Run lint & typecheck and commit**

```bash
pnpm run typecheck && pnpm run lint
git add components/incidents/detail/IncidentDetailPage.tsx app/incidents/[id]/page.tsx components/incidents/IncidentsPageLayout.tsx components/incidents/IncidentsTable.tsx components/incidents/index.ts
git commit -m "feat(incidents): add /incidents/[id] route and wire table row navigation"
```

---

### Task 7: Automated Contract Testing & Verification Gate

**Files:**
- Create: `scripts/test-incident-detail-contracts.ts`

**Interfaces:**
- Consumes: Dynamic route contract, severity mappings, tab definitions, offline fallbacks.
- Produces: Comprehensive automated regression test suite.

- [ ] **Step 1: Write `scripts/test-incident-detail-contracts.ts`**

Implement automated test verifying:
1. Severity normalization for all tiers (`Critical`, `Major`, `Minor`, and `SEV0`–`SEV3`).
2. ID normalization (`7134`, `#7134`, `INC-7134`).
3. Offline data fallback integrity for all default incidents.
4. Tab definitions (exactly 5 tabs: `Updates`, `Timeline`, `Actions`, `Follow-ups`, `Alerts`).
5. War Room URL formation.

- [ ] **Step 2: Run contract test**

Run: `npx tsx scripts/test-incident-detail-contracts.ts`  
Expected: PASS

- [ ] **Step 3: Run full verification suite**

Run:
```bash
pnpm run lint
pnpm run typecheck
pnpm run verify:api
pnpm run build
```
Expected: All pass with 0 errors.

- [ ] **Step 4: Commit verification script**

```bash
git add scripts/test-incident-detail-contracts.ts
git commit -m "test(incidents): add automated contracts verification for incident detail page"
```
