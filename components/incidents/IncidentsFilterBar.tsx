'use client';

import React, { useEffect, useRef } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type IncidentsViewTab = 'active' | 'all' | 'resolved';
export type IncidentSortOption = 'newest' | 'oldest' | 'severity';

export interface IncidentsFilterBarProps {
  activeTab: IncidentsViewTab;
  onTabChange: (tab: IncidentsViewTab) => void;
  counts?: {
    active: number;
    all: number;
    resolved: number;
  };
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedSeverity: string;
  onSeverityChange: (severity: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  sortBy: IncidentSortOption;
  onSortChange: (sort: IncidentSortOption) => void;
  onResetFilters?: () => void;
  className?: string;
}

interface SeverityOption {
  value: string;
  label: string;
  dotColor?: string;
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  { value: 'ALL', label: 'All Severities' },
  { value: 'Critical', label: 'Critical', dotColor: 'bg-red-500' },
  { value: 'Major', label: 'Major', dotColor: 'bg-amber-500' },
  { value: 'Minor', label: 'Minor', dotColor: 'bg-blue-500' },
];

interface StatusOption {
  value: string;
  label: string;
  dotColor?: string;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'INVESTIGATING', label: 'Investigating', dotColor: 'bg-amber-500' },
  { value: 'FIXING', label: 'Fixing', dotColor: 'bg-blue-500' },
  { value: 'MONITORING', label: 'Monitoring', dotColor: 'bg-emerald-500' },
  { value: 'RESOLVED', label: 'Resolved', dotColor: 'bg-zinc-400 dark:bg-zinc-500' },
];

interface SortOption {
  value: IncidentSortOption;
  label: string;
}

const SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'severity', label: 'Highest Severity' },
];

const VIEW_TABS: { id: IncidentsViewTab; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'all', label: 'All' },
  { id: 'resolved', label: 'Resolved' },
];

export function IncidentsFilterBar({
  activeTab,
  onTabChange,
  counts,
  searchQuery,
  onSearchChange,
  selectedSeverity,
  onSeverityChange,
  selectedStatus,
  onStatusChange,
  sortBy,
  onSortChange,
  onResetFilters,
  className,
}: IncidentsFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut to focus the search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const target = e.target as HTMLElement | null;
        const isEditingOtherField =
          target &&
          target !== searchInputRef.current &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable);

        if (!isEditingOtherField) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter state checks
  const isSeverityFiltered = Boolean(
    selectedSeverity && selectedSeverity.toUpperCase() !== 'ALL'
  );
  const isStatusFiltered = Boolean(
    selectedStatus && selectedStatus.toUpperCase() !== 'ALL'
  );
  const isSearchFiltered = Boolean(searchQuery.trim());
  const hasActiveFilters =
    isSearchFiltered || isSeverityFiltered || isStatusFiltered;

  // Active option helpers
  const activeSeverityOpt = SEVERITY_OPTIONS.find(
    (opt) => opt.value.toUpperCase() === selectedSeverity.toUpperCase()
  );
  const activeStatusOpt = STATUS_OPTIONS.find(
    (opt) => opt.value.toUpperCase() === selectedStatus.toUpperCase()
  );
  const activeSortOpt =
    SORT_OPTIONS.find((opt) => opt.value === sortBy) || SORT_OPTIONS[0];

  const handleReset = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      onSearchChange('');
      onSeverityChange('ALL');
      onStatusChange('ALL');
      onSortChange('newest');
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      {/* Segmented View Tabs (Active, All, Resolved) */}
      <div className="flex items-center shrink-0">
        <div
          role="tablist"
          aria-label="Incident views"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 shadow-2xs"
        >
          {VIEW_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = counts?.[tab.id];

            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer select-none',
                  isActive
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-2xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'
                )}
              >
                <span>{tab.label}</span>
                {count !== undefined && (
                  <span
                    className={cn(
                      'inline-flex h-4 min-w-[16px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tracking-tight leading-none',
                      isActive
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200'
                        : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Real-time search input */}
        <div className="relative flex items-center min-w-[180px] sm:min-w-[220px] md:min-w-[240px] flex-1 sm:flex-none">
          <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter incidents... (⌘K)"
            aria-label="Filter incidents"
            className="h-9 w-full rounded-lg border border-zinc-200 bg-transparent pl-9 pr-8 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-2xs transition-all hover:border-zinc-300 focus:border-purple-600 focus:bg-transparent focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            style={{ backgroundColor: 'transparent' }}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                onSearchChange('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="absolute right-2.5 flex h-4 w-4 items-center justify-center rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-none cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 hidden sm:inline-flex items-center rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 dark:text-zinc-500 shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Severity Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Filter by severity"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500/20',
                isSeverityFiltered
                  ? 'border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              {isSeverityFiltered && activeSeverityOpt ? (
                <span className="inline-flex items-center gap-1.5">
                  {activeSeverityOpt.dotColor && (
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        activeSeverityOpt.dotColor
                      )}
                    />
                  )}
                  <span>{activeSeverityOpt.label}</span>
                </span>
              ) : (
                <span>Severity</span>
              )}
              <ChevronDown className="h-3 w-3 text-zinc-400 dark:text-zinc-500 ml-0.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {SEVERITY_OPTIONS.map((opt) => {
              const isSelected =
                (opt.value === 'ALL' &&
                  (!selectedSeverity ||
                    selectedSeverity.toUpperCase() === 'ALL')) ||
                selectedSeverity.toUpperCase() === opt.value.toUpperCase();

              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onSeverityChange(opt.value)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <div className="flex items-center gap-2">
                    {opt.dotColor ? (
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          opt.dotColor
                        )}
                      />
                    ) : (
                      <span className="h-2 w-2 shrink-0" />
                    )}
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Filter by status"
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-purple-500/20',
                isStatusFiltered
                  ? 'border-purple-300 dark:border-purple-800 bg-purple-50/60 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-semibold'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              )}
            >
              {isStatusFiltered && activeStatusOpt ? (
                <span className="inline-flex items-center gap-1.5">
                  {activeStatusOpt.dotColor && (
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full shrink-0',
                        activeStatusOpt.dotColor
                      )}
                    />
                  )}
                  <span>{activeStatusOpt.label}</span>
                </span>
              ) : (
                <span>Status</span>
              )}
              <ChevronDown className="h-3 w-3 text-zinc-400 dark:text-zinc-500 ml-0.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected =
                (opt.value === 'ALL' &&
                  (!selectedStatus ||
                    selectedStatus.toUpperCase() === 'ALL')) ||
                selectedStatus.toUpperCase() === opt.value.toUpperCase();

              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onStatusChange(opt.value)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <div className="flex items-center gap-2">
                    {opt.dotColor ? (
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          opt.dotColor
                        )}
                      />
                    ) : (
                      <span className="h-2 w-2 shrink-0" />
                    )}
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort Order Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Sort incidents"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-2xs hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <ArrowUpDown className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>{activeSortOpt.label}</span>
              <ChevronDown className="h-3 w-3 text-zinc-400 dark:text-zinc-500 ml-0.5 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortBy === opt.value;

              return (
                <DropdownMenuItem
                  key={opt.value}
                  onClick={() => onSortChange(opt.value)}
                  className="flex items-center justify-between text-xs cursor-pointer py-1.5"
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset / Clear Filters CTA */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset all filters"
            className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2.5 py-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default IncidentsFilterBar;
