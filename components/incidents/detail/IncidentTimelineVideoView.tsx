'use client';

import React, { useMemo, useState } from 'react';
import { Radio } from 'lucide-react';
import type { TimelineEvent } from '@/lib/incident-detail-data';
import { cn } from '@/lib/utils';
import { IncidentTimelineView, type LedgerEventItem } from './IncidentTimelineView';
import {
  IncidentWarRoomVideo,
  WAR_ROOM_DURATION_SECONDS,
  DEFAULT_CHAPTERS,
} from './IncidentWarRoomVideo';
import { IncidentApprovalCard } from './IncidentApprovalCard';
import { StateLedgerPanel } from '@/components/war-room/StateLedgerPanel';
import type { LedgerItem } from '@/types/conversation';

export interface IncidentTimelineVideoViewProps {
  timelineEvents?: TimelineEvent[];
  ledgerEvents?: LedgerEventItem[];
  isExpanded?: boolean;
  /** Shown in the approval gate; omitted when nothing is awaiting a decision. */
  pendingAction?: { title: string; assignee: string } | null;
  onAuthorizeRemediation?: () => void | Promise<void>;
  className?: string;
}

function formatClock(seconds: number): string {
  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * Bridges live ledger events into the war-room ledger card shape. When the
 * incident has no ledger yet we fall back to the panel's own defaults rather
 * than rendering an empty rail.
 */
function toLedgerItems(events: LedgerEventItem[]): LedgerItem[] | undefined {
  if (events.length === 0) return undefined;
  return events.map((evt, idx): LedgerItem => {
    // Ledger events carry a preformatted timestamp string. Parse it when it is
    // a real date so the panel can localise it; otherwise leave timestampMs
    // non-numeric and let formatLedgerTimestamp fall back to the raw string.
    const parsed = Date.parse(evt.timestamp);
    return {
      id: evt._id ?? `${evt.incidentId}-${idx}`,
      timestampMs: Number.isNaN(parsed) ? Number.NaN : parsed,
      timestamp: evt.timestamp,
      speaker: evt.speaker,
      text: evt.text,
      tag: evt.tag,
      status: '',
    };
  });
}

export function IncidentTimelineVideoView({
  timelineEvents = [],
  ledgerEvents = [],
  isExpanded = false,
  pendingAction = { title: 'Restart replica nodes', assignee: 'DBA' },
  onAuthorizeRemediation,
  className,
}: IncidentTimelineVideoViewProps) {
  const [playheadSeconds, setPlayheadSeconds] = useState(0);

  const ledgerItems = useMemo(() => toLedgerItems(ledgerEvents), [ledgerEvents]);

  // The chapter nearest to (but not past) the playhead is what the operator is
  // currently hearing — surfaced so the rail explains what the video is showing.
  const activeChapter = useMemo(() => {
    const passed = DEFAULT_CHAPTERS.filter((c) => c.atSecond <= playheadSeconds);
    return passed.length ? passed[passed.length - 1] : null;
  }, [playheadSeconds]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Live sync strip */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
        <span className="flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
            <Radio className="h-3 w-3" />
            LIVE
          </span>
          <span className="truncate">
            EchoSphere AI listening — video timeline synced with audio &amp; transcript
          </span>
        </span>
        <span className="shrink-0 rounded bg-slate-800 px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-slate-100 dark:bg-slate-700">
          SYNC: {formatClock(playheadSeconds)} / {formatClock(WAR_ROOM_DURATION_SECONDS)}
        </span>
      </div>

      <IncidentWarRoomVideo onTimeChange={setPlayheadSeconds} />

      {/* Timeline + intelligence rail */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1">
          <IncidentTimelineView
            timelineEvents={timelineEvents}
            ledgerEvents={ledgerEvents}
            isExpanded={isExpanded}
          />
        </div>

        <aside className="w-full shrink-0 space-y-4 xl:w-[320px]">
          {pendingAction && (
            <IncidentApprovalCard
              actionTitle={pendingAction.title}
              assignee={pendingAction.assignee}
              onAuthorize={onAuthorizeRemediation}
            />
          )}

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3.5 py-2.5 dark:border-slate-800">
              <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                EchoSphere AI
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                LIVE VIDEO SYNC
              </span>
            </div>

            {activeChapter && (
              <div className="border-b border-slate-100 px-3.5 py-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Now playing:{' '}
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {activeChapter.label}
                </span>{' '}
                <span className="font-mono tabular-nums">
                  @ {formatClock(activeChapter.atSecond)}
                </span>
              </div>
            )}

            <StateLedgerPanel items={ledgerItems} variant="light" />
          </div>
        </aside>
      </div>
    </div>
  );
}

export default IncidentTimelineVideoView;
