import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export interface SendNotificationInput {
  incidentId: string;
  channels: Array<'slack' | 'teams' | 'email' | 'statuspage' | 'internal'>;
  recipient?: string;
  subject: string;
  message: string;
}

export interface NotificationDeliveryLog {
  channel: string;
  recipient: string;
  status: 'delivered' | 'pending' | 'failed';
  timestamp: number;
}

export async function dispatchNotifications(input: SendNotificationInput): Promise<NotificationDeliveryLog[]> {
  const logs: NotificationDeliveryLog[] = [];
  const now = Date.now();

  for (const ch of input.channels) {
    const recipient =
      input.recipient ||
      (ch === 'slack'
        ? `#incident-${input.incidentId.replace(/[^a-zA-Z0-9]/g, '')}`
        : ch === 'statuspage'
        ? 'status.acme.com'
        : ch === 'email'
        ? 'incident-responders@acme.inc'
        : 'Teams #IncidentChannel');

    await convexClient.mutation(api.incidents.recordNotification, {
      incidentId: input.incidentId,
      channel: ch,
      recipient,
      subject: input.subject,
      message: input.message,
      status: 'delivered',
    });

    logs.push({
      channel: ch,
      recipient,
      status: 'delivered',
      timestamp: now,
    });
  }

  return logs;
}

export async function getIncidentNotificationLogs(incidentId: string) {
  return await convexClient.query(api.incidents.listNotifications, { incidentId });
}
