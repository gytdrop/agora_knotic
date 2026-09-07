'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

export interface IncidentsHeaderProps {
  totalCount?: number;
  activeCount?: number;
  count?: number;
  onDeclareIncident?: () => void;
  className?: string;
}

/**
 * Top page header matching incident.io clean layout adapted to Ecosphere branding.
 * Displays page heading, live animated incident count pill, subtitle, and primary action.
 */
export function IncidentsHeader({
  totalCount,
  activeCount,
  count,
  onDeclareIncident,
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Incidents
          </h1>
          <span className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <NumberTicker
              value={displayCount}
              className="text-xs font-semibold tracking-normal text-slate-700 dark:text-slate-300"
            />
          </span>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Monitor, triage, and resolve production incidents across all services.
        </p>
      </div>

      {/* Right: + Declare Incident Action */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDeclareIncident}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-sm font-medium shadow-sm transition-all duration-150 ring-1 ring-slate-700/20 focus:outline-none focus:ring-2 focus:ring-slate-700/40 active:scale-[0.98] cursor-pointer"
        >
          <Plus className="h-4 w-4 shrink-0" />
          <span>Declare Incident</span>
        </button>
      </div>
    </header>
  );
}

export default IncidentsHeader;
