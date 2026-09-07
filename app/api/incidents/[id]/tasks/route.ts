import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import { handleCorsPreflight, withCors } from '@/lib/cors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();

    const tasks = await convexClient.query(api.incidents.listTasks, { incidentId: cleanId });
    return withCors(NextResponse.json({ success: true, count: tasks.length, tasks }), request);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to retrieve tasks', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id).trim();
    const body = await request.json();

    if (!body.title) {
      return withCors(
        NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 }),
        request
      );
    }

    const taskId = await convexClient.mutation(api.incidents.createTask, {
      incidentId: cleanId,
      title: body.title,
      assignee: body.assignee,
      priority: body.priority || 'Medium',
      dueTime: body.dueTime,
    });

    return withCors(
      NextResponse.json(
        {
          success: true,
          message: 'Task created successfully',
          taskId,
        },
        { status: 201 }
      ),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to create task', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
