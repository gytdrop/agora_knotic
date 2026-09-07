'use client';

import React from 'react';
import {
  ChevronDown,
  Columns3,
  Filter,
  Info,
  Layers,
  PhoneCall,
  Search,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface EventsToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isLiveMode: boolean;
  onToggleLiveMode: () => void;
  selectedView: string;
  onSelectView: (view: string) => void;
  onOpenFilter?: () => void;
  onOpenColumns?: () => void;
  onStartPaging?: () => void;
}

export function EventsToolbar({
  searchQuery,
  onSearchChange,
  isLiveMode,
  onToggleLiveMode,
  selectedView,
  onSelectView,
  onOpenFilter,
  onOpenColumns,
  onStartPaging,
}: EventsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-white border-b border-slate-200">
      {/* Left Section: Views Dropdown & Search Input */}
      <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-xl">
        {/* Views Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-md border border-slate-200/80 transition-colors shrink-0 cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-slate-500" />
              <span>{selectedView}</span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-[11px] text-slate-400 uppercase tracking-wider">
              Saved Views
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => onSelectView('All Events')}
              className="text-xs cursor-pointer font-medium"
            >
              All Events
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSelectView('Triggered')}
              className="text-xs cursor-pointer font-medium text-rose-600"
            >
              🔴 Triggered Only
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSelectView('Acknowledged')}
              className="text-xs cursor-pointer font-medium text-amber-600"
            >
              🟠 Acknowledged Only
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onSelectView('Resolved')}
              className="text-xs cursor-pointer font-medium text-emerald-600"
            >
              🟢 Resolved Only
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Search Input Box */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-9 pr-8 py-1.5 text-xs text-slate-900 placeholder-slate-400 bg-transparent hover:bg-slate-50/50 focus:bg-transparent border border-slate-200 focus:border-slate-700 focus:ring-1 focus:ring-slate-700 rounded-md transition-colors outline-none"
            style={{ backgroundColor: 'transparent' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Section: Filter, Columns, Live Mode, Start Paging */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Filter Trigger */}
        <button
          type="button"
          onClick={onOpenFilter}
          aria-label="Filter events"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
          title="Filter events"
        >
          <Filter className="h-3.5 w-3.5" />
        </button>

        {/* Columns Settings Trigger */}
        <button
          type="button"
          onClick={onOpenColumns}
          aria-label="Configure columns"
          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
          title="Configure table columns"
        >
          <Columns3 className="h-3.5 w-3.5" />
        </button>

        {/* Live Mode Toggle */}
        <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-200">
          <button
            type="button"
            onClick={onToggleLiveMode}
            className="flex items-center gap-1.5 cursor-pointer select-none group"
            title="Toggle Live Mode polling"
          >
            <span
              className={cn(
                'relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                isLiveMode ? 'bg-slate-900' : 'bg-slate-300'
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  isLiveMode ? 'translate-x-3' : 'translate-x-0'
                )}
              />
            </span>
            <span className="text-xs font-semibold text-slate-700">Live mode</span>
          </button>
          <div
            className="text-slate-400 hover:text-slate-600 cursor-help"
            title="Live mode dynamically polls and synchronizes event streams in real time."
          >
            <Info className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Start Paging Solid Dark Button */}
        <button
          type="button"
          onClick={onStartPaging}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#19154e] hover:bg-[#120f3a] rounded-md shadow-xs transition-colors cursor-pointer"
        >
          <PhoneCall className="h-3.5 w-3.5" />
          <span>Start paging</span>
        </button>
      </div>
    </div>
  );
}
