import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { triggerWorkflowsForIncident } from './workflow-engine';

export type IncidentLifecycleState =
  | 'Detected'
  | 'Investigating'
  | 'Identified'
  | 'Monitoring'
  | 'Resolved'
  | 'Closed';

export const ALLOWED_TRANSITIONS: Record<IncidentLifecycleState, IncidentLifecycleState[]> = {
  Detected: ['Investigating'],
  Investigating: ['Identified', 'Monitoring', 'Resolved'],
  Identified: ['Monitoring', 'Resolved', 'Investigating'],
  Monitoring: ['Resolved', 'Investigating'],
  Resolved: ['Closed', 'Investigating'],
  Closed: ['Investigating'],
};

export function normalizeStatus(raw: string): IncidentLifecycleState {
  const upper = (raw || '').toUpperCase().trim();
  if (upper === 'DETECTED') return 'Detected';
  if (upper === 'INVESTIGATING' || upper === 'FIXING' || upper === 'TRIAGE') return 'Investigating';
  if (upper === 'IDENTIFIED') return 'Identified';
  if (upper === 'MONITORING' || upper === 'ACTIVE' || upper === 'STAGED') return 'Monitoring';
  if (upper === 'RESOLVED') return 'Resolved';
  if (upper === 'CLOSED') return 'Closed';
  return 'Investigating';
}

export function canTransition(
  current: IncidentLifecycleState,
  target: IncidentLifecycleState
): { allowed: boolean; reason?: string } {
  if (current === target) {
    return { allowed: true };
  }
  const validNext = ALLOWED_TRANSITIONS[current] || [];
  if (validNext.includes(target)) {
    return { allowed: true };
  }
  return {
    allowed: false,
    reason: `Invalid transition from "${current}" to "${target}". Allowed next states: ${validNext.join(', ')}`,
  };
}

export async function transitionIncidentState(
  incidentId: string,
  targetStatus: IncidentLifecycleState,
  actor = 'Incident Commander',
  reason?: string
) {
  const incident = await convexClient.query(api.incidents.getIncident, { incidentId });
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const currentStatus = normalizeStatus(incident.status);
  const check = canTransition(currentStatus, targetStatus);
  if (!check.allowed) {
    throw new Error(check.reason);
  }

  const now = Date.now();

  if (targetStatus === 'Investigating' && (currentStatus === 'Resolved' || currentStatus === 'Closed')) {
    await convexClient.mutation(api.incidents.reopenIncident, {
      incidentId,
      actor,
      reason,
    });
  } else if (targetStatus === 'Resolved') {
    await convexClient.mutation(api.incidents.resolveIncident, {
      incidentId,
      resolvedBy: actor,
    });
  } else {
    await convexClient.mutation(api.incidents.updateIncident, {
      incidentId,
      status: targetStatus,
    });

    await convexClient.mutation(api.incidents.addTimelineEvent, {
      incidentId,
      type: 'status_changed',
      message: `Status moved from ${currentStatus} to ${targetStatus}${reason ? `: ${reason}` : ''}`,
      actor,
      icon: 'RotateCw',
      timestamp: now,
    });
  }

  // Trigger state-driven workflows
  await triggerWorkflowsForIncident({
    incidentId,
    eventType: 'STATUS_CHANGED',
    context: {
      oldStatus: currentStatus,
      newStatus: targetStatus,
      actor,
      reason,
    },
  });

  return {
    incidentId,
    previousStatus: currentStatus,
    currentStatus: targetStatus,
    transitionedAt: now,
  };
}
