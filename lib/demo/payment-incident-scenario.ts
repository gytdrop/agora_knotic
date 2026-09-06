/**
 * Payment Incident Scenario State Store (#INC-8921)
 *
 * Provides deterministic state synchronization across:
 * 1. Agora WebRTC War Room voice call (keyword triggers + Ctrl+Alt+N hotkey)
 * 2. Incident Command Center (/incidents/INC-8921)
 * 3. Incident.io Features: Ask AI Drawer (Feature 1), Alerts Hub (Feature 2), Role Assignments (Feature 5)
 * 4. Actions Checklist, Stakeholder Updates, Escalations, and AI Postmortem
 */

export interface DemoBeat {
  beatNumber: number;
  speaker: string;
  role: 'Incident Commander' | 'Lead SRE';
  spokenCue: string;
  matchKeywords: string[];
  card: {
    tag: '[FACT]' | '[HYPOTHESIS]' | '[CONTRADICTION]' | '[ACTION]';
    title: string;
    details: string;
    metrics?: Record<string, string>;
  };
}

export const PAYMENT_INCIDENT_BEATS: DemoBeat[] = [
  {
    beatNumber: 1,
    speaker: 'Ashley Sawatsky',
    role: 'Incident Commander',
    spokenCue: 'Team, starting triage on INC-8921. Payment processing 5xx error rate is at 47.2% and p99 latency spiked to 6.2 seconds. Approximately 1,420 checkout attempts per minute are failing.',
    matchKeywords: ['payment processing', 'error rate', '47.2', '6.2 seconds', 'triage on inc-8921', 'checkout attempts'],
    card: {
      tag: '[FACT]',
      title: 'Checkout 5xx Rate 47.2% | Latency 6.2s',
      details: 'Elevated 5xx rate on /v1/checkout/charge. Ingress latency p99 spiked to 6.2s across us-east-1. 1,420 transactions/min failing with HTTP 504 gateway timeout.',
      metrics: {
        'Error Rate': '47.2%',
        'p99 Latency': '6.2s',
        'Impact': '1,420 req/min',
        'Status': 'CRITICAL',
      },
    },
  },
  {
    beatNumber: 2,
    speaker: 'David Chen',
    role: 'Lead SRE',
    spokenCue: 'Looking at recent deploys. payment-service:v2.8.1 went live 20 minutes ago. Hypothesis: worker thread recursion memory leak on the new payment orchestrator.',
    matchKeywords: ['v2.8.1', 'recent deploy', 'memory leak', 'worker thread', 'orchestrator'],
    card: {
      tag: '[HYPOTHESIS]',
      title: 'Deploy v2.8.1 Worker Thread Recursion Leak',
      details: 'Candidate root cause: commit 9b8f2c in payment-service:v2.8.1 introduced a recursive retry on failed gateway handshakes, potentially exhausting pod memory and thread pools.',
      metrics: {
        'Release': 'v2.8.1',
        'Deployed': '15:20 UTC',
        'Hypothesis': 'Memory Leak',
      },
    },
  },
  {
    beatNumber: 3,
    speaker: 'David Chen',
    role: 'Lead SRE',
    spokenCue: 'Wait, disproving that. HolmesGPT telemetry query confirms DB connection pool utilization is at 22% and pod memory usage is nominal at 58%. It is NOT a memory leak or connection starvation.',
    matchKeywords: ['disproving', 'holmesgpt', 'not a memory leak', 'nominal at 58', 'connection pool', '22%'],
    card: {
      tag: '[CONTRADICTION]',
      title: 'Hypothesis Disproven: Memory & DB Pools Nominal',
      details: 'Telemetry evidence: Pod memory usage is flat at 58% (limit 4GB). PostgreSQL replica connection pool active leases at 22/100. Worker threads healthy. Memory leak hypothesis rejected.',
      metrics: {
        'Pod Memory': '58% (Nominal)',
        'DB Leases': '22/100 (Nominal)',
        'Verdict': 'DISPROVEN',
      },
    },
  },
  {
    beatNumber: 4,
    speaker: 'David Chen',
    role: 'Lead SRE',
    spokenCue: 'Isolating downstream trace: downstream dependency fraud-detection-svc timeout rate is 45%. It is holding open client sockets and exhausting the connection backlog.',
    matchKeywords: ['downstream', 'fraud-detection', 'timeout rate', 'socket', 'backlog', 'isolating trace'],
    card: {
      tag: '[FACT]',
      title: 'Root Cause: fraud-detection-svc Socket Timeout',
      details: 'Distributed trace spans isolate bottleneck: payment-service synchronous HTTP call to fraud-detection-svc timing out after 5,000ms. 45% socket backlog exhaustion.',
      metrics: {
        'Bottleneck': 'fraud-detection-svc',
        'Timeout Rate': '45.1%',
        'Socket State': 'SYN_SENT Backlog',
      },
    },
  },
  {
    beatNumber: 5,
    speaker: 'Ashley Sawatsky',
    role: 'Incident Commander',
    spokenCue: 'Acknowledged. Three immediate action items: first, execute canary rollback on payment-service to v2.8.0. Second, page Fraud SRE on-call for socket saturation. Third, broadcast customer update on Slack and Statuspage. Let us transition to the web dashboard to manage the fix.',
    matchKeywords: ['canary rollback', 'page fraud', 'broadcast customer', 'transition to the web', 'three immediate', 'dashboard'],
    card: {
      tag: '[ACTION]',
      title: 'Actions: Canary Rollback, Page Fraud, Comms',
      details: '1) Revert payment-service to stable v2.8.0. 2) Escalate & page Fraud SRE on-call (Meera Patel). 3) Publish stakeholder status announcement to status.acme.com.',
      metrics: {
        'Action 1': 'Canary Rollback v2.8.0',
        'Action 2': 'Page Fraud SRE Lead',
        'Action 3': 'Broadcast Statuspage Update',
      },
    },
  },
];

export interface IncidentRole {
  roleName: string;
  assignee: string;
  avatar: string;
  policy: string;
}

export interface DemoIncidentState {
  currentBeat: number;
  status: 'INVESTIGATING' | 'FIXING' | 'MONITORING' | 'RESOLVED';
  severity: 'Critical' | 'Major' | 'Minor';
  roles: IncidentRole[];
  escalated: boolean;
  escalatedTo?: string;
  escalationTime?: string;
  actions: { id: string; title: string; completed: boolean; assignee: string }[];
  updates: { id: string; time: string; author: string; channels: string[]; text: string }[];
}

const DEFAULT_DEMO_STATE: DemoIncidentState = {
  currentBeat: 1,
  status: 'INVESTIGATING',
  severity: 'Critical',
  roles: [
    { roleName: 'Incident Lead', assignee: 'Ashley Sawatsky', avatar: 'AS', policy: 'Primary On-Call' },
    { roleName: 'SRE Lead', assignee: 'David Chen', avatar: 'DC', policy: 'Secondary Responder' },
    { roleName: 'Comms Lead', assignee: 'Sarah Connor', avatar: 'SC', policy: 'Stakeholder Comms' },
    { roleName: 'Scribe', assignee: 'EchoSphere AI Sentinel', avatar: 'AI', policy: 'Automated Bot' },
  ],
  escalated: false,
  actions: [
    {
      id: 'act-1',
      title: 'Execute canary rollback on payment-service to stable v2.8.0',
      completed: false,
      assignee: 'David Chen',
    },
    {
      id: 'act-2',
      title: 'Page Fraud SRE on-call (Meera Patel) for downstream socket timeout saturation',
      completed: false,
      assignee: 'Ashley Sawatsky',
    },
    {
      id: 'act-3',
      title: 'Broadcast customer-facing status update on status.acme.com and Slack #incident-payments',
      completed: false,
      assignee: 'Sarah Connor',
    },
  ],
  updates: [
    {
      id: 'upd-1',
      time: '15:42 UTC',
      author: 'Sarah Connor',
      channels: ['Slack #incident-payments', 'Statuspage (status.acme.com)'],
      text: 'Investigating: Customers may experience intermittent 504 timeouts during checkout. Our engineering responders are actively deploying mitigation.',
    },
  ],
};

// In-memory reactive state instance
let demoState: DemoIncidentState = { ...DEFAULT_DEMO_STATE };
const listeners = new Set<(state: DemoIncidentState) => void>();

function notify() {
  listeners.forEach((listener) => listener({ ...demoState }));
}

export const demoIncidentStore = {
  getState: () => ({ ...demoState }),
  subscribe: (listener: (state: DemoIncidentState) => void) => {
    listeners.add(listener);
    listener({ ...demoState });
    return () => {
      listeners.delete(listener);
    };
  },
  advanceBeat: (targetBeat?: number) => {
    const nextBeat = targetBeat !== undefined ? targetBeat : Math.min(demoState.currentBeat + 1, 5);
    demoState.currentBeat = nextBeat;
    if (nextBeat >= 5 && demoState.status === 'INVESTIGATING') {
      demoState.status = 'FIXING';
    }
    notify();
    return nextBeat;
  },
  setStatus: (status: DemoIncidentState['status']) => {
    demoState.status = status;
    notify();
  },
  setSeverity: (severity: DemoIncidentState['severity']) => {
    demoState.severity = severity;
    notify();
  },
  reassignRole: (roleName: string, newAssignee: string, avatar: string) => {
    demoState.roles = demoState.roles.map((r) =>
      r.roleName === roleName ? { ...r, assignee: newAssignee, avatar } : r
    );
    notify();
  },
  toggleAction: (actionId: string) => {
    demoState.actions = demoState.actions.map((a) =>
      a.id === actionId ? { ...a, completed: !a.completed } : a
    );
    notify();
  },
  escalate: (team: string, engineer: string) => {
    demoState.escalated = true;
    demoState.escalatedTo = `${team} (${engineer})`;
    demoState.escalationTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC';
    demoState.actions = demoState.actions.map((a) =>
      a.id === 'act-2' ? { ...a, completed: true } : a
    );
    notify();
  },
  publishUpdate: (text: string, channels: string[]) => {
    const newUpd = {
      id: `upd-${Date.now()}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
      author: 'Ashley Sawatsky',
      channels,
      text,
    };
    demoState.updates = [newUpd, ...demoState.updates];
    demoState.actions = demoState.actions.map((a) =>
      a.id === 'act-3' ? { ...a, completed: true } : a
    );
    notify();
  },
  reset: () => {
    demoState = { ...DEFAULT_DEMO_STATE };
    notify();
  },
};
