import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/workflow-engine';

interface RouteContext {
  params: Promise<{ executionId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { executionId } = await context.params;
    const execution = workflowStore.getExecution(executionId);
    if (!execution) {
      return NextResponse.json({ error: `Execution with id "${executionId}" not found` }, { status: 404 });
    }
    return NextResponse.json({ execution });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get execution' }, { status: 500 });
  }
}
