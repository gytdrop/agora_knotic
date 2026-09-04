import { NextResponse } from "next/server";
import { handleCorsPreflight, withCors } from '@/lib/cors';

export interface RemediationRequest {
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
