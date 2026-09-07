import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/workflow-engine';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const workflow = workflowStore.getWorkflow(id);
    if (!workflow) {
      return NextResponse.json({ error: `Workflow with id "${id}" not found` }, { status: 404 });
    }
    return NextResponse.json({ workflow });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to get workflow' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const existing = workflowStore.getWorkflow(id);
    if (!existing) {
      return NextResponse.json({ error: `Workflow with id "${id}" not found` }, { status: 404 });
    }

    const body = await request.json();
    const updated = workflowStore.updateWorkflow(id, body);
    return NextResponse.json({ workflow: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update workflow' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const success = workflowStore.deleteWorkflow(id);
    if (!success) {
      return NextResponse.json({ error: `Workflow with id "${id}" not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete workflow' }, { status: 500 });
  }
}
