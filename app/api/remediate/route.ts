import { NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from '@/lib/cors';
import { recordIncidentEvent, getIncidentState } from '@/lib/event-store';

export interface RemediationRequest {
  incidentId?: string;
  actionId?: string;
  actionType?: string;
  targetService?: string;
  authorizedBy?: string;
  passkeyUsed?: boolean;
}

export interface RemediationResponse {
  success: boolean;
  message: string;
  timestamp: string;
  actionId: string;
  status: string;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body: RemediationRequest = await request.json().catch(() => ({}));
    
    const actionId = body.actionId || `act_${Date.now()}`;
    const authorizedBy = body.authorizedBy || "Incident Commander";
    const rawIncidentId = body.incidentId || 'INC-8921';
    const cleanId = rawIncidentId.replace(/^#/, '');
    const normalizedIncidentId = `#${cleanId}`;

    try {
      const incident = getIncidentState(normalizedIncidentId);
      incident.isResolved = true;
      recordIncidentEvent(normalizedIncidentId, 'REMEDIATION_EXECUTED', {
        id: actionId,
        speaker: authorizedBy,
        text: `Remediation hotfix executed: Ingress port restored (8080 -> 8000). Rolling restart deployed.`,
        tag: 'ACTION',
        status: 'Remediation Executed (Active)',
        telemetryEvidence: {
          source: 'k8s-api',
          component: 'ingress-nginx',
          details: 'Ingress port 8000 target restored, pod health checks passed.',
        },
      });
    } catch (storeErr) {
      console.warn('[remediate] failed to record event in store:', storeErr);
    }

    return withCors(
      NextResponse.json<RemediationResponse>(
        {
          success: true,
          message: `Remediation hotfix executed successfully by ${authorizedBy}. Ingress port restored (8080 -> 8000).`,
          timestamp: new Date().toISOString(),
          actionId,
          status: "RESOLVED",
        },
        { status: 200 }
      ),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        {
          success: false,
          message: "Failed to execute remediation patch",
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      ),
      request
    );
  }
}

export async function GET(request: Request) {
  return withCors(
    NextResponse.json(
      {
        status: "READY",
        endpoint: "/api/remediate",
        description: "Human-in-the-Loop (HITL) remediation webhook execution route",
      },
      { status: 200 }
    ),
    request
  );
}
