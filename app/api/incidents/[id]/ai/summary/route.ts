import { NextRequest, NextResponse } from 'next/server';
import { generateIncidentAiSummary } from '@/lib/services/ai-incident-service';
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

    const summary = await generateIncidentAiSummary(cleanId);
    return withCors(
      NextResponse.json({
        success: true,
        message: 'AI Incident Summary synthesized successfully',
        summary,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to generate AI summary', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
