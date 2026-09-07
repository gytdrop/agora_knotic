'use client';

import React, { useMemo } from 'react';
import {
  Activity,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  TrendingDown,
} from 'lucide-react';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { NumberTicker } from '@/components/ui/number-ticker';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface IncidentInsightsHeatmapProps {
  className?: string;
  totalIncidents?: number;
  mttr?: string;
  openActions?: number;
}

const MONTH_MARKERS: { week: number; label: string }[] = [
  { week: 0, label: 'Mar' },
  { week: 4, label: 'Apr' },
  { week: 8, label: 'May' },
  { week: 13, label: 'Jun' },
  { week: 17, label: 'Jul' },
  { week: 21, label: 'Aug' },
  { week: 26, label: 'Sep' },
  { week: 30, label: 'Oct' },
  { week: 35, label: 'Nov' },
  { week: 39, label: 'Dec' },
  { week: 43, label: 'Jan' },
  { week: 48, label: 'Feb' },
  { week: 51, label: 'Mar' },
];

/**
 * Deterministic occurrence map summing to exactly 34 incidents over 52 weeks
 */
const INCIDENT_OCCURRENCES: Record<string, number> = {
  '2-2': 1, // Week 2, Tue
  '5-4': 2, // Week 5, Thu
  '9-1': 1, // Week 9, Mon
  '12-3': 3, // Week 12, Wed
  '15-5': 1, // Week 15, Fri
  '18-2': 2, // Week 18, Tue
  '22-4': 1, // Week 22, Thu
  '25-1': 5, // Week 25, Mon
  '29-3': 1, // Week 29, Wed
  '33-2': 2, // Week 33, Tue
  '36-5': 1, // Week 36, Fri
  '40-3': 3, // Week 40, Wed
  '43-1': 1, // Week 43, Mon
  '46-4': 2, // Week 46, Thu
  '49-2': 3, // Week 49, Tue
  '51-3': 5, // Week 51, Wed (current 5 active incidents)
};

interface CalendarCell {
  week: number;
  day: number;
  dateStr: string;
  count: number;
}

function getCellIntensity(count: number): string {
  if (count === 0) {
    return 'bg-slate-100 hover:bg-slate-200 border border-slate-200/50';
  }
  if (count <= 2) {
    return 'bg-slate-200 hover:bg-slate-300';
  }
  if (count <= 4) {
    return 'bg-slate-400 hover:bg-slate-700';
  }
  return 'bg-slate-900 hover:bg-slate-800';
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function IncidentInsightsHeatmapView({
  className,
  totalIncidents = 34,
  mttr = '24m',
  openActions = 12,
}: IncidentInsightsHeatmapProps) {

  // Generate 52 weeks x 7 days cells
  const cells = useMemo(() => {
    const list: CalendarCell[] = [];
    const startDate = new Date(2025, 2, 2); // Early March base date

    for (let w = 0; w < 52; w++) {
      for (let d = 0; d < 7; d++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + w * 7 + d);

        const key = `${w}-${d}`;
        const count = INCIDENT_OCCURRENCES[key] || 0;
        const dateStr = `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

        list.push({
          week: w,
          day: d,
          dateStr,
          count,
        });
      }
    }
    return list;
  }, []);

  // Map of week indices to month labels for header alignment
  const monthByWeek = useMemo(() => {
    const map = new Map<number, string>();
    MONTH_MARKERS.forEach((m) => {
      map.set(m.week, m.label);
    });
    return map;
  }, []);

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all select-none',
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 border border-slate-100 shadow-2xs">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-slate-900">
              Incident Insights
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="font-semibold text-slate-800">Activities</span>
              <span className="text-slate-300">·</span>
              <span>52-week incident frequency</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Mar 2025 – Mar 2026</span>
        </div>
      </div>

      {/* 52-Week Activity Calendar & Timeline */}
      <div className="mt-5">
        <div className="overflow-x-auto no-scrollbar pb-1">
          <div className="min-w-[680px]">
            {/* Month Markers Row */}
            <div className="flex items-center mb-2 pl-7">
              <div
                className="w-full grid gap-[3px]"
                style={{ gridTemplateColumns: 'repeat(52, minmax(0, 1fr))' }}
              >
                {Array.from({ length: 52 }).map((_, w) => {
                  const label = monthByWeek.get(w);
                  return (
                    <span
                      key={w}
                      className="text-[10px] font-medium text-slate-400 whitespace-nowrap overflow-visible select-none"
                    >
                      {label || ''}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Day Labels + Heatmap Grid Matrix */}
            <div className="flex items-start gap-1.5">
              {/* Day of Week Labels (Mon, Wed, Fri) */}
              <div className="flex flex-col justify-between h-[105px] sm:h-[116px] w-5 text-[9px] font-medium text-slate-400 shrink-0 select-none py-0.5">
                <span className="h-2.5 sm:h-3.5 flex items-center">Mon</span>
                <span className="h-2.5 sm:h-3.5 flex items-center">Wed</span>
                <span className="h-2.5 sm:h-3.5 flex items-center">Fri</span>
              </div>

              {/* 52-Week Cells Matrix: 7 rows x 52 columns */}
              <TooltipProvider delayDuration={150}>
                <div
                  className="grid grid-flow-col grid-rows-7 gap-[3px] flex-1"
                  style={{ gridAutoColumns: 'minmax(0, 1fr)' }}
                >
                  {cells.map((cell) => {
                    const cellColor = getCellIntensity(cell.count);
                    const tooltipText = `${cell.dateStr}: ${cell.count} incident${cell.count === 1 ? '' : 's'}`;

                    return (
                      <Tooltip key={`${cell.week}-${cell.day}`}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'h-2.5 sm:h-3.5 w-full rounded-[2px] transition-all duration-100 cursor-pointer hover:ring-1 hover:ring-slate-700',
                              cellColor
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs py-1 px-2 font-medium">
                          {tooltipText}
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              </TooltipProvider>
            </div>
          </div>
        </div>

        {/* Legend Row */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px] text-slate-500 font-medium">
            34 incidents tracked across past 12 months
          </span>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span
                className="h-2.5 w-2.5 rounded-[2px] bg-slate-100 border border-slate-200/60"
                title="0 incidents"
              />
              <span
                className="h-2.5 w-2.5 rounded-[2px] bg-slate-200"
                title="1-2 incidents"
              />
              <span
                className="h-2.5 w-2.5 rounded-[2px] bg-slate-400"
                title="3-4 incidents"
              />
              <span
                className="h-2.5 w-2.5 rounded-[2px] bg-slate-900"
                title="5+ incidents"
              />
            </div>
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Summary Stats Row: 3-column responsive grid below the timeline */}
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Total Incidents */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-amber-500" />
              <span>Total Incidents</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800">
              Annual
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              <NumberTicker value={totalIncidents} className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-900" />
            </span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingDown className="h-3 w-3" />
              <span>-8% vs avg</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Past 52 weeks recorded
          </p>
        </div>

        {/* MTTR */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              <span>MTTR</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              Target Met
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {mttr}
            </span>
            <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-0.5">
              <TrendingDown className="h-3 w-3" />
              <span>-15% faster</span>
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Mean time to resolve
          </p>
        </div>

        {/* Open Actions */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-all hover:border-slate-200 hover:bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-slate-700" />
              <span>Open Actions</span>
            </span>
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              Active
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              <NumberTicker value={openActions} className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-900" />
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              items pending
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            3 high priority items
          </p>
        </div>
      </div>
    </div>
  );
}

function ConvexIncidentInsightsHeatmap(props: IncidentInsightsHeatmapProps) {
  const metrics = useQuery(api.incidents.calculateMetrics);
  return (
    <IncidentInsightsHeatmapView
      {...props}
      totalIncidents={props.totalIncidents ?? (metrics?.totalIncidents !== undefined && metrics.totalIncidents > 0 ? metrics.totalIncidents : 34)}
      mttr={props.mttr ?? (metrics?.mttr !== undefined ? `${metrics.mttr}m` : '24m')}
      openActions={props.openActions ?? (metrics?.openActions !== undefined ? metrics.openActions : 12)}
    />
  );
}

function OfflineIncidentInsightsHeatmap(props: IncidentInsightsHeatmapProps) {
  return <IncidentInsightsHeatmapView {...props} />;
}

export function IncidentInsightsHeatmap(props: IncidentInsightsHeatmapProps) {
  const convex = useConvex();
  if (convex) {
    return <ConvexIncidentInsightsHeatmap {...props} />;
  }
  return <OfflineIncidentInsightsHeatmap {...props} />;
}

export default IncidentInsightsHeatmap;

