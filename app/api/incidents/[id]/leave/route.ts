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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const body = await request.json();

    if (!body.userId) {
      return withCors(
        NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 }),
        request
      );
    }

    await convexClient.mutation(api.incidents.removeParticipant, {
      incidentId: cleanId,
      userId: body.userId,
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: `Participant ${body.userId} left incident`,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to leave incident', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
