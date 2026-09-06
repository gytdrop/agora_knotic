'use client';

import React from 'react';
import { Sparkles, ExternalLink } from 'lucide-react';
import type { FollowUpItem } from '@/lib/incident-detail-data';
import { cn } from '@/lib/utils';

export interface IncidentFollowUpsViewProps {
  followUps?: FollowUpItem[];
  className?: string;
}

export function IncidentFollowUpsView({
  followUps = [],
  className,
}: IncidentFollowUpsViewProps) {
  const getPriorityBadge = (priority: FollowUpItem['priority']) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60';
      case 'Medium':
        return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60';
      case 'Low':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/60';
    }
  };

  const getStatusBadge = (status: FollowUpItem['status']) => {
    switch (status) {
      case 'Done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
      case 'In Progress':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300';
      case 'Open':
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  return (
    <div className={cn('py-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Post-Incident Follow-ups ({followUps.length})
          </h3>
        </div>
      </div>

      {followUps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-400">
          No post-incident follow-ups filed yet. Tasks exported to Jira/Linear will appear here.
        </div>
      ) : (
        <div className="space-y-2.5">
          {followUps.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:border-purple-200 dark:hover:border-purple-800 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.title}
                  </span>
                  {item.jiraKey && (
                    <span className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-600 dark:text-zinc-400">
                      {item.jiraKey}
                      <ExternalLink className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>
                {item.owner && (
                  <span className="text-[11px] text-zinc-400">
                    Owner: {item.owner}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                    getPriorityBadge(item.priority)
                  )}
                >
                  {item.priority}
                </span>

                <span
                  className={cn(
                    'inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border',
                    getStatusBadge(item.status)
                  )}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
