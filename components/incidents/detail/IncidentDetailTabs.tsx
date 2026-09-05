'use client';

import React from 'react';
import {
  Clock,
  Sparkles,
  ArrowUpDown,
  Pencil,
  Bell,
  Activity,
  ListTodo,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IncidentDetailTab =
  | 'updates'
  | 'timeline'
  | 'actions'
  | 'follow-ups'
  | 'alerts';

export interface IncidentDetailTabsProps {
  activeTab: IncidentDetailTab;
  onTabChange: (tab: IncidentDetailTab) => void;
  actionCount?: number;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEditTimeline?: () => void;
  dateIndicator?: string;
  className?: string;
}

export function IncidentDetailTabs({
  activeTab,
  onTabChange,
  actionCount = 0,
  isExpanded = false,
  onToggleExpand,
  onEditTimeline,
  dateIndicator = 'Today',
  className,
}: IncidentDetailTabsProps) {
  const tabs: {
    id: IncidentDetailTab;
    label: string;
    icon?: React.ReactNode;
    count?: number;
  }[] = [
    { id: 'updates', label: 'Updates', icon: <Bell className="h-3.5 w-3.5" /> },
    { id: 'timeline', label: 'Timeline', icon: <Activity className="h-3.5 w-3.5" /> },
    {
      id: 'actions',
      label: 'Actions',
      icon: <ListTodo className="h-3.5 w-3.5" />,
      count: actionCount,
    },
    {
      id: 'follow-ups',
      label: 'Follow - ups',
      icon: <Sparkles className="h-3.5 w-3.5 text-purple-500" />,
    },
    { id: 'alerts', label: 'Alerts', icon: <Clock className="h-3.5 w-3.5" /> },
  ];

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 dark:border-zinc-800 gap-3 pb-0',
        className
      )}
    >
      {/* 5 Tabs */}
      <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 py-3 px-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px cursor-pointer',
                isActive
                  ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Date, Expand all, Edit */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pb-2 sm:pb-0 shrink-0">
        <span className="hidden md:inline-block font-medium">
          {dateIndicator} • Times shown in UTC
        </span>

        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{isExpanded ? 'Collapse all' : 'Expand all'}</span>
          </button>
        )}

        {onEditTimeline && (
          <button
            type="button"
            onClick={onEditTimeline}
            className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}
