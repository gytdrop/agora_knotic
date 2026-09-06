import type { LedgerItem } from './conversation';

export type WarRoomToolTab = 'chat' | 'people' | 'updates' | 'actions' | 'ai-brief';

export interface IncidentMetadata {
  incidentId: string;
  title: string;
  severity: string;
  status: 'INVESTIGATING' | 'STAGED' | 'RESOLVED';
  startTimeMs: number;
}

export interface WarRoomChatMessage {
  id: string;
  senderName: string;
  senderRole?: string;
  avatarUrl?: string;
  timestamp: string;
  text: string;
  isAi?: boolean;
  attachment?: {
    type: 'incident_context' | 'image' | 'code';
    title: string;
    details?: string;
    imageUrl?: string;
  };
}

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description?: string;
  severity?: 'info' | 'warning' | 'critical' | 'success';
  source: string;
}

export interface ParticipantInfo {
  id: string;
  name: string;
  role: string;
  status: 'Speaking' | 'Muted' | 'Ambient Mode' | 'Viewpoint';
  avatarUrl?: string;
  isLocal?: boolean;
  isAi?: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
}
