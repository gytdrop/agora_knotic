import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export interface CreateTimelineEventInput {
  incidentId: string;
  type:
    | 'created'
    | 'severity_changed'
    | 'status_changed'
    | 'assignee_added'
    | 'participant_joined'
    | 'ai_summary_generated'
    | 'war_room_created'
    | 'workflow_executed'
    | 'update_posted'
    | 'task_completed'
    | 'resolved'
    | 'note';
  message: string;
  actor: string;
  icon?: string;
  metadata?: Record<string, unknown> | string;
  timestamp?: number;
}

export async function recordTimelineEvent(input: CreateTimelineEventInput) {
  const metadataStr =
    typeof input.metadata === 'object' ? JSON.stringify(input.metadata) : input.metadata;

  return await convexClient.mutation(api.incidents.addTimelineEvent, {
    incidentId: input.incidentId,
    type: input.type,
    message: input.message,
    actor: input.actor,
    icon: input.icon,
    metadata: metadataStr,
    timestamp: input.timestamp || Date.now(),
  });
}

export async function getUnifiedIncidentTimeline(incidentId: string) {
  const [timelineEvents, ledgerEvents] = await Promise.all([
    convexClient.query(api.incidents.listTimelineEvents, { incidentId }).catch(() => []),
    convexClient.query(api.incidents.listLedgerEvents, { incidentId }).catch(() => []),
  ]);

  return {
    incidentId,
    timelineEvents,
    ledgerEvents,
    totalCount: (timelineEvents?.length || 0) + (ledgerEvents?.length || 0),
  };
}
