import { NextRequest, NextResponse } from 'next/server';
import { workflowStore } from '@/lib/workflow-engine';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || undefined;
    const query = searchParams.get('query') || undefined;
    const enabledParam = searchParams.get('enabled');
    const enabled = enabledParam !== null ? enabledParam === 'true' : undefined;

    const workflows = workflowStore.listWorkflows({ folder, query, enabled });
    return NextResponse.json({ workflows, total: workflows.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to list workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.name) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 });
    }

    const newWorkflow = workflowStore.createWorkflow({
      id: body.id,
      name: body.name,
      description: body.description || '',
      enabled: typeof body.enabled === 'boolean' ? body.enabled : true,
      type: body.type || 'incident',
      folder: body.folder || 'General',
      integration: body.integration || 'internal',
      trigger: body.trigger || {
        type: 'manual',
        description: 'Manual Trigger',
      },
      actions: Array.isArray(body.actions) ? body.actions : [],
    });

    return NextResponse.json({ workflow: newWorkflow }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create workflow' }, { status: 500 });
  }
}
