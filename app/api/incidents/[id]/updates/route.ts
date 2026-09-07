import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
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

    const updates = await convexClient.query(api.incidents.listUpdates, { incidentId: cleanId });
    return withCors(NextResponse.json({ success: true, count: updates.length, updates }), request);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to retrieve updates', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const body = await request.json();

    if (!body.message) {
      return withCors(
        NextResponse.json({ success: false, error: 'Update message is required' }, { status: 400 }),
        request
      );
    }

    const updateId = await convexClient.mutation(api.incidents.createUpdate, {
      incidentId: cleanId,
      message: body.message,
      author: body.author || 'Communications Lead',
      channels: body.channels || ['Slack #incident-general', 'Statuspage (status.acme.com)'],
      visibility: body.visibility || 'public',
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'Stakeholder update published successfully',
          updateId,
        },
        { status: 201 }
      ),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to publish update', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
