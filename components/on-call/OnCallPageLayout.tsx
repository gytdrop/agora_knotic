'use client';

import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Menu,
  PhoneCall,
  Plus,
  RefreshCw,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { cn } from '@/lib/utils';

export interface ScheduleItem {
  id: string;
  name: string;
  type: string;
  primary: string;
  primaryAvatar: string;
  secondary: string;
  secondaryAvatar: string;
  rotation: string;
  nextShift: string;
  coverage: string;
}

export const DEMO_SCHEDULES: ScheduleItem[] = [
  {
    id: 'sch-payments',
    name: 'Payments Core',
    type: '24/7 Primary Rotation',
    primary: 'Ashley Sawatsky',
    primaryAvatar: 'AS',
    secondary: 'David Chen',
    secondaryAvatar: 'DC',
    rotation: 'Weekly on Mondays at 09:00 UTC',
    nextShift: 'David Chen (in 3 days)',
    coverage: '100% Coverage',
  },
  {
    id: 'sch-fraud',
    name: 'Fraud SRE',
    type: 'Follow-the-Sun Rotation',
    primary: 'Meera Patel',
    primaryAvatar: 'MP',
    secondary: 'Alex Mercer',
    secondaryAvatar: 'AM',
    rotation: 'Daily 12h handover at 08:00 & 20:00 UTC',
    nextShift: 'Alex Mercer (in 4 hours)',
    coverage: '100% Coverage',
  },
  {
    id: 'sch-db',
    name: 'Database Infrastructure',
    type: 'Tiered 24/7 Rotation',
    primary: 'Sarah Connor',
    primaryAvatar: 'SC',
    secondary: 'Marcus Vance',
    secondaryAvatar: 'MV',
    rotation: 'Bi-weekly on Wednesdays',
    nextShift: 'Marcus Vance (in 6 days)',
    coverage: '100% Coverage',
  },
  {
    id: 'sch-platform',
    name: 'Core Platform Engineering',
    type: 'Follow-the-Sun Rotation',
    primary: 'David Chen',
    primaryAvatar: 'DC',
    secondary: 'Ashley Sawatsky',
    secondaryAvatar: 'AS',
    rotation: 'Weekly on Mondays at 09:00 UTC',
    nextShift: 'Ashley Sawatsky (in 3 days)',
    coverage: '100% Coverage',
  },
];

export function OnCallPageLayout() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'escalations' | 'shifts' | 'overrides'>('schedules');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [overrideSuccessMessage, setOverrideSuccessMessage] = useState<string | null>(null);

  const handleQuickSwap = (scheduleName: string) => {
    setOverrideSuccessMessage(`Requested temporary coverage for ${scheduleName}. Responders notified.`);
    setTimeout(() => setOverrideSuccessMessage(null), 4000);
  };

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
            <PhoneCall className="h-4 w-4 text-slate-900" />
            <span className="text-sm font-bold tracking-tight">On-Call</span>
          </div>
        </div>

        {/* Page Body */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <PhoneCall className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  On-Call Management
                </h1>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Rotations, escalation policies, real-time paging schedules, and coverage overrides.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickSwap('Payments Core')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                <span>Request Coverage</span>
              </button>
              <button
                type="button"
                onClick={() => alert('New Schedule modal opened.')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Schedule</span>
              </button>
            </div>
          </div>

          {overrideSuccessMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in duration-200">
              <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{overrideSuccessMessage}</span>
            </div>
          )}

          {/* User Live On-Call Alert Hero Card */}
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold text-sm ring-4 ring-emerald-50 dark:ring-emerald-950">
                AS
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    You are currently ON-CALL (Primary)
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <div className="text-xs text-emerald-800/90 dark:text-emerald-400 flex flex-wrap items-center gap-2">
                  <span>Payments Core Service</span>
                  <span>•</span>
                  <span>Shift ends tomorrow at 08:00 UTC</span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    Phone & Push notifications active
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-200/80 dark:border-emerald-800">
                100% On-Call Readiness
              </span>
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'schedules', label: 'Schedules', icon: Calendar, count: 4 },
              { id: 'escalations', label: 'Escalation Policies', icon: Shield, count: 2 },
              { id: 'shifts', label: 'My Shifts', icon: Clock },
              { id: 'overrides', label: 'Overrides & Swaps', icon: RefreshCw },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    'inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px]',
                        isActive
                          ? 'bg-slate-700 text-slate-100 dark:bg-slate-300 dark:text-slate-900 font-bold'
                          : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: SCHEDULES */}
          {activeTab === 'schedules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_SCHEDULES.map((sch) => (
                  <div
                    key={sch.id}
                    className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                          {sch.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {sch.type} • {sch.rotation}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                        {sch.coverage}
                      </span>
                    </div>

                    {/* Responders Details */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="space-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Primary (Active Now)
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-300 font-bold text-[10px]">
                            {sch.primaryAvatar}
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {sch.primary}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                          Secondary
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px]">
                            {sch.secondaryAvatar}
                          </div>
                          <span className="text-slate-600 dark:text-slate-400 truncate">
                            {sch.secondary}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Visual 7-day Rotation Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Upcoming handover</span>
                        <span>{sch.nextShift}</span>
                      </div>
                      <div className="grid grid-cols-7 gap-1 h-2 rounded overflow-hidden">
                        <div className="bg-slate-900 rounded-xs" title="Mon: Primary" />
                        <div className="bg-slate-900 rounded-xs" title="Tue: Primary" />
                        <div className="bg-slate-900 rounded-xs" title="Wed: Primary" />
                        <div className="bg-slate-400 rounded-xs" title="Thu: Primary" />
                        <div className="bg-slate-700 rounded-xs" title="Fri: Secondary" />
                        <div className="bg-slate-700 rounded-xs" title="Sat: Secondary" />
                        <div className="bg-slate-700 rounded-xs" title="Sun: Secondary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ESCALATION POLICIES */}
          {activeTab === 'escalations' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>High Severity Escalation Policy (SEV-0 / SEV-1)</span>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-400">
                        Active Paging Rule
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Executed immediately when an incident is declared as Critical or Major.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shrink-0">
                      1
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Step 1: Immediate Notification (0 min delay)
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Page Primary On-Call via Voice call, high-priority SMS, and Push notification.
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Target: Primary Responder</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-xs shrink-0">
                      2
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Step 2: Escalation if Unacknowledged (5 min delay)
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Page Secondary On-Call responder + broadcast urgent alert to Slack #sre-critical.
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Target: Secondary Responder</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-xs shrink-0">
                      3
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        Step 3: Executive Paging (10 min delay)
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Page Engineering Leadership (Elena Rostova) and automatically provision Agora War Room.
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">Target: Eng Director</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MY SHIFTS */}
          {activeTab === 'shifts' && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Your Upcoming On-Call Rotations
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Payments Core — Primary On-Call
                    </div>
                    <div className="text-slate-400 text-[11px]">Active Now — ends Tomorrow, 08:00 UTC</div>
                  </div>
                  <span className="text-emerald-600 font-bold">Active</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      Core Platform Engineering — Secondary On-Call
                    </div>
                    <div className="text-slate-400 text-[11px]">Starts in 3 days: Monday 09:00 UTC</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickSwap('Core Platform Engineering')}
                    className="text-slate-900 hover:text-slate-800 font-medium cursor-pointer"
                  >
                    Request Swap
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: OVERRIDES */}
          {activeTab === 'overrides' && (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Recent Coverage Overrides & Swaps
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Audited schedule overrides and temporary shift coverage handoffs.
              </p>
              <div className="space-y-2 pt-2">
                <div className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      David Chen covered for Ashley Sawatsky
                    </div>
                    <div className="text-slate-400 text-[11px]">Last Tuesday (4h PTO window) • Payments Core</div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          )}
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

export default OnCallPageLayout;
