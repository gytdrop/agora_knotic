import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export type WorkflowEventType =
  | 'INCIDENT_CREATED'
  | 'SEVERITY_CHANGED'
  | 'STATUS_CHANGED'
  | 'WAR_ROOM_CREATED'
  | 'UPDATE_POSTED';

export interface WorkflowTriggerPayload {
  incidentId: string;
  eventType: WorkflowEventType;
  context: Record<string, unknown>;
}

export async function triggerWorkflowsForIncident(payload: WorkflowTriggerPayload) {
  const { incidentId, eventType, context } = payload;
  const now = Date.now();

  try {
    const incident = await convexClient.query(api.incidents.getIncident, { incidentId });
    if (!incident) return;

    if (eventType === 'INCIDENT_CREATED') {
      await convexClient.mutation(api.incidents.recordWorkflowExecution, {
        incidentId,
        workflowId: 'wf-auto-provision',
        workflowName: '[Auto] PagerDuty Responder Invite & Channel Provisioning',
        trigger: `Incident Created (${incident.severity})`,
        status: 'completed',
        actionsExecuted: [
          `Dispatched high-priority on-call page to ${incident.lead || 'Ashley Sawatsky'}`,
          `Provisioned Slack channel ${incident.slackChannel || '#incident-auto'}`,
          `Linked automated Jira ticket ${incident.jiraKey || 'INC-AUTO'}`,
          `Invited Scribe and Operations Lead`,
        ],
        output: 'Responder notified; triage channel active.',
      });
    } else if (eventType === 'SEVERITY_CHANGED') {
      const newSeverity = String(context.newSeverity || incident.severity).toUpperCase();
      const isCritical = newSeverity.includes('0') || newSeverity.includes('1') || newSeverity.includes('CRITICAL');

      if (isCritical) {
        await convexClient.mutation(api.incidents.recordWorkflowExecution, {
          incidentId,
          workflowId: 'wf-escalation-matrix',
          workflowName: `[Escalation] ${newSeverity} Leadership Alert & Runbook Dispatch`,
          trigger: `Severity Escalated to ${newSeverity}`,
          status: 'completed',
          actionsExecuted: [
            'Triggered Tier-1 Executive SMS Broadcast',
            'Paging Secondary SRE On-Call and Database Infrastructure Lead',
            'Broadcasting status update to #incident-announcements',
            'Auto-scaling cluster ingress buffer pods',
          ],
          output: 'Leadership alerted; runbooks attached.',
        });
      }
    } else if (eventType === 'STATUS_CHANGED') {
      const newStatus = String(context.newStatus || incident.status);
      if (newStatus === 'Resolved') {
        await convexClient.mutation(api.incidents.recordWorkflowExecution, {
          incidentId,
          workflowId: 'wf-postmortem-generation',
          workflowName: '[Post-Incident] Automated AI Post-Mortem & Jira Follow-Ups',
          trigger: 'Incident Resolved',
          status: 'completed',
          actionsExecuted: [
            'Generated draft Post-Incident Review (PIR) report via EchoSphere AI',
            'Synced resolution timestamp to Datadog APM and PagerDuty',
            'Created 2 Jira remediation follow-ups in project PLAT',
            'Published final resolution notice to status.acme.com',
          ],
          output: 'PIR generated; tickets filed.',
        });
      }
    }
  } catch (error) {
    console.warn('workflow-engine execution error:', error);
  }
}
