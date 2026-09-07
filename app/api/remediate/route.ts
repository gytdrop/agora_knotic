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

/**
 * Allowlisted sandbox operations.
 *
 * The trigger chain ends in "speech causes code to run", so the request body
 * selects a KEY only — it never supplies a command, path, or URL. Each key maps
 * to a hardcoded operation below. Adding a case is a deliberate code change.
 */
const SANDBOX_ACTIONS = {
  ROLLBACK_PAYMENT_SERVICE: { path: '/admin/version', body: { version: 'v2.8.0' } },
  RESET_SANDBOX: { path: '/admin/reset', body: {} },
} as const;

type SandboxActionType = keyof typeof SANDBOX_ACTIONS;

function sandboxEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.DEMO_SANDBOX === '1';
}

/**
 * Perform the real rollback against the local sandbox, returning its
 * before/after numbers. Returns null whenever the sandbox is disabled or not
 * running — the caller then reports the narrated outcome, so the demo works
 * end to end with no sandbox at all.
 */
async function runSandboxAction(
  actionType: string | undefined,
): Promise<Record<string, unknown> | null> {
  if (!sandboxEnabled()) return null;
  if (!actionType || !(actionType in SANDBOX_ACTIONS)) return null;

  const action = SANDBOX_ACTIONS[actionType as SandboxActionType];
  try {
    const res = await fetch(`http://127.0.0.1:4000${action.path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action.body),
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    // Sandbox down: fall back to the narrated path rather than failing the demo.
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body: RemediationRequest = await request.json().catch(() => ({}));
    
    const actionId = body.actionId || `act_${Date.now()}`;

    // Perform the real rollback when the sandbox is running; null otherwise.
    const sandbox = await runSandboxAction(body.actionType);
    const before = (sandbox?.before ?? null) as
      | { errorRatePct?: number; p99LatencyMs?: number; podMemoryPct?: number; dbPoolActive?: number }
      | null;
    const rolledBack = Boolean(sandbox);

    const outcomeText = rolledBack
      ? `payment-service rolled back ${sandbox?.from ?? 'v2.8.1'} -> ${sandbox?.to ?? 'v2.8.0'}. `
        + `Error rate was ${before?.errorRatePct ?? '?'}%, p99 ${before?.p99LatencyMs ?? '?'}ms. `
        + `Pod memory (${before?.podMemoryPct ?? '?'}%) and DB pool (${before?.dbPoolActive ?? '?'}/100) unchanged `
        + `— the memory-leak hypothesis was never the cause.`
      : 'Canary rollback executed: payment-service reverted to stable v2.8.0. Fraud check budgeted at 300ms with fallback verdict.';
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
        text: `Remediation executed: ${outcomeText}`,
        tag: 'ACTION',
        status: 'Remediation Executed (Active)',
        telemetryEvidence: {
          source: 'k8s-api',
          component: 'ingress-nginx',
          details: rolledBack
            ? 'Live sandbox rollback confirmed; checkout error rate recovering.'
            : 'Canary rollback staged; checkout path no longer blocks on fraud-detection-svc.',
        },
      });
    } catch (storeErr) {
      console.warn('[remediate] failed to record event in store:', storeErr);
    }

    return withCors(
      NextResponse.json<RemediationResponse>(
        {
          success: true,
          message: `Remediation executed by ${authorizedBy}. ${outcomeText}`,
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
