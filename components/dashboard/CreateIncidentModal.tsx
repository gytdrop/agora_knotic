'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';
import { type IncidentSeverity } from '@/lib/incident-severity';

export type { IncidentSeverity };

export type IncidentDeclareMode = 'active' | 'retrospective' | 'test';
export type IncidentInitialStatus = 'INVESTIGATING' | 'TRIAGE';

export interface CreatedIncident {
  _id?: string;
  incidentId: string;
  title: string;
  severity: IncidentSeverity | string;
  status: string;
  rootCause: string;
  createdAt: number;
  type?: string;
  lead?: string;
}

export interface CreateIncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (newIncident: CreatedIncident) => void;
  className?: string;
}

interface SeverityOption {
  id: IncidentSeverity;
  label: string;
  impact: string;
  barCount: number;
  barColor: string;
  activeClasses: string;
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    id: 'Minor',
    label: 'Minor',
    impact: 'Localized / Low Urgency',
    barCount: 1,
    barColor: 'bg-slate-900',
    activeClasses: 'border-slate-700 bg-slate-100/70 text-slate-900 ring-2 ring-slate-700/20',
  },
  {
    id: 'Major',
    label: 'Major',
    impact: 'Partial Outage / Degradation',
    barCount: 2,
    barColor: 'bg-amber-600',
    activeClasses: 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20',
  },
  {
    id: 'Critical',
    label: 'Critical',
    impact: 'System Outage / Emergency',
    barCount: 3,
    barColor: 'bg-rose-600',
    activeClasses: 'border-rose-500 bg-rose-50/70 text-rose-900 ring-2 ring-rose-500/20',
  },
];

interface CreateIncidentModalFormProps extends CreateIncidentModalProps {
  mutateFn:
    | ((args: {
        title: string;
        severity: string;
        summary?: string;
        status?: string;
        lead?: string;
      }) => Promise<unknown>)
    | null;
}

export function CreateIncidentModalForm({
  isOpen,
  onClose,
  onCreated,
  className,
  mutateFn,
}: CreateIncidentModalFormProps) {
  // Mode tabs: Active, Retrospective, Test
  const [declareMode, setDeclareMode] = useState<IncidentDeclareMode>('active');

  // Form states
  const [title, setTitle] = useState('');
  const [incidentType, setIncidentType] = useState('Default');
  const [initialStatus, setInitialStatus] = useState<IncidentInitialStatus>('INVESTIGATING');
  const [severity, setSeverity] = useState<IncidentSeverity>('Major');
  const [lead, setLead] = useState('Ashley Sawatsky');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Reset state when closed
      setTitle('');
      setIncidentType('Default');
      setInitialStatus('INVESTIGATING');
      setSeverity('Major');
      setLead('Ashley Sawatsky');
      setSummary('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // ESC to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTitle = title.trim() || 'Untitled Incident';
    setIsSubmitting(true);
    setErrorMessage(null);

    const trimmedSummary = summary.trim();

    try {
      let createdDocId: string | undefined;
      let createdIncidentId: string | undefined;

      if (mutateFn) {
        try {
          const result = (await mutateFn({
            title: trimmedTitle,
            severity,
            summary: trimmedSummary || undefined,
            status: initialStatus,
            lead: lead !== 'Unassigned' ? lead : undefined,
          })) as { docId?: string; incidentId?: string } | string | null | undefined;

          if (typeof result === 'string') {
            createdDocId = result;
          } else if (result && typeof result === 'object') {
            createdDocId = result.docId;
            createdIncidentId = result.incidentId;
          }
        } catch (convexError) {
          console.error('Convex createIncident mutation failed:', convexError);
          const message =
            convexError instanceof Error
              ? convexError.message
              : 'Failed to create incident on server. Please try again.';
          setErrorMessage(message);
          return;
        }
      }

      // Generate realistic sequential ID if offline or not returned
      const randomNum = Math.floor(7135 + Math.random() * 50);
      const is8921 =
        trimmedTitle.toUpperCase().includes('8921') ||
        trimmedTitle.toUpperCase().includes('ECHOSPHERE');
      const incidentId = is8921 ? '#INC-8921' : (createdIncidentId || `#${randomNum}`);

      const newIncident: CreatedIncident = {
        _id: createdDocId,
        incidentId,
        title: trimmedTitle,
        severity,
        status: initialStatus,
        rootCause: trimmedSummary || 'No summary for this incident',
        createdAt: Date.now(),
        type: incidentType,
        lead: lead !== 'Unassigned' ? lead : undefined,
      };

      onCreated?.(newIncident);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to declare incident. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="declare-incident-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Semi-transparent dark backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Incident.io Style Modal Card */}
      <div
        ref={modalContainerRef}
        className={cn(
          'relative w-full max-w-xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-slate-200 z-10 overflow-hidden flex flex-col',
          className
        )}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2
            id="declare-incident-title"
            className="text-lg font-semibold tracking-tight text-slate-900"
          >
            Declare incident
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center border-b border-slate-100 px-6 gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setDeclareMode('active')}
            className={cn(
              'py-3 border-b-2 transition-colors cursor-pointer select-none',
              declareMode === 'active'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Active incident
          </button>
          <button
            type="button"
            onClick={() => setDeclareMode('retrospective')}
            className={cn(
              'py-3 border-b-2 transition-colors cursor-pointer select-none',
              declareMode === 'retrospective'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Retrospective incident
          </button>
          <button
            type="button"
            onClick={() => setDeclareMode('test')}
            className={cn(
              'py-3 border-b-2 transition-colors cursor-pointer select-none',
              declareMode === 'test'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Test incident
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Field: Incident Name */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="incident-name"
                  className="text-sm font-medium text-slate-900"
                >
                  Incident name
                </label>
                <span className="text-xs text-slate-400 font-normal">(optional)</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setTitle('AGORA ECHOSPHERE SEV-1 OUTAGE');
                  setSeverity('Critical');
                  setSummary('Ingress prefix route mismatch (/api/v2/auth -> port 8080 instead of 8000).');
                  setLead('Akthar (Lead SRE)');
                }}
                className="text-[11px] font-mono text-slate-800 hover:text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 cursor-pointer font-medium"
              >
                + Auto-fill INC-8921 (Demo)
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Give a short description of what is happening. If you&apos;d like to, you can leave it blank and change it later
            </p>
            <input
              ref={titleInputRef}
              id="incident-name"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's happening?"
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-2xs transition-colors hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Field: Incident Type */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="incident-type"
                className="text-sm font-medium text-slate-900"
              >
                Incident type
              </label>
              <span className="text-xs text-slate-400 font-normal">(optional)</span>
            </div>
            <div className="relative">
              <select
                id="incident-type"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs transition-colors hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 pr-10 cursor-pointer"
              >
                <option value="Default">Default</option>
                <option value="Security">Security</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Customer Facing">Customer Facing</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Field: Initial Status (Radio Cards) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-900 block">
              Initial status
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Active incident */}
              <button
                type="button"
                onClick={() => setInitialStatus('INVESTIGATING')}
                className={cn(
                  'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none',
                  initialStatus === 'INVESTIGATING'
                    ? 'border-slate-900 bg-slate-50/60 ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      initialStatus === 'INVESTIGATING'
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {initialStatus === 'INVESTIGATING' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    Active incident
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-6">
                  You&apos;ve confirmed there&apos;s a problem, and you&apos;d like to investigate it right away.
                </p>
              </button>

              {/* Option 2: Triage a problem */}
              <button
                type="button"
                onClick={() => setInitialStatus('TRIAGE')}
                className={cn(
                  'flex flex-col items-start p-3.5 rounded-xl border text-left transition-all cursor-pointer select-none',
                  initialStatus === 'TRIAGE'
                    ? 'border-slate-900 bg-slate-50/60 ring-1 ring-slate-900'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/30'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded-full border',
                      initialStatus === 'TRIAGE'
                        ? 'border-slate-900 bg-slate-900'
                        : 'border-slate-300 bg-white'
                    )}
                  >
                    {initialStatus === 'TRIAGE' && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-slate-900">
                    Triage a problem
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed pl-6">
                  You suspect an issue, but want to verify before sounding alarms.
                </p>
              </button>
            </div>
          </div>

          {/* Field: Severity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-900">
                Severity
              </label>
              <span className="text-xs text-slate-400">Select tier</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = severity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSeverity(opt.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all cursor-pointer select-none',
                      isSelected
                        ? opt.activeClasses
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold tracking-tight">
                        {opt.label}
                      </span>
                      {/* Signal Bars */}
                      <span className="flex items-end gap-0.5 h-3">
                        <span
                          className={cn(
                            'w-0.5 rounded-xs transition-colors h-1.5',
                            opt.barCount >= 1 ? opt.barColor : 'bg-slate-200'
                          )}
                        />
                        <span
                          className={cn(
                            'w-0.5 rounded-xs transition-colors h-2',
                            opt.barCount >= 2 ? opt.barColor : 'bg-slate-200'
                          )}
                        />
                        <span
                          className={cn(
                            'w-0.5 rounded-xs transition-colors h-2.5',
                            opt.barCount >= 3 ? opt.barColor : 'bg-slate-200'
                          )}
                        />
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {opt.impact}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Field: Incident Lead */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="incident-lead"
                className="text-sm font-medium text-slate-900"
              >
                Incident Lead
              </label>
              <span className="text-xs text-slate-400 font-normal">(optional)</span>
            </div>
            <div className="relative">
              <select
                id="incident-lead"
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 shadow-2xs transition-colors hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 pr-10 cursor-pointer"
              >
                <option value="Ashley Sawatsky">Ashley Sawatsky</option>
                <option value="SRE On-Call">SRE On-Call</option>
                <option value="Unassigned">Unassigned</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Field: Summary / Context */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="incident-summary"
                className="text-sm font-medium text-slate-900"
              >
                Summary / Initial Context
              </label>
              <span className="text-xs text-slate-400">Optional</span>
            </div>
            <textarea
              id="incident-summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Payments gateway returning HTTP 504 on checkout flow..."
              className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs transition-colors hover:border-slate-300 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-black text-white px-4 py-2 text-xs font-semibold shadow-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                <span>Declaring...</span>
              </>
            ) : (
              <span>Declare Incident</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Convex-connected wrapper that binds the `createIncident` mutation.
 */
function ConvexCreateIncidentModal(props: CreateIncidentModalProps) {
  const createIncidentMutation = useMutation(api.incidents.createIncident);
  return <CreateIncidentModalForm {...props} mutateFn={createIncidentMutation} />;
}

/**
 * Fallback wrapper used when ConvexProvider is not present in the React tree.
 */
function OfflineCreateIncidentModal(props: CreateIncidentModalProps) {
  return <CreateIncidentModalForm {...props} mutateFn={null} />;
}

/**
 * Main accessible dialog modal to declare and create a new incident.
 * Automatically adapts between Convex live mutation and offline fallback.
 */
export function CreateIncidentModal(props: CreateIncidentModalProps) {
  const convex = useConvex();

  if (!props.isOpen) return null;

  if (convex) {
    return <ConvexCreateIncidentModal {...props} />;
  }

  return <OfflineCreateIncidentModal {...props} />;
}

export default CreateIncidentModal;
