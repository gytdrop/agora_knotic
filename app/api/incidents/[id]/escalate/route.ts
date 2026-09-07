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
    const body = await request.json();

    if (!body.severity) {
      return withCors(
        NextResponse.json({ success: false, error: 'Severity is required' }, { status: 400 }),
        request
      );
    }

    const result = await IncidentService.escalateIncident(cleanId, {
      severity: body.severity,
      team: body.team,
      engineer: body.engineer,
      reason: body.reason,
      actor: body.actor,
    });

    return withCors(
      NextResponse.json({
        message: `Incident escalated to ${body.severity}`,
        ...result,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to escalate incident', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
