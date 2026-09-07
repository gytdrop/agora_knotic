'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Globe,
  Menu,
  Plus,
  Radio,
  Send,
  Shield,
  Sliders,
  Users,
  X,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { cn } from '@/lib/utils';

export interface ComponentHealthItem {
  id: string;
  name: string;
  group: string;
  status: 'operational' | 'degraded' | 'outage' | 'maintenance';
  uptime30d: string;
  description: string;
}

export const DEMO_COMPONENTS: ComponentHealthItem[] = [
  {
    id: 'cmp-payments',
    name: 'Payment Processing Service',
    group: 'Core Infrastructure',
    status: 'outage',
    uptime30d: '98.42%',
    description: 'Elevated 5xx failure rate (47.2%) under active investigation (#INC-8921).',
  },
  {
    id: 'cmp-checkout',
    name: 'Web & Mobile Checkout Flow',
    group: 'Customer Applications',
    status: 'degraded',
    uptime30d: '99.12%',
    description: 'Increased checkout submit latency (avg 6.2s).',
  },
  {
    id: 'cmp-gateway',
    name: 'Production API Gateway',
    group: 'Core Infrastructure',
    status: 'operational',
    uptime30d: '99.98%',
    description: 'All ingress points nominal in us-east-1 and eu-west-1.',
  },
  {
    id: 'cmp-auth',
    name: 'Authentication & SSO',
    group: 'Identity Services',
    status: 'operational',
    uptime30d: '100.0%',
    description: 'OAuth2 and session token validation fully operational.',
  },
  {
    id: 'cmp-webhooks',
    name: 'Webhook Deliveries',
    group: 'Integration Services',
    status: 'operational',
    uptime30d: '99.95%',
    description: 'Event delivery queue depth nominal at < 50ms.',
  },
  {
    id: 'cmp-db',
    name: 'Database Replicas & Cache',
    group: 'Data Stores',
    status: 'operational',
    uptime30d: '99.99%',
    description: 'Primary and read replica pool utilization at 22%.',
  },
];

export function StatusPageLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [isPostUpdateOpen, setIsPostUpdateOpen] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [updatePosted, setUpdatePosted] = useState(false);

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;
    setUpdatePosted(true);
    setTimeout(() => {
      setIsPostUpdateOpen(false);
      setUpdatePosted(false);
      setUpdateText('');
    }, 1500);
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
            <Globe className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-bold tracking-tight">Status Pages</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Globe className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Status Pages
                </h1>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
                Let your team and customers know when your services are down with private and public status pages. Show service uptime, post your incidents directly to the page and connect third party services your company is dependent on.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPostUpdateOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5 text-zinc-400" />
                <span>Post Update</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Create Status Page modal opened.')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Status Page</span>
              </button>
            </div>
          </div>

          {/* Active Status Page Card */}
          <div className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/80 dark:text-amber-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                      Acme Inc. Production Status
                    </h2>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 dark:bg-amber-900/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      Partial Outage
                    </span>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                    <span className="font-mono">status.acme.com</span>
                    <span>•</span>
                    <span>1,420 email & webhook subscribers</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="https://status.acme.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <span>View Live Page</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Active Incident Broadcast Banner */}
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-xs font-bold text-red-900 dark:text-red-200">
                    Active Incident: Payment Latency & Timeout Degradation
                  </span>
                </div>
                <Link
                  href="/incidents/INC-8921"
                  className="text-[11px] font-semibold text-red-700 dark:text-red-300 hover:underline font-mono"
                >
                  #INC-8921 →
                </Link>
              </div>
              <p className="text-xs text-red-800 dark:text-red-300 leading-relaxed">
                <strong>Investigating (15:42 UTC):</strong> We are observing intermittent 504 timeouts and elevated latency during checkout authorization. Our engineering team has isolated downstream socket saturation and is actively executing a canary rollback.
              </p>
            </div>
          </div>

          {/* Component Health Matrix Table */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  System Components Status
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Real-time telemetry and 30-day availability across infrastructure services.
                </p>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-400">
                Overall: 99.94% Uptime
              </span>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
              {DEMO_COMPONENTS.map((cmp) => {
                const isOutage = cmp.status === 'outage';
                const isDegraded = cmp.status === 'degraded';
                const isOperational = cmp.status === 'operational';

                return (
                  <div key={cmp.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {cmp.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                          {cmp.group}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {cmp.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                          {cmp.uptime30d}
                        </div>
                        <div className="text-[10px] text-zinc-400">30d uptime</div>
                      </div>

                      <div className="w-28 text-right">
                        {isOutage && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Partial Outage
                          </span>
                        )}
                        {isDegraded && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Degraded
                          </span>
                        )}
                        {isOperational && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-900">
                            <CheckCircle2 className="h-3 w-3" />
                            Operational
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 90-Day Uptime Historical Bar Visualizer */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Historical System Uptime (Past 90 Days)
              </span>
              <span className="font-mono text-zinc-500">99.94% Uptime</span>
            </div>

            <div className="flex items-center gap-0.5 h-7 w-full overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800 p-1">
              {Array.from({ length: 88 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex-1 h-full bg-emerald-500 hover:opacity-80 rounded-xs transition-opacity cursor-help"
                  title={`Day -${90 - idx}: 100% Operational`}
                />
              ))}
              <div
                className="flex-1 h-full bg-amber-500 hover:opacity-80 rounded-xs"
                title="Yesterday: 99.8% Minor Degradation"
              />
              <div
                className="flex-1 h-full bg-rose-500 hover:opacity-80 rounded-xs animate-pulse"
                title="Today: Partial Outage (#INC-8921)"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </main>
      </div>

      {/* Post Update Modal Dialog */}
      {isPostUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                Broadcast Statuspage Update
              </h3>
              <button
                type="button"
                onClick={() => setIsPostUpdateOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {updatePosted ? (
              <div className="py-8 text-center text-emerald-600 font-semibold text-xs space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto" />
                <div>Update broadcasted to status.acme.com and all 1,420 subscribers.</div>
              </div>
            ) : (
              <form onSubmit={handlePostUpdate} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Incident Update Message
                  </label>
                  <textarea
                    rows={4}
                    value={updateText}
                    onChange={(e) => setUpdateText(e.target.value)}
                    placeholder="We have verified the canary rollback and error rates are recovering to normal thresholds..."
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 p-2.5 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/30"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsPostUpdateOpen(false)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-2xs cursor-pointer"
                  >
                    Publish to status.acme.com
                  </button>
                </div>
              </form>
            )}
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

export default StatusPageLayout;
