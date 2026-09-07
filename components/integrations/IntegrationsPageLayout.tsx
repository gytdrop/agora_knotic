'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  Github,
  Globe,
  Menu,
  MessageSquare,
  Plus,
  Puzzle,
  Search,
  Settings,
  Shield,
  Video,
  X,
  Zap,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { SlackIcon } from '@/components/incidents/IncidentsTable';
import { cn } from '@/lib/utils';

export interface IntegrationCardItem {
  id: string;
  name: string;
  category: 'comms' | 'monitoring' | 'paging' | 'ticketing' | 'video';
  status: 'connected' | 'available';
  description: string;
  iconBg: string;
  badge?: string;
  account?: string;
}

export const DEMO_INTEGRATIONS: IntegrationCardItem[] = [
  {
    id: 'int-agora',
    name: 'Agora WebRTC Voice & Video',
    category: 'video',
    status: 'connected',
    description: 'Ultra-low latency audio/video engine powering War Room collaboration and AI multi-speaker transcription.',
    iconBg: 'bg-slate-900 text-white',
    badge: 'Core Engine',
    account: 'App ID: 3e8a...07b (Active)',
  },
  {
    id: 'int-slack',
    name: 'Slack',
    category: 'comms',
    status: 'connected',
    description: 'Auto-provision incident channels, sync timeline pins, and drive response via slash commands.',
    iconBg: 'bg-emerald-600 text-white',
    account: 'Workspace: Acme Corp (#incident-8921)',
  },
  {
    id: 'int-datadog',
    name: 'Datadog APM',
    category: 'monitoring',
    status: 'connected',
    description: 'Ingest latency spikes, 5xx error thresholds, and pod performance metrics into triage streams.',
    iconBg: 'bg-slate-800 text-white',
    account: 'Account: Datadog US1 Production',
  },
  {
    id: 'int-aws',
    name: 'AWS CloudWatch',
    category: 'monitoring',
    status: 'connected',
    description: 'Monitor ALB 504 gateway timeout rates, Lambda errors, and ECS cluster utilization alarms.',
    iconBg: 'bg-amber-600 text-white',
    account: 'Account: 9481-2294-0192 (us-east-1)',
  },
  {
    id: 'int-pagerduty',
    name: 'PagerDuty On-Call',
    category: 'paging',
    status: 'connected',
    description: 'Sync on-call schedules, escalate SEV-1 incidents, and page secondary responders via phone & SMS.',
    iconBg: 'bg-emerald-700 text-white',
    account: 'Service: Payments Core On-Call',
  },
  {
    id: 'int-jira',
    name: 'Jira Software',
    category: 'ticketing',
    status: 'connected',
    description: 'Automatically file post-incident follow-ups, link tracking keys, and synchronize resolution status.',
    iconBg: 'bg-slate-900 text-white',
    account: 'Instance: acme.atlassian.net',
  },
  {
    id: 'int-statuspage',
    name: 'Atlassian Statuspage',
    category: 'comms',
    status: 'connected',
    description: 'Publish customer-facing status updates and component degradation alerts directly to status.acme.com.',
    iconBg: 'bg-slate-700 text-white',
    account: 'Domain: status.acme.com',
  },
  {
    id: 'int-github',
    name: 'GitHub',
    category: 'ticketing',
    status: 'available',
    description: 'Correlate pull requests, deployment releases, and commit regressions with active incident timelines.',
    iconBg: 'bg-slate-800 text-white',
  },
  {
    id: 'int-zoom',
    name: 'Zoom Video Communications',
    category: 'video',
    status: 'available',
    description: 'Secondary video conferencing bridge for external executive briefings and customer calls.',
    iconBg: 'bg-slate-900 text-white',
  },
  {
    id: 'int-linear',
    name: 'Linear',
    category: 'ticketing',
    status: 'available',
    description: 'Create remediation cycle issues and link pull requests directly from incident action checklists.',
    iconBg: 'bg-slate-900 text-white',
  },
];

export function IntegrationsPageLayout() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<IntegrationCardItem | null>(null);

  const categories = [
    { id: 'all', label: 'All Integrations', count: DEMO_INTEGRATIONS.length },
    { id: 'comms', label: 'Communication & Chat', count: 2 },
    { id: 'monitoring', label: 'Observability & APM', count: 2 },
    { id: 'paging', label: 'On-Call & Paging', count: 1 },
    { id: 'ticketing', label: 'Ticketing & Code', count: 3 },
    { id: 'video', label: 'Voice & Video', count: 2 },
  ];

  const filteredIntegrations = DEMO_INTEGRATIONS.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={() => setIsCreateIncidentOpen(true)}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white dark:bg-slate-900 shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 cursor-pointer"
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
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Puzzle className="h-4 w-4 text-slate-900" />
            <span className="text-sm font-bold tracking-tight">Integrations</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-950/60 text-slate-900 dark:text-slate-400">
                  <Puzzle className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Integrations & Connected Apps
                </h1>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Connect chat platforms, telemetry monitors, on-call escalation providers, and issue trackers.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => alert('API tokens and webhook settings.')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                <span>API Tokens</span>
              </button>
              <button
                type="button"
                onClick={() => alert('Add integration modal opened.')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Integration</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors cursor-pointer',
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  )}
                >
                  <span>{cat.label}</span>
                  <span className="ml-1.5 opacity-60 text-[10px]">({cat.count})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-700/30"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIntegrations.map((item) => {
              const isConnected = item.status === 'connected';

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-lg font-bold text-xs',
                            item.iconBg
                          )}
                        >
                          {item.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {item.name}
                          </h3>
                          {item.badge && (
                            <span className="text-[10px] font-semibold text-slate-800 bg-slate-100 dark:bg-slate-950 dark:text-slate-300 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-800">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      {isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {item.description}
                    </p>

                    {item.account && (
                      <div className="text-[11px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded border border-slate-100 dark:border-slate-800 truncate">
                        {item.account}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    {isConnected ? (
                      <button
                        type="button"
                        onClick={() => setActiveModal(item)}
                        className="text-slate-900 dark:text-slate-400 font-semibold hover:underline cursor-pointer"
                      >
                        Manage Settings →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setActiveModal(item)}
                        className="text-slate-700 dark:text-slate-300 font-semibold hover:text-slate-900 cursor-pointer"
                      >
                        Connect App →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Integration Manage Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {activeModal.name}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  {activeModal.status === 'connected' ? 'Active' : 'Setup Required'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {activeModal.description}
            </p>

            {activeModal.account && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Connected Target:
                </div>
                <div className="font-mono text-slate-500 text-[11px]">{activeModal.account}</div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Settings updated for ${activeModal.name}`);
                  setActiveModal(null);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-2xs cursor-pointer"
              >
                Save Configuration
              </button>
            </div>
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

export default IntegrationsPageLayout;
