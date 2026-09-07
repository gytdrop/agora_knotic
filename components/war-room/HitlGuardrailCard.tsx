'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, AlertOctagon, CheckCircle2, Loader2, Terminal, Flame, ArrowRight } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';
import { publishStatus } from '@/lib/demo/app-status';

interface HitlGuardrailCardProps {
  isStaged?: boolean;
  isResolved?: boolean;
  incidentId?: string;
  onRemediateSuccess?: () => void | Promise<void>;
}

export function HitlGuardrailCard({
  isStaged: _isStaged = true,
  isResolved = false,
  incidentId = 'INC-8921',
  onRemediateSuccess,
}: HitlGuardrailCardProps) {
  const router = useRouter();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cleanIncidentId = incidentId.replace(/^#/, '');

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setErrorMsg(null);
    try {
      if (onRemediateSuccess) {
        await onRemediateSuccess();
      } else {
        const res = await fetch(getApiUrl('/api/remediate'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: 'act_hotfix_8080_8000',
            // Allowlisted in /api/remediate; performs the real sandbox rollback
            // when DEMO_SANDBOX=1, otherwise falls back to the narrated outcome.
            actionType: 'ROLLBACK_PAYMENT_SERVICE',
            targetService: 'payment-service',
            authorizedBy: 'Akthar (Lead SRE)',
            passkeyUsed: true,
            incidentId: cleanIncidentId,
          }),
        });

        if (!res.ok) {
          throw new Error('Remediation webhook returned non-200 status');
        }
      }

      // Flip the customer-facing app tab from red to green immediately.
      publishStatus('RESOLVED');

      // Auto-route to post-mortem after brief visual confirmation (Beat 2:30)
      setTimeout(() => {
        router.push(`/post-mortem/${encodeURIComponent(cleanIncidentId)}`);
      }, 1200);
    } catch (err) {
      setErrorMsg('Failed to authorize patch. Try again.');
      console.error('HITL Authorization error:', err);
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] p-4 border border-slate-800/80 shadow-md font-sans">
      <div>
        {/* Top Badges - Strictly Tag-Only, Matte Styling */}
        <div className="flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-1.5">
            {isResolved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400/90" />
            ) : (
              <AlertOctagon className="h-4 w-4 text-rose-400/90" />
            )}
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border border-slate-700 text-slate-300">
              {isResolved
                ? 'REMEDIATION EXECUTED (200 OK)'
                : 'HITL GUARDRAIL CAPSULE'}
            </span>
          </div>

          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium border border-slate-700 text-slate-400">
            {isResolved ? 'PATCH ACTIVE' : 'STAGED'}
          </span>
        </div>

        {/* Root Cause Details */}
        <div className="space-y-1.5 text-xs text-slate-200">
          <p className="font-normal leading-relaxed text-slate-300">
            <span className="font-medium text-slate-100">
              ROOT CAUSE ISOLATED:
            </span>{' '}
            Ingress prefix route mismatch (&apos;/api/v2/auth&apos; -&gt; port 8080 instead of 8000).
          </p>

          {/* Staged Hotfix Manifest Code Block */}
          <div className="mt-2.5 rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] text-slate-300 border border-slate-800">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1.5 font-sans">
              <Terminal className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-medium text-slate-300">&gt;_ Staged Hotfix Manifest</span>
            </div>
            <p className="break-all text-slate-300 leading-relaxed font-mono">
              kubectl patch ingress auth-svc -p &apos;&#123;&quot;spec&quot;:&#123;&quot;rules&quot;:[&#123;&quot;http&quot;:&#123;&quot;port&quot;:8080&#125;&#125;]&#125;&#125;&apos;
            </p>
            <p className="mt-2 text-[10px] text-slate-400 font-sans">
              Verbal Trigger: <span className="text-slate-200 font-semibold">&quot;Authorize Patch&quot;</span>
            </p>
          </div>
        </div>
      </div>

      {/* Action Button - Matte Zinc Neutral (Zero Neon) */}
      <div className="mt-3">
        {errorMsg && <p className="mb-1 text-[11px] text-rose-400">{errorMsg}</p>}
        <button
          onClick={handleAuthorize}
          disabled={isAuthorizing || isResolved}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold border transition-all ${
            isResolved
              ? 'bg-slate-800 border-slate-700 text-emerald-300 cursor-default'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 cursor-pointer active:scale-[0.98]'
          } disabled:opacity-90`}
        >
          {isAuthorizing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              Executing Hotfix Webhook...
            </>
          ) : isResolved ? (
            <>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              1-Click Hotfix Executed (Incident Resolved)
            </>
          ) : (
            <>
              <Flame className="h-4 w-4 text-rose-400" />
              Authorize 1-Click Hotfix
            </>
          )}
        </button>

        {isResolved && (
          <Link
            href="/post-mortem/INC-8921"
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-slate-800 hover:text-emerald-200 transition-colors shadow-sm"
          >
            <span>View Incident Post-Mortem</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default HitlGuardrailCard;
