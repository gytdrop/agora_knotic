import { NextRequest, NextResponse } from 'next/server';
import { AgoraClient, Area } from 'agora-agents';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export interface AgentSpeakRequest {
  agentId: string;
  alerts: string[];
}

/**
 * POST /api/agent-speak
 *
 * Drains the muted-alert queue by replaying queued alerts via the agent's TTS
 * module. Called exactly once when the user unmutes the agent after a Silent
 * Mode session. Alerts are coalesced into a single INTERRUPT-priority message
 * so only one TTS turn fires.
 *
 * If agentId is missing or the speak call fails the route responds with 200 and
 * a "skipped" flag — the caller already committed all items to the ledger as
 * text, so audio replay is best-effort.
 */
export async function POST(request: NextRequest) {
  try {
    const body: AgentSpeakRequest = await request.json();
    const { agentId, alerts } = body;

    if (!agentId || !alerts || alerts.length === 0) {
      return NextResponse.json({ ok: true, skipped: true, reason: 'no_alerts_or_agent_id' });
    }

    const appId = requireEnv('NEXT_PUBLIC_AGORA_APP_ID');
    const appCertificate = requireEnv('NEXT_AGORA_APP_CERTIFICATE');

    const clientArea = process.env.AGORA_AREA === 'US' ? Area.US : Area.AP;
    const agoraClient = new AgoraClient({ area: clientArea, appId, appCertificate });

    // Coalesce all queued alerts into one spoken message so a burst of
    // contradictions/actions doesn't produce multiple TTS interruptions.
    const summary =
      alerts.length === 1
        ? alerts[0]
        : `Silent mode summary: ${alerts.length} alerts. ${alerts.join(' Next: ')}`;

    await agoraClient.agents.speak({
      appid: appId,
      agentId,
      text: summary,
      priority: 'INTERRUPT',
      interruptable: false,
    });

    return NextResponse.json({ ok: true, skipped: false, count: alerts.length });
  } catch (error) {
    // Speak endpoint failure is non-fatal — alerts are already in the ledger.
    console.warn('[agent-speak] TTS replay failed (non-fatal):', error);
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }
}
