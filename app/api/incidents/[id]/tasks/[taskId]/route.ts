import { NextRequest, NextResponse } from 'next/server';
import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { handleCorsPreflight, withCors } from '@/lib/cors';

interface RouteParams {
  params: Promise<{ id: string; taskId: string }>;
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;
    const body = await request.json();

    await convexClient.mutation(api.incidents.updateTask, {
      taskId: taskId as Id<'incident_tasks'>,
      title: body.title,
      completed: body.completed,
      status: body.status,
      assignee: body.assignee,
      priority: body.priority,
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Task updated successfully',
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to update task', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { taskId } = await params;

    await convexClient.mutation(api.incidents.deleteTask, {
      taskId: taskId as Id<'incident_tasks'>,
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: 'Task deleted successfully',
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to delete task', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
