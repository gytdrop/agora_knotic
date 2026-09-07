'use client';

import React from 'react';
import { SearchX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface IncidentsEmptyStateProps {
  title?: string;
  description?: string;
  onResetFilters?: () => void;
  resetButtonLabel?: string;
  className?: string;
}

export function IncidentsEmptyState({
  title = 'No incidents found',
  description = "We couldn't find any incidents matching your current search terms or filter criteria. Try adjusting or clearing your filters.",
  onResetFilters,
  resetButtonLabel = 'Reset filters',
  className,
}: IncidentsEmptyStateProps) {
  return (
    <div
      role="status"
      aria-label="No incidents found"
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-8 sm:p-12 text-center transition-all duration-200',
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ring-8 ring-slate-50 dark:ring-slate-900/50 mb-4">
        <SearchX className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>

      <p className="mt-1.5 max-w-sm text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>

      {onResetFilters && (
        <div className="mt-5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 rounded-lg border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
            <span>{resetButtonLabel}</span>
          </Button>
        </div>
      )}
    </div>
  );
}

export default IncidentsEmptyState;
