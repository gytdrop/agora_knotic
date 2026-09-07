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

    if (!body.name) {
      return withCors(
        NextResponse.json({ success: false, error: 'Participant name is required' }, { status: 400 }),
        request
      );
    }

    const userId = body.userId || `usr-${body.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const role = body.role || 'Observer';

    const participantId = await convexClient.mutation(api.incidents.addParticipant, {
      incidentId: cleanId,
      userId,
      name: body.name,
      email: body.email,
      role,
      avatar: body.avatar,
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: `${body.name} joined incident as ${role}`,
        participantId,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to join incident', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
