'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, Loader2, Terminal, Radio } from 'lucide-react';

interface HitlGuardrailCardProps {
  isStaged?: boolean;
  isResolved?: boolean;
  onRemediateSuccess?: () => void;
}

export function HitlGuardrailCard({
  isStaged = false,
  isResolved = false,
  onRemediateSuccess,
}: HitlGuardrailCardProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
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

  // 1. Idle / Standby Sentinel State (When no incident/defect is staged yet)
  if (!isStaged && !isResolved) {
    return (
      <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#28292c] p-4 shadow-sm transition-all hover:border-zinc-700 font-sans">
        <div>
          {/* Header Tag */}
          <div className="flex items-center justify-between pb-2.5">
            <div className="flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-blue-400 animate-pulse" />
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-blue-300 border border-zinc-700">
                Sentinel Guardrail Slot
              </span>
            </div>
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-400 border border-zinc-700">
              STANDBY
            </span>
          </div>

          {/* Details */}
          <div className="space-y-1.5 text-xs text-zinc-300">
            <p className="font-normal leading-relaxed text-zinc-300">
              <span className="text-zinc-100 font-medium">AMBIENT SENTINEL ACTIVE:</span>{' '}
              Listening to voice channel. Awaiting verbalized defect signals or hypotheses.
            </p>

            <div className="mt-2 rounded-xl bg-zinc-950/90 p-3 font-mono text-[11px] text-zinc-400 border border-zinc-800/80">
              <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1 font-sans">
                <Terminal className="h-3 w-3 text-zinc-500" /> Cluster Diagnostic Guard
              </div>
              <p className="text-zinc-400 font-mono">
                Telemetry normal. Ready to stage hotfix manifest upon anomaly detection.
              </p>
            </div>
          </div>
        </div>

        {/* Disabled Action Button */}
        <div className="mt-3">
          <button
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 px-4 py-2.5 text-xs font-medium text-zinc-500 cursor-not-allowed border border-zinc-700/60"
          >
            Awaiting Anomaly Signal...
          </button>
        </div>
      </div>
    );
  }

  // 2. Active Staged Hotfix OR Resolved State
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-[#28292c] p-4 shadow-sm transition-all hover:border-zinc-700 font-sans">
      <div>
        {/* Capsule Tag Badge */}
        <div className="flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-1.5">
            {isResolved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            ) : (
              <AlertOctagon className="h-4 w-4 text-rose-400" />
            )}
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border ${
                isResolved
                  ? 'bg-zinc-800 text-emerald-300 border-zinc-700'
                  : 'bg-zinc-800 text-rose-300 border-zinc-700'
              }`}
            >
              {isResolved ? 'Remediation Executed (200 OK)' : 'HITL Guardrail Capsule'}
            </span>
          </div>

          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-medium border ${
              isResolved
                ? 'bg-zinc-800 text-emerald-300 border-zinc-700'
                : 'bg-zinc-800 text-rose-300 border-zinc-700'
            }`}
          >
            {isResolved ? 'PATCH ACTIVE' : 'STAGED'}
          </span>
        </div>

        {/* Root Cause Details */}
        <div className="space-y-1.5 text-xs text-zinc-200">
          <p className="font-normal leading-relaxed">
            <span className={isResolved ? 'text-emerald-300 font-semibold' : 'text-rose-300 font-semibold'}>
              ROOT CAUSE ISOLATED:
            </span>{' '}
            Ingress prefix route mismatch (`/api/v2/auth` -&gt; port 8080 instead of 8000).
          </p>

          {/* Staged Patch Code Block */}
          <div className="mt-2 rounded-xl bg-zinc-950/90 p-3 font-mono text-[11px] text-zinc-300 border border-zinc-800/80">
            <div className="flex items-center gap-1 text-[10px] text-zinc-400 mb-1 font-sans">
              <Terminal className="h-3 w-3 text-zinc-400" /> Staged Hotfix Manifest
            </div>
            <p className="break-all text-zinc-300 leading-relaxed font-mono">
              kubectl patch ingress auth-svc -p &#39;&#123;&quot;spec&quot;:&#123;&quot;rules&quot;:[&#123;&quot;http&quot;:&#123;&quot;port&quot;:8080&#125;&#125;]&#125;&#125;&#39;
            </p>
            <p className="mt-1.5 text-[10px] text-zinc-400 font-sans">
              Verbal Trigger: <span className="text-zinc-200 font-medium">&quot;Authorize Patch&quot;</span>
            </p>
          </div>
        </div>
      </div>

      {/* 1-Click Action Button */}
      <div className="mt-3">
        {errorMsg && <p className="mb-1 text-[11px] text-rose-400">{errorMsg}</p>}
        <button
          onClick={handleAuthorize}
          disabled={isAuthorizing || isResolved}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-medium shadow transition-all ${
            isResolved
              ? 'bg-emerald-700 text-zinc-100 cursor-default'
              : 'bg-rose-700 hover:bg-rose-600 active:scale-[0.98] text-white cursor-pointer'
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
