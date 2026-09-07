import { NextRequest, NextResponse } from 'next/server';
import { dispatchNotifications, getIncidentNotificationLogs } from '@/lib/services/notification-service';
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

    const logs = await getIncidentNotificationLogs(cleanId);
    return withCors(NextResponse.json({ success: true, count: logs.length, logs }), request);
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to retrieve notification logs', details: String(error) },
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

    if (!body.message) {
      return withCors(
        NextResponse.json({ success: false, error: 'Broadcast message is required' }, { status: 400 }),
        request
      );
    }

    const channels = body.channels || ['slack', 'statuspage', 'email'];
    const logs = await dispatchNotifications({
      incidentId: cleanId,
      channels,
      recipient: body.recipient,
      subject: body.subject || `Incident Broadcast: ${cleanId}`,
      message: body.message,
    });

    return withCors(
      NextResponse.json({
        success: true,
        message: `Notification broadcast dispatched to ${channels.join(', ')}`,
        deliveryLogs: logs,
      }),
      request
    );
  } catch (error) {
    return withCors(
      NextResponse.json(
        { success: false, error: 'Failed to dispatch broadcast', details: String(error) },
        { status: 500 }
      ),
      request
    );
  }
}
