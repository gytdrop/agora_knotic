import { NextRequest, NextResponse } from 'next/server';
import { IncidentService } from '@/lib/services/incident-service';
import { handleCorsPreflight, withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const search = searchParams.get('search') || undefined;

    const incidents = await IncidentService.listIncidents({ status, severity, search });
    return withCors(
      NextResponse.json({
        success: true,
        count: incidents.length,
        incidents,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to fetch incidents', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return withCors(
        NextResponse.json(
          { success: false, error: 'Title is required' },
          { status: 400 }
        ),
        request
      );
    }

    const created = await IncidentService.createIncident({
      title: body.title,
      severity: body.severity || 'Major',
      description: body.description,
      summary: body.summary,
      status: body.status || 'Investigating',
      lead: body.lead,
      service: body.service,
      environment: body.environment,
      source: body.source,
      customerImpact: body.customerImpact,
      createdBy: body.createdBy,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'Incident created successfully',
          incident: created,
        },
        { status: 201 }
      ),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to create incident', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
