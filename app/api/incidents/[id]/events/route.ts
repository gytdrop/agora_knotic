import { NextRequest, NextResponse } from 'next/server';
import { recordTimelineEvent } from '@/lib/services/timeline-service';
import { handleCorsPreflight, withCors } from '@/lib/cors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const body = await request.json();

    if (!body.message) {
      return withCors(
        NextResponse.json({ success: false, error: 'Event message is required' }, { status: 400 }),
        request
      );
    }

    const eventId = await recordTimelineEvent({
      incidentId: cleanId,
      type: body.type || 'note',
      message: body.message,
      actor: body.actor || 'Incident Responder',
      icon: body.icon,
      metadata: body.metadata,
      timestamp: body.timestamp,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'Timeline event recorded successfully',
          eventId,
        },
        { status: 201 }
      ),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to record timeline event', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
