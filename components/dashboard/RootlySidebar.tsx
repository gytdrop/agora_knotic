'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Asterisk,
  BarChart3,
  Bell,
  ChevronDown,
  Flame,
  Globe,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
  PhoneCall,
  Plus,
  Puzzle,
  Search,
  Sparkles,
  Video,
  Workflow,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface RootlySidebarProps {
  activePath?: string;
  className?: string;
  onCreateIncident?: () => void;
  onOpenSearch?: () => void;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
}

const FALLBACK_ACTIVE_INCIDENTS_COUNT = 5;

/**
 * Convex-connected badge that queries dynamic active incident count.
 */
function ConvexIncidentsActiveCountBadge() {
  const activeIncidents = useQuery(api.incidents.listActiveIncidents);
  const count =
    activeIncidents !== undefined
      ? activeIncidents.length
      : FALLBACK_ACTIVE_INCIDENTS_COUNT;

  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 tabular-nums">
      {count}
    </span>
  );
}

/**
 * Dynamic active incident count badge beside Incidents navigation link.
 * Automatically adapts between Convex real-time query and resilient offline fallback (5).
 */
function IncidentsActiveCountBadge() {
  const convex = useConvex();

  if (convex) {
    return <ConvexIncidentsActiveCountBadge />;
  }

  return (
    <span className="ml-auto inline-flex items-center justify-center rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 tabular-nums">
      {FALLBACK_ACTIVE_INCIDENTS_COUNT}
    </span>
  );
}

export function RootlySidebar({
  activePath,
  className,
  onCreateIncident: _onCreateIncident,
  onOpenSearch,
  onNavigate,
  collapsed: collapsedProp,
  onToggleCollapse,
}: RootlySidebarProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname ?? '/';
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('echosphere_sidebar_collapsed');
      if (saved === 'true') {
        setInternalCollapsed(true);
      }
    }
  }, []);

  const isCollapsed = collapsedProp !== undefined ? collapsedProp : internalCollapsed;

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse();
    } else {
      setInternalCollapsed((prev) => {
        const next = !prev;
        if (typeof window !== 'undefined') {
          localStorage.setItem('echosphere_sidebar_collapsed', String(next));
        }
        return next;
      });
    }
  };

  // Global keyboard shortcut for search trigger (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const isItemActive = (href: string) => {
    if (href === '/') {
      return currentPath === '/' || currentPath === '';
    }
    return currentPath === href || currentPath.startsWith(href + '/');
  };

  const coreNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home,
    },
    {
      label: 'Incidents',
      href: '/incidents',
      icon: Flame,
      badge: <IncidentsActiveCountBadge />,
    },
    {
      label: 'Events',
      href: '/events',
      icon: Bell,
    },
    {
      label: 'On-Call',
      href: '/on-call',
      icon: PhoneCall,
    },
    {
      label: 'War Room',
      href: '/war-room',
      icon: Video,
      badge: (
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-rose-600">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rose-500" />
          </span>
          Live
        </span>
      ),
    },
    {
      label: 'Status Page',
      href: '/status-page',
      icon: Globe,
    },
    {
      label: 'Metrics',
      href: '/metrics',
      icon: BarChart3,
    },
    {
      label: 'Ecosphere AI',
      href: '/ai',
      icon: Sparkles,
      badge: (
        <span className="ml-auto inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
          New
        </span>
      ),
    },
    {
      label: 'Workflows',
      href: '/workflows',
      icon: Workflow,
    },
    {
      label: 'Integrations',
      href: '/integrations',
      icon: Puzzle,
    },
  ];

  const renderNavLink = (item: NavItem) => {
    const active = isItemActive(item.href);
    const Icon = item.icon;

    if (isCollapsed) {
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => onNavigate?.()}
          title={item.label}
          className={cn(
            'group relative flex items-center justify-center h-10 w-10 mx-auto rounded-lg text-xs font-medium transition-colors my-1',
            active
              ? 'bg-slate-100 text-slate-800'
              : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
          )}
        >
          <Icon
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              active ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'
            )}
          />
          {item.label === 'War Room' && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
          {item.label === 'Incidents' && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
          )}
          {item.label === 'Ecosphere AI' && (
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-slate-700" />
          )}
        </Link>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => onNavigate?.()}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors border-l-4 rounded-r-md',
          active
            ? 'border-slate-900 bg-slate-100 text-slate-800 font-semibold'
            : 'border-transparent text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
          )}
        />
        <span className="truncate">{item.label}</span>
        {item.badge}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-slate-200 bg-white select-none sticky top-0 shrink-0 z-30 transition-all duration-200 ease-in-out',
        isCollapsed ? 'w-[70px]' : 'w-64',
        className
      )}
    >
      {/* Top Header & Logo */}
      <div
        className={cn(
          'flex items-center justify-between py-3.5 border-b border-slate-100 transition-all',
          isCollapsed ? 'px-2.5 justify-center' : 'px-4'
        )}
      >
        {!isCollapsed ? (
          <>
            <Link
              href="/dashboard"
              onClick={() => onNavigate?.()}
              className="flex items-center gap-2.5 group"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs transition-colors group-hover:bg-slate-800">
                <Asterisk className="h-5 w-5 stroke-[2.5]" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                Ecosphere
              </span>
            </Link>
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Link
              href="/dashboard"
              onClick={() => onNavigate?.()}
              className="group"
              title="Ecosphere"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs transition-colors group-hover:bg-slate-800">
                <Asterisk className="h-5 w-5 stroke-[2.5]" />
              </div>
            </Link>
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Organization Selector */}
      <div className={cn('pt-3 pb-2 transition-all', isCollapsed ? 'px-2 flex justify-center' : 'px-3')}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isCollapsed ? (
              <button
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/90 bg-slate-50/80 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer"
                title="Acme, Inc. (Production)"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-500 text-[11px] font-bold text-white shadow-xs">
                  A
                </div>
              </button>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200/90 bg-slate-50/50 px-2.5 py-2 text-left text-xs transition-colors hover:border-slate-300 hover:bg-slate-100/80 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-amber-500 text-[11px] font-bold text-white shadow-xs">
                  A
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold text-slate-800">
                    Acme, Inc.
                  </span>
                  <span className="truncate text-[10px] text-slate-400">
                    Production
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? 'center' : 'start'}
            side={isCollapsed ? 'right' : 'bottom'}
            className="w-56 bg-white border border-slate-200 shadow-lg rounded-xl text-slate-900 z-50 p-1"
          >
            <DropdownMenuLabel className="text-[11px] font-semibold text-slate-500 px-2 py-1">
              Organizations
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2.5 text-xs font-medium text-slate-800 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 cursor-pointer rounded-lg px-2 py-1.5 transition-colors">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white shadow-2xs">
                  A
                </div>
                <span className="flex-1 truncate">Acme, Inc.</span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                  Active
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 cursor-pointer rounded-lg px-2 py-1.5 transition-colors">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-400 text-[10px] font-bold text-white shadow-2xs">
                  S
                </div>
                <span className="flex-1 truncate">Acme Staging</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <DropdownMenuItem className="gap-2 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 cursor-pointer rounded-lg px-2 py-1.5 transition-colors">
              <Plus className="h-3.5 w-3.5 text-slate-500" />
              <span>Add Organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Search Trigger */}
      <div className={cn('pb-2 transition-all', isCollapsed ? 'px-2 flex justify-center' : 'px-3')}>
        {isCollapsed ? (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-transparent text-slate-500 hover:bg-slate-100/90 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer"
            title="Search (⌘K)"
          >
            <Search className="h-4 w-4 text-slate-500" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onOpenSearch}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200/80 bg-transparent px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:border-slate-300 hover:bg-slate-100/90 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span>Search</span>
            </span>
            <kbd className="inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 shadow-xs">
              ⌘K
            </kbd>
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className={cn('flex-1 overflow-y-auto py-1 space-y-1', isCollapsed ? 'px-1' : 'px-2')}>
        <nav className="space-y-0.5" aria-label="Main Navigation">
          {coreNavItems.map(renderNavLink)}
        </nav>
      </div>

      {/* Footer Area: On-Call Widget & User Profile (Create Incident Removed) */}
      <div className={cn('mt-auto border-t border-slate-200/80 space-y-2.5 transition-all', isCollapsed ? 'p-2' : 'p-3')}>
        {/* Rootly On-Call Status Widget */}
        {isCollapsed ? (
          <Link
            href="/on-call"
            onClick={() => onNavigate?.()}
            className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50/60 transition-colors hover:bg-emerald-100/60 cursor-pointer"
            title="You are on-call • Payments Core • Primary"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </Link>
        ) : (
          <Link
            href="/on-call"
            onClick={() => onNavigate?.()}
            className="block rounded-lg border border-emerald-200/80 bg-emerald-50/60 p-2.5 transition-colors hover:bg-emerald-100/60 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-800 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span>You are on-call</span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                Primary
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-emerald-600">
              <span>Payments Core</span>
              <span>Active now</span>
            </div>
          </Link>
        )}

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {isCollapsed ? (
              <button
                type="button"
                className="flex h-9 w-9 mx-auto items-center justify-center rounded-lg transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer"
                title="Ashley Sawatsky (ashley@acme.inc)"
              >
                <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-slate-900 text-[10px] font-bold text-white shadow-xs">
                  AS
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-1 ring-white" />
                </div>
              </button>
            ) : (
              <button
                type="button"
                className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer"
              >
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-slate-900 text-xs font-bold text-white shadow-xs">
                  AS
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-xs font-semibold text-slate-900">
                    Ashley Sawatsky
                  </span>
                  <span className="truncate text-[11px] text-slate-500">
                    ashley@acme.inc
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </button>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align={isCollapsed ? 'center' : 'end'}
            side={isCollapsed ? 'right' : 'top'}
            className="w-56 mb-1.5 bg-white border border-slate-200 shadow-lg rounded-xl text-slate-900 z-50 p-1"
          >
            <DropdownMenuLabel className="px-2.5 py-1.5 text-xs font-semibold text-slate-900">
              Ashley Sawatsky
              <span className="block font-normal text-[11px] text-slate-500">
                ashley@acme.inc
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <DropdownMenuItem className="px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 cursor-pointer rounded-lg transition-colors">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-100 hover:text-slate-900 focus:bg-slate-100 cursor-pointer rounded-lg transition-colors">
              Notification Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1 bg-slate-100" />
            <DropdownMenuItem className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 focus:bg-rose-50 cursor-pointer rounded-lg transition-colors">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default RootlySidebar;
