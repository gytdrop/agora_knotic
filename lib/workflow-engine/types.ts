export type WorkflowType = 'incident' | 'post-incident' | 'alert';

export type IntegrationType =
  | 'slack'
  | 'pagerduty'
  | 'statuspage'
  | 'jira'
  | 'ai'
  | 'teams'
  | 'email'
  | 'internal';

export type TriggerEventType =
  | 'incident_created'
  | 'incident_severity_changed'
  | 'incident_updated'
  | 'war_room_started'
  | 'ai_summary_ready'
  | 'incident_resolved'
  | 'manual'
  | 'scheduled';

export interface WorkflowTrigger {
  type: TriggerEventType;
  description?: string;
  config?: {
    severityThreshold?: string[]; // e.g. ['SEV-0', 'SEV-1', 'Critical', 'Major']
    hasCustomerImpact?: boolean;
    cron?: string;
    scheduleIntervalMinutes?: number;
    matchTags?: string[];
  };
}

export type ActionType =
  // Communication
  | 'create_slack_channel'
  | 'post_slack_message'
  | 'post_teams_message'
  | 'send_email'
  // Incident operations
  | 'create_war_room'
  | 'assign_incident_commander'
  | 'update_incident_severity'
  | 'resolve_incident'
  | 'archive_slack_channel'
  | 'close_war_room'
  // AI operations
  | 'generate_ai_summary'
  | 'generate_ai_hypothesis'
  | 'generate_ai_action_items'
  | 'generate_ai_timeline'
  | 'generate_ai_post_mortem'
  // Internal & Control
  | 'wait_delay'
  | 'condition_branch'
  | 'log_event'
  | 'update_status_page';

export interface ActionRetryPolicy {
  maxRetries: number;
  backoffMs: number;
}

export interface WorkflowAction {
  id: string;
  name: string;
  type: ActionType;
  description?: string;
  config: Record<string, any>;
  retryPolicy?: ActionRetryPolicy;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  type: WorkflowType;
  folder: string; // e.g. 'Slack', 'Statuspage', 'AI', 'Jira', 'General'
  integration: IntegrationType;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionIncidentContext {
  id: string;
  title: string;
  severity: string; // 'SEV-0' | 'SEV-1' | 'SEV-2' | 'SEV-3' | 'Critical' | 'Major' | 'Minor'
  status: string; // 'INVESTIGATING' | 'FIXING' | 'MONITORING' | 'RESOLVED'
  lead?: string;
  reporter?: string;
  customerImpact?: boolean;
  slackChannel?: string;
  warRoomUrl?: string;
  summary?: string;
  rootCause?: string;
  [key: string]: any;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  workflowName: string;
  trigger: {
    type: TriggerEventType;
    payload: Record<string, any>;
  };
  incident: ExecutionIncidentContext;
  variables: Record<string, any>;
  stepOutputs: Record<string, any>;
  startedAt: number;
}

export type ExecutionStatus = 'running' | 'success' | 'failed' | 'cancelled';
export type StepExecutionStatus = 'running' | 'success' | 'failed' | 'skipped';

export interface ExecutionLogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  stepId?: string;
  stepName?: string;
  message: string;
  data?: any;
}

export interface ActionExecutionResult {
  actionId: string;
  actionName: string;
  actionType: ActionType;
  status: StepExecutionStatus;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  input: any;
  output: any;
  error?: string;
  retryCount: number;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: ExecutionStatus;
  triggerType: TriggerEventType;
  triggerPayload: Record<string, any>;
  startedAt: number;
  finishedAt?: number;
  durationMs?: number;
  error?: string;
  logs: ExecutionLogEntry[];
  stepResults: ActionExecutionResult[];
  contextSnapshot?: {
    variables: Record<string, any>;
    incident: ExecutionIncidentContext;
  };
}
