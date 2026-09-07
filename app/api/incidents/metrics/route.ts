import { NextRequest, NextResponse } from 'next/server';
import { getLiveIncidentMetrics } from '@/lib/services/metrics-service';
import { handleCorsPreflight, withCors } from '@/lib/cors';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: NextRequest) {
  try {
    const metrics = await getLiveIncidentMetrics();
    return withCors(NextResponse.json({ success: true, metrics }), request);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to compute live metrics', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
