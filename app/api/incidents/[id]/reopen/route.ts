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
    let body: { actor?: string; reason?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    const result = await IncidentService.transitionStatus(
      cleanId,
      'Investigating',
      body.actor || 'Incident Commander',
      body.reason || 'Incident re-opened due to recurring alert'
    );

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Incident reopened successfully',
        ...result,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to reopen incident', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
