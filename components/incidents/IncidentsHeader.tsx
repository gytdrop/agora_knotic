'use client';

import React from 'react';
import { Download, Plus } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

export interface IncidentsHeaderProps {
  totalCount?: number;
  activeCount?: number;
  count?: number;
  onDeclareIncident?: () => void;
  onExportCsv?: () => void;
  className?: string;
}

/**
 * Top page header matching incident.io clean layout adapted to Ecosphere branding.
 * Displays page heading, live animated incident count pill, subtitle, and primary actions (Export CSV & Declare Incident).
 */
export function IncidentsHeader({
  totalCount,
  activeCount,
  count,
  onDeclareIncident,
  onExportCsv,
  className,
}: IncidentsHeaderProps) {
  // Determine count to display: prefer totalCount, fallback to count or activeCount
  const displayCount = totalCount ?? count ?? activeCount ?? 0;

  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Left: Heading + Live Count Pill Badge + Subtitle */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Incidents
          </h1>
          <span className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-850 dark:text-zinc-300">
            <NumberTicker
              value={displayCount}
              className="text-xs font-semibold tracking-normal text-zinc-700 dark:text-zinc-300"
            />
          </span>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Monitor, triage, and resolve production incidents across all services.
        </p>
      </div>

      {/* Right Actions: Export CSV + Declare Incident */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onExportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={onDeclareIncident}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 px-3.5 py-2 text-xs font-semibold shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-zinc-900/40 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Declare incident</span>
        </button>
      </div>
    </header>
  );
}

export default IncidentsHeader;
