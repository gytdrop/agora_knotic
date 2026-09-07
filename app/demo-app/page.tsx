'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  type AppStatus,
  readStatus,
  resetStatus,
  subscribeStatus,
} from '@/lib/demo/app-status';

interface SandboxMetrics {
  version: string;
  errorRatePct: number;
  p99LatencyMs: number;
  podMemoryPct: number;
  dbPoolActive: number;
  fraudTimeoutPct: number;
}

/**
 * acme-pay checkout status — the customer-facing surface of INC-8921.
 *
 * Runs in its own tab beside the war room. Status resolves from two sources,
 * in priority order:
 *
 *   1. Live sandbox metrics, when demo-sandbox is running and DEMO_SANDBOX=1.
 *      This is real: the numbers come from actual traffic, and the page turns
 *      green because the rollback genuinely dropped the error rate.
 *   2. The cross-tab signal, used on deployed instances where the sandbox
 *      cannot run. The war room publishes on authorize and this page reacts.
 *
 * Source 1 is preferred because it is evidence rather than assertion.
 */
export default function DemoAppPage() {
  const [status, setStatus] = useState<AppStatus>('CRITICAL');
  const [metrics, setMetrics] = useState<SandboxMetrics | null>(null);
  const [live, setLive] = useState(false);

  // Read persisted state and subscribe to other tabs.
  // First client render intentionally matches the server (CRITICAL), then the
  // effect corrects it. Returning null until mount would flash a blank page,
  // which reads as a broken app on camera.
  useEffect(() => {
    setStatus(readStatus());
    return subscribeStatus(setStatus);
  }, []);

  // Poll the sandbox. A 503/404 simply means it is not running, which is not an
  // error — the cross-tab signal takes over.
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch('/api/sandbox/metrics', { cache: 'no-store' });
        if (!res.ok) throw new Error('unavailable');
        const data: SandboxMetrics = await res.json();
        if (cancelled) return;
        setMetrics(data);
        setLive(true);
        // Real evidence outranks the signal: healthy traffic means resolved.
        setStatus(data.errorRatePct < 2 ? 'RESOLVED' : 'CRITICAL');
      } catch {
        if (!cancelled) setLive(false);
      }
    };

    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const handleReset = useCallback(async () => {
    // Clear the cross-tab signal first so the flip is instant, then clear the
    // server-side ledger — which otherwise keeps isResolved=true and appends a
    // second remediation event on the next take.
    resetStatus();
    setStatus('CRITICAL');
    try {
      await fetch('/api/demo/reset', { method: 'POST' });
    } catch {
      // Ledger reset is best effort; the visible state is already restored.
    }
  }, []);

  const critical = status === 'CRITICAL';

  return (
    <main
      className={`min-h-screen font-sans transition-colors duration-500 ${
        critical ? 'bg-rose-950 text-rose-100' : 'bg-emerald-950 text-emerald-100'
      }`}
    >
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
        <header className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-tight">acme-pay</span>
          <span className="flex items-center gap-2 text-[11px] uppercase tracking-widest opacity-70">
            <span
              className={`h-2 w-2 rounded-full ${
                live ? 'bg-emerald-400' : 'bg-slate-400'
              } ${live ? 'animate-pulse' : ''}`}
            />
            {live ? 'live telemetry' : 'signal mode'}
          </span>
        </header>

        <div>
          <div
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${
              critical
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${critical ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400'}`} />
            {critical ? 'Major outage' : 'All systems operational'}
          </div>

          <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl">
            {critical ? '504 Gateway Timeout' : '200 OK'}
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed opacity-80">
            {critical
              ? 'Checkout is failing. Requests to /v1/checkout/charge are timing out waiting on the fraud-detection service.'
              : 'Checkout has recovered. The fraud check is budgeted with a fallback verdict and no longer blocks payment.'}
          </p>
        </div>

        {/* Live figures when the sandbox is up; scripted stand-ins otherwise. */}
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              label: 'Error rate',
              value: metrics ? `${metrics.errorRatePct}%` : critical ? '47.2%' : '0.3%',
            },
            {
              label: 'p99 latency',
              value: metrics
                ? `${(metrics.p99LatencyMs / 1000).toFixed(1)}s`
                : critical
                ? '6.2s'
                : '0.46s',
            },
            {
              label: 'Pod memory',
              value: metrics ? `${metrics.podMemoryPct}%` : '58%',
              muted: true,
            },
            {
              label: 'DB pool',
              value: metrics ? `${metrics.dbPoolActive}/100` : '22/100',
              muted: true,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 ${
                stat.muted ? 'opacity-60' : ''
              }`}
            >
              <dt className="text-[10px] uppercase tracking-widest opacity-70">{stat.label}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-[11px] leading-relaxed opacity-50">
          {live
            ? 'Figures are read from the running sandbox. Memory and DB pool stay flat across the rollback — they were never the cause.'
            : 'Sandbox not detected; showing scripted figures and listening for the war room signal.'}
          {' '}
          <button
            type="button"
            onClick={handleReset}
            className="underline underline-offset-2 hover:opacity-100"
          >
            Reset for next take
          </button>
        </p>
      </div>
    </main>
  );
}
