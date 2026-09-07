'use client';

import React from 'react';
import {
  Clock,
  ChevronDown,
  Check,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSeverityConfig } from '@/lib/incident-severity';
import { cn } from '@/lib/utils';

export type IncidentLifecycleStage =
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'MITIGATING'
  | 'RESOLVED';

const LIFECYCLE_STAGES: { id: IncidentLifecycleStage; label: string }[] = [
  { id: 'DETECTED', label: 'Detected' },
  { id: 'INVESTIGATING', label: 'Investigating' },
  { id: 'MITIGATING', label: 'Mitigating' },
  { id: 'RESOLVED', label: 'Resolved' },
];

export interface IncidentLifecycleStepperProps {
  status: string;
  severity: string;
  durationString?: string;
  incidentType?: string;
  onUpdateStatus?: (newStatus: IncidentLifecycleStage) => void;
  onUpdateSeverity?: (newSeverity: 'Critical' | 'Major' | 'Minor') => void;
  className?: string;
}

export function IncidentLifecycleStepper({
  status,
  severity,
  durationString = 'Active for 1h',
  incidentType = 'Default',
  onUpdateStatus,
  onUpdateSeverity,
  className,
}: IncidentLifecycleStepperProps) {
  const normalizedRaw = status.toUpperCase().trim();
  const currentStage: IncidentLifecycleStage =
    normalizedRaw === 'FIXING' || normalizedRaw === 'MONITORING'
      ? 'MITIGATING'
      : (normalizedRaw as IncidentLifecycleStage) || 'INVESTIGATING';
  const sevConfig = getSeverityConfig(severity);

  const currentStageIndex = LIFECYCLE_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-4',
        className
      )}
    >
      {/* Left: Horizontal Status Stepper */}
      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isActive = stage.id === currentStage;
          const isPast = currentStageIndex > idx;
          const isResolved = currentStage === 'RESOLVED';

          return (
            <React.Fragment key={stage.id}>
              {idx > 0 && (
                <ChevronRight className="h-3 w-3 text-slate-300 dark:text-slate-700 shrink-0" />
              )}

              {isActive ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        'inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors cursor-pointer',
                        stage.id === 'RESOLVED'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                      )}
                    >
                      {/* Static bullseye dot - strictly no animation */}
                      {stage.id === 'RESOLVED' ? (
                        <span className="flex h-2 w-2 items-center justify-center rounded-full bg-emerald-500 text-white text-[7px]">
                          ✓
                        </span>
                      ) : (
                        <span className="flex h-2 w-2 items-center justify-center rounded-full bg-rose-500">
                          <span className="h-1 w-1 rounded-full bg-white" />
                        </span>
                      )}
                      <span>{stage.label}</span>
                      <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40 text-xs">
                    {LIFECYCLE_STAGES.map((targetStage) => (
                      <DropdownMenuItem
                        key={targetStage.id}
                        onClick={() => onUpdateStatus?.(targetStage.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <span>{targetStage.label}</span>
                        {targetStage.id === currentStage && (
                          <Check className="h-3 w-3 text-slate-900" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  type="button"
                  onClick={() => onUpdateStatus?.(stage.id)}
                  className={cn(
                    'text-xs font-medium transition-colors hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer px-1.5 py-1',
                    isPast
                      ? 'text-slate-600 dark:text-slate-400'
                      : 'text-slate-400 dark:text-slate-500'
                  )}
                >
                  {isPast && isResolved && idx === LIFECYCLE_STAGES.length - 1 ? (
                    <span className="text-emerald-600 font-medium">✓ {stage.label}</span>
                  ) : (
                    stage.label
                  )}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Right: Metadata Strip (Severity Badge, Type, Duration) */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Severity Badge with Interactive Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide cursor-pointer transition-all hover:opacity-90',
                sevConfig.badgeClasses
              )}
            >
              {/* 3-bar signal icon */}
              <span className="flex items-end gap-0.5 h-3">
                <span
                  className={cn(
                    'w-0.5 rounded-xs transition-colors',
                    sevConfig.barCount >= 1 ? sevConfig.dotColor : 'bg-slate-300 dark:bg-slate-700',
                    'h-1.5'
                  )}
                />
                <span
                  className={cn(
                    'w-0.5 rounded-xs transition-colors',
                    sevConfig.barCount >= 2 ? sevConfig.dotColor : 'bg-slate-300 dark:bg-slate-700',
                    'h-2'
                  )}
                />
                <span
                  className={cn(
                    'w-0.5 rounded-xs transition-colors',
                    sevConfig.barCount >= 3 ? sevConfig.dotColor : 'bg-slate-300 dark:bg-slate-700',
                    'h-2.5'
                  )}
                />
              </span>
              <span>{sevConfig.label}</span>
              <ChevronDown className="h-3 w-3 opacity-50 ml-0.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 text-xs">
            {(['Critical', 'Major', 'Minor'] as const).map((sevTier) => (
              <DropdownMenuItem
                key={sevTier}
                onClick={() => onUpdateSeverity?.(sevTier)}
                className="flex items-center justify-between cursor-pointer"
              >
                <span>{sevTier}</span>
                {sevConfig.label === sevTier && (
                  <Check className="h-3 w-3 text-slate-900" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Incident Type pill */}
        <div className="hidden sm:inline-flex items-center rounded-md border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          {incidentType}
        </div>

        {/* Duration counter pill */}
        <div className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{durationString}</span>
        </div>
      </div>
    </div>
  );
}
