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

    if (!body.role || !body.name) {
      return withCors(
        NextResponse.json({ success: false, error: 'Both role and name are required' }, { status: 400 }),
        request
      );
    }

    const result = await convexClient.mutation(api.incidents.assignParticipantRole, {
      incidentId: cleanId,
      role: body.role,
      name: body.name,
      userId: body.userId,
    });

    return withCors(
      NextResponse.json({
        message: `Assigned ${body.name} as ${body.role}`,
        ...result,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to assign role', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
