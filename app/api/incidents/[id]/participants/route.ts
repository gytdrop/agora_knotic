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

    const participants = await convexClient.query(api.incidents.listParticipants, { incidentId: cleanId });
    return withCors(NextResponse.json({ success: true, count: participants.length, participants }), request);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to retrieve participants', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
