import type { RTMClient } from 'agora-rtm';

export type LedgerTag = 'FACT' | 'HYPOTHESIS' | 'CONTRADICTION' | 'ACTION';

export interface RtmLedgerPayload {
  object?: 'message.ledger_item';
  timestamp?: string;
  speaker?: string;
  text?: string;
  tag?: LedgerTag;
  status?: string;
  reason?: string;
}

export interface LedgerItem {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  tag: LedgerTag;
  status: string;
  reason?: string;
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
}

