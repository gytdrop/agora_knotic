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
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type IncidentDetailTab =
  | 'updates'
  | 'timeline'
  | 'actions'
  | 'follow-ups'
  | 'alerts'
  | 'response-team';

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
    badge?: string;
  }[] = [
    {
      id: 'actions',
      label: 'Actions',
      icon: <ListTodo className="h-3.5 w-3.5" />,
      count: actionCount,
    },
    {
      id: 'timeline',
      label: 'Timeline & Video',
      icon: <Activity className="h-3.5 w-3.5" />,
    },
    {
      id: 'follow-ups',
      label: 'Remediation',
      icon: <Sparkles className="h-3.5 w-3.5 text-slate-700" />,
    },
    {
      id: 'response-team',
      label: 'Response Team',
      icon: <Users className="h-3.5 w-3.5" />,
      badge: 'BETA',
    },
    { id: 'updates', label: 'Notifications', icon: <Bell className="h-3.5 w-3.5" /> },
    { id: 'alerts', label: 'EchoSphere AI', icon: <Clock className="h-3.5 w-3.5" />, badge: 'AI' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 dark:border-slate-800 gap-3 pb-0',
        className
      )}
    >
      {/* 5 Tabs */}
      <div className="-mb-px flex items-center gap-1 sm:gap-4 overflow-x-auto overflow-y-hidden no-scrollbar sm:overflow-visible">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 py-3 px-2 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 cursor-pointer',
                isActive
                  ? 'border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && tab.count > 0 && (
                <span
                  className={cn(
                    'ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="ml-1 rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Date, Expand all, Edit */}
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 pb-2 sm:pb-0 shrink-0">
        <span className="hidden md:inline-block font-medium">
          {dateIndicator} • Times shown in UTC
        </span>

        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{isExpanded ? 'Collapse all' : 'Expand all'}</span>
          </button>
        )}

        {onEditTimeline && (
          <button
            type="button"
            onClick={onEditTimeline}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
          >
            <Pencil className="h-3 w-3" />
            <span>Edit</span>
          </button>
        )}
      </div>
    </div>
  );
}
