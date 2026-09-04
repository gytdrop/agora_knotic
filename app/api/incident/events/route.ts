import { NextRequest, NextResponse } from 'next/server';
import { getIncidentState, recordIncidentEvent, type LedgerEventType } from '@/lib/event-store';
import type { LedgerItem } from '@/types/conversation';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get('incidentId') || '#INC-8921';

  const incident = getIncidentState(incidentId);
  return NextResponse.json(incident, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const incidentId = body.incidentId || '#INC-8921';
    const eventType: LedgerEventType = body.eventType || 'TURN_FINALIZED';
    const item: LedgerItem = body.item;

    if (!item || !item.speaker || !item.text) {
      return NextResponse.json(
        { error: 'Missing required item payload' },
        { status: 400 },
      );
    }

    const { event, incident } = recordIncidentEvent(incidentId, eventType, item);
    return NextResponse.json({ success: true, event, incident }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record incident event', details: String(error) },
      { status: 500 },
    );
  }
}
