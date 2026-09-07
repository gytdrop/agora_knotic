import { workflowStore } from './store';
import { Execution, TriggerEventType, Workflow, WorkflowTrigger } from './types';
import { executeWorkflow } from './engine';

/**
 * Evaluates whether an incoming event payload matches the workflow trigger criteria.
 */
export function matchesTrigger(
  trigger: WorkflowTrigger,
  eventType: TriggerEventType,
  payload: Record<string, any>
): boolean {
  // Manual runs always match when explicitly invoked
  if (eventType === 'manual') {
    return true;
  }

  // Event types must match
  if (trigger.type !== eventType) {
    return false;
  }

  const config = trigger.config || {};
  const incident = payload.incident || payload;

  // Check severity threshold filter
  if (config.severityThreshold && Array.isArray(config.severityThreshold) && config.severityThreshold.length > 0) {
    const incSeverity = String(incident.severity || '').toUpperCase();
    const matchesSev = config.severityThreshold.some((sev) => {
      const s = String(sev).toUpperCase();
      return incSeverity === s || incSeverity.includes(s) || s.includes(incSeverity);
    });
    if (!matchesSev) {
      return false;
    }
  }

  // Check customer impact filter
  if (typeof config.hasCustomerImpact === 'boolean') {
    const hasImpact = Boolean(incident.customerImpact ?? incident.hasCustomerImpact);
    if (hasImpact !== config.hasCustomerImpact) {
      return false;
    }
  }

  // Check tag match filter
  if (config.matchTags && Array.isArray(config.matchTags) && config.matchTags.length > 0) {
    const incidentTags: string[] = incident.tags || [];
    const hasMatchingTag = config.matchTags.some((tag) => incidentTags.includes(tag));
    if (!hasMatchingTag) {
      return false;
    }
  }

  return true;
}

/**
 * Returns all active workflows matching the given trigger event.
 */
export function findMatchingWorkflows(
  eventType: TriggerEventType,
  payload: Record<string, any>
): Workflow[] {
  const activeWorkflows = workflowStore.listWorkflows({ enabled: true });
  return activeWorkflows.filter((wf) => matchesTrigger(wf.trigger, eventType, payload));
}

/**
 * Dispatches an event into the workflow engine, executing all matching workflows asynchronously.
 */
export async function dispatchTrigger(
  eventType: TriggerEventType,
  payload: Record<string, any>
): Promise<Execution[]> {
  const matching = findMatchingWorkflows(eventType, payload);
  if (matching.length === 0) {
    return [];
  }

  // Run all matching workflows
  const executionPromises = matching.map((wf) =>
    executeWorkflow(wf, {
      triggerType: eventType,
      triggerPayload: payload,
      incident: payload.incident || payload,
    })
  );

  return Promise.all(executionPromises);
}
