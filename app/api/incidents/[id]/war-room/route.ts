import { NextRequest, NextResponse } from 'next/server';
import { createOrGetWarRoom } from '@/lib/services/war-room-service';
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

    const warRoom = await convexClient.query(api.incidents.getWarRoom, { incidentId: cleanId });
    if (!warRoom) {
      return withCors(
        NextResponse.json({ success: false, error: 'War Room session not found' }, { status: 404 }),
        request
      );
    }

    return withCors(NextResponse.json({ success: true, warRoom }), request);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to retrieve war room session', details: String(error) },
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

    const session = await createOrGetWarRoom(cleanId);
    return withCors(
      NextResponse.json({
        success: true,
        message: 'War Room session initialized',
        warRoom: session,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to initialize war room', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
