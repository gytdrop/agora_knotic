'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, Loader2, Terminal } from 'lucide-react';

interface HitlGuardrailCardProps {
  onRemediateSuccess?: () => void;
}

export function HitlGuardrailCard({ onRemediateSuccess }: HitlGuardrailCardProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: 'act_hotfix_8080_8000',
          actionType: 'K8S_INGRESS_PATCH',
          targetService: 'ingress/auth-svc',
          authorizedBy: 'Sarah (Lead SRE)',
          passkeyUsed: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Remediation webhook returned non-200 status');
      }

      setIsResolved(true);
      if (onRemediateSuccess) {
        onRemediateSuccess();
      }
    } catch (err) {
      setErrorMsg('Failed to authorize patch. Try again.');
      console.error('HITL Authorization error:', err);
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-[#28292c] p-4 shadow-md transition-all hover:border-zinc-700">
      <div>
        {/* Capsule Tag Badge - Tag-only color */}
        <div className="flex items-center justify-between pb-2.5 font-sans">
          <div className="flex items-center gap-1.5">
            {isResolved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertOctagon className="h-4 w-4 text-rose-400" />
            )}
            <span
              className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide border ${
                isResolved
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
                  : 'bg-rose-950/70 text-rose-400 border-rose-800/60'
              }`}
            >
              {isResolved ? 'Remediation Executed (200 OK)' : 'HITL Guardrail Capsule'}
            </span>
          </div>

          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold border ${
              isResolved
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/40'
                : 'bg-rose-950/50 text-rose-300 border-rose-800/40'
            }`}
          >
            {isResolved ? 'PATCH ACTIVE' : 'STAGED'}
          </span>
        </div>

        {/* Root Cause Details */}
        <div className="space-y-1.5 text-xs text-zinc-200 font-sans">
          <p className="font-medium leading-snug">
            <span className={isResolved ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
              ROOT CAUSE ISOLATED:
            </span>{' '}
            Ingress prefix route mismatch (`/api/v2/auth` -&gt; port 8080 instead of 8000).
          </p>

          {/* Staged Patch Code Block */}
          <div className="mt-2 rounded-xl bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 border border-zinc-800/80">
            <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1 font-sans">
              <Terminal className="h-3 w-3" /> Staged Hotfix Manifest
            </div>
            <p className="break-all text-zinc-300">
              kubectl patch ingress auth-svc -p &#39;&#123;&quot;spec&quot;:&#123;&quot;rules&quot;:[&#123;&quot;http&quot;:&#123;&quot;port&quot;:8080&#125;&#125;]&#125;&#125;&#39;
            </p>
            <p className="mt-1.5 text-[10px] text-zinc-400 font-sans">
              Verbal Trigger: <span className="text-amber-400 font-semibold">&quot;Authorize Patch&quot;</span>
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click Action Button */}
      <div className="mt-3 font-sans">
        {errorMsg && <p className="mb-1 text-[11px] text-rose-400">{errorMsg}</p>}
        <button
          onClick={handleAuthorize}
          disabled={isAuthorizing || isResolved}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-md transition-all ${
            isResolved
              ? 'bg-emerald-600 text-white cursor-default'
              : 'bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white cursor-pointer'
          } disabled:opacity-80`}
        >
          {isAuthorizing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Executing Hotfix Webhook...
            </>
          ) : isResolved ? (
            <>
              <ShieldCheck className="h-4 w-4" />
              1-Click Hotfix Executed (Incident Resolved)
            </>
          ) : (
            '1-Click Hotfix Card'
          )}
        </button>
      </div>
    </div>
  );
}
export default HitlGuardrailCard;
