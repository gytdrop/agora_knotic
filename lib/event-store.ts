import type { LedgerItem, TelemetryEvidence } from '@/types/conversation';
import { applyLedgerMutation } from './ledger';

export type LedgerEventType =
  | 'TURN_FINALIZED'
  | 'TELEMETRY_EVIDENCE_ATTACHED'
  | 'CONTRADICTION_FLAGGED'
  | 'HOTFIX_STAGED'
  | 'REMEDIATION_EXECUTED'
  | 'CUSTOM_RTM_RECEIVED';

export interface LedgerEvent {
  eventId: string;
  incidentId: string;
  sequenceNumber: number;
  timestampMs: number;
  eventType: LedgerEventType;
  item: LedgerItem;
}

export interface IncidentState {
  incidentId: string;
  title: string;
  severity: string;
  createdAtMs: number;
  isResolved: boolean;
  events: LedgerEvent[];
  ledgerItems: LedgerItem[];
}

// Global in-memory event store (persists across API requests in Node runtime)
const incidentStore = new Map<string, IncidentState>();

const DEFAULT_INCIDENT_ID = '#INC-8921';

function getOrCreateIncident(incidentId = DEFAULT_INCIDENT_ID): IncidentState {
  let incident = incidentStore.get(incidentId);
  if (!incident) {
    const now = Date.now();
    const initialItems: LedgerItem[] = [
      {
        id: 'init-1',
        timestampMs: now - 20000,
        speaker: 'EchoSphere Sentinel',
        text: 'Ambient Sentinel Mode active. Listening to Agora 16kHz WebRTC stream...',
        tag: 'FACT',
        status: 'Standby Monitoring',
      },
      {
        id: 'init-2',
        timestampMs: now - 10000,
        speaker: 'HolmesGPT Engine',
        text: 'HolmesGPT cluster diagnostics active. Monitored: [ingress-nginx, auth-service, aws-rds].',
        tag: 'FACT',
        status: 'Diagnostic Sync OK',
      },
    ];

    incident = {
      incidentId,
      title: 'AGORA ECHOSPHERE SEV-1 OUTAGE',
      severity: 'SEV-1',
      createdAtMs: now - 25000,
      isResolved: false,
      events: initialItems.map((item, idx) => ({
        eventId: `evt_${incidentId.replace(/[^a-zA-Z0-9]/g, '')}_${idx + 1}`,
        incidentId,
        sequenceNumber: idx + 1,
        timestampMs: item.timestampMs,
        eventType: 'TURN_FINALIZED',
        item,
      })),
      ledgerItems: initialItems,
    };
    incidentStore.set(incidentId, incident);
  }
  return incident;
}

/**
 * Appends a new event monotonically to the incident event store.
 * Updates the materialized ledger items array deterministically via applyLedgerMutation.
 */
export function recordIncidentEvent(
  incidentId: string = DEFAULT_INCIDENT_ID,
  eventType: LedgerEventType,
  itemInput: LedgerItem | Omit<LedgerItem, 'id' | 'timestampMs'> & { id?: string; timestampMs?: number; telemetryEvidence?: TelemetryEvidence },
): { event: LedgerEvent; incident: IncidentState } {
  const incident = getOrCreateIncident(incidentId);
  const nextSeq = incident.events.length + 1;
  const now = Date.now();

  const { nextItems, committedItem } = applyLedgerMutation(incident.ledgerItems, itemInput);
  incident.ledgerItems = nextItems;

  if (committedItem.tag === 'ACTION' && committedItem.status.includes('Active')) {
    incident.isResolved = true;
  }

  const event: LedgerEvent = {
    eventId: `evt_${incidentId.replace(/[^a-zA-Z0-9]/g, '')}_${nextSeq}`,
    incidentId,
    sequenceNumber: nextSeq,
    timestampMs: committedItem.timestampMs || now,
    eventType,
    item: committedItem,
  };

  incident.events.push(event);
  return { event, incident };
}

/**
 * Retrieves the full incident state and ledger items for hydration.
 */
export function getIncidentState(incidentId: string = DEFAULT_INCIDENT_ID): IncidentState {
  return getOrCreateIncident(incidentId);
}

/**
 * Generates an automated Post-Incident Review (PIR) document from the ledger events.
 */
export function generatePostIncidentReview(incidentId: string = DEFAULT_INCIDENT_ID): string {
  const incident = getOrCreateIncident(incidentId);
  const resolutionTime = incident.isResolved ? new Date().toISOString() : 'IN PROGRESS';

  const facts = incident.ledgerItems.filter((i) => i.tag === 'FACT');
  const hypotheses = incident.ledgerItems.filter((i) => i.tag === 'HYPOTHESIS');
  const contradictions = incident.ledgerItems.filter((i) => i.tag === 'CONTRADICTION');
  const actions = incident.ledgerItems.filter((i) => i.tag === 'ACTION');

  return `# Post-Incident Review (PIR) — ${incident.incidentId}

**Incident Title:** ${incident.title}  
**Severity:** ${incident.severity}  
**Created:** ${new Date(incident.createdAtMs).toISOString()}  
**Resolution Status:** ${incident.isResolved ? 'RESOLVED (200 OK)' : 'ACTIVE'}  
**Resolved At:** ${resolutionTime}  
**Total Recorded Events:** ${incident.events.length}  

---

## Executive Summary
During this incident, EchoSphere monitored the Agora WebRTC voice channel, cross-referencing multi-engineer spoken dialogue against HolmesGPT cluster diagnostics. False diagnostic paths were suppressed via real-time telemetry verification, and remediation was executed through the Human-in-the-Loop (HITL) Guardrail.

---

## Chronological Event Timeline
| Seq | Time (UTC) | Speaker | Tag | Event / Statement | Status |
| :---: | :---: | :---: | :---: | :--- | :--- |
${incident.events
  .map(
    (e) =>
      `| ${e.sequenceNumber} | ${new Date(e.timestampMs).toISOString().substring(11, 19)} | ${e.item.speaker} | \`[${e.item.tag}]\` | ${e.item.text.replace(/\|/g, '-')} | ${e.item.status} |`,
  )
  .join('\n')}

---

## Incident Analysis Breakdown

### 1. Confirmed Telemetry Facts (${facts.length})
${facts.map((f) => `- **${f.speaker}:** ${f.text} *(Status: ${f.status})*`).join('\n') || 'None recorded.'}

### 2. Hypotheses Evaluated (${hypotheses.length})
${hypotheses.map((h) => `- **${h.speaker}:** ${h.text} *(Status: ${h.status})*`).join('\n') || 'None recorded.'}

### 3. Contradictions Flagged (${contradictions.length})
${
  contradictions
    .map((c) => `- **${c.speaker}:** ${c.text}\n  - *Analysis:* ${c.reason || 'Contradiction confirmed by HolmesGPT.'}`)
    .join('\n') || 'None recorded.'
}

### 4. Remediation Actions Executed (${actions.length})
${actions.map((a) => `- **${a.speaker}:** ${a.text} *(Status: ${a.status})*`).join('\n') || 'None recorded.'}

---

*Generated deterministically by EchoSphere Incident State Ledger.*
`;
}
