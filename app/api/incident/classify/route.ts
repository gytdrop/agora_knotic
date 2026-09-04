import { NextRequest, NextResponse } from 'next/server';
import { analyzeStatement } from '@/lib/incident-analyzer';
import { recordIncidentEvent } from '@/lib/event-store';
import type { SpeakerRole, LedgerItem } from '@/types/conversation';

export interface ClassifyStatementRequest {
  text: string;
  speaker?: string;
  speakerRole?: SpeakerRole;
  speakerUid?: string;
  turnId?: number;
  incidentId?: string;
  recordEvent?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClassifyStatementRequest = await request.json();
    const {
      text,
      speaker = 'Unknown',
      speakerRole,
      speakerUid,
      turnId,
      incidentId = '#INC-8921',
      recordEvent = false,
    } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text parameter' },
        { status: 400 },
      );
    }

    const analyzed = analyzeStatement(speaker, text, speakerRole);

    const ledgerItem: LedgerItem = {
      id:
        turnId !== undefined
          ? `turn-${turnId}`
          : `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestampMs: Date.now(),
      speaker,
      speakerRole,
      speakerUid,
      turnId,
      text,
      tag: analyzed.tag,
      status: analyzed.status,
      reason: analyzed.reason,
      telemetryEvidence: analyzed.telemetryEvidence,
      hypothesisLifecycle: analyzed.hypothesisLifecycle,
    };

    let eventResult;
    if (recordEvent && !analyzed.isNoise) {
      const eventType =
        analyzed.tag === 'ACTION'
          ? 'HOTFIX_STAGED'
          : analyzed.tag === 'CONTRADICTION'
          ? 'CONTRADICTION_FLAGGED'
          : 'TURN_FINALIZED';
      eventResult = recordIncidentEvent(incidentId, eventType, ledgerItem);
    }

    return NextResponse.json(
      {
        success: true,
        tag: analyzed.tag,
        analysis: analyzed,
        item: ledgerItem,
        event: eventResult?.event,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to classify statement', details: String(error) },
      { status: 500 },
    );
  }
}
