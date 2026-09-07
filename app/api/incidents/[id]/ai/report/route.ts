import { NextRequest, NextResponse } from 'next/server';
import { generateAiIncidentReport } from '@/lib/services/ai-incident-service';
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

    const report = await generateAiIncidentReport(cleanId);
    return withCors(
      NextResponse.json({
        success: true,
        message: 'Comprehensive Post-Incident Report generated',
        report,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to generate incident report', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
