'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Video,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { SlackIcon } from '@/components/incidents/IncidentsTable';
import { Execution } from '@/lib/workflow-engine/types';
import { cn } from '@/lib/utils';

interface WorkflowExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  execution: Execution | null;
  isRunning?: boolean;
}

export function WorkflowExecutionModal({
  isOpen,
  onClose,
  execution,
  isRunning = false,
}: WorkflowExecutionModalProps) {
  const [activeTab, setActiveTab] = useState<'timeline' | 'logs' | 'context'>('timeline');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  if (!isOpen || !execution) return null;

  const isSuccess = execution.status === 'success';
  const isFailed = execution.status === 'failed';
  const running = isRunning || execution.status === 'running';

  const getActionIcon = (type: string) => {
    if (type.includes('slack')) return <SlackIcon className="h-4 w-4 text-purple-600" />;
    if (type.includes('war_room')) return <Video className="h-4 w-4 text-blue-600" />;
    if (type.includes('ai') || type.includes('post_mortem')) return <Sparkles className="h-4 w-4 text-amber-500" />;
    return <Zap className="h-4 w-4 text-emerald-600" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center',
                isSuccess && 'bg-emerald-100 text-emerald-700',
                isFailed && 'bg-rose-100 text-rose-700',
                running && 'bg-blue-100 text-blue-700'
              )}
            >
              {running && <Loader2 className="h-5 w-5 animate-spin" />}
              {isSuccess && <CheckCircle2 className="h-5 w-5" />}
              {isFailed && <XCircle className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-zinc-900">{execution.workflowName}</h3>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    isSuccess && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
                    isFailed && 'bg-rose-50 text-rose-700 border border-rose-200',
                    running && 'bg-blue-50 text-blue-700 border border-blue-200 animate-pulse'
                  )}
                >
                  {execution.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                <span className="font-mono text-[11px] text-zinc-400">{execution.id}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3 w-3 text-purple-600" />
                  {execution.triggerType}
                </span>
                {execution.durationMs !== undefined && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      {execution.durationMs}ms
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 px-6 bg-white text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={cn(
              'py-2.5 px-3 border-b-2 transition-colors cursor-pointer',
              activeTab === 'timeline'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            Action Timeline ({execution.stepResults.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={cn(
              'py-2.5 px-3 border-b-2 transition-colors cursor-pointer',
              activeTab === 'logs'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            Live Logs ({execution.logs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('context')}
            className={cn(
              'py-2.5 px-3 border-b-2 transition-colors cursor-pointer',
              activeTab === 'context'
                ? 'border-purple-600 text-purple-700 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            )}
          >
            Context & Payload
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {execution.stepResults.map((step, idx) => {
                const isExpanded = expandedStepId === step.actionId;
                return (
                  <div
                    key={step.actionId || idx}
                    className="border border-zinc-200 rounded-lg overflow-hidden bg-white shadow-2xs transition-all hover:border-zinc-300"
                  >
                    <div
                      onClick={() => setExpandedStepId(isExpanded ? null : step.actionId)}
                      className="flex items-center justify-between p-3.5 cursor-pointer bg-white hover:bg-zinc-50/70"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 shrink-0">
                          {getActionIcon(step.actionType)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-zinc-900 truncate">
                              {idx + 1}. {step.actionName}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400">({step.actionType})</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {step.status === 'success' ? 'Completed successfully' : step.error || 'Failed'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] font-mono text-zinc-400">{step.durationMs}ms</span>
                        {step.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="h-3 w-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step Details */}
                    {isExpanded && (
                      <div className="border-t border-zinc-100 bg-zinc-50 p-3.5 space-y-2 text-xs">
                        {step.output && (
                          <div>
                            <span className="font-semibold text-zinc-700 block mb-1">Step Outputs:</span>
                            <pre className="p-2.5 rounded bg-zinc-900 text-zinc-100 text-[11px] font-mono overflow-x-auto">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.input && (
                          <div>
                            <span className="font-semibold text-zinc-700 block mb-1">Configuration Inputs:</span>
                            <pre className="p-2.5 rounded bg-zinc-100 border border-zinc-200 text-zinc-800 text-[11px] font-mono overflow-x-auto">
                              {JSON.stringify(step.input, null, 2)}
                            </pre>
                          </div>
                        )}
                        {step.retryCount > 0 && (
                          <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                            Notice: Step succeeded after {step.retryCount} retry attempts.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="rounded-lg bg-zinc-950 p-4 text-xs font-mono space-y-1.5 overflow-x-auto max-h-[500px]">
              {execution.logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2">
                  <span className="text-zinc-500 shrink-0 select-none">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={cn(
                      'uppercase text-[10px] font-bold px-1 rounded shrink-0 select-none',
                      log.level === 'info' && 'bg-blue-900/50 text-blue-400',
                      log.level === 'warn' && 'bg-amber-900/50 text-amber-400',
                      log.level === 'error' && 'bg-rose-900/50 text-rose-400',
                      log.level === 'debug' && 'bg-zinc-800 text-zinc-400'
                    )}
                  >
                    {log.level}
                  </span>
                  <span
                    className={cn(
                      'text-zinc-200 leading-relaxed',
                      log.level === 'error' && 'text-rose-300 font-semibold',
                      log.level === 'warn' && 'text-amber-200'
                    )}
                  >
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'context' && (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-zinc-800 block mb-1">Target Incident Context:</span>
                <pre className="p-3 rounded-lg bg-zinc-900 text-zinc-100 text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(execution.contextSnapshot?.incident || {}, null, 2)}
                </pre>
              </div>

              <div>
                <span className="font-semibold text-zinc-800 block mb-1">Propagated Execution Variables:</span>
                <pre className="p-3 rounded-lg bg-zinc-900 text-zinc-100 text-[11px] font-mono overflow-x-auto">
                  {JSON.stringify(execution.contextSnapshot?.variables || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
          <span>Rootly-style Automated Workflow Engine v1.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
