'use client';

import React from 'react';
import {
  Flame,
  UserCheck,
  Pin,
  GitPullRequest,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import type { TimelineEvent } from '@/lib/incident-detail-data';
import { cn } from '@/lib/utils';

export interface LedgerEventItem {
  _id?: string;
  incidentId: string;
  timestamp: string;
  speaker: string;
  tag: 'FACT' | 'HYPOTHESIS' | 'CONTRADICTION' | 'ACTION';
  text: string;
}

export interface IncidentTimelineViewProps {
  timelineEvents?: TimelineEvent[];
  ledgerEvents?: LedgerEventItem[];
  isExpanded?: boolean;
  className?: string;
}

export function IncidentTimelineView({
  timelineEvents = [],
  ledgerEvents = [],
  className,
}: IncidentTimelineViewProps) {
  const getEventIcon = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'declared':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 ring-4 ring-white dark:ring-zinc-950">
            <Flame className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        );
      case 'lead_assigned':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400 ring-4 ring-white dark:ring-zinc-950">
            <UserCheck className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        );
      case 'slack_pin':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400 ring-4 ring-white dark:ring-zinc-950">
            <Pin className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        );
      case 'severity_changed':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 ring-4 ring-white dark:ring-zinc-950">
            <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        );
      case 'pr_deployed':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 ring-4 ring-white dark:ring-zinc-950">
            <GitPullRequest className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        );
      case 'resolved':
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 ring-4 ring-white dark:ring-zinc-950">
            <CheckCircle className="h-3.5 w-3.5 stroke-[2.5]" />
          </div>
        );
      default:
        return (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ring-4 ring-white dark:ring-zinc-950">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
        );
    }
  };

  const getLedgerBadgeClass = (tag: LedgerEventItem['tag']) => {
    switch (tag) {
      case 'FACT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'HYPOTHESIS':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'CONTRADICTION':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      case 'ACTION':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
    }
  };

  return (
    <div className={cn('py-4 space-y-6', className)}>
      {/* Speech Ledger Feed Callout if War Room events exist */}
      {ledgerEvents.length > 0 && (
        <div className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-900 dark:text-purple-200">
              Live War Room Intelligence Ledger ({ledgerEvents.length})
            </h4>
          </div>

          <div className="space-y-2">
            {ledgerEvents.map((evt, idx) => (
              <div
                key={evt._id || idx}
                className="flex items-start gap-2.5 rounded-lg border border-white/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-900/80 p-2.5 text-xs shadow-2xs"
              >
                <span
                  className={cn(
                    'inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0',
                    getLedgerBadgeClass(evt.tag)
                  )}
                >
                  {evt.tag}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-zinc-500 mb-0.5">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {evt.speaker}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{evt.timestamp}</span>
                  </div>
                  <p className="text-zinc-800 dark:text-zinc-200 leading-snug">
                    {evt.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Vertical Timeline Feed */}
      <div className="relative pl-6 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-6 ml-3">
        {timelineEvents.map((event, idx) => (
          <div key={event.id || idx} className="relative group">
            {/* Milestone icon positioned over vertical line */}
            <div className="absolute -left-[37px] top-0.5">
              {getEventIcon(event.type)}
            </div>

            {/* Event Body */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {event.title}
                </span>
                {event.badgeLabel && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                    {event.badgeLabel}
                  </span>
                )}
                <span className="text-[11px] text-zinc-400 font-mono">
                  {event.timeFormatted}
                </span>
              </div>

              {event.description && (
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                  {event.description}
                </p>
              )}

              {event.author && (
                <span className="text-[10px] text-zinc-400 font-medium block">
                  by {event.author}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
