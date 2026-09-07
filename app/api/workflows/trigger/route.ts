import { NextRequest, NextResponse } from 'next/server';
import { dispatchTrigger, TriggerEventType } from '@/lib/workflow-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = (body.event || body.eventType || body.type) as TriggerEventType;
    if (!eventType) {
      return NextResponse.json({ error: 'Event type (e.g. incident_created, incident_resolved) is required' }, { status: 400 });
    }

    const payload = body.payload || body;
    const executions = await dispatchTrigger(eventType, payload);

    return NextResponse.json({
      success: true,
      eventType,
      triggeredWorkflowsCount: executions.length,
      executions,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to dispatch trigger event' }, { status: 500 });
  }
}
