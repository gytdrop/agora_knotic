export interface TimelineEvent {
  id: string;
  timestamp: number;
  timeFormatted: string;
  type:
    | 'declared'
    | 'lead_assigned'
    | 'slack_pin'
    | 'severity_changed'
    | 'pr_deployed'
    | 'resolved'
    | 'status_changed'
    | 'ledger_fact'
    | 'ledger_hypothesis'
    | 'ledger_action'
    | 'note';
  title: string;
  description?: string;
  author?: string;
  badgeLabel?: string;
}

export interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
  assignee?: string;
  createdAt: number;
}

export interface FollowUpItem {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Done';
  jiraKey?: string;
  owner?: string;
}

export interface IncidentDetailRecord {
  _id?: string;
  incidentId: string;
  title: string;
  severity: 'Critical' | 'Major' | 'Minor';
  status: 'INVESTIGATING' | 'FIXING' | 'MONITORING' | 'RESOLVED';
  lead: string;
  reporter: string;
  participants: string[];
  slackChannel: string;
  jiraKey?: string;
  problem: string;
  impact: string;
  causes: string;
  mitigation: string;
  createdAt: number;
  resolvedAt?: number;
  durationString?: string;
  timelineEvents: TimelineEvent[];
  actions: ActionItem[];
  followUps: FollowUpItem[];
  affectedTeam: string;
  reviewer: string;
}

/**
 * Normalizes incident identifier variants (e.g. '7134', 'INC-7134', '#INC-7134', '#7134') to '#7134'.
 */
export function normalizeIncidentId(raw: string): string {
  if (!raw) return '#7134';
  const decoded = decodeURIComponent(raw).trim();
  const digits = decoded.replace(/[^0-9]/g, '');
  if (digits) {
    return `#${digits}`;
  }
  return decoded.startsWith('#') ? decoded : `#${decoded}`;
}

const SEEDED_FALLBACK_INCIDENTS: Record<string, IncidentDetailRecord> = {
  '#7134': {
    incidentId: '#7134',
    title: 'Alluring Muse - Production API Gateway Latency Spike',
    severity: 'Major',
    status: 'INVESTIGATING',
    lead: 'Ashley Sawatsky',
    reporter: 'SRE On-Call (PagerDuty)',
    participants: ['Ashley Sawatsky', 'David Chen', 'Sarah Connor', 'EchoSphere Sentinel'],
    slackChannel: '#incident-7134',
    jiraKey: 'INC-7134',
    problem:
      'API gateway p99 latency exceeded 1200ms across us-east-1 endpoints, leading to intermittent 504 timeouts on auth-dependent microservices.',
    impact:
      'Approximately 4.2% of mobile and web checkout requests timed out between 01:15 UTC and 02:00 UTC. Third-party webhooks experienced delivery delays.',
    causes:
      'Downstream connection pool starvation triggered by an un-indexed tenant membership query introduced in release v2.4.1.',
    mitigation:
      'Scaled connection pool limits dynamically from 40 to 120; rolled back query planner cache; currently drafting emergency index migration.',
    createdAt: Date.now() - 3600 * 1000 * 2, // 2h ago
    durationString: 'Active for 2h 00m',
    affectedTeam: 'Engineering / Core Platform',
    reviewer: 'Ashley Sawatsky',
    timelineEvents: [
      {
        id: 'evt-1',
        timestamp: Date.now() - 3600 * 1000 * 2,
        timeFormatted: '00:30 UTC',
        type: 'declared',
        title: 'Incident reported in triage',
        description: 'Automated alert fired from Datadog: p99 Gateway Latency > 1000ms',
        author: 'PagerDuty Bot',
      },
      {
        id: 'evt-2',
        timestamp: Date.now() - 3600 * 1000 * 1.8,
        timeFormatted: '00:42 UTC',
        type: 'lead_assigned',
        title: 'Ashley Sawatsky became the Incident Lead',
        description: 'Acknowledged page and assumed incident command.',
        author: 'Ashley Sawatsky',
      },
      {
        id: 'evt-3',
        timestamp: Date.now() - 3600 * 1000 * 1.5,
        timeFormatted: '01:00 UTC',
        type: 'slack_pin',
        title: 'Slack message pinned in #incident-7134',
        description: 'Confirmed database replicas in us-east-1 are healthy. Isolating connection pool metrics.',
        author: 'David Chen',
      },
      {
        id: 'evt-4',
        timestamp: Date.now() - 3600 * 1000 * 1.1,
        timeFormatted: '01:24 UTC',
        type: 'severity_changed',
        title: 'Severity upgraded to Major',
        description: 'Error rate crossed 3% threshold across European customers.',
        author: 'Ashley Sawatsky',
        badgeLabel: 'Major',
      },
      {
        id: 'evt-5',
        timestamp: Date.now() - 3600 * 1000 * 0.5,
        timeFormatted: '02:00 UTC',
        type: 'pr_deployed',
        title: 'PR #1892 deployed to production',
        description: 'Hotfix merged: pool capacity tripled and lease timeouts bounded.',
        author: 'Sarah Connor',
      },
    ],
    actions: [
      {
        id: 'act-1',
        title: 'Verify connection pool exhaustion rate on secondary read-replicas',
        completed: true,
        assignee: 'David Chen',
        createdAt: Date.now() - 3600 * 1000 * 1.5,
      },
      {
        id: 'act-2',
        title: 'Deploy query index hotfix to primary database cluster',
        completed: false,
        assignee: 'Sarah Connor',
        createdAt: Date.now() - 3600 * 1000 * 0.8,
      },
      {
        id: 'act-3',
        title: 'Conduct traffic replay test against canary nodes',
        completed: false,
        assignee: 'Ashley Sawatsky',
        createdAt: Date.now() - 3600 * 1000 * 0.3,
      },
    ],
    followUps: [
      {
        id: 'fup-1',
        title: 'Audit all un-indexed foreign key queries in v2.4.0–v2.4.2 diff',
        priority: 'High',
        status: 'In Progress',
        jiraKey: 'PLAT-4091',
        owner: 'David Chen',
      },
      {
        id: 'fup-2',
        title: 'Implement automated canary latency circuit breakers in CI/CD pipeline',
        priority: 'Medium',
        status: 'Open',
        jiraKey: 'DEV-882',
        owner: 'Ashley Sawatsky',
      },
    ],
  },
  '#7126': {
    incidentId: '#7126',
    title: 'Code Deployment Error Leads to Service Degradation',
    severity: 'Critical',
    status: 'FIXING',
    lead: 'Alex Mercer',
    reporter: 'CI/CD Deployment Watchdog',
    participants: ['Alex Mercer', 'Elena Rostova', 'Marcus Vance'],
    slackChannel: '#incident-7126',
    jiraKey: 'INC-7126',
    problem:
      'A faulty migration script in deployment build 4402 corrupted schema references on users authentication cache.',
    impact: 'Users attempting OAuth login received 500 internal server errors for 34 minutes.',
    causes: 'Cache serialization mismatch between node-redis v4 client and legacy redis cluster engine.',
    mitigation: 'Rolled back to build 4401 and flushed auth session keys.',
    createdAt: Date.now() - 22 * 3600 * 1000,
    durationString: 'Active for 22h',
    affectedTeam: 'Engineering / Security & Auth',
    reviewer: 'Marcus Vance',
    timelineEvents: [
      {
        id: 'evt-26-1',
        timestamp: Date.now() - 22 * 3600 * 1000,
        timeFormatted: 'Yesterday',
        type: 'declared',
        title: 'Incident declared in #incident-7126',
        description: 'Critical authentication failures reported post deploy.',
        author: 'Alex Mercer',
      },
    ],
    actions: [
      {
        id: 'act-26-1',
        title: 'Verify session restoration on user auth pods',
        completed: true,
        assignee: 'Elena Rostova',
        createdAt: Date.now() - 21 * 3600 * 1000,
      },
    ],
    followUps: [
      {
        id: 'fup-26-1',
        title: 'Pin redis client dependencies across microservices',
        priority: 'High',
        status: 'Open',
        jiraKey: 'SEC-102',
        owner: 'Alex Mercer',
      },
    ],
  },
};

/**
 * Returns a complete fallback incident record for offline or unconfigured environments.
 */
export function getFallbackIncident(rawId: string): IncidentDetailRecord {
  const normId = normalizeIncidentId(rawId);
  if (SEEDED_FALLBACK_INCIDENTS[normId]) {
    return SEEDED_FALLBACK_INCIDENTS[normId];
  }

  // Dynamic fallback for any other incident ID so arbitrary test IDs work smoothly
  return {
    incidentId: normId,
    title: `Incident ${normId} - System Operation Review`,
    severity: 'Minor',
    status: 'INVESTIGATING',
    lead: 'Ashley Sawatsky',
    reporter: 'Automated Monitor',
    participants: ['Ashley Sawatsky', 'Incident Commander'],
    slackChannel: `#incident-${normId.replace('#', '')}`,
    jiraKey: `INC-${normId.replace('#', '')}`,
    problem: 'Anomaly detected during routine system health checks.',
    impact: 'Subsystem operating with slight latency elevation; core traffic unaffected.',
    causes: 'Under investigation by responders.',
    mitigation: 'Active diagnostic telemetry gathering in progress.',
    createdAt: Date.now() - 3600 * 1000,
    durationString: 'Active for 1h 00m',
    affectedTeam: 'Engineering',
    reviewer: 'Ashley Sawatsky',
    timelineEvents: [
      {
        id: 'evt-dyn-1',
        timestamp: Date.now() - 3600 * 1000,
        timeFormatted: '1 hour ago',
        type: 'declared',
        title: `Incident ${normId} declared`,
        description: 'Triage channel provisioned and commander notified.',
        author: 'System',
      },
    ],
    actions: [
      {
        id: 'act-dyn-1',
        title: 'Verify telemetry data on primary cluster',
        completed: false,
        assignee: 'Ashley Sawatsky',
        createdAt: Date.now() - 3600 * 1000,
      },
    ],
    followUps: [],
  };
}
