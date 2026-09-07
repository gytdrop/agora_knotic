'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Menu,
  PieChart,
  Plus,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { cn } from '@/lib/utils';

export type SeverityLevel = 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3';
export type Environment = 'all' | 'production' | 'staging' | 'sandbox';

export interface IncidentRecord {
  id: string;
  title: string;
  severity: SeverityLevel;
  service: string;
  environment: 'production' | 'staging' | 'sandbox';
  commander: string;
  durationMinutes: number;
  durationText: string;
  startedAt: string;
  status: 'investigating' | 'identified' | 'mitigated' | 'resolved';
  channelName?: string;
}

export interface CustomWidget {
  id: string;
  title: string;
  type: 'stat' | 'bar' | 'donut' | 'ranking';
  dataset: 'volume' | 'mttr' | 'mttd' | 'mtta';
  groupBy: 'severity' | 'service' | 'environment';
}

export const SEVERITY_METADATA: Record<
  SeverityLevel,
  { label: string; short: string; color: string; bg: string; border: string; text: string }
> = {
  SEV0: {
    label: 'SEV-0 (Critical)',
    short: 'Sev 0',
    color: '#EF4444',
    bg: 'bg-red-50 dark:bg-red-950/60',
    border: 'border-red-200 dark:border-red-900',
    text: 'text-red-700 dark:text-red-300',
  },
  SEV1: {
    label: 'SEV-1 (Major Outage)',
    short: 'Sev 1',
    color: '#F97316',
    bg: 'bg-orange-50 dark:bg-orange-950/60',
    border: 'border-orange-200 dark:border-orange-900',
    text: 'text-orange-700 dark:text-orange-300',
  },
  SEV2: {
    label: 'SEV-2 (Degraded)',
    short: 'Sev 2',
    color: '#F59E0B',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    border: 'border-amber-200 dark:border-amber-900',
    text: 'text-amber-700 dark:text-amber-300',
  },
  SEV3: {
    label: 'SEV-3 (Low / Info)',
    short: 'Sev 3',
    color: '#3B82F6',
    bg: 'bg-blue-50 dark:bg-blue-950/60',
    border: 'border-blue-200 dark:border-blue-900',
    text: 'text-blue-700 dark:text-blue-300',
  },
};

export const MOCK_INCIDENTS: IncidentRecord[] = [
  {
    id: '#INC-8921',
    title: 'Payment service latency and failure rate spike',
    severity: 'SEV0',
    service: 'Payments Core Service',
    environment: 'production',
    commander: 'Ashley Sawatsky',
    durationMinutes: 90,
    durationText: '1h 30m',
    startedAt: 'Today, 14:12 UTC',
    status: 'investigating',
    channelName: '#inc-8921-payments',
  },
  {
    id: '#INC-8894',
    title: 'Authentication token validation intermittent timeout',
    severity: 'SEV0',
    service: 'Authentication & SSO',
    environment: 'production',
    commander: 'Elena Vance',
    durationMinutes: 28,
    durationText: '28m',
    startedAt: 'Sep 5, 09:15 UTC',
    status: 'resolved',
    channelName: '#inc-8894-auth-timeout',
  },
  {
    id: '#INC-8871',
    title: 'Web & Mobile Checkout flow 504 errors after deploy',
    severity: 'SEV1',
    service: 'Checkout Application',
    environment: 'production',
    commander: 'Marcus Chen',
    durationMinutes: 42,
    durationText: '42m',
    startedAt: 'Sep 4, 18:20 UTC',
    status: 'resolved',
    channelName: '#inc-8871-checkout',
  },
  {
    id: '#INC-8850',
    title: 'Realtime WebRTC Gateway packet loss elevated',
    severity: 'SEV1',
    service: 'API Gateway & Ingress',
    environment: 'production',
    commander: 'Alex Rivera',
    durationMinutes: 44,
    durationText: '44m',
    startedAt: 'Sep 2, 11:05 UTC',
    status: 'resolved',
    channelName: '#inc-8850-webrtc-gateway',
  },
  {
    id: '#INC-8832',
    title: 'PostgreSQL primary read replica connection pool saturated',
    severity: 'SEV1',
    service: 'Database Infrastructure',
    environment: 'production',
    commander: 'Ashley Sawatsky',
    durationMinutes: 35,
    durationText: '35m',
    startedAt: 'Aug 29, 21:40 UTC',
    status: 'resolved',
    channelName: '#inc-8832-db-saturation',
  },
  {
    id: '#INC-8819',
    title: 'Webhook delivery worker concurrency queue backup',
    severity: 'SEV2',
    service: 'Integration Services',
    environment: 'production',
    commander: 'Marcus Chen',
    durationMinutes: 22,
    durationText: '22m',
    startedAt: 'Aug 27, 16:30 UTC',
    status: 'resolved',
    channelName: '#inc-8819-webhook-queue',
  },
  {
    id: '#INC-8805',
    title: 'Search indexing pipeline memory leak in us-east-1',
    severity: 'SEV2',
    service: 'Database Infrastructure',
    environment: 'production',
    commander: 'Elena Vance',
    durationMinutes: 19,
    durationText: '19m',
    startedAt: 'Aug 25, 08:14 UTC',
    status: 'resolved',
    channelName: '#inc-8805-search-mem',
  },
  {
    id: '#INC-8789',
    title: 'User profile block avatar upload failure',
    severity: 'SEV3',
    service: 'Checkout Application',
    environment: 'staging',
    commander: 'Alex Rivera',
    durationMinutes: 14,
    durationText: '14m',
    startedAt: 'Aug 22, 14:02 UTC',
    status: 'resolved',
    channelName: '#inc-8789-avatar-upload',
  },
  {
    id: '#INC-8766',
    title: 'Internal analytics cron sync delayed by 30 minutes',
    severity: 'SEV3',
    service: 'Integration Services',
    environment: 'production',
    commander: 'Ashley Sawatsky',
    durationMinutes: 11,
    durationText: '11m',
    startedAt: 'Aug 19, 04:00 UTC',
    status: 'resolved',
    channelName: '#inc-8766-analytics-cron',
  },
];

export function MetricsPageLayout() {
  const [currentDashboard, setCurrentDashboard] = useState<string>('Incident Overview');
  const [isDashboardDropdownOpen, setIsDashboardDropdownOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<string>('Last 30 Days');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [comparePrior, setComparePrior] = useState<boolean>(true);
  const [isFavorite, setIsFavorite] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

  // Global Filter states
  const [selectedSeverities, setSelectedSeverities] = useState<SeverityLevel[]>([
    'SEV0',
    'SEV1',
    'SEV2',
    'SEV3',
  ]);
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedEnv, setSelectedEnv] = useState<Environment>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Drilldown Drawer state
  const [selectedDrilldown, setSelectedDrilldown] = useState<{
    title: string;
    description?: string;
    incidents: IncidentRecord[];
  } | null>(null);

  // Custom Widgets State
  const [customWidgets, setCustomWidgets] = useState<CustomWidget[]>([]);
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetType, setNewWidgetType] = useState<'stat' | 'bar' | 'donut' | 'ranking'>('stat');
  const [newWidgetDataset, setNewWidgetDataset] = useState<'volume' | 'mttr' | 'mttd' | 'mtta'>('volume');
  const [newWidgetGroupBy, setNewWidgetGroupBy] = useState<'severity' | 'service' | 'environment'>('severity');

  // Filtered incidents based on active global filters
  const filteredIncidents = useMemo(() => {
    return MOCK_INCIDENTS.filter((inc) => {
      if (!selectedSeverities.includes(inc.severity)) return false;
      if (selectedService !== 'all' && inc.service !== selectedService) return false;
      if (selectedEnv !== 'all' && inc.environment !== selectedEnv) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = inc.title.toLowerCase().includes(query);
        const matchId = inc.id.toLowerCase().includes(query);
        const matchService = inc.service.toLowerCase().includes(query);
        const matchCommander = inc.commander.toLowerCase().includes(query);
        if (!matchTitle && !matchId && !matchService && !matchCommander) return false;
      }
      return true;
    });
  }, [selectedSeverities, selectedService, selectedEnv, searchQuery]);

  // Calculations for KPI Cards
  const kpis = useMemo(() => {
    const total = filteredIncidents.length;
    const sev0Count = filteredIncidents.filter((i) => i.severity === 'SEV0').length;
    const sev1Count = filteredIncidents.filter((i) => i.severity === 'SEV1').length;
    const sev2Count = filteredIncidents.filter((i) => i.severity === 'SEV2').length;
    const sev3Count = filteredIncidents.filter((i) => i.severity === 'SEV3').length;

    const avgMinutes =
      total > 0
        ? Math.round(filteredIncidents.reduce((acc, curr) => acc + curr.durationMinutes, 0) / total)
        : 0;

    return [
      {
        id: 'mttr',
        title: 'Mean Time to Resolve (MTTR)',
        value: `${avgMinutes}m 14s`,
        p50: '24m',
        p90: '75m',
        target: '< 45m',
        delta: '-14.2%',
        isGood: true,
        trend: 'down',
        subtitle: 'Target Met (< 45m)',
        icon: Clock,
        drilldownTitle: 'All Incidents for MTTR Calculation',
      },
      {
        id: 'mttd',
        title: 'Mean Time to Detect (MTTD)',
        value: '4m 12s',
        p50: '3m 10s',
        p90: '8m 40s',
        target: '< 5m',
        delta: '+2.1%',
        isGood: false,
        trend: 'up',
        subtitle: 'Synthetic & Telemetry alerts',
        icon: Activity,
        drilldownTitle: 'Detection Telemetry Incidents',
      },
      {
        id: 'volume',
        title: 'Total Incidents Recorded',
        value: total.toString(),
        delta: '-8.0%',
        isGood: true,
        trend: 'down',
        subtitle: `${sev0Count} Sev0 • ${sev1Count} Sev1 • ${sev2Count} Sev2 • ${sev3Count} Sev3`,
        icon: AlertTriangle,
        drilldownTitle: 'All Recorded Incidents',
      },
      {
        id: 'mtta',
        title: 'Mean Time to Ack (MTTA)',
        value: '2m 45s',
        p50: '1m 30s',
        p90: '4m 10s',
        target: '< 3m',
        delta: '-18.5%',
        isGood: true,
        trend: 'down',
        subtitle: '98.4% Acknowledged on first page',
        icon: CheckCircle2,
        drilldownTitle: 'On-Call & Paging Response Times',
      },
    ];
  }, [filteredIncidents]);

  // Severity Distribution Data
  const severityDistribution = useMemo(() => {
    const total = filteredIncidents.length || 1;
    const counts: Record<SeverityLevel, number> = {
      SEV0: filteredIncidents.filter((i) => i.severity === 'SEV0').length,
      SEV1: filteredIncidents.filter((i) => i.severity === 'SEV1').length,
      SEV2: filteredIncidents.filter((i) => i.severity === 'SEV2').length,
      SEV3: filteredIncidents.filter((i) => i.severity === 'SEV3').length,
    };
    return (['SEV0', 'SEV1', 'SEV2', 'SEV3'] as SeverityLevel[]).map((sev) => ({
      sev,
      ...SEVERITY_METADATA[sev],
      count: counts[sev],
      pct: Math.round((counts[sev] / total) * 100),
    }));
  }, [filteredIncidents]);

  // MTTR by Service Benchmarks
  const mttrByService = useMemo(() => {
    return [
      {
        service: 'Payments Core Service',
        mttr: '42m',
        target: '30m',
        incidents: filteredIncidents.filter((i) => i.service === 'Payments Core Service').length,
        met: false,
      },
      {
        service: 'Database Infrastructure',
        mttr: '35m',
        target: '45m',
        incidents: filteredIncidents.filter((i) => i.service === 'Database Infrastructure').length,
        met: true,
      },
      {
        service: 'Authentication & SSO',
        mttr: '18m',
        target: '20m',
        incidents: filteredIncidents.filter((i) => i.service === 'Authentication & SSO').length,
        met: true,
      },
      {
        service: 'API Gateway & Ingress',
        mttr: '12m',
        target: '15m',
        incidents: filteredIncidents.filter((i) => i.service === 'API Gateway & Ingress').length,
        met: true,
      },
    ];
  }, [filteredIncidents]);

  // Lifecycle Waterfall Stages
  const lifecycleStages = [
    { stage: 'Time to Detect (TTD)', pct: 9, time: '4m 12s', color: 'bg-amber-500', desc: 'Alert created' },
    { stage: 'Time to Acknowledge (TTA)', pct: 6, time: '2m 45s', color: 'bg-emerald-500', desc: 'Commander on scene' },
    { stage: 'Time to Mitigate (TTM)', pct: 55, time: '25m 10s', color: 'bg-blue-600', desc: 'Canary rollback' },
    { stage: 'Full Resolution (TTR)', pct: 30, time: '13m 04s', color: 'bg-purple-600', desc: 'Verification complete' },
  ];

  // Daily Trend Bars for 14-Day Timeline simulation
  const dailyBars = [
    { day: 'Day 1', date: 'Aug 24', sev0: 0, sev1: 1, sev2: 1, sev3: 2, total: 4 },
    { day: 'Day 2', date: 'Aug 25', sev0: 0, sev1: 0, sev2: 2, sev3: 0, total: 2 },
    { day: 'Day 3', date: 'Aug 26', sev0: 1, sev1: 2, sev2: 2, sev3: 1, total: 6 },
    { day: 'Day 4', date: 'Aug 27', sev0: 0, sev1: 0, sev2: 1, sev3: 0, total: 1 },
    { day: 'Day 5', date: 'Aug 28', sev0: 0, sev1: 1, sev2: 1, sev3: 1, total: 3 },
    { day: 'Day 6', date: 'Aug 29', sev0: 1, sev1: 1, sev2: 2, sev3: 1, total: 5 },
    { day: 'Day 7', date: 'Aug 30', sev0: 0, sev1: 0, sev2: 1, sev3: 1, total: 2 },
    { day: 'Day 8', date: 'Aug 31', sev0: 0, sev1: 2, sev2: 3, sev3: 2, total: 7 },
    { day: 'Day 9', date: 'Sep 1', sev0: 0, sev1: 1, sev2: 1, sev3: 1, total: 3 },
    { day: 'Day 10', date: 'Sep 2', sev0: 0, sev1: 1, sev2: 2, sev3: 1, total: 4 },
    { day: 'Day 11', date: 'Sep 3', sev0: 0, sev1: 0, sev2: 1, sev3: 1, total: 2 },
    { day: 'Day 12', date: 'Sep 4', sev0: 1, sev1: 2, sev2: 3, sev3: 2, total: 8 },
    { day: 'Day 13', date: 'Sep 5', sev0: 0, sev1: 1, sev2: 1, sev3: 1, total: 3 },
    { day: 'Day 14', date: 'Today', sev0: 1, sev1: 0, sev2: 0, sev3: 0, total: 1 },
  ];

  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Severity', 'Service', 'Environment', 'Commander', 'Duration', 'StartedAt', 'Status'];
    const rows = filteredIncidents.map((i) => [
      i.id,
      `"${i.title.replace(/"/g, '""')}"`,
      i.severity,
      `"${i.service}"`,
      i.environment,
      `"${i.commander}"`,
      i.durationText,
      `"${i.startedAt}"`,
      i.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rootly_metrics_${selectedRange.toLowerCase().replace(/ /g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);
  };

  const handleAddWidget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWidgetTitle.trim()) return;
    const widget: CustomWidget = {
      id: `widget-${Date.now()}`,
      title: newWidgetTitle.trim(),
      type: newWidgetType,
      dataset: newWidgetDataset,
      groupBy: newWidgetGroupBy,
    };
    setCustomWidgets((prev) => [...prev, widget]);
    setNewWidgetTitle('');
    setIsAddWidgetOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={() => setIsCreateIncidentOpen(true)}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white dark:bg-zinc-900 shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RootlySidebar
              className="h-full w-full border-r-0"
              onCreateIncident={() => {
                setIsMobileMenuOpen(false);
                setIsCreateIncidentOpen(true);
              }}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Responsive Canvas */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-bold tracking-tight">Metrics & Dashboards</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Top Header & Dashboard Selector */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              {/* Breadcrumb path */}
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
                <span>Rootly</span>
                <span>/</span>
                <span>Dashboards</span>
                <span>/</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{currentDashboard}</span>
              </div>

              {/* Title & Dashboard Switcher Dropdown */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDashboardDropdownOpen(!isDashboardDropdownOpen)}
                    className="flex items-center gap-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer group"
                  >
                    <span>{currentDashboard}</span>
                    <ChevronDown className="h-5 w-5 text-zinc-400 group-hover:text-purple-600 transition-transform" />
                  </button>

                  {/* Dashboard Switcher Dropdown Menu */}
                  {isDashboardDropdownOpen && (
                    <div className="absolute left-0 mt-2 w-64 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-30 py-2 divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        System Dashboards
                      </div>
                      <div className="py-1">
                        {[
                          'Incident Overview',
                          'Service Reliability & SLAs',
                          'MTTR & Response Times',
                          'Team Performance & On-Call',
                          'Executive Summary (Board View)',
                        ].map((dash) => (
                          <button
                            key={dash}
                            type="button"
                            onClick={() => {
                              setCurrentDashboard(dash);
                              setIsDashboardDropdownOpen(false);
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer',
                              currentDashboard === dash
                                ? 'font-bold text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20'
                                : 'text-zinc-700 dark:text-zinc-300'
                            )}
                          >
                            <span>{dash}</span>
                            {currentDashboard === dash && <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />}
                          </button>
                        ))}
                      </div>
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsDashboardDropdownOpen(false);
                            setIsAddWidgetOpen(true);
                          }}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium text-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Create Custom Dashboard</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Favorite Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFavorite(!isFavorite)}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className={cn(
                    'p-1.5 rounded-lg border transition-colors cursor-pointer',
                    isFavorite
                      ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                      : 'text-zinc-400 hover:text-zinc-600 border-zinc-200 dark:border-zinc-800'
                  )}
                >
                  <Star className={cn('h-4 w-4', isFavorite && 'fill-amber-500')} />
                </button>

                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Real-time incident response telemetry, resolution velocity, MTTR distributions, and subsystem SLAs.
              </p>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Range Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDateDropdownOpen(!isDateDropdownOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs transition-colors cursor-pointer"
                >
                  <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{selectedRange}</span>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>

                {isDateDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-30 py-1.5 text-xs">
                    {['Last 24 Hours', 'Last 7 Days', 'Last 14 Days', 'Last 30 Days', 'Last 90 Days', '1 Year'].map(
                      (range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            setSelectedRange(range);
                            setIsDateDropdownOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center justify-between',
                            selectedRange === range ? 'font-bold text-purple-600' : 'text-zinc-700 dark:text-zinc-300'
                          )}
                        >
                          <span>{range}</span>
                          {selectedRange === range && <CheckCircle2 className="h-3 w-3 text-purple-600" />}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Compare Prior Period Toggle */}
              <button
                type="button"
                onClick={() => setComparePrior(!comparePrior)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                  comparePrior
                    ? 'border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                )}
              >
                <span>Compare Prior</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Export</span>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>

                {isExportOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl z-30 py-1.5 text-xs">
                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Export as CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        window.print();
                        setIsExportOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2 text-zinc-700 dark:text-zinc-300"
                    >
                      <FileText className="h-3.5 w-3.5 text-blue-600" />
                      <span>Print / PDF Report</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Add Widget Button */}
              <button
                type="button"
                onClick={() => setIsAddWidgetOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-white text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Widget</span>
              </button>
            </div>
          </div>

          {/* Global Multi-Attribute Filter Bar */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 shadow-2xs space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 text-zinc-400 font-semibold pr-2 border-r border-zinc-200 dark:border-zinc-800">
                  <Filter className="h-3.5 w-3.5 text-zinc-500" />
                  <span>Filters</span>
                </div>

                {/* Severity Multi-select Chips */}
                <div className="flex items-center gap-1">
                  {(['SEV0', 'SEV1', 'SEV2', 'SEV3'] as SeverityLevel[]).map((sev) => {
                    const isSelected = selectedSeverities.includes(sev);
                    const meta = SEVERITY_METADATA[sev];
                    return (
                      <button
                        key={sev}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (selectedSeverities.length > 1) {
                              setSelectedSeverities(selectedSeverities.filter((s) => s !== sev));
                            }
                          } else {
                            setSelectedSeverities([...selectedSeverities, sev]);
                          }
                        }}
                        className={cn(
                          'px-2 py-0.5 rounded-md font-medium text-[11px] border transition-all cursor-pointer',
                          isSelected
                            ? `${meta.bg} ${meta.border} ${meta.text} font-bold`
                            : 'border-zinc-200 dark:border-zinc-800 text-zinc-400 bg-transparent hover:border-zinc-300'
                        )}
                      >
                        {meta.short}
                      </button>
                    );
                  })}
                </div>

                {/* Service Dropdown */}
                <select
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all" className="dark:bg-zinc-900">All Services</option>
                  <option value="Payments Core Service" className="dark:bg-zinc-900">Payments Core Service</option>
                  <option value="Database Infrastructure" className="dark:bg-zinc-900">Database Infrastructure</option>
                  <option value="Authentication & SSO" className="dark:bg-zinc-900">Authentication & SSO</option>
                  <option value="API Gateway & Ingress" className="dark:bg-zinc-900">API Gateway & Ingress</option>
                  <option value="Checkout Application" className="dark:bg-zinc-900">Checkout Application</option>
                  <option value="Integration Services" className="dark:bg-zinc-900">Integration Services</option>
                </select>

                {/* Environment Dropdown */}
                <select
                  value={selectedEnv}
                  onChange={(e) => setSelectedEnv(e.target.value as Environment)}
                  className="bg-transparent border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-zinc-700 dark:text-zinc-300 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="all" className="dark:bg-zinc-900">Environment: All</option>
                  <option value="production" className="dark:bg-zinc-900">Production</option>
                  <option value="staging" className="dark:bg-zinc-900">Staging</option>
                  <option value="sandbox" className="dark:bg-zinc-900">Sandbox</option>
                </select>
              </div>

              {/* Transparent Search Filter Bar */}
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search incident, service..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent pl-8 pr-3 py-1 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Reset Filters */}
                {(selectedSeverities.length < 4 || selectedService !== 'all' || selectedEnv !== 'all' || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSeverities(['SEV0', 'SEV1', 'SEV2', 'SEV3']);
                      setSelectedService('all');
                      setSelectedEnv('all');
                      setSearchQuery('');
                    }}
                    className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline font-medium cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 4 Executive KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={kpi.id}
                  onClick={() =>
                    setSelectedDrilldown({
                      title: kpi.drilldownTitle,
                      description: `Active metric: ${kpi.title} (${kpi.value})`,
                      incidents: filteredIncidents,
                    })
                  }
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-2 cursor-pointer hover:border-purple-500/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">{kpi.title}</span>
                    <Icon className="h-4 w-4 text-zinc-400 group-hover:text-purple-600 transition-colors" />
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                      {kpi.value}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center text-xs font-semibold',
                        kpi.isGood ? 'text-emerald-600' : 'text-rose-600'
                      )}
                    >
                      {kpi.trend === 'down' ? (
                        <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                      ) : (
                        <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                      )}
                      {kpi.delta}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100 dark:border-zinc-800 text-zinc-400">
                    {kpi.p50 && <span>p50: {kpi.p50}</span>}
                    {kpi.p90 && <span>p90: {kpi.p90}</span>}
                    <span className="font-medium text-zinc-500 dark:text-zinc-400 truncate">{kpi.subtitle}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 12-Column Responsive Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart 1: Incident Volume Over Time (8 Columns) */}
            <div className="lg:col-span-8 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span>Incident Volume Over Time</span>
                    <span className="text-[10px] text-zinc-400 font-normal">Stacked by Severity</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Daily frequency of declared incidents. Click any column to drill into incidents.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  {(['SEV0', 'SEV1', 'SEV2', 'SEV3'] as SeverityLevel[]).map((s) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEVERITY_METADATA[s].color }} />
                      <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stacked Daily Bars */}
              <div className="h-60 w-full flex items-end gap-1.5 sm:gap-2 pt-6 pb-2 px-1 border-b border-zinc-100 dark:border-zinc-800">
                {dailyBars.map((bar, idx) => {
                  const maxH = 8;
                  const total = bar.total;
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setSelectedDrilldown({
                          title: `Incidents on ${bar.date} (${total} Total)`,
                          description: `${bar.sev0} Sev0 • ${bar.sev1} Sev1 • ${bar.sev2} Sev2 • ${bar.sev3} Sev3`,
                          incidents: filteredIncidents,
                        })
                      }
                      className="flex-1 flex flex-col justify-end items-center group cursor-pointer h-full"
                    >
                      {/* Bar Stack */}
                      <div className="w-full max-w-[28px] flex flex-col-reverse rounded-t-sm overflow-hidden transition-all group-hover:brightness-110">
                        {bar.sev0 > 0 && (
                          <div
                            style={{ height: `${(bar.sev0 / maxH) * 160}px` }}
                            className="w-full bg-red-500"
                            title={`Sev0: ${bar.sev0}`}
                          />
                        )}
                        {bar.sev1 > 0 && (
                          <div
                            style={{ height: `${(bar.sev1 / maxH) * 160}px` }}
                            className="w-full bg-orange-500"
                            title={`Sev1: ${bar.sev1}`}
                          />
                        )}
                        {bar.sev2 > 0 && (
                          <div
                            style={{ height: `${(bar.sev2 / maxH) * 160}px` }}
                            className="w-full bg-amber-500"
                            title={`Sev2: ${bar.sev2}`}
                          />
                        )}
                        {bar.sev3 > 0 && (
                          <div
                            style={{ height: `${(bar.sev3 / maxH) * 160}px` }}
                            className="w-full bg-blue-500"
                            title={`Sev3: ${bar.sev3}`}
                          />
                        )}
                      </div>

                      {/* X-Axis Label */}
                      <span className="text-[10px] text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 mt-2 font-mono truncate w-full text-center">
                        {bar.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
                <span>Start: {selectedRange}</span>
                <span className="font-mono text-zinc-500 font-semibold">{filteredIncidents.length} Total Incidents</span>
                <span>Current</span>
              </div>
            </div>

            {/* Chart 2: Severity Distribution Donut (4 Columns) */}
            <div className="lg:col-span-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Severity Breakdown
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Proportional distribution by impact tier
                  </p>
                </div>
                <PieChart className="h-4 w-4 text-zinc-400" />
              </div>

              {/* Simulated Donut Visualizer */}
              <div className="relative flex items-center justify-center py-4">
                <div className="relative h-44 w-44 rounded-full border-12 border-zinc-100 dark:border-zinc-800 border-t-red-500 border-r-orange-500 border-b-amber-500 border-l-blue-500 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-3xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                    {filteredIncidents.length}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400 tracking-wider">
                    Incidents
                  </span>
                </div>
              </div>

              {/* Severity Legend Rows */}
              <div className="space-y-1.5 text-xs">
                {severityDistribution.map((item) => (
                  <div
                    key={item.sev}
                    onClick={() =>
                      setSelectedDrilldown({
                        title: `Incidents with Severity ${item.sev}`,
                        incidents: filteredIncidents.filter((i) => i.severity === item.sev),
                      })
                    }
                    className="flex items-center justify-between p-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.label}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Incident Lifecycle Phase Breakdown (12 Columns) */}
            <div className="lg:col-span-12 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Incident Lifecycle Phase Waterfall
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Mean time duration across the 4 key stages: Detection → Acknowledged → Mitigated → Full Resolution.
                  </p>
                </div>
                <span className="text-xs font-mono font-semibold text-zinc-500 dark:text-zinc-400">
                  Total Lifecycle Avg: 45m 11s
                </span>
              </div>

              {/* Horizontal Waterfall Bar */}
              <div className="w-full h-8 rounded-lg overflow-hidden flex items-center shadow-2xs">
                {lifecycleStages.map((stg, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${stg.pct}%` }}
                    className={cn(stg.color, 'h-full flex items-center justify-center text-[10px] font-bold text-white transition-all')}
                    title={`${stg.stage}: ${stg.time} (${stg.pct}%)`}
                  >
                    {stg.pct >= 10 ? `${stg.time}` : ''}
                  </div>
                ))}
              </div>

              {/* 4 Phase Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                {lifecycleStages.map((stg, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/80 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={cn('h-2 w-2 rounded-full', stg.color)} />
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">{stg.stage}</span>
                    </div>
                    <div className="text-lg font-bold font-mono text-zinc-800 dark:text-zinc-200">{stg.time}</div>
                    <div className="text-[10px] text-zinc-400">{stg.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 1: MTTR Benchmarks by Subsystem (6 Columns) */}
            <div className="lg:col-span-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    MTTR by Service & Subsystem
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    SLA targets vs actual mean time to resolve
                  </p>
                </div>
                <span className="text-xs font-mono text-zinc-400">SLA Standard</span>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {mttrByService.map((srv, idx) => (
                  <div
                    key={idx}
                    onClick={() =>
                      setSelectedDrilldown({
                        title: `Incidents for ${srv.service}`,
                        incidents: filteredIncidents.filter((i) => i.service === srv.service),
                      })
                    }
                    className="py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/40 px-1 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {srv.service}
                      </div>
                      <div className="text-[11px] text-zinc-400">
                        {srv.incidents} incidents recorded • Target: {srv.target}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                        {srv.mttr}
                      </span>
                      {srv.met ? (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          Target Met
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 px-2 py-0.5 rounded-full">
                          Above SLA
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 2: Contributing Factors & Root Causes (6 Columns) */}
            <div className="lg:col-span-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Contributing Factors & Root Causes
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Post-incident retro tags and telemetry categorization
                  </p>
                </div>
                <span className="text-xs text-zinc-400">Retro Insights</span>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                {[
                  { reason: 'Code & Configuration Deployment', pct: 38, count: 18, color: 'bg-purple-600' },
                  { reason: 'Downstream Service Dependency Timeout', pct: 29, count: 14, color: 'bg-indigo-500' },
                  { reason: 'Infrastructure Capacity & Memory Exhaustion', pct: 18, count: 9, color: 'bg-blue-500' },
                  { reason: 'Network Ingress & DNS Latency', pct: 15, count: 6, color: 'bg-amber-500' },
                ].map((rc, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-zinc-700 dark:text-zinc-300">{rc.reason}</span>
                      <span className="font-mono text-zinc-500">{rc.count} incidents ({rc.pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${rc.pct}%` }}
                        className={cn(rc.color, 'h-full rounded-full')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom User-Added Widgets */}
            {customWidgets.map((cw) => (
              <div
                key={cw.id}
                className="lg:col-span-6 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{cw.title}</h3>
                    <p className="text-xs text-zinc-400">
                      Dataset: {cw.dataset.toUpperCase()} • Grouped by {cw.groupBy}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomWidgets(customWidgets.filter((w) => w.id !== cw.id))}
                    className="text-zinc-400 hover:text-rose-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg text-center text-xs text-zinc-500">
                  Custom telemetry rendered for <strong className="text-zinc-800 dark:text-zinc-200">{cw.title}</strong>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Slide-over Drilldown Drawer */}
      {selectedDrilldown && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-900/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between shadow-2xl overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                    {selectedDrilldown.title}
                  </h3>
                  {selectedDrilldown.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {selectedDrilldown.description}
                    </p>
                  )}
                  <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                    Showing {selectedDrilldown.incidents.length} matching incident(s)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedDrilldown(null)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Incidents List */}
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 pr-1 mt-4">
                {selectedDrilldown.incidents.length === 0 ? (
                  <div className="py-12 text-center text-xs text-zinc-400">
                    No incidents match the active drilldown filters.
                  </div>
                ) : (
                  selectedDrilldown.incidents.map((inc) => {
                    const sevMeta = SEVERITY_METADATA[inc.severity];
                    return (
                      <div
                        key={inc.id}
                        className="py-3.5 px-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 rounded-lg transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {inc.id}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded border',
                                sevMeta.bg,
                                sevMeta.border,
                                sevMeta.text
                              )}
                            >
                              {inc.severity}
                            </span>
                            <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {inc.environment}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-400">{inc.startedAt}</span>
                        </div>

                        <div className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {inc.title}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                          <span>
                            Service: <strong className="text-zinc-700 dark:text-zinc-300">{inc.service}</strong>
                          </span>
                          <span>
                            Commander: <strong className="text-zinc-700 dark:text-zinc-300">{inc.commander}</strong>
                          </span>
                          <span className="font-mono font-semibold text-emerald-600">
                            Duration: {inc.durationText}
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1">
                          <Link
                            href={`/incidents/${inc.id.replace('#', '')}`}
                            className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Incident Room</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export Incidents</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedDrilldown(null)}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-semibold hover:bg-zinc-800 cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Widget Modal */}
      {isAddWidgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                Add Dashboard Widget
              </h3>
              <button
                type="button"
                onClick={() => setIsAddWidgetOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddWidget} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Widget Title</label>
                <input
                  type="text"
                  value={newWidgetTitle}
                  onChange={(e) => setNewWidgetTitle(e.target.value)}
                  placeholder="e.g. Gateway MTTR Trend"
                  required
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-medium text-zinc-700 dark:text-zinc-300">Visualization Type</label>
                <select
                  value={newWidgetType}
                  onChange={(e) => setNewWidgetType(e.target.value as 'stat' | 'bar' | 'donut' | 'ranking')}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                >
                  <option value="stat" className="dark:bg-zinc-900">Single Stat KPI</option>
                  <option value="bar" className="dark:bg-zinc-900">Stacked Bar Chart</option>
                  <option value="donut" className="dark:bg-zinc-900">Donut Chart</option>
                  <option value="ranking" className="dark:bg-zinc-900">Ranked Service Table</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">Dataset</label>
                  <select
                    value={newWidgetDataset}
                    onChange={(e) => setNewWidgetDataset(e.target.value as 'volume' | 'mttr' | 'mttd' | 'mtta')}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="volume" className="dark:bg-zinc-900">Incident Volume</option>
                    <option value="mttr" className="dark:bg-zinc-900">MTTR</option>
                    <option value="mttd" className="dark:bg-zinc-900">MTTD</option>
                    <option value="mtta" className="dark:bg-zinc-900">MTTA</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">Group By</label>
                  <select
                    value={newWidgetGroupBy}
                    onChange={(e) => setNewWidgetGroupBy(e.target.value as 'severity' | 'service' | 'environment')}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent p-2.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  >
                    <option value="severity" className="dark:bg-zinc-900">Severity</option>
                    <option value="service" className="dark:bg-zinc-900">Service</option>
                    <option value="environment" className="dark:bg-zinc-900">Environment</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddWidgetOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-2xs cursor-pointer"
                >
                  Add to Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={() => setIsCreateIncidentOpen(false)}
        onCreated={() => setIsCreateIncidentOpen(false)}
      />
    </div>
  );
}

export default MetricsPageLayout;
