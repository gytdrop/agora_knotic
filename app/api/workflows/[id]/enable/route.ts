import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/workflow-engine';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const updated = workflowStore.toggleWorkflowEnabled(id, true);
    if (!updated) {
      return NextResponse.json({ error: `Workflow with id "${id}" not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, workflow: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to enable workflow' }, { status: 500 });
  }
}
