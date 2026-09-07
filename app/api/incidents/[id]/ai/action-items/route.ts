import { NextRequest, NextResponse } from 'next/server';
import { extractAiActionItems } from '@/lib/services/ai-incident-service';
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

    const result = await extractAiActionItems(cleanId);
    return withCors(
      NextResponse.json({
        success: true,
        message: 'Action items extracted and assigned',
        ...result,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to extract action items', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
