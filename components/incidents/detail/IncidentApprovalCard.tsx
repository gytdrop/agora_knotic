'use client';

import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { publishStatus } from '@/lib/demo/app-status';

export interface IncidentApprovalCardProps {
  /** Remediation awaiting a human decision. */
  actionTitle?: string;
  assignee?: string;
  onAuthorize?: () => void | Promise<void>;
  className?: string;
}

/**
 * Human-in-the-loop gate for AI-staged remediation.
 *
 * Deliberately does not reuse war-room/HitlGuardrailCard: that component POSTs
 * to /api/remediate and hard-navigates to the post-mortem route, which is the
 * live-call flow. On the incident detail page the gate should record the
 * decision in place and leave navigation to the operator.
 */
export function IncidentApprovalCard({
  actionTitle = 'Restart replica nodes',
  assignee = 'DBA',
  onAuthorize,
  className,
}: IncidentApprovalCardProps) {
  const [state, setState] = useState<'idle' | 'working' | 'authorized'>('idle');

  const handleAuthorize = async () => {
    setState('working');
    try {
      await onAuthorize?.();
      // Flip the customer-facing app tab from red to green immediately.
      publishStatus('RESOLVED');
      setState('authorized');
    } catch (err) {
      console.error('Failed to authorize remediation:', err);
      setState('idle');
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-slate-500 dark:text-slate-400">
        Human Approval Action
      </div>
      <p className="mb-2.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <strong className="font-semibold text-slate-900 dark:text-slate-100">{actionTitle}</strong>{' '}
        — AI-staged remediation for{' '}
        <strong className="font-semibold text-slate-900 dark:text-slate-100">{assignee}</strong>.
        Review before EchoSphere dispatches to PagerDuty.
      </p>
      <button
        type="button"
        onClick={handleAuthorize}
        disabled={state !== 'idle'}
        className={cn(
          'flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12.5px] font-semibold transition-colors',
          state === 'authorized'
            ? 'cursor-default bg-slate-300 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
            : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200',
        )}
      >
        {state === 'working' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {state === 'authorized' && <Check className="h-3.5 w-3.5" />}
        {state === 'authorized' ? 'Authorized' : 'Authorize 1-Click'}
      </button>
    </div>
  );
}

export default IncidentApprovalCard;
