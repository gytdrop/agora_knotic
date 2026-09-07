import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export interface WarRoomSession {
  incidentId: string;
  meetingId: string;
  channelName: string;
  startedAt: number;
  recordingEnabled: boolean;
  transcriptStatus: string;
  activeParticipantsCount?: number;
}

export async function createOrGetWarRoom(incidentId: string): Promise<WarRoomSession> {
  const existing = await convexClient.query(api.incidents.getWarRoom, { incidentId });
  if (existing) {
    return existing;
  }

  const cleanId = incidentId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
  const meetingId = `wr-${cleanId}-${Date.now().toString(36)}`;
  const channelName = `incident-${cleanId.toLowerCase()}`;

  const session = await convexClient.mutation(api.incidents.ensureWarRoom, {
    incidentId,
    meetingId,
    channelName,
    recordingEnabled: true,
    transcriptStatus: 'active',
  });

  return session;
}
