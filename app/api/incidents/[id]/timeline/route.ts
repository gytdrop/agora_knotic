import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedIncidentTimeline } from '@/lib/services/timeline-service';
import { handleCorsPreflight, withCors } from '@/lib/cors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    const timeline = await getUnifiedIncidentTimeline(cleanId);
    return withCors(
      NextResponse.json({
        success: true,
        timeline: timeline.timelineEvents,
        ...timeline,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to retrieve timeline', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
