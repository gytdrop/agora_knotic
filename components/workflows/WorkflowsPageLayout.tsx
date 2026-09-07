'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Folder,
  History,
  Info,
  Loader2,
  Menu,
  Play,
  Plus,
  Search,
  Sparkles,
  Video,
  Workflow as WorkflowIcon,
  X,
  Zap,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { SlackIcon } from '@/components/incidents/IncidentsTable';
import { Execution, Workflow } from '@/lib/workflow-engine/types';
import { WorkflowExecutionModal } from './WorkflowExecutionModal';
import { WorkflowHistoryModal } from './WorkflowHistoryModal';
import { WorkflowBuilderModal } from './WorkflowBuilderModal';
import { cn } from '@/lib/utils';

export function WorkflowsPageLayout() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [activeExecution, setActiveExecution] = useState<Execution | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  const [historyWorkflow, setHistoryWorkflow] = useState<Workflow | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isBuilderModalOpen, setIsBuilderModalOpen] = useState(false);
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null);

  const fetchWorkflows = async () => {
    try {
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
      }
    } catch {
      // Fetch error handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

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

  const toggleWorkflow = async (id: string) => {
    const target = workflows.find((w) => w.id === id);
    if (!target) return;
    const nextState = !target.enabled;

    // Optimistic UI update
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: nextState } : w))
    );

    try {
      await fetch(`/api/workflows/${id}/${nextState ? 'enable' : 'disable'}`, {
        method: 'POST',
      });
    } catch {
      // Revert if failed
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, enabled: !nextState } : w))
      );
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedWorkflows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRunWorkflow = async (workflow: Workflow) => {
    setRunningWorkflowId(workflow.id);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.execution) {
          setActiveExecution(data.execution);
          setIsExecutionModalOpen(true);
        }
      }
    } catch (err) {
      console.error('Failed to run workflow', err);
    } finally {
      setRunningWorkflowId(null);
    }
  };

  const handleOpenHistory = (workflow: Workflow) => {
    setHistoryWorkflow(workflow);
    setIsHistoryModalOpen(true);
  };

  // Dynamic folders calculation
  const folderCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    workflows.forEach((w) => {
      const f = w.folder || 'General';
      counts[f] = (counts[f] || 0) + 1;
    });
    return counts;
  }, [workflows]);

  const filteredWorkflows = workflows.filter((w) => {
    if (selectedFolder !== 'all' && (w.folder || '').toLowerCase() !== selectedFolder.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        w.name.toLowerCase().includes(q) ||
        (w.description || '').toLowerCase().includes(q) ||
        (w.folder || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getActionIcon = (type: string) => {
    if (type.includes('slack')) return <SlackIcon className="h-3 w-3 text-slate-900" />;
    if (type.includes('war_room')) return <Video className="h-3 w-3 text-slate-900" />;
    if (type.includes('ai') || type.includes('post_mortem')) return <Sparkles className="h-3 w-3 text-amber-500" />;
    return <Zap className="h-3 w-3 text-emerald-600" />;
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white text-slate-900 font-sans antialiased">
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
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
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
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <WorkflowIcon className="h-4 w-4 text-slate-900" />
            <span className="text-sm font-bold tracking-tight">Workflows</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 w-full px-6 py-6 space-y-6">
          {/* Header Matching Rootly Screenshot */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Workflows
              </h1>
              <span
                title="Automate incident lifecycle actions, notifications, and follow-ups"
                className="text-slate-400 hover:text-slate-600 cursor-help"
              >
                <Info className="h-4 w-4" />
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (workflows.length > 0) {
                    handleOpenHistory(workflows[0]);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
                title="View execution history"
              >
                <History className="h-3.5 w-3.5 text-slate-500" />
                <span>Execution History</span>
              </button>

              <button
                type="button"
                onClick={() => setIsBuilderModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors cursor-pointer"
              >
                Create via Template
              </button>
              <button
                type="button"
                onClick={() => setIsBuilderModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Workflow</span>
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
                    ? 'bg-slate-100 text-slate-800'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <Zap className="h-3.5 w-3.5 text-slate-900" />
                <span>All Workflows</span>
                <span className="ml-auto text-[10px] text-slate-400">{workflows.length}</span>
              </button>

              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 pt-2">
                Folders
              </div>

              <div className="space-y-0.5">
                {Object.entries(folderCounts).map(([folderName, count]) => (
                  <button
                    key={folderName}
                    type="button"
                    onClick={() => setSelectedFolder(folderName)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer',
                      selectedFolder.toLowerCase() === folderName.toLowerCase()
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{folderName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">{count}</span>
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <span>View: All</span>
                  <ChevronDown className="h-3 w-3 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsBuilderModalOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  <Plus className="h-3 w-3 text-slate-400" />
                  <span>Add Filters</span>
                </button>
              </div>

              {/* Table Toolbar Search & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search workflows"
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 bg-transparent text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-700/20"
                    style={{ backgroundColor: 'transparent' }}
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
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
                    className="inline-flex items-center gap-1 hover:text-slate-900 cursor-pointer"
                  >
                    <span>Expand all</span>
                  </button>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={filteredWorkflows.length > 0 && selectedIds.length === filteredWorkflows.length}
                      onChange={toggleSelectAll}
                      className="h-3.5 w-3.5 rounded border border-slate-300 bg-transparent text-slate-900 focus:ring-slate-700 shrink-0 cursor-pointer"
                      style={{ backgroundColor: 'transparent' }}
                    />
                    <span>Select all</span>
                  </label>
                </div>
              </div>

              {/* Workflows List Rows */}
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-900" />
                  <span className="text-xs">Loading automated workflows...</span>
                </div>
              ) : filteredWorkflows.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border border-slate-200 rounded-lg p-6">
                  <WorkflowIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">No workflows found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try adjusting your search query or folder filter.</p>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  {filteredWorkflows.map((wf) => {
                    const isExpanded = !!expandedWorkflows[wf.id];
                    const isRunning = runningWorkflowId === wf.id;

                    return (
                      <div
                        key={wf.id}
                        className="rounded-lg border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(wf.id)}
                              onChange={() => toggleSelect(wf.id)}
                              className="h-3.5 w-3.5 rounded border border-slate-300 bg-transparent text-slate-900 focus:ring-slate-700 shrink-0 cursor-pointer"
                              style={{ backgroundColor: 'transparent' }}
                            />

                            {/* Toggle Switch */}
                            <button
                              type="button"
                              onClick={() => toggleWorkflow(wf.id)}
                              title={wf.enabled ? 'Click to disable' : 'Click to enable'}
                              className={cn(
                                'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-2 ring-transparent',
                                wf.enabled ? 'bg-slate-900' : 'bg-slate-200'
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
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {wf.name}
                            </span>

                            {/* Type Badge */}
                            <span
                              className={cn(
                                'text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0',
                                wf.type === 'incident'
                                  ? 'bg-slate-100 text-slate-800 border border-slate-200'
                                  : 'bg-slate-100 text-slate-800 border border-slate-200'
                              )}
                            >
                              {wf.type}
                            </span>

                            {/* Action Count Chip */}
                            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline-block">
                              {wf.actions.length} {wf.actions.length === 1 ? 'action' : 'actions'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Run Now Button */}
                            <button
                              type="button"
                              onClick={() => handleRunWorkflow(wf)}
                              disabled={isRunning}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                              title="Run workflow immediately"
                            >
                              {isRunning ? (
                                <Loader2 className="h-3 w-3 animate-spin text-slate-300" />
                              ) : (
                                <Play className="h-3 w-3 fill-current text-slate-400" />
                              )}
                              <span>{isRunning ? 'Running...' : 'Run Now'}</span>
                            </button>

                            {/* History Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenHistory(wf)}
                              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                              title="View execution history"
                            >
                              <History className="h-3.5 w-3.5" />
                            </button>

                            {/* Expand Chevron */}
                            <button
                              type="button"
                              onClick={() => toggleExpand(wf.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                              title={isExpanded ? 'Collapse pipeline' : 'Expand pipeline'}
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

                        {/* Expandable Details Drawer with Pipeline Graph */}
                        {isExpanded && (
                          <div className="bg-slate-50 border-t border-slate-100 p-4 text-xs text-slate-600 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-800">Trigger Condition:</span>
                              <span className="font-mono text-[11px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-semibold inline-flex items-center gap-1">
                                <Zap className="h-3 w-3 text-slate-900" />
                                {wf.trigger.description || wf.trigger.type}
                              </span>
                            </div>

                            <div>
                              <span className="font-semibold text-slate-800 block mb-1">Description:</span>
                              <p className="text-slate-600 text-[11px] leading-relaxed">{wf.description}</p>
                            </div>

                            {/* Step Pipeline Visualization */}
                            <div>
                              <span className="font-semibold text-slate-800 block mb-2">Execution Pipeline:</span>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {/* Trigger Node */}
                                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-200">
                                  <Zap className="h-3 w-3" />
                                  <span>{wf.trigger.type}</span>
                                </div>

                                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />

                                {/* Action Nodes */}
                                {wf.actions.map((act, aIdx) => (
                                  <React.Fragment key={act.id || aIdx}>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 text-slate-800 text-[11px] shadow-2xs hover:border-slate-300 transition-colors">
                                      {getActionIcon(act.type)}
                                      <span className="font-medium">{act.name}</span>
                                    </div>
                                    {aIdx < wf.actions.length - 1 && (
                                      <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />
                                    )}
                                  </React.Fragment>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Pagination Matching Rootly */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>Showing 1 to {filteredWorkflows.length} of {filteredWorkflows.length}</span>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1 rounded border border-slate-700 text-slate-900 font-bold bg-slate-100">
                    1
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Execution Live Runner Modal */}
      <WorkflowExecutionModal
        isOpen={isExecutionModalOpen}
        onClose={() => setIsExecutionModalOpen(false)}
        execution={activeExecution}
      />

      {/* Execution History Modal */}
      <WorkflowHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        workflow={historyWorkflow}
        onRunWorkflow={(wf) => {
          setIsHistoryModalOpen(false);
          handleRunWorkflow(wf);
        }}
      />

      {/* Workflow Builder Modal */}
      <WorkflowBuilderModal
        isOpen={isBuilderModalOpen}
        onClose={() => setIsBuilderModalOpen(false)}
        onCreated={fetchWorkflows}
      />

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
