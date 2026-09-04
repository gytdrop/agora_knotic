import type {
  HypothesisLifecycle,
  LedgerItem,
  LedgerTag,
  SpeakerRole,
  TelemetryEvidence,
} from '@/types/conversation';

export type LedgerItemInput = {
  id?: string;
  timestampMs?: number;
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
};

/**
 * Pure reducer function to apply a mutation to the ledger items array.
 * Guarantees:
 * - Deterministic ID assignment
 * - Epoch millisecond timestamp assignment (preserving original timestamp on update)
 * - Upsert logic: if an item with the same ID exists, updates in-place immutably
 * - If not, appends to the end
 */
export function applyLedgerMutation(
  items: LedgerItem[],
  input: LedgerItemInput | LedgerItem,
): { nextItems: LedgerItem[]; committedItem: LedgerItem } {
  const id =
    input.id ??
    (input.turnId !== undefined
      ? `turn-${input.turnId}`
      : `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  const existingIdx = items.findIndex((item) => item.id === id);
  const now = Date.now();

  const timestampMs =
    existingIdx >= 0
      ? items[existingIdx].timestampMs
      : (input.timestampMs ?? now);

  const committedItem: LedgerItem = {
    id,
    timestampMs,
    speaker: input.speaker,
    speakerRole:
      input.speakerRole ??
      (existingIdx >= 0 ? items[existingIdx].speakerRole : undefined),
    speakerUid:
      input.speakerUid ??
      (existingIdx >= 0 ? items[existingIdx].speakerUid : undefined),
    turnId:
      input.turnId ?? (existingIdx >= 0 ? items[existingIdx].turnId : undefined),
    text: input.text,
    tag: input.tag,
    status: input.status,
    reason: input.reason,
    timestamp: input.timestamp,
    telemetryEvidence:
      input.telemetryEvidence ??
      (existingIdx >= 0 ? items[existingIdx].telemetryEvidence : undefined),
    hypothesisLifecycle:
      input.hypothesisLifecycle ??
      (existingIdx >= 0 ? items[existingIdx].hypothesisLifecycle : undefined),
  };

  let nextItems: LedgerItem[];
  if (existingIdx >= 0) {
    nextItems = [...items];
    nextItems[existingIdx] = committedItem;
  } else {
    nextItems = [...items, committedItem];
  }

  return { nextItems, committedItem };
}

/**
 * Helper to format a ledger item's timestampMs into a 24h clock string (HH:mm:ss).
 * Falls back to legacy timestamp string if timestampMs is unavailable.
 */
export function formatLedgerTimestamp(item: LedgerItem): string {
  if (typeof item.timestampMs === 'number' && !Number.isNaN(item.timestampMs)) {
    return new Date(item.timestampMs).toLocaleTimeString('en-US', {
      hour12: false,
    });
  }
  return item.timestamp || '';
}
