import { NextRequest, NextResponse } from 'next/server';
import { IncidentService } from '@/lib/services/incident-service';
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
    let body: { actor?: string; acknowledgedBy?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const actor = body.actor || body.acknowledgedBy;
    const result = await IncidentService.acknowledgeIncident(cleanId, actor);
    return withCors(
      NextResponse.json({
        message: 'Incident acknowledged and triage started',
        ...result,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to acknowledge incident', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
