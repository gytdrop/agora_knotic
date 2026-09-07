'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  History,
  Loader2,
  Play,
  RotateCcw,
  X,
  XCircle,
} from 'lucide-react';
import { Execution, Workflow } from '@/lib/workflow-engine/types';
import { WorkflowExecutionModal } from './WorkflowExecutionModal';
import { cn } from '@/lib/utils';

interface WorkflowHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow | null;
  onRunWorkflow?: (workflow: Workflow) => void;
}

export function WorkflowHistoryModal({
  isOpen,
  onClose,
  workflow,
  onRunWorkflow,
}: WorkflowHistoryModalProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExecution, setSelectedExecution] = useState<Execution | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!workflow) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}/history?limit=30`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } catch {
      // Fetch error handled
    } finally {
      setLoading(false);
    }
  }, [workflow]);

  useEffect(() => {
    if (isOpen && workflow) {
      fetchHistory();
    }
  }, [isOpen, workflow, fetchHistory]);

  if (!isOpen || !workflow) return null;

  return (
    <>
      <div className="fixed inset-0 z-45 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs font-sans">
        <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Execution History</h3>
                <p className="text-xs text-zinc-500">{workflow.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onRunWorkflow && (
                <button
                  type="button"
                  onClick={() => {
                    onRunWorkflow(workflow);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Run Now</span>
                </button>
              )}
              <button
                type="button"
                onClick={fetchHistory}
                className="p-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-600 cursor-pointer"
                title="Refresh history"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <span className="text-xs">Loading execution records...</span>
              </div>
            ) : executions.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 space-y-2">
                <History className="h-8 w-8 mx-auto text-zinc-300" />
                <p className="text-xs font-medium">No execution records found for this workflow.</p>
                <p className="text-[11px] text-zinc-400">Click &quot;Run Now&quot; to execute this pipeline.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
                {executions.map((exec) => {
                  const isSuccess = exec.status === 'success';
                  const isFailed = exec.status === 'failed';

                  return (
                    <div
                      key={exec.id}
                      onClick={() => setSelectedExecution(exec)}
                      className="flex items-center justify-between p-3.5 hover:bg-zinc-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            'h-7 w-7 rounded-md flex items-center justify-center shrink-0',
                            isSuccess && 'bg-emerald-50 text-emerald-600',
                            isFailed && 'bg-rose-50 text-rose-600',
                            exec.status === 'running' && 'bg-blue-50 text-blue-600'
                          )}
                        >
                          {isSuccess && <CheckCircle2 className="h-4 w-4" />}
                          {isFailed && <XCircle className="h-4 w-4" />}
                          {exec.status === 'running' && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-900 font-mono">
                              {exec.id}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.2 rounded uppercase',
                                isSuccess && 'bg-emerald-100 text-emerald-800',
                                isFailed && 'bg-rose-100 text-rose-800',
                                exec.status === 'running' && 'bg-blue-100 text-blue-800'
                              )}
                            >
                              {exec.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span>Trigger: {exec.triggerType}</span>
                            <span>•</span>
                            <span>{new Date(exec.startedAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-xs">
                        <span className="text-zinc-500 font-mono">
                          {exec.durationMs !== undefined ? `${exec.durationMs}ms` : '—'}
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
            <span>Showing recent runs ({executions.length})</span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-100 font-semibold text-zinc-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Modal for Detailed Execution View */}
      <WorkflowExecutionModal
        isOpen={!!selectedExecution}
        onClose={() => setSelectedExecution(null)}
        execution={selectedExecution}
      />
    </>
  );
}
