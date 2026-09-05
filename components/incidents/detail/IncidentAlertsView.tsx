'use client';

import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IncidentAlertsViewProps {
  incidentId: string;
  className?: string;
}

export function IncidentAlertsView({
  className,
}: IncidentAlertsViewProps) {
  const alerts = [
    {
      id: 'alt-1',
      title: 'p99 API Gateway Latency > 1000ms',
      source: 'Datadog',
      severity: 'Critical',
      time: '00:30 UTC',
      status: 'Triggered',
    },
    {
      id: 'alt-2',
      title: 'HTTP 504 Gateway Timeout Rate > 2%',
      source: 'AWS CloudWatch',
      severity: 'Major',
      time: '00:34 UTC',
      status: 'Triggered',
    },
  ];

  return (
    <div className={cn('py-4 space-y-4', className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Correlated Alerts ({alerts.length})
      </h3>

      <div className="space-y-2.5">
        {alerts.map((alt) => (
          <div
            key={alt.id}
            className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 shrink-0 mt-0.5">
                <AlertCircle className="h-3.5 w-3.5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {alt.title}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                    {alt.source}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  Triggered at {alt.time} • Status: {alt.status}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
                {alt.severity}
              </span>
              <button
                type="button"
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
