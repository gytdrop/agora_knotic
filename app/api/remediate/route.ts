import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  try {
    const body: RemediationRequest = await request.json().catch(() => ({}));
    
    const actionId = body.actionId || `act_${Date.now()}`;
    const authorizedBy = body.authorizedBy || "Incident Commander";

    return NextResponse.json<RemediationResponse>(
      {
        success: true,
        message: `Remediation hotfix executed successfully by ${authorizedBy}. Ingress port restored (8080 -> 8000).`,
        timestamp: new Date().toISOString(),
        actionId,
        status: "RESOLVED",
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to execute remediation patch",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      status: "READY",
      endpoint: "/api/remediate",
      description: "Human-in-the-Loop (HITL) remediation webhook execution route",
    },
    { status: 200 }
  );
}
