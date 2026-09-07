import fs from 'node:fs';
import path from 'node:path';
import { Execution, Workflow } from './types';

// Preloaded 4 demo workflows required by Phase 7 + UI defaults
export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'wf-p1-production',
    name: '[Demo] P1 Production Incident Response',
    description:
      'Automated rapid response for critical production outages. Provisions dedicated channels, mobilizes commander, and starts Agora War Room.',
    enabled: true,
    type: 'incident',
    folder: 'Slack',
    integration: 'slack',
    trigger: {
      type: 'incident_created',
      description: 'Incident Created (SEV-0, SEV-1, Critical)',
      config: {
        severityThreshold: ['SEV-0', 'SEV-1', 'Critical'],
      },
    },
    actions: [
      {
        id: 'act-1-slack-channel',
        name: 'Create Incident Slack Channel',
        type: 'create_slack_channel',
        description: 'Provisions dedicated channel #incident-{{incident.id}} and pins response runbooks.',
        config: {
          channelNameTemplate: 'incident-{{incident.id}}',
          topic: 'Live incident coordination: {{incident.title}}',
          inviteResponders: true,
        },
      },
      {
        id: 'act-1-assign-commander',
        name: 'Assign Incident Commander',
        type: 'assign_incident_commander',
        description: 'Auto-assigns on-call primary responder.',
        config: {
          role: 'Incident Commander',
          assignee: 'Sarah Chen (Staff SRE)',
        },
      },
      {
        id: 'act-1-ai-summary',
        name: 'Generate AI Blast Radius Summary',
        type: 'generate_ai_summary',
        description: 'Invokes AI analyzer to synthesize incident context, impact, and initial hypothesis.',
        config: {
          detailLevel: 'detailed',
          targetAudience: 'technical',
        },
      },
      {
        id: 'act-1-war-room',
        name: 'Provision Agora Video War Room',
        type: 'create_war_room',
        description: 'Initializes Agora HD Video War Room session with live transcription.',
        config: {
          roomNameTemplate: 'War Room #{{incident.id}}',
          recordSession: true,
        },
      },
      {
        id: 'act-1-email-exec',
        name: 'Send Incident Alert Email',
        type: 'send_email',
        description: 'Dispatches high-priority executive alert with live links.',
        config: {
          to: 'exec-alerts@ecosphere.dev',
          subject: '[P1 Outage Alert] {{incident.title}} ({{incident.severity}})',
          priority: 'urgent',
        },
      },
    ],
    createdAt: 1725700000000,
    updatedAt: 1725700000000,
  },
  {
    id: 'wf-db-outage',
    name: '[Demo] Database Outage Escalation Pipeline',
    description:
      'Escalation pipeline for database and storage outages with delay buffer, state verification, and lead assignment.',
    enabled: true,
    type: 'incident',
    folder: 'PagerDuty',
    integration: 'pagerduty',
    trigger: {
      type: 'incident_severity_changed',
      description: 'Severity Changed to SEV-1 or Critical',
      config: {
        severityThreshold: ['SEV-1', 'Critical'],
      },
    },
    actions: [
      {
        id: 'act-2-slack-alert',
        name: 'Post Slack Alert to Infra Channel',
        type: 'post_slack_message',
        description: 'Broadcasts severity escalation alert to #infra-alerts.',
        config: {
          channel: '#infra-alerts',
          message: '🚨 *ESCALATION*: {{incident.id}} escalated to *{{incident.severity}}*. Initiating database triage.',
        },
      },
      {
        id: 'act-2-delay',
        name: 'Wait Triage Grace Period',
        type: 'wait_delay',
        description: 'Simulate brief delay buffer (1.5 seconds) to allow initial health checks.',
        config: {
          delaySeconds: 1.5,
        },
      },
      {
        id: 'act-2-condition',
        name: 'Check Incident Active Status',
        type: 'condition_branch',
        description: 'Evaluates whether incident is still active and requires database specialist.',
        config: {
          conditionField: 'incident.status',
          operator: 'in',
          values: ['INVESTIGATING', 'FIXING', 'STAGED'],
        },
      },
      {
        id: 'act-2-assign-db-lead',
        name: 'Assign Database Specialist Lead',
        type: 'assign_incident_commander',
        description: 'Assigns database domain expert to the incident.',
        config: {
          role: 'Database Lead',
          assignee: 'Marcus Vance (Principal DB Engineer)',
        },
      },
    ],
    createdAt: 1725705000000,
    updatedAt: 1725705000000,
  },
  {
    id: 'wf-customer-impact',
    name: '[Demo] Customer Impact & Status Page Workflow',
    description:
      'Broadcasts customer status updates, customer-facing notices, and executive summaries upon confirmed customer impact.',
    enabled: true,
    type: 'incident',
    folder: 'Statuspage',
    integration: 'statuspage',
    trigger: {
      type: 'incident_updated',
      description: 'Incident Updated with Customer Impact',
      config: {
        hasCustomerImpact: true,
      },
    },
    actions: [
      {
        id: 'act-3-status-page',
        name: 'Publish Advisory to Status Page',
        type: 'update_status_page',
        description: 'Updates status.ecosphere.dev with active incident degradation notice.',
        config: {
          statusMessage: 'Partial service degradation observed. Engineering team is mitigating.',
          componentState: 'degraded_performance',
        },
      },
      {
        id: 'act-3-customer-email',
        name: 'Send Customer Advisory Email',
        type: 'send_email',
        description: 'Dispatches notice to customer success and enterprise distribution list.',
        config: {
          to: 'customer-advisories@ecosphere.dev',
          subject: '[Service Notice] Active investigation into {{incident.title}}',
          priority: 'normal',
        },
      },
      {
        id: 'act-3-exec-ai-summary',
        name: 'Generate Customer Impact AI Summary',
        type: 'generate_ai_summary',
        description: 'AI generation of non-technical customer facing impact assessment.',
        config: {
          detailLevel: 'executive',
          targetAudience: 'customer_facing',
        },
      },
    ],
    createdAt: 1725710000000,
    updatedAt: 1725710000000,
  },
  {
    id: 'wf-incident-resolution',
    name: '[Demo] Incident Resolution & Post-Mortem',
    description:
      'Decommissions incident resources, archives Slack channel, closes War Room, and synthesizes full AI post-mortem.',
    enabled: true,
    type: 'post-incident',
    folder: 'AI',
    integration: 'ai',
    trigger: {
      type: 'incident_resolved',
      description: 'Incident Resolved',
      config: {},
    },
    actions: [
      {
        id: 'act-4-archive-slack',
        name: 'Archive Incident Slack Channel',
        type: 'archive_slack_channel',
        description: 'Marks Slack coordination channel read-only and archives.',
        config: {
          channelNameTemplate: 'incident-{{incident.id}}',
          notifyBeforeArchive: true,
        },
      },
      {
        id: 'act-4-ai-post-mortem',
        name: 'Generate AI Post-Mortem & Timeline',
        type: 'generate_ai_post_mortem',
        description: 'Synthesizes full incident timeline, root cause, timeline events, and action items.',
        config: {
          includeHypotheses: true,
          includeTimeline: true,
        },
      },
      {
        id: 'act-4-close-warroom',
        name: 'Decommission Agora War Room',
        type: 'close_war_room',
        description: 'Ends active conference and exports recording transcript.',
        config: {
          exportTranscript: true,
        },
      },
      {
        id: 'act-4-resolution-email',
        name: 'Send Incident Resolution Report',
        type: 'send_email',
        description: 'Notifies stakeholders and responders that incident has reached full resolution.',
        config: {
          to: 'incident-responders@ecosphere.dev',
          subject: '[Resolved] {{incident.title}} (Incident {{incident.id}})',
          priority: 'normal',
        },
      },
    ],
    createdAt: 1725715000000,
    updatedAt: 1725715000000,
  },
  {
    id: 'wf-jira-followups',
    name: 'File Jira Follow-Up Tickets for Uncompleted Actions',
    description: 'Creates Jira issues in project PAY and INFRA for remaining post-incident tasks.',
    enabled: true,
    type: 'post-incident',
    folder: 'Jira',
    integration: 'jira',
    trigger: {
      type: 'incident_resolved',
      description: 'Incident Resolved / Closed',
      config: {},
    },
    actions: [
      {
        id: 'act-5-ai-action-items',
        name: 'Generate AI Remediation Action Items',
        type: 'generate_ai_action_items',
        description: 'Extracts preventative engineering follow-ups and tickets.',
        config: {
          projectKeys: ['PAY', 'INFRA'],
        },
      },
      {
        id: 'act-5-log-jira',
        name: 'Log Jira Tickets Created',
        type: 'log_event',
        description: 'Logs ticket creation events into the audit ledger.',
        config: {
          message: 'Created follow-up Jira tickets for incident {{incident.id}}',
        },
      },
    ],
    createdAt: 1725720000000,
    updatedAt: 1725720000000,
  },
];

// File-based persistence directory
const DATA_DIR = path.join(process.cwd(), '.data', 'workflow-engine');
const WORKFLOWS_FILE = path.join(DATA_DIR, 'workflows.json');
const EXECUTIONS_FILE = path.join(DATA_DIR, 'executions.json');

// In-memory cache
let inMemoryWorkflows: Workflow[] | null = null;
let inMemoryExecutions: Execution[] | null = null;

function ensureDataDir(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Read-only filesystem fallback is acceptable; memory cache will be used
  }
}

function loadWorkflowsFromDisk(): Workflow[] {
  if (inMemoryWorkflows !== null) {
    return inMemoryWorkflows;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(WORKFLOWS_FILE)) {
      const data = fs.readFileSync(WORKFLOWS_FILE, 'utf-8');
      inMemoryWorkflows = JSON.parse(data) as Workflow[];
      return inMemoryWorkflows;
    }
  } catch {
    // Disk read failure
  }
  // Initialize with defaults
  inMemoryWorkflows = [...DEFAULT_WORKFLOWS];
  saveWorkflowsToDisk();
  return inMemoryWorkflows;
}

function saveWorkflowsToDisk(): void {
  if (!inMemoryWorkflows) return;
  ensureDataDir();
  try {
    fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify(inMemoryWorkflows, null, 2), 'utf-8');
  } catch {
    // In-memory fallback
  }
}

function loadExecutionsFromDisk(): Execution[] {
  if (inMemoryExecutions !== null) {
    return inMemoryExecutions;
  }
  ensureDataDir();
  try {
    if (fs.existsSync(EXECUTIONS_FILE)) {
      const data = fs.readFileSync(EXECUTIONS_FILE, 'utf-8');
      inMemoryExecutions = JSON.parse(data) as Execution[];
      return inMemoryExecutions;
    }
  } catch {
    // Disk read failure
  }
  inMemoryExecutions = [];
  return inMemoryExecutions;
}

function saveExecutionsToDisk(): void {
  if (!inMemoryExecutions) return;
  ensureDataDir();
  try {
    fs.writeFileSync(EXECUTIONS_FILE, JSON.stringify(inMemoryExecutions, null, 2), 'utf-8');
  } catch {
    // In-memory fallback
  }
}

export const workflowStore = {
  listWorkflows(filter?: { folder?: string; query?: string; enabled?: boolean }): Workflow[] {
    const list = loadWorkflowsFromDisk();
    return list.filter((w) => {
      if (filter?.folder && filter.folder !== 'all' && w.folder.toLowerCase() !== filter.folder.toLowerCase()) {
        return false;
      }
      if (typeof filter?.enabled === 'boolean' && w.enabled !== filter.enabled) {
        return false;
      }
      if (filter?.query && filter.query.trim()) {
        const q = filter.query.toLowerCase();
        const matchesName = w.name.toLowerCase().includes(q);
        const matchesDesc = w.description.toLowerCase().includes(q);
        const matchesFolder = w.folder.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesFolder) return false;
      }
      return true;
    });
  },

  getWorkflow(id: string): Workflow | null {
    const list = loadWorkflowsFromDisk();
    return list.find((w) => w.id === id) || null;
  },

  createWorkflow(data: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Workflow {
    const list = loadWorkflowsFromDisk();
    const id = data.id || `wf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const newWf: Workflow = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(newWf);
    inMemoryWorkflows = list;
    saveWorkflowsToDisk();
    return newWf;
  },

  updateWorkflow(id: string, updates: Partial<Workflow>): Workflow | null {
    const list = loadWorkflowsFromDisk();
    const idx = list.findIndex((w) => w.id === id);
    if (idx === -1) return null;
    const updated: Workflow = {
      ...list[idx],
      ...updates,
      id, // Immutable ID
      updatedAt: Date.now(),
    };
    list[idx] = updated;
    inMemoryWorkflows = list;
    saveWorkflowsToDisk();
    return updated;
  },

  deleteWorkflow(id: string): boolean {
    const list = loadWorkflowsFromDisk();
    const initialLen = list.length;
    const filtered = list.filter((w) => w.id !== id);
    if (filtered.length === initialLen) return false;
    inMemoryWorkflows = filtered;
    saveWorkflowsToDisk();
    return true;
  },

  toggleWorkflowEnabled(id: string, enabled?: boolean): Workflow | null {
    const wf = this.getWorkflow(id);
    if (!wf) return null;
    const nextEnabled = typeof enabled === 'boolean' ? enabled : !wf.enabled;
    return this.updateWorkflow(id, { enabled: nextEnabled });
  },

  recordExecution(execution: Execution): Execution {
    const executions = loadExecutionsFromDisk();
    // Prepend new execution
    executions.unshift(execution);
    // Keep max 500 executions
    if (executions.length > 500) {
      executions.length = 500;
    }
    inMemoryExecutions = executions;
    saveExecutionsToDisk();
    return execution;
  },

  updateExecution(id: string, updates: Partial<Execution>): Execution | null {
    const executions = loadExecutionsFromDisk();
    const idx = executions.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    const updated: Execution = {
      ...executions[idx],
      ...updates,
      id,
    };
    executions[idx] = updated;
    inMemoryExecutions = executions;
    saveExecutionsToDisk();
    return updated;
  },

  getExecution(id: string): Execution | null {
    const executions = loadExecutionsFromDisk();
    return executions.find((e) => e.id === id) || null;
  },

  listExecutionsForWorkflow(workflowId: string, limit = 50): Execution[] {
    const executions = loadExecutionsFromDisk();
    return executions.filter((e) => e.workflowId === workflowId).slice(0, limit);
  },

  listAllExecutions(limit = 100): Execution[] {
    const executions = loadExecutionsFromDisk();
    return executions.slice(0, limit);
  },

  resetStoreToDefaults(): void {
    inMemoryWorkflows = [...DEFAULT_WORKFLOWS];
    inMemoryExecutions = [];
    saveWorkflowsToDisk();
    saveExecutionsToDisk();
  },
};
