'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, Flame, Loader2, Sparkles, X } from 'lucide-react';
import { useConvex, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/utils';

export type IncidentSeverity = 'Critical' | 'Major' | 'Minor' | string;

export interface CreatedIncident {
  _id?: string;
  incidentId: string;
  title: string;
  severity: IncidentSeverity | string;
  status: string;
  rootCause: string;
  createdAt: number;
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
  dotColor: string;
  activeClasses: string;
  hoverClasses: string;
}

const SEVERITY_OPTIONS: SeverityOption[] = [
  {
    id: 'Critical',
    label: 'Critical',
    impact: 'System Outage / Emergency',
    dotColor: 'bg-red-500',
    activeClasses: 'bg-red-50 text-red-700 border-red-500 ring-2 ring-red-500/20 font-semibold',
    hoverClasses: 'hover:border-red-300 hover:bg-red-50/50',
  },
  {
    id: 'Major',
    label: 'Major',
    impact: 'Partial Outage / Degradation',
    dotColor: 'bg-amber-500',
    activeClasses: 'bg-amber-50 text-amber-800 border-amber-500 ring-2 ring-amber-500/20 font-semibold',
    hoverClasses: 'hover:border-amber-300 hover:bg-amber-50/50',
  },
  {
    id: 'Minor',
    label: 'Minor',
    impact: 'Localized / Low Urgency',
    dotColor: 'bg-blue-500',
    activeClasses: 'bg-blue-50 text-blue-700 border-blue-500 ring-2 ring-blue-500/20 font-semibold',
    hoverClasses: 'hover:border-blue-300 hover:bg-blue-50/50',
  },
];

interface CreateIncidentModalFormProps extends CreateIncidentModalProps {
  mutateFn:
    | ((args: { title: string; severity: string; summary?: string }) => Promise<unknown>)
    | null;
}

export function CreateIncidentModalForm({
  isOpen,
  onClose,
  onCreated,
  className,
  mutateFn,
}: CreateIncidentModalFormProps) {
  const [title, setTitle] = useState('');
  const [severity, setSeverity] = useState<IncidentSeverity>('Major');
  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Focus title input on mount/open
  useEffect(() => {
    if (isOpen) {
      // Small timeout ensures modal DOM is rendered before focusing
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Reset state when closed
      setTitle('');
      setSeverity('SEV1');
      setSummary('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
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

  // Prevent background body scroll when open
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

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setErrorMessage('Please enter an incident title.');
      titleInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const trimmedSummary = summary.trim();

    try {
      let createdDocId: string | undefined;
      let createdIncidentId: string | undefined;

      // Attempt Convex mutation if client is connected
      if (mutateFn) {
        try {
          const result = (await mutateFn({
            title: trimmedTitle,
            severity,
            summary: trimmedSummary || undefined,
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

      const incidentId = createdIncidentId || '#7135';

      const newIncident: CreatedIncident = {
        _id: createdDocId,
        incidentId,
        title: trimmedTitle,
        severity,
        status: 'ACTIVE',
        rootCause: trimmedSummary || 'No summary for this incident',
        createdAt: Date.now(),
      };

      onCreated?.(newIncident);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to create incident. Please try again.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-incident-title"
      aria-describedby="create-incident-description"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Semi-transparent backdrop overlay */}
      <div
        className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalContainerRef}
        className={cn(
          'relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-zinc-200/90 z-10 overflow-hidden flex flex-col transition-all',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4.5 bg-zinc-50/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs">
              <Flame className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="create-incident-title"
                className="text-base font-semibold tracking-tight text-zinc-900"
              >
                Create New Incident
              </h2>
              <p id="create-incident-description" className="text-xs text-zinc-500">
                Declare an incident and initiate response workflows
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-5">
          {/* Incident Title */}
          <div className="space-y-1.5">
            <label
              htmlFor="incident-title"
              className="block text-xs font-semibold text-zinc-700"
            >
              Incident Title <span className="text-red-500">*</span>
            </label>
            <input
              ref={titleInputRef}
              id="incident-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Code Deployment Error Leads to Service Degradation"
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors hover:border-zinc-300 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Severity Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-700">
                Severity Level <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-zinc-400 font-medium">
                Rootly Severity Matrix
              </span>
            </div>

            <div
              role="radiogroup"
              aria-label="Incident Severity"
              className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            >
              {SEVERITY_OPTIONS.map((opt) => {
                const isSelected = severity === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSeverity(opt.id)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-2.5 text-left transition-all duration-150 cursor-pointer select-none',
                      isSelected
                        ? opt.activeClasses
                        : cn('border-zinc-200 bg-white text-zinc-600', opt.hoverClasses)
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-xs font-bold tracking-tight">
                        {opt.label}
                      </span>
                      <span
                        className={cn('h-2 w-2 rounded-full shrink-0', opt.dotColor)}
                      />
                    </div>
                    <span className="text-[10px] opacity-85">{opt.impact}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="incident-summary"
                className="block text-xs font-semibold text-zinc-700"
              >
                Summary / Root Cause Context
              </label>
              <span className="text-[11px] text-zinc-400">Optional</span>
            </div>
            <textarea
              id="incident-summary"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A recent deployment of new code to the production environment inadvertently introduced an error affecting core endpoints..."
              className="w-full resize-none rounded-lg border border-zinc-200 bg-white p-3 text-xs text-zinc-900 placeholder:text-zinc-400 shadow-xs transition-colors hover:border-zinc-300 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-400/20 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:from-purple-700 hover:to-indigo-700 hover:shadow active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-200" />
                  <span>Declaring...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-purple-200" />
                  <span>Create Incident</span>
                </>
              )}
            </button>
          </div>
        </form>
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
