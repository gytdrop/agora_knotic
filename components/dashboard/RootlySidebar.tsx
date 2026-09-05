'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConvex, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  Asterisk,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  FileText,
  Flame,
  Home,
  Plus,
  Puzzle,
  Search,
  Settings,
  Shield,
  Sparkles,
  Video,
  Workflow,
  Wrench,
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
    <span className="ml-auto inline-flex items-center justify-center rounded-full border border-red-200/80 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 tabular-nums">
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
    <span className="ml-auto inline-flex items-center justify-center rounded-full border border-red-200/80 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600 tabular-nums">
      {FALLBACK_ACTIVE_INCIDENTS_COUNT}
    </span>
  );
}

export function RootlySidebar({
  activePath,
  className,
  onCreateIncident,
  onOpenSearch,
  onNavigate,
}: RootlySidebarProps) {
  const pathname = usePathname();
  const currentPath = activePath ?? pathname ?? '/';

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
      label: 'Retrospectives',
      href: '/#retrospectives',
      icon: FileText,
    },
    {
      label: 'Action Items',
      href: '/#action-items',
      icon: CheckCircle2,
    },
    {
      label: 'War Room',
      href: '/war-room',
      icon: Video,
      badge: (
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-red-200/80 bg-red-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-red-600">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          Live
        </span>
      ),
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      label: 'Alerts',
      href: '/#alerts',
      icon: Shield,
    },
    {
      label: 'Maintenance',
      href: '/#maintenance',
      icon: Wrench,
    },
    {
      label: 'Metrics',
      href: '/#metrics',
      icon: BarChart3,
    },
  ];

  const platformNavItems: NavItem[] = [
    {
      label: 'Rootly AI',
      href: '/#ai',
      icon: Sparkles,
      badge: (
        <span className="ml-auto inline-flex items-center rounded-full border border-purple-200/80 bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
          New
        </span>
      ),
    },
    {
      label: 'Workflows',
      href: '/#workflows',
      icon: Workflow,
    },
    {
      label: 'Configuration',
      href: '/#configuration',
      icon: Settings,
    },
    {
      label: 'Integrations',
      href: '/#integrations',
      icon: Puzzle,
    },
  ];

  const renderNavLink = (item: NavItem) => {
    const active = isItemActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.label}
        href={item.href}
        onClick={() => onNavigate?.()}
        className={cn(
          'group flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors border-l-4 rounded-r-md',
          active
            ? 'border-purple-600 bg-purple-50 text-purple-700 font-semibold'
            : 'border-transparent text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            active ? 'text-purple-600' : 'text-zinc-400 group-hover:text-zinc-600'
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
        'flex h-screen w-64 flex-col border-r border-zinc-200 bg-white select-none sticky top-0 shrink-0 z-30',
        className
      )}
    >
      {/* Top Header & Logo */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-100">
        <Link
          href="/"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-2.5 group"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-600 text-white shadow-xs transition-colors group-hover:bg-purple-700">
            <Asterisk className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-zinc-900">
            rootly
          </span>
        </Link>
      </div>

      {/* Organization Selector */}
      <div className="px-3 pt-3 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg border border-zinc-200/90 bg-zinc-50/50 px-2.5 py-2 text-left text-xs transition-colors hover:border-zinc-300 hover:bg-zinc-100/80 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-[11px] font-bold text-white shadow-xs">
                A
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-zinc-800">
                  Acme, Inc.
                </span>
                <span className="truncate text-[10px] text-zinc-400">
                  Production
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[11px] font-medium text-zinc-400">
              Organizations
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem className="gap-2 text-xs font-medium cursor-pointer">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                  A
                </div>
                <span className="flex-1 truncate">Acme, Inc.</span>
                <span className="text-[10px] text-emerald-600 font-semibold">
                  Active
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 text-xs text-zinc-600 cursor-pointer">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-400 text-[10px] font-bold text-white">
                  S
                </div>
                <span className="flex-1 truncate">Acme Staging</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-xs text-zinc-600 cursor-pointer">
              <Plus className="h-3.5 w-3.5 text-zinc-500" />
              <span>Add Organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Quick Search Trigger */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-200/80 bg-zinc-50/70 px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:bg-zinc-100/90 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-zinc-400" />
            <span>Search</span>
          </span>
          <kbd className="inline-flex items-center rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 shadow-xs">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {/* Core Nav Group */}
        <nav className="space-y-0.5" aria-label="Core Navigation">
          {coreNavItems.map(renderNavLink)}
        </nav>

        {/* Secondary Nav Group */}
        <div className="pt-2">
          <nav className="space-y-0.5" aria-label="Secondary Navigation">
            {secondaryNavItems.map(renderNavLink)}
          </nav>
        </div>

        {/* Section Divider */}
        <div className="my-2 border-t border-zinc-200/80" />

        {/* Platform / AI Nav Group */}
        <nav className="space-y-0.5" aria-label="Platform Navigation">
          {platformNavItems.map(renderNavLink)}
        </nav>
      </div>

      {/* Footer Area: Create Incident CTA & User Profile */}
      <div className="mt-auto border-t border-zinc-200/80 p-3 space-y-2.5">
        {/* Primary Create Incident Gradient Button */}
        <button
          type="button"
          onClick={onCreateIncident}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3 py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:from-purple-700 hover:to-indigo-700 hover:shadow active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-purple-500/40 cursor-pointer"
        >
          <Sparkles className="h-4 w-4 text-purple-200" />
          <span>Create Incident</span>
        </button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-xs">
                AS
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs font-semibold text-zinc-900">
                  Ashley Sawatsky
                </span>
                <span className="truncate text-[11px] text-zinc-500">
                  ashley@acme.inc
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 mb-1">
            <DropdownMenuLabel className="text-xs font-semibold text-zinc-900">
              Ashley Sawatsky
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs cursor-pointer">
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs cursor-pointer">
              Notification Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs text-rose-600 cursor-pointer">
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

export default RootlySidebar;
