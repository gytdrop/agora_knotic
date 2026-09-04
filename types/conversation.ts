import type { RTMClient } from 'agora-rtm';

export type LedgerTag = 'FACT' | 'HYPOTHESIS' | 'CONTRADICTION' | 'ACTION' | 'NOISE';

export type HypothesisLifecycle = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CONTRADICTED';

export type SpeakerRole = 'agent' | 'user' | 'peer';

export interface TelemetryEvidence {
  source: string;
  component: string;
  metrics?: Record<string, unknown>;
  confidence?: number;
  details?: string;
}

export interface RtmLedgerPayload {
  object?: 'message.ledger_item';
  timestamp?: string;
  timestampMs?: number;
  speakerUid?: string;
  turnId?: number;
  speaker?: string;
  speakerRole?: SpeakerRole;
  text?: string;
  tag?: LedgerTag;
  status?: string;
  reason?: string;
  telemetryEvidence?: TelemetryEvidence;
  hypothesisLifecycle?: HypothesisLifecycle;
}

export interface LedgerItem {
  id: string;
  timestampMs: number;
  speaker: string;
  speakerRole?: SpeakerRole;
  speakerUid?: string;
  turnId?: number;
  text: string;
  tag: LedgerTag;
  status: string;
  reason?: string;
  timestamp?: string;
  telemetryEvidence?: TelemetryEvidence;
  hypothesisLifecycle?: HypothesisLifecycle;
}

export interface AgoraTokenData {
  token: string;
  uid: string;
  channel: string;
  agentId?: string;
}

export interface ClientStartRequest {
  requester_id: string;
  channel_name: string;
  multiSpeaker?: boolean;
  remoteUids?: string[];
}

export interface StopConversationRequest {
  agent_id: string;
}

export interface AgentResponse {
  agent_id: string;
  create_ts: number;
  state: string;
}

export interface AgoraRenewalTokens {
  rtcToken: string;
  rtmToken: string;
}

export interface ConversationComponentProps {
  agoraData: AgoraTokenData;
  rtmClient: RTMClient;
  onTokenWillExpire: (uid: string) => Promise<AgoraRenewalTokens>;
  onEndConversation: () => void;
  onLedgerItemReceived?: (item: LedgerItem) => void;
  initialVideoEnabled?: boolean;
  initialMicEnabled?: boolean;
}

