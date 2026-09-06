'use client';

import React from 'react';
import { Bell, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IncidentUpdatesViewProps {
  incidentId: string;
  className?: string;
}

export function IncidentUpdatesView({
  incidentId,
  className,
}: IncidentUpdatesViewProps) {
  return (
    <div className={cn('py-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Executive & Stakeholder Updates
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer"
        >
          <Send className="h-3 w-3" />
          <span>Publish Update</span>
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Bell className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Update #1 (Investigating)
            </span>
          </div>
          <span className="font-mono text-[11px]">1 hour ago</span>
        </div>
        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
          We are currently investigating elevated latency affecting checkout services. Engineering has identified a connection pool bottleneck and is preparing a mitigation release. Next update in 30 minutes.
        </p>
        <div className="text-[11px] text-zinc-400">
          Published to Slack #{incidentId.replace('#', 'incident-')} and Statuspage
        </div>
      </div>
    </div>
  );
}
