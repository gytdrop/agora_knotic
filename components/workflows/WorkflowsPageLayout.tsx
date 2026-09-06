'use client';

import React, { useState } from 'react';
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  Info,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Workflow,
  X,
  Zap,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { SlackIcon } from '@/components/incidents/IncidentsTable';
import { cn } from '@/lib/utils';

export interface WorkflowItem {
  id: string;
  name: string;
  enabled: boolean;
  type: 'incident' | 'post-incident' | 'alert';
  folder: string;
  integration: 'slack' | 'pagerduty' | 'statuspage' | 'jira' | 'ai';
  description: string;
  trigger: string;
}

export const INITIAL_WORKFLOWS: WorkflowItem[] = [
  {
    id: 'wf-1',
    name: '[Demo] Page on-call for high-severity incidents',
    enabled: true,
    type: 'incident',
    folder: 'Slack',
    integration: 'slack',
    trigger: 'Incident Created (SEV-0, SEV-1)',
    description: 'Pages Primary and Secondary On-Call engineers and triggers Slack channel creation.',
  },
  {
    id: 'wf-2',
    name: 'Auto-create Slack incident channel & invite responders',
    enabled: true,
    type: 'incident',
    folder: 'Slack',
    integration: 'slack',
    trigger: 'Incident Created',
    description: 'Creates #incident-[id], pins runbooks, and invites on-call responders.',
  },
  {
    id: 'wf-3',
    name: 'Post status update to Statuspage on SEV-1 declaration',
    enabled: true,
    type: 'incident',
    folder: 'Statuspage',
    integration: 'statuspage',
    trigger: 'Severity Changed to SEV-1',
    description: 'Drafts and publishes partial outage notice on status.acme.com.',
  },
  {
    id: 'wf-4',
    name: 'Generate AI Post-Mortem draft on incident resolution',
    enabled: true,
    type: 'post-incident',
    folder: 'AI',
    integration: 'ai',
    trigger: 'Incident Resolved',
    description: 'Invokes AI post-mortem synthesizer to generate timeline and root cause summary.',
  },
  {
    id: 'wf-5',
    name: 'File Jira follow-up tickets for uncompleted actions',
    enabled: true,
    type: 'post-incident',
    folder: 'Jira',
    integration: 'jira',
    trigger: 'Incident Closed',
    description: 'Creates Jira issues in project PAY and INFRA for remaining post-incident tasks.',
  },
];

export function WorkflowsPageLayout() {
  const [workflows, setWorkflows] = useState<WorkflowItem[]>(INITIAL_WORKFLOWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({});

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredWorkflows.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredWorkflows.map((w) => w.id));
    }
  };

  const toggleWorkflow = (id: string) => {
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedWorkflows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredWorkflows = workflows.filter((w) => {
    if (selectedFolder !== 'all' && w.folder.toLowerCase() !== selectedFolder.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return w.name.toLowerCase().includes(q) || w.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white text-zinc-900 font-sans antialiased">
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
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
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
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-zinc-600 hover:bg-zinc-100 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-bold tracking-tight">Workflows</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 w-full px-6 py-6 space-y-6">
          {/* Header Matching Rootly Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900">
                Workflows
              </h1>
              <span
                title="Automate incident lifecycle actions, notifications, and follow-ups"
                className="text-zinc-400 hover:text-zinc-600 cursor-help"
              >
                <Info className="h-4 w-4" />
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 cursor-pointer"
                title="More options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => alert('Browse workflow templates.')}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-2xs transition-colors cursor-pointer"
              >
                Create via Template
              </button>
              <button
                type="button"
                onClick={() => alert('New Workflow builder opened.')}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
              >
                Create Workflow
              </button>
            </div>
          </div>

          {/* Two Column Layout: Left Folders + Right Table */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Left Sub-Nav Folders Matching Rootly */}
            <div className="w-full lg:w-48 shrink-0 space-y-3">
              <button
                type="button"
                onClick={() => setSelectedFolder('all')}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  selectedFolder === 'all'
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-zinc-600 hover:bg-zinc-50'
                )}
              >
                <Zap className="h-3.5 w-3.5 text-purple-600" />
                <span>All Workflows</span>
              </button>

              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-3 pt-2">
                Folders
              </div>

              <div className="space-y-0.5">
                {[
                  { name: 'Slack', count: 2 },
                  { name: 'Statuspage', count: 1 },
                  { name: 'AI', count: 1 },
                  { name: 'Jira', count: 1 },
                ].map((fld) => (
                  <button
                    key={fld.name}
                    type="button"
                    onClick={() => setSelectedFolder(fld.name)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer',
                      selectedFolder.toLowerCase() === fld.name.toLowerCase()
                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                        : 'text-zinc-600 hover:bg-zinc-50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-3.5 w-3.5 text-amber-500" />
                      <span>{fld.name}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400">{fld.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Right Main Table Column */}
            <div className="flex-1 w-full min-w-0 space-y-4">
              {/* Filter Controls Row Matching Rootly */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  <span>View: All</span>
                  <ChevronDown className="h-3 w-3 text-zinc-400" />
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-zinc-300 rounded-lg text-xs font-medium text-zinc-600 hover:bg-zinc-50 cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-zinc-400" />
                  <span>Add Filters</span>
                </button>
              </div>

              {/* Table Toolbar Search & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows"
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-transparent text-xs text-zinc-900 placeholder-zinc-400 outline-none focus:ring-2 focus:ring-purple-500/20"
                    style={{ backgroundColor: 'transparent' }}
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-600">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    <span>Newest</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const allExpanded = Object.keys(expandedWorkflows).length === filteredWorkflows.length;
                      if (allExpanded) {
                        setExpandedWorkflows({});
                      } else {
                        const next: Record<string, boolean> = {};
                        filteredWorkflows.forEach((w) => (next[w.id] = true));
                        setExpandedWorkflows(next);
                      }
                    }}
                    className="inline-flex items-center gap-1 hover:text-zinc-900 cursor-pointer"
                  >
                    <span>Expand all</span>
                  </button>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filteredWorkflows.length > 0 && selectedIds.length === filteredWorkflows.length}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border border-zinc-300 bg-transparent text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                      style={{ backgroundColor: 'transparent' }}
                    />
                    <span>Select all</span>
                  </label>
                </div>
              </div>

              {/* Workflows List Rows */}
              <div className="space-y-2 pt-1">
                {filteredWorkflows.map((wf) => {
                  const isExpanded = !!expandedWorkflows[wf.id];

                  return (
                    <div
                      key={wf.id}
                      className="rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 transition-all shadow-2xs overflow-hidden"
                    >
                      <div className="flex items-center justify-between p-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(wf.id)}
                            onChange={() => toggleSelect(wf.id)}
                            className="h-3.5 w-3.5 rounded border border-zinc-300 bg-transparent text-purple-600 focus:ring-purple-500 shrink-0 cursor-pointer"
                            style={{ backgroundColor: 'transparent' }}
                          />

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => toggleWorkflow(wf.id)}
                            className={cn(
                              'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent',
                              wf.enabled ? 'bg-purple-600' : 'bg-zinc-200'
                            )}
                          >
                            <span
                              className={cn(
                                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-0.5',
                                wf.enabled ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'
                              )}
                            />
                          </button>

                          {/* Title */}
                          <span className="text-xs font-semibold text-zinc-900 truncate">
                            {wf.name}
                          </span>

                          {/* Badge */}
                          <span
                            className={cn(
                              'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0',
                              wf.type === 'incident'
                                ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            )}
                          >
                            {wf.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* Integration Icon */}
                          {wf.integration === 'slack' && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-50 text-purple-700">
                              <SlackIcon className="h-3 w-3" />
                            </div>
                          )}
                          {wf.integration === 'ai' && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-purple-100 text-purple-700">
                              <Sparkles className="h-3 w-3" />
                            </div>
                          )}

                          <button
                            type="button"
                            className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleExpand(wf.id)}
                            className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                          >
                            <ChevronDown
                              className={cn(
                                'h-3.5 w-3.5 transition-transform',
                                isExpanded ? 'rotate-180' : ''
                              )}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div className="bg-zinc-50 border-t border-zinc-100 p-3.5 text-xs text-zinc-600 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-800">Trigger Condition:</span>
                            <span className="font-mono text-[11px] bg-white border border-zinc-200 px-2 py-0.5 rounded">
                              {wf.trigger}
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-800">Execution Actions: </span>
                            <span>{wf.description}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer Pagination Matching Rootly */}
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-100">
                <span>Showing 1 to {filteredWorkflows.length} of {filteredWorkflows.length}</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1 rounded border border-purple-500 text-purple-600 font-bold bg-purple-50">
                    1
                  </span>
                </div>
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

export default WorkflowsPageLayout;
