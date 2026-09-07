import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { transitionIncidentState, type IncidentLifecycleState } from './lifecycle-engine';
import { triggerWorkflowsForIncident } from './workflow-engine';

export interface CreateIncidentDTO {
  title: string;
  severity: string;
  description?: string;
  summary?: string;
  status?: string;
  lead?: string;
  service?: string;
  environment?: string;
  source?: string;
  customerImpact?: string;
  createdBy?: string;
}

export interface UpdateIncidentDTO {
  title?: string;
  description?: string;
  severity?: string;
  status?: string;
  lead?: string;
  service?: string;
  environment?: string;
  customerImpact?: string;
  problem?: string;
  impact?: string;
  causes?: string;
  mitigation?: string;
  rootCause?: string;
}

export class IncidentService {
  static async listIncidents(filters?: { status?: string; severity?: string; search?: string }) {
    const all = await convexClient.query(api.incidents.listAllIncidents, {});
    let filtered = all;

    if (filters?.status && filters.status !== 'ALL') {
      const s = filters.status.toUpperCase();
      if (s === 'ACTIVE') {
        filtered = filtered.filter((i) => i.status.toUpperCase() !== 'RESOLVED' && i.status.toUpperCase() !== 'CLOSED');
      } else {
        filtered = filtered.filter((i) => i.status.toUpperCase() === s);
      }
    }

    if (filters?.severity && filters.severity !== 'ALL') {
      const sev = filters.severity.toUpperCase();
      filtered = filtered.filter((i) => (i.severity || '').toUpperCase().includes(sev));
    }

    if (filters?.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.title.toLowerCase().includes(query) ||
          i.incidentId.toLowerCase().includes(query) ||
          (i.lead && i.lead.toLowerCase().includes(query)) ||
          (i.service && i.service.toLowerCase().includes(query))
      );
    }

    return filtered;
  }

  static async getIncident(incidentId: string) {
    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`;
    const incident = await convexClient.query(api.incidents.getIncident, { incidentId: cleanId });
    if (!incident) return null;

    const [participants, tasks, updates, artifacts, warRoom, timeline] = await Promise.all([
      convexClient.query(api.incidents.listParticipants, { incidentId: cleanId }).catch(() => []),
      convexClient.query(api.incidents.listTasks, { incidentId: cleanId }).catch(() => []),
      convexClient.query(api.incidents.listUpdates, { incidentId: cleanId }).catch(() => []),
      convexClient.query(api.incidents.listArtifacts, { incidentId: cleanId }).catch(() => []),
      convexClient.query(api.incidents.getWarRoom, { incidentId: cleanId }).catch(() => null),
      convexClient.query(api.incidents.listTimelineEvents, { incidentId: cleanId }).catch(() => []),
    ]);

    return {
      ...incident,
      participants,
      tasks,
      updates,
      artifacts,
      warRoom,
      timelineEvents: timeline,
    };
  }

  static async createIncident(data: CreateIncidentDTO) {
    const created = await convexClient.mutation(api.incidents.createIncident, {
      title: data.title,
      severity: data.severity,
      summary: data.summary,
      description: data.description,
      status: data.status || 'Investigating',
      lead: data.lead,
      service: data.service,
      environment: data.environment,
      source: data.source,
      customerImpact: data.customerImpact,
      createdBy: data.createdBy,
    });

    return created;
  }

  static async updateIncident(incidentId: string, data: UpdateIncidentDTO) {
    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`;
    return await convexClient.mutation(api.incidents.updateIncident, {
      incidentId: cleanId,
      ...data,
    });
  }

  static async deleteIncident(incidentId: string) {
    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`;
    return await convexClient.mutation(api.incidents.deleteIncident, { incidentId: cleanId });
  }

  static async acknowledgeIncident(incidentId: string, actor?: string) {
    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`;
    return await convexClient.mutation(api.incidents.acknowledgeIncident, {
      incidentId: cleanId,
      actor,
    });
  }

  static async escalateIncident(
    incidentId: string,
    params: { severity: string; team?: string; engineer?: string; reason?: string; actor?: string }
  ) {
    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`;
    const res = await convexClient.mutation(api.incidents.escalateIncident, {
      incidentId: cleanId,
      severity: params.severity,
      team: params.team,
      engineer: params.engineer,
      reason: params.reason,
      actor: params.actor,
    });

    await triggerWorkflowsForIncident({
      incidentId: cleanId,
      eventType: 'SEVERITY_CHANGED',
      context: {
        newSeverity: params.severity,
        team: params.team,
        engineer: params.engineer,
        reason: params.reason,
      },
    });

    return res;
  }

  static async transitionStatus(
    incidentId: string,
    targetStatus: IncidentLifecycleState,
    actor?: string,
    reason?: string
  ) {
    const cleanId = incidentId.startsWith('#') ? incidentId : `#${incidentId}`;
    return await transitionIncidentState(cleanId, targetStatus, actor, reason);
  }
}
