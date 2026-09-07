import { NextRequest, NextResponse } from 'next/server';
import { executeWorkflow, workflowStore } from '@/lib/workflow-engine';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const workflow = workflowStore.getWorkflow(id);
    if (!workflow) {
      return NextResponse.json({ error: `Workflow with id "${id}" not found` }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional for manual run
      body = {};
    }

    const execution = await executeWorkflow(workflow, {
      triggerType: body.triggerType || 'manual',
      triggerPayload: body.triggerPayload || { manual: true, initiatedBy: body.initiatedBy || 'Web UI' },
      incident: body.incident,
      initialVariables: body.initialVariables,
    });

    return NextResponse.json({
      success: execution.status === 'success',
      execution,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Workflow execution failed' }, { status: 500 });
  }
}
