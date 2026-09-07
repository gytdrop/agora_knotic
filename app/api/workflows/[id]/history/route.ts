import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/workflow-engine';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const executions = workflowStore.listExecutionsForWorkflow(id, limit);
    return NextResponse.json({ executions, total: executions.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get execution history' }, { status: 500 });
  }
}
