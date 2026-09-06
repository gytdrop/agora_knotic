# Design Specification: Incident.io "Response > Incidents" Replication

**Date**: 2026-09-06  
**Topic**: Replicating incident.io `Response > Incidents` Page & Application Shell  
**Target Worktree**: `/home/boris/Projects/agora/.worktrees/frontend`  
**Branch**: `feat/frontend`  
**Observed Live Target**: `https://app.incident.io/kartikeys-workspace/response/incidents` (inspected via Chrome CDP)

---

## 1. Executive Summary & Forensic Findings

Following direct inspection of the user's logged-in Chrome session on `https://app.incident.io/kartikeys-workspace/response/incidents`, this specification outlines the full replication of the **Response > Incidents** directory, its containing application shell, and associated routing.

### Verified Visual & Architectural Observations:
1. **"Card in Shell" Architecture**:
   - Canvas background: `#f8f9fa` (zinc-50).
   - Main content is hosted inside an elevated white card: `bg-white rounded-xl shadow-xs border border-zinc-200/80 m-2 flex-1 flex flex-col min-h-[calc(100vh-4rem)]`.
   - Top banner: Slim announcement bar `You've got 13 days left in your incident.io trial.` (`bg-zinc-100 text-zinc-600 text-xs py-1.5 px-4 text-center`).
2. **Incident.io Sidebar Navigation**:
   - Workspace header: Logo with 4 color quadrants (cyan, coral, dark navy, amber), `kartikeys-workspace` (or user org), `↕` chevron, and `[|]` sidebar collapse icon.
   - Core links: `Home`, `Search` (with trailing `⌘K` badge), `My tasks`, `Settings`.
   - Sections: `Your teams >`, `Your organization ⌵` with:
     - `On-call >`
     - `Response ⌵`:
       - `Incidents` (**Active item**: `bg-zinc-200/60 text-zinc-900 font-medium px-2.5 py-1.5 rounded-lg flex items-center gap-2`, leading orange flame `#ea580c`).
       - `Post-incident flow`
       - `Follow-ups`
       - `Post-mortems`
     - `Status pages`, `Nexus >`, `Insights`.
   - Footer: `● You're not on call` charcoal pill (`bg-zinc-800 text-white rounded-full text-xs px-3 py-1.5 font-medium`) and `No upcoming shifts`.
3. **Response > Incidents Header & Toolbar**:
   - Breadcrumb: Rounded-md orange badge with white flame (`w-6 h-6 rounded-md bg-[#ea580c]`) + `Response > Incidents`.
   - Header actions:
     - `Export CSV` (white button, tray download icon, `border border-zinc-300`).
     - `Declare incident` (solid black button `bg-zinc-900 text-white`, flame icon).
   - Toolbar:
     - Left: `Any team` dropdown pill button + `Filters and views` dropdown pill button (`bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium px-2.5 py-1.5`).
     - Right: `Search` input (`border border-zinc-200 rounded-lg text-xs px-2.5 py-1 w-52 placeholder-zinc-400`) + `Display` button.
4. **Table Columns & Styling**:
   - Columns: `[ ]` (checkbox), `Incident`, `Severity`, `Status`, `Type`, `Duration`, `Reported`, `Incident Lead`, `Actions` (War Room CTA).
   - `Incident`: `INC-X` subtle monospace tag (`text-zinc-400 font-mono text-xs`) + title link (`hover:underline font-medium text-sm text-zinc-900`).
   - `Severity`: `—` (dash when unset) or `📊 Major` (vertical signal bars with amber/red badge).
   - `Status`: `⦿ Triage` (blue pill, static concentric bullseye) or `⦿ Investigating` (red pill, static concentric bullseye).
   - `Type`: `⠋ Default` (window 4-dot grid icon, gray border, white bg).
   - `Duration`: e.g. `12h 27m`, `14h 53m`.
   - `Reported`: e.g. `12h 27m ago`, `14h 53m ago`.
   - `Incident Lead`: `Unassigned` (muted text) or avatar + name.
   - `Actions`: Preserving our native Agora WebRTC "Enter War Room" bridge.
5. **Floating Widget**:
   - Floating `💬 Ask incident` button in bottom-right corner.

---

## 2. Proposed Changes & Component Map

### 2.1 Component Architecture

```
components/
├── navigation/
│   └── IncidentIoSidebar.tsx        # [NEW] Authentic incident.io left sidebar navigation
├── incidents/
│   ├── IncidentsPageLayout.tsx      # [MODIFY] Switch to IncidentIoSidebar + "card-in-shell" frame + trial banner
│   ├── IncidentsDirectory.tsx       # [MODIFY] Connect with new toolbar and table
│   ├── IncidentsHeader.tsx          # [MODIFY] Breadcrumb with flame badge, Export CSV, Declare Incident
│   ├── IncidentsFilterBar.tsx       # [MODIFY] Any team dropdown, Filters and views, Search input, Display button
│   ├── IncidentsTable.tsx           # [MODIFY] Full columns: Checkbox, Incident, Severity, Status, Type, Duration, Reported, Lead, War Room
│   └── AskIncidentWidget.tsx        # [NEW] Bottom-right floating "💬 Ask incident" trigger
app/
├── response/
│   ├── incidents/
│   │   ├── page.tsx                 # [NEW] Dedicated route /response/incidents matching incident.io URL
│   │   └── [id]/page.tsx            # [NEW] Dedicated route /response/incidents/[id] linking to detail page
│   └── page.tsx                     # [NEW] Redirects /response to /response/incidents
```

---

## 3. Data Flow & Contract Verification

1. **Incident Data Model**:
   - Enhance `IncidentItem` to include `type?: string` (defaulting to `'Default'`), `declaredAt?: number`, `reportedDuration?: string`.
2. **Dual-Mode Backend Resilience**:
   - Convex queries (`listAllIncidents`) work seamlessly when configured.
   - Offline fallback includes seeded items (`#7134`, `#7126`, `#7125`, `#7124`, `#7123`, `#7119`, `#7115`, and demo records `INC-2`, `INC-3`) with 100% UI fidelity.
3. **Agora War Room Integration**:
   - "Enter War Room" remains accessible via table action column and incident detail quick action button (`Start a call`).

---

## 4. Verification Plan

1. **Type Safety & Linting**:
   - Run `pnpm run typecheck` to ensure 0 TypeScript compilation errors.
   - Run `pnpm run lint` to verify ESLint compliance.
2. **Automated Contracts**:
   - Run `npx tsx scripts/test-incident-detail-contracts.ts` and add tests for `IncidentIoSidebar` and table columns.
3. **Production Build**:
   - Run `pnpm run build` to ensure all routes (`/incidents`, `/response/incidents`, `/response/incidents/[id]`) build cleanly.
4. **Visual Comparison**:
   - Compare rendered local pages against the 4 captured screenshots in `/home/boris/.gemini/antigravity/brain/ed62894b-d760-4d45-b0be-c8904caa3515/`.
