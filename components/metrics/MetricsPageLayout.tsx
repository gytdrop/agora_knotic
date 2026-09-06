'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Flame,
  Menu,
  PieChart,
  Shield,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { cn } from '@/lib/utils';

export function MetricsPageLayout() {
  const [selectedRange, setSelectedRange] = useState('Last 90 Days');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);

  const kpis = [
    {
      title: 'Mean Time to Resolve (MTTR)',
      value: '26m',
      change: '-15% vs prior period',
      trend: 'down',
      status: 'Target Met (< 30m)',
      icon: Clock,
      color: 'emerald',
    },
    {
      title: 'Mean Time to Detect (MTTD)',
      value: '3.4m',
      change: '-22% faster detection',
      trend: 'down',
      status: 'Target Met (< 5m)',
      icon: Zap,
      color: 'emerald',
    },
    {
      title: 'Total Incidents Recorded',
      value: '34',
      change: '-5% vs avg',
      trend: 'down',
      status: 'Annual Volume',
      icon: Flame,
      color: 'purple',
    },
    {
      title: 'Customer Downtime Recorded',
      value: '4h 12m',
      change: '99.94% overall availability',
      trend: 'up',
      status: 'SLA Compliant',
      icon: Shield,
      color: 'blue',
    },
  ];

  const severityBreakdown = [
    { sev: 'SEV-0 (Critical Blocker)', count: 2, pct: 6, color: 'bg-red-600', textColor: 'text-red-600' },
    { sev: 'SEV-1 (Major Outage)', count: 7, pct: 21, color: 'bg-rose-500', textColor: 'text-rose-600' },
    { sev: 'SEV-2 (Moderate Degradation)', count: 14, pct: 41, color: 'bg-amber-500', textColor: 'text-amber-600' },
    { sev: 'SEV-3 (Minor / Informational)', count: 11, pct: 32, color: 'bg-blue-500', textColor: 'text-blue-600' },
  ];

  const mttrByService = [
    { service: 'Payments Core Service', mttr: '42m', target: '30m', incidents: 8, met: false },
    { service: 'Database Infrastructure', mttr: '35m', target: '45m', incidents: 6, met: true },
    { service: 'Authentication & SSO', mttr: '18m', target: '20m', incidents: 5, met: true },
    { service: 'API Gateway & Ingress', mttr: '12m', target: '15m', incidents: 15, met: true },
  ];

  const lifecycleStages = [
    { stage: 'Investigation & Root Cause', pct: 48, time: '19.2m avg', color: 'bg-purple-600' },
    { stage: 'Mitigation & Rollback', pct: 32, time: '12.8m avg', color: 'bg-indigo-500' },
    { stage: 'Monitoring & Verification', pct: 12, time: '4.8m avg', color: 'bg-blue-500' },
    { stage: 'Detection & Triage', pct: 8, time: '3.2m avg', color: 'bg-emerald-500' },
  ];

  const rootCauses = [
    { reason: 'Code & Configuration Deployment', pct: 38, count: 13 },
    { reason: 'Downstream Service Dependency Timeout', pct: 29, count: 10 },
    { reason: 'Infrastructure Capacity & Memory Exhaustion', pct: 18, count: 6 },
    { reason: 'Network Ingress & DNS Latency', pct: 15, count: 5 },
  ];

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
            <span className="text-sm font-bold tracking-tight">Metrics</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Incident Metrics & Analytics
                </h1>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Mean Time to Resolve (MTTR), detection speed, severity distributions, and reliability trends.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-1 text-xs">
                {['Last 7 Days', 'Last 30 Days', 'Last 90 Days', '1 Year'].map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setSelectedRange(range)}
                    className={cn(
                      'px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer',
                      selectedRange === range
                        ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-bold'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
                    )}
                  >
                    {range}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => alert('Metrics report exported as CSV.')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-zinc-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Executive KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, idx) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium truncate">{kpi.title}</span>
                    <Icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 font-mono">
                    {kpi.value}
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <TrendingDown className="h-3 w-3" />
                      {kpi.change}
                    </span>
                    <span className="text-zinc-400 font-medium">{kpi.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Two-Column Analytics Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Incidents by Severity Breakdown */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Incidents by Severity Level
                </h3>
                <span className="text-xs font-mono text-zinc-400">34 Total</span>
              </div>

              {/* Progress Stack Bar */}
              <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                {severityBreakdown.map((s, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${s.pct}%` }}
                    className={cn(s.color, 'h-full transition-all')}
                    title={`${s.sev}: ${s.count} incidents (${s.pct}%)`}
                  />
                ))}
              </div>

              {/* Severity Legend */}
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {severityBreakdown.map((s, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2.5 w-2.5 rounded-full', s.color)} />
                      <span className="font-medium text-zinc-700 dark:text-zinc-300">{s.sev}</span>
                    </div>
                    <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100">
                      {s.count} ({s.pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Time Spent in Lifecycle Stages */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Lifecycle Phase Distribution
                </h3>
                <span className="text-xs font-mono text-zinc-400">Mean Duration</span>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                {lifecycleStages.map((stage, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-zinc-700 dark:text-zinc-300">{stage.stage}</span>
                      <span className="font-mono text-zinc-500">{stage.time} ({stage.pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${stage.pct}%` }}
                        className={cn(stage.color, 'h-full rounded-full')}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table 1: MTTR Benchmarks by Subsystem */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  MTTR by Service & Subsystem
                </h3>
                <span className="text-xs text-zinc-400">SLA Comparison</span>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                {mttrByService.map((srv, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
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

            {/* Table 2: Incidents by Root Cause Factor */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Contributing Factors & Root Causes
                </h3>
                <span className="text-xs text-zinc-400">Postmortem Insights</span>
              </div>

              <div className="space-y-3 pt-1 text-xs">
                {rootCauses.map((rc, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-zinc-700 dark:text-zinc-300">{rc.reason}</span>
                      <span className="font-mono text-zinc-500">{rc.count} incidents ({rc.pct}%)</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                      <div
                        style={{ width: `${rc.pct}%` }}
                        className="h-full bg-indigo-500 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

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
