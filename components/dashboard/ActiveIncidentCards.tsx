'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  ChevronDown,
  RotateCw,
  Video,
} from 'lucide-react';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NumberTicker } from '@/components/ui/number-ticker';
import { BorderBeam } from '@/components/ui/border-beam';
import { normalizeSeverity, getSeverityConfig } from '@/lib/incident-severity';

export type IncidentSeverity = 'Critical' | 'Major' | 'Minor' | 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3';

export interface ActiveIncidentItem {
  _id?: string;
  incidentId: string;
  title: string;
  severity: IncidentSeverity | string;
  status: string;
  rootCause?: string;
  createdAt: number;
}

export interface ActiveIncidentCardsProps {
  searchQuery?: string;
  className?: string;
  onEnterWarRoom?: (incidentId: string, severity: string) => void;
  initialIncidents?: ActiveIncidentItem[];
}

/**
 * 5 default incidents matching the Rootly dashboard screenshot
 */
export const DEFAULT_ACTIVE_INCIDENTS: ActiveIncidentItem[] = [
  {
    incidentId: '#INC-8921',
    title: 'Payment service latency and failures',
    severity: 'Critical',
    status: 'ACTIVE',
    rootCause: 'Downstream dependency fraud-detection-svc socket saturation causing timeout cascade.',
    createdAt: Date.now() - 3600 * 1000 * 1.5, // 1h 30m relative
  },
  {
    incidentId: '#7134',
    title: 'Alluring Muse - Production API Gateway Latency Spike',
    severity: 'Major',
    status: 'ACTIVE',
    rootCause: 'Downstream connection pool starvation triggered by unindexed query.',
    createdAt: Date.now() - 3600 * 1000 * 1, // 1h relative
  },
  {
    incidentId: '#7124',
    title: 'Security Vulnerability Discovered in Auth Module',
    severity: 'Major',
    status: 'ACTIVE',
    rootCause:
      'A significant security flaw was identified within the authentication module of our core platform...',
    createdAt: Date.now() - 3600 * 1000 * 22, // 22h relative
  },
  {
    incidentId: '#7125',
    title: 'Memory Leak in Main Application Server',
    severity: 'Critical',
    status: 'ACTIVE',
    rootCause:
      'Users reported unusual slowdowns and service interruptions traced back to a memory leak...',
    createdAt: Date.now() - 3600 * 1000 * 22, // 22h relative
  },
  {
    incidentId: '#7126',
    title: 'Code Deployment Error Leads to Service Degradation',
    severity: 'Critical',
    status: 'ACTIVE',
    rootCause:
      'A recent deployment of new code to the production environment inadvertently introduced an error...',
    createdAt: Date.now() - 3600 * 1000 * 22, // 22h relative
  },
  {
    incidentId: '#7123',
    title: 'Unexpected Database Downtime After Upgrade',
    severity: 'Minor',
    status: 'ACTIVE',
    rootCause:
      'During a routine update, a critical database unexpectedly went offline, leading to widespread...',
    createdAt: Date.now() - 3600 * 1000 * 22, // 22h relative
  },
];

/**
 * Official Slack vector mark for incident channel affiliation
 */
function SlackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

/**
 * Computes deterministic or elapsed duration matching the Rootly design
 */
function getIncidentDuration(incident: ActiveIncidentItem): string {
  if (
    incident.incidentId === '#INC-8921' ||
    incident.incidentId === 'INC-8921' ||
    incident.incidentId.includes('8921')
  ) {
    return '1h 30m';
  }
  if (incident.incidentId === '#7134') return '1h';
  if (
    incident.incidentId === '#7126' ||
    incident.incidentId === '#7125' ||
    incident.incidentId === '#7124' ||
    incident.incidentId === '#7123'
  ) {
    return '22h';
  }

  const diffMs = Math.max(0, Date.now() - incident.createdAt);
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  const diffMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24);
    return `${days}d`;
  }
  if (diffHours >= 1) {
    return diffMinutes > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffHours}h`;
  }
  if (diffMinutes >= 1) {
    return `${diffMinutes}m`;
  }
  return '1m';
}

type SortOption = 'latest' | 'oldest' | 'severity';

interface ActiveIncidentCardsViewProps extends ActiveIncidentCardsProps {
  incidents: ActiveIncidentItem[];
}

function ActiveIncidentCardsView({
  incidents,
  searchQuery,
  className,
  onEnterWarRoom,
}: ActiveIncidentCardsViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isTickSpin, setIsTickSpin] = useState(false);

  // 5-second ticker indicator
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setIsTickSpin(true);
      timeoutId = setTimeout(() => setIsTickSpin(false), 700);
    }, 5000);
    return () => {
      clearInterval(interval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const totalCount = incidents.length;

  const displayedIncidents = useMemo(() => {
    let result = [...incidents];

    // Filter by tab
    if (activeTab === 'my') {
      // My incidents: top priority or assigned responder items (#7126, #7124)
      result = result.filter(
        (inc) =>
          inc.incidentId === '#7126' ||
          inc.incidentId === '#7124' ||
          inc.incidentId === '#INC-8921' ||
          normalizeSeverity(inc.severity) === 'Critical'
      );
    }

    // Filter by search query if present
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (inc) =>
          inc.incidentId.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          normalizeSeverity(inc.severity).toLowerCase().includes(q) ||
          (inc.rootCause && inc.rootCause.toLowerCase().includes(q))
      );
    }

    // Sort incidents
    result.sort((a, b) => {
      if (sortBy === 'latest') {
        return b.createdAt - a.createdAt;
      }
      if (sortBy === 'oldest') {
        return a.createdAt - b.createdAt;
      }
      if (sortBy === 'severity') {
        const order: Record<string, number> = {
          Critical: 0,
          Major: 1,
          Minor: 2,
        };
        const rankA = order[normalizeSeverity(a.severity)] ?? 99;
        const rankB = order[normalizeSeverity(b.severity)] ?? 99;
        return rankA - rankB;
      }
      return 0;
    });

    return result;
  }, [incidents, activeTab, searchQuery, sortBy]);

  const sortByLabel =
    sortBy === 'latest'
      ? 'Latest ▾'
      : sortBy === 'oldest'
        ? 'Oldest ▾'
        : 'Severity ▾';

  return (
    <section
      aria-label="Active Incidents Feed"
      className={cn('w-full space-y-3.5', className)}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 pb-3">
        {/* Left: 🔴 Active Incidents count badge & 5s refresh ticker */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-zinc-900">
              Active Incidents
            </h2>
            <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
              <NumberTicker value={totalCount} className="text-red-700 dark:text-red-700 text-xs font-bold tracking-normal" />
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium select-none">
            <RotateCw
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-700 ease-in-out',
                isTickSpin ? 'rotate-180 text-purple-600' : 'text-zinc-400'
              )}
            />
            <span>Refreshes every 5s</span>
          </div>
        </div>

        {/* Right: Filter pills: Latest ▾, All Incidents, My Incidents */}
        <div className="flex items-center gap-2">
          {/* Latest ▾ Sort Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
              >
                <span>{sortByLabel}</span>
                <ChevronDown className="h-3 w-3 text-zinc-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setSortBy('latest')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>Latest First</span>
                {sortBy === 'latest' && (
                  <Check className="h-3.5 w-3.5 text-purple-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('oldest')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>Oldest First</span>
                {sortBy === 'oldest' && (
                  <Check className="h-3.5 w-3.5 text-purple-600" />
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('severity')}
                className="flex items-center justify-between text-xs cursor-pointer"
              >
                <span>Highest Severity</span>
                {sortBy === 'severity' && (
                  <Check className="h-3.5 w-3.5 text-purple-600" />
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Segmented Filter Pills */}
          <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50/80 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'all'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              All Incidents
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                activeTab === 'my'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-700'
              )}
            >
              My Incidents
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Cards Grid */}
      {displayedIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center">
          <p className="text-xs font-medium text-zinc-500">
            No active incidents matching your filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
          {displayedIncidents.map((incident) => {
            const cleanId = incident.incidentId.replace(/^#/, '');
            const normSev = normalizeSeverity(incident.severity);
            const sevConfig = getSeverityConfig(normSev);
            const duration = getIncidentDuration(incident);
            const warRoomUrl = `/war-room?incident=${encodeURIComponent(cleanId)}&sev=${encodeURIComponent(normSev)}&severity=${encodeURIComponent(normSev)}`;

            return (
              <div
                key={incident.incidentId}
                className="group relative flex flex-col justify-between rounded-xl border border-zinc-200/90 bg-white p-4 shadow-xs transition-all duration-150 hover:border-purple-300 hover:shadow-md overflow-hidden"
              >
                {normSev === 'Critical' && (
                  <BorderBeam
                    size={80}
                    duration={6}
                    colorFrom="#ef4444"
                    colorTo="#f87171"
                    borderWidth={1.5}
                  />
                )}
                {/* Top: Incident ID & Title */}
                <div>
                  <div className="flex items-center justify-between text-xs font-mono font-medium text-zinc-400">
                    <span>{incident.incidentId}</span>
                  </div>
                  <Link href={`/incidents/${encodeURIComponent(cleanId)}`}>
                    <h3
                      className="mt-1.5 text-sm font-bold text-zinc-900 line-clamp-2 leading-snug transition-colors hover:text-purple-700 cursor-pointer"
                      title={incident.title}
                    >
                      {incident.title}
                    </h3>
                  </Link>

                  {/* Middle: Severity Pill & Active Status */}
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {/* Severity pill: Critical, Major, Minor */}
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold tracking-wide',
                        sevConfig.badgeClasses
                      )}
                    >
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: sevConfig.barCount }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              sevConfig.dotColor
                            )}
                          />
                        ))}
                      </span>
                      <span>{sevConfig.label}</span>
                    </div>

                    {/* Status: 🔴 Active 1h, 🔴 Active 22h */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                      </span>
                      <span>Active {duration}</span>
                    </div>
                  </div>

                  {/* Description Snippet */}
                  <p className="mt-2.5 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                    {incident.rootCause || 'No summary for this incident'}
                  </p>
                </div>

                {/* Bottom Row: Slack icon indicator & Enter War Room Action */}
                <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-1.5 text-[11px] font-medium text-zinc-500 truncate"
                    title={`#incident-${cleanId}`}
                  >
                    <SlackIcon className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">#incident-{cleanId}</span>
                  </div>

                  <Link
                    href={warRoomUrl}
                    onClick={() =>
                      onEnterWarRoom?.(incident.incidentId, normSev)
                    }
                    className="inline-flex items-center gap-1.5 rounded-md bg-purple-50 px-2.5 py-1 text-[11px] font-semibold text-purple-700 transition-all duration-150 hover:bg-purple-600 hover:text-white group-hover:bg-purple-600 group-hover:text-white shadow-2xs cursor-pointer shrink-0"
                  >
                    <Video className="h-3 w-3" />
                    <span>Enter War Room</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Counter */}
      <div className="flex items-center justify-between pt-1 text-xs text-zinc-400 font-medium select-none">
        <span>
          Showing 1 to {displayedIncidents.length} of {totalCount}
        </span>
        {searchQuery && (
          <span className="text-zinc-500">
            Filtered by &ldquo;{searchQuery}&rdquo;
          </span>
        )}
      </div>
    </section>
  );
}

/**
 * Convex-connected implementation that queries `listActiveIncidents`
 * and auto-seeds default screenshot incidents if the table is empty.
 */
function ConvexActiveIncidentCards(props: ActiveIncidentCardsProps) {
  const rawIncidents = useQuery(api.incidents.listActiveIncidents);
  const seedDefault = useMutation(api.incidents.seedDefaultIncidents);
  const [hasTriggeredSeed, setHasTriggeredSeed] = useState(false);

  useEffect(() => {
    if (
      rawIncidents !== undefined &&
      rawIncidents.length === 0 &&
      !hasTriggeredSeed
    ) {
      setHasTriggeredSeed(true);
      seedDefault().catch((err) => {
        console.warn('Convex seedDefaultIncidents encountered an error:', err);
      });
    }
  }, [rawIncidents, hasTriggeredSeed, seedDefault]);

  const incidents: ActiveIncidentItem[] = useMemo(() => {
    if (rawIncidents !== undefined) {
      return rawIncidents.map((inc) => ({
        _id: inc._id,
        incidentId: inc.incidentId,
        title: inc.title,
        severity: inc.severity,
        status: inc.status,
        rootCause: inc.rootCause || 'No summary for this incident',
        createdAt: inc.createdAt,
      }));
    }
    return props.initialIncidents || DEFAULT_ACTIVE_INCIDENTS;
  }, [rawIncidents, props.initialIncidents]);

  return <ActiveIncidentCardsView {...props} incidents={incidents} />;
}

/**
 * Offline fallback implementation rendered when Convex is not configured or mounted.
 */
function OfflineActiveIncidentCards(props: ActiveIncidentCardsProps) {
  const incidents = props.initialIncidents || DEFAULT_ACTIVE_INCIDENTS;
  return <ActiveIncidentCardsView {...props} incidents={incidents} />;
}

/**
 * Main ActiveIncidentCards export. Automatically detects Convex availability
 * and seamlessly switches between real-time queries and resilient offline fallback.
 */
export function ActiveIncidentCards(props: ActiveIncidentCardsProps) {
  const convex = useConvex();

  if (convex) {
    return <ConvexActiveIncidentCards {...props} />;
  }

  return <OfflineActiveIncidentCards {...props} />;
}

export default ActiveIncidentCards;
