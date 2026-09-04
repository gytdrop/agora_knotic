'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2, Loader2, Terminal, Flame } from 'lucide-react';
import { getApiUrl } from '@/lib/api-config';

interface HitlGuardrailCardProps {
  isStaged?: boolean;
  isResolved?: boolean;
  onRemediateSuccess?: () => void | Promise<void>;
}

export function HitlGuardrailCard({
  isStaged: _isStaged = true,
  isResolved = false,
  onRemediateSuccess,
}: HitlGuardrailCardProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
            actionType: 'K8S_INGRESS_PATCH',
            targetService: 'ingress/auth-svc',
            authorizedBy: 'Akthar (Lead SRE)',
            passkeyUsed: true,
          }),
        });

        if (!res.ok) {
          throw new Error('Remediation webhook returned non-200 status');
        }
      }
    } catch (err) {
      setErrorMsg('Failed to authorize patch. Try again.');
      console.error('HITL Authorization error:', err);
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] p-4 border border-zinc-800/80 shadow-md font-sans">
      <div>
        {/* Top Badges - Strictly Tag-Only, Matte Styling */}
        <div className="flex items-center justify-between pb-2.5">
          <div className="flex items-center gap-1.5">
            {isResolved ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400/90" />
            ) : (
              <AlertOctagon className="h-4 w-4 text-rose-400/90" />
            )}
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase border border-zinc-700 text-zinc-300">
              {isResolved
                ? 'REMEDIATION EXECUTED (200 OK)'
                : 'HITL GUARDRAIL CAPSULE'}
            </span>
          </div>

          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium border border-zinc-700 text-zinc-400">
            {isResolved ? 'PATCH ACTIVE' : 'STAGED'}
          </span>
        </div>

        {/* Root Cause Details */}
        <div className="space-y-1.5 text-xs text-zinc-200">
          <p className="font-normal leading-relaxed text-zinc-300">
            <span className="font-medium text-zinc-100">
              ROOT CAUSE ISOLATED:
            </span>{' '}
            Ingress prefix route mismatch (&apos;/api/v2/auth&apos; -&gt; port 8080 instead of 8000).
          </p>

          {/* Staged Hotfix Manifest Code Block */}
          <div className="mt-2.5 rounded-xl bg-zinc-950 p-3.5 font-mono text-[11px] text-zinc-300 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-1.5 font-sans">
              <Terminal className="h-3.5 w-3.5 text-zinc-400" />
              <span className="font-medium text-zinc-300">&gt;_ Staged Hotfix Manifest</span>
            </div>
            <p className="break-all text-zinc-300 leading-relaxed font-mono">
              kubectl patch ingress auth-svc -p &apos;&#123;&quot;spec&quot;:&#123;&quot;rules&quot;:[&#123;&quot;http&quot;:&#123;&quot;port&quot;:8080&#125;&#125;]&#125;&#125;&apos;
            </p>
            <p className="mt-2 text-[10px] text-zinc-400 font-sans">
              Verbal Trigger: <span className="text-zinc-200 font-semibold">&quot;Authorize Patch&quot;</span>
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
              ? 'bg-zinc-800 border-zinc-700 text-emerald-300 cursor-default'
              : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 cursor-pointer active:scale-[0.98]'
          } disabled:opacity-90`}
        >
          {isAuthorizing ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
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
      </div>
    </div>
  );
}

export default HitlGuardrailCard;
