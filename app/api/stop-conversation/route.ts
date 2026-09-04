import { NextResponse } from 'next/server';
import { AgoraClient, Area } from 'agora-agents';
import { StopConversationRequest } from '@/types/conversation';
import { handleCorsPreflight, withCors } from '@/lib/cors';

function isAgentAlreadyStoppingOrStopped(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const maybeErr = error as {
    statusCode?: number;
    body?: { detail?: string; reason?: string };
    message?: string;
  };

  const statusCode = maybeErr.statusCode;
  const reason = (maybeErr.body?.reason ?? '').toLowerCase();
  const detail = (maybeErr.body?.detail ?? maybeErr.message ?? '').toLowerCase();

  if (statusCode === 404) return true;
  if (
    reason.includes('already in the process of shutting down') ||
    detail.includes('already in the process of shutting down') ||
    detail === 'errconflict'
  ) {
    return true;
  }
  return false;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body: StopConversationRequest = await request.json();
    const { agent_id } = body;

    if (!agent_id) {
      return withCors(
        NextResponse.json(
          { error: 'agent_id is required' },
          { status: 400 },
        ),
        request,
      );
    }

    const appId = process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const appCertificate =
      process.env.AGORA_APP_CERTIFICATE || process.env.NEXT_AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      return withCors(
        NextResponse.json(
          {
            error:
              'Missing Agora configuration. Set AGORA_APP_ID and AGORA_APP_CERTIFICATE.',
          },
          { status: 500 },
        ),
        request,
      );
    }

    // area: change to Area.EU or Area.AP for European or Asia-Pacific deployments.
    const client = new AgoraClient({
      area: Area.US,
      appId,
      appCertificate,
    });

    try {
      await client.stopAgent(agent_id);
    } catch (error) {
      if (isAgentAlreadyStoppingOrStopped(error)) {
        // Treat stop as idempotent: agent is already exiting (or gone).
        return withCors(
          NextResponse.json({ success: true, state: 'already-stopping' }),
          request,
        );
      }
      throw error;
    }

    return withCors(NextResponse.json({ success: true }), request);
  } catch (error) {
    console.error('Error stopping conversation:', error);
    return withCors(
      NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'Failed to stop conversation',
        },
        { status: 500 },
      ),
      request,
    );
  }
}
