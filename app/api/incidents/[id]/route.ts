import { NextRequest, NextResponse } from 'next/server';
import { IncidentService } from '@/lib/services/incident-service';
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
    const incident = await IncidentService.getIncident(cleanId);

    if (!incident) {
      return withCors(
        NextResponse.json({ success: false, error: `Incident ${cleanId} not found` }, { status: 404 }),
        request
      );
    }

    return withCors(NextResponse.json({ success: true, incident }), request);
  } catch (error) {
    return withCors(
      NextResponse.json({ success: false, error: 'Failed to retrieve incident', details: String(error) }, { status: 500 }),
      request
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const body = await request.json();

    await IncidentService.updateIncident(cleanId, body);
    const updated = await IncidentService.getIncident(cleanId);

    return withCors(
      NextResponse.json({ success: true, message: 'Incident updated successfully', incident: updated }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json({ success: false, error: 'Failed to update incident', details: String(error) }, { status: 500 }),
      request
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    const deleted = await IncidentService.deleteIncident(cleanId);
    if (!deleted) {
      return withCors(
        NextResponse.json({ success: false, error: `Incident ${cleanId} not found` }, { status: 404 }),
        request
      );
    }

    return withCors(
      NextResponse.json({ success: true, message: `Incident ${cleanId} deleted successfully` }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json({ success: false, error: 'Failed to delete incident', details: String(error) }, { status: 500 }),
      request
    );
  }
}
