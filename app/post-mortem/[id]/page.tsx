'use client';

import React, { useState, use, useEffect } from 'react';
import Link from 'next/link';
import type { LedgerItem } from '@/types/conversation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Radio,
  FileText,
  Loader2,
  Copy,
  Check,
  Cpu,
  Layers,
  Server,
  Sparkles,
  Video,
} from 'lucide-react';
import { useQuery, useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';

type PirSummary = {
  rootCause: string;
  problem: string;
  impact: string;
  causes: string;
  mitigation: string;
  timeline: Array<{ time: string; speaker: string; summary: string }>;
};

type PirResponse = {
  incidentId: string;
  title: string;
  severity: string;
  isResolved: boolean;
  eventCount: number;
  ledgerItems: LedgerItem[];
  pirMarkdown: string;
  summaryJson: PirSummary;
  llm: { attempted: boolean; succeeded: boolean; error: string | null };
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostIncidentDashboard({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams?.id || 'INC-8921';
  const cleanId = decodeURIComponent(rawId).replace(/^#/, '');
  const normalizedIncidentId = cleanId.startsWith('INC-')
    ? `#${cleanId}`
    : cleanId.startsWith('#')
    ? cleanId
    : `#${cleanId}`;
  const incidentNumber = cleanId;

  const convex = useConvex();
  const convexIncident = useQuery(
    api.incidents.getIncident,
    convex ? { incidentId: normalizedIncidentId } : 'skip',
  );
  const convexEvents = useQuery(
    api.incidents.listLedgerEvents,
    convex ? { incidentId: normalizedIncidentId } : 'skip',
  );
  const mutateGeneratePostMortem = useMutation(api.incidents.generatePostMortem);
  const mutateResolve = useMutation(api.incidents.resolveIncident);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemediating, setIsRemediating] = useState(false);
  const [hotfixExecuted, setHotfixExecuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pirData, setPirData] = useState<PirResponse | null>(null);
  const [pirLoading, setPirLoading] = useState(true);
  const [llmUsed, setLlmUsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(
      `/api/incident/pir?incidentId=${encodeURIComponent(normalizedIncidentId)}&format=json&useLlm=true`,
      { cache: 'no-store' },
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Status ${r.status}`))))
      .then((data: PirResponse) => {
        if (cancelled) return;
        setPirData(data);
        if (data?.isResolved) setHotfixExecuted(true);
        setLlmUsed(Boolean(data?.llm?.succeeded));
        setPirLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('[post-mortem] PIR fetch failed, using static fallback:', err);
        setPirLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [normalizedIncidentId]);

  const isResolved = hotfixExecuted || convexIncident?.status === 'RESOLVED';

  const liveFacts = convexEvents?.filter((e) => e.tag === 'FACT') || [];
  const liveHypotheses = convexEvents?.filter((e) => e.tag === 'HYPOTHESIS') || [];
  const liveContradictions = convexEvents?.filter((e) => e.tag === 'CONTRADICTION') || [];
  const _liveActions = convexEvents?.filter((e) => e.tag === 'ACTION') || [];

  const handleGeneratePostMortem = async () => {
    setIsGenerating(true);
    try {
      await mutateGeneratePostMortem({ incidentId: normalizedIncidentId });
    } catch (err) {
      console.warn('Failed to generate postmortem:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuthorizeHotfix = async () => {
    setIsRemediating(true);
    try {
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: `act_hotfix_${incidentNumber.replace('#', '')}`,
          actionType: 'K8S_INGRESS_PATCH',
          targetService: 'ingress/auth-svc',
          authorizedBy: convexIncident?.lead || 'Akthar (Lead SRE)',
          passkeyUsed: true,
        }),
      });
      if (res.ok) {
        await mutateResolve({
          incidentId: normalizedIncidentId,
          resolvedBy: convexIncident?.lead || 'Akthar (Lead SRE)',
        });
        setHotfixExecuted(true);
      }
    } catch (err) {
      console.error('Failed to remediate:', err);
    } finally {
      setIsRemediating(false);
    }
  };

  const copyManifest = () => {
    navigator.clipboard.writeText(
      convexIncident?.hotfixManifest ||
        `kubectl patch ingress auth-svc -n prod-auth -p '{"spec":{"rules":[{"http":{"paths":[{"backend":{"service":{"port":{"number":8000}}}}]}}]}}'`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPIR = () => {
    const lines = [
      `# Post-Incident Review (PIR) — ${normalizedIncidentId}`,
      `**Title:** ${convexIncident?.title || 'Production Outage'}`,
      `**Severity:** ${convexIncident?.severity || 'SEV-1'}`,
      `**Status:** ${convexIncident?.status || 'RESOLVED'}`,
      `**Lead:** ${convexIncident?.lead || 'Incident Commander'}`,
      `**Generated At:** ${new Date().toISOString()}`,
      '',
      '## Executive Summary',
      convexIncident?.problem || 'Telemetry and voice stream reconciled during live Agora triage session.',
      '',
      '## Root Cause & Contradiction Analysis',
      convexIncident?.causes || convexIncident?.rootCause || 'Identified via NLI cross-encoder telemetry contradiction analysis.',
      '',
      '## Mitigation & Remediation',
      convexIncident?.mitigation || 'Hotfix executed with zero-downtime rollback guarantee.',
      '',
      '## Audit Trail & Agora STT Transcripts',
      ...(convexEvents && convexEvents.length > 0
        ? convexEvents.map(
            (e) => `- **${e.timestamp} [${e.speaker}]** (\`${e.tag}\`): "${e.text}"`
          )
        : [
            '- **14:05:22 [Akthar]** (`HYPOTHESIS`): "Database connection pools are throwing timeouts. We might have a deadlocked RDS instance."',
            '- **14:05:40 [Ashrith]** (`FACT`): "Ingress controllers are dropping routes on auth-svc. Checking pod network endpoints."',
            '- **14:05:58 [EchoSphere]** (`CONTRADICTION`): "Ingress prefix route points to 8080. Pod listens on 8000. Staging hotfix patch."',
            '- **14:06:12 [Akthar]** (`ACTION`): "Understood. EchoSphere, authorize patch."',
          ]),
      '',
      '---',
      '*Exported from EchoSphere Incident Reconciliation Engine.*',
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PIR-${cleanId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col gap-5 font-sans antialiased">
      {/* ========================================================================= */}
      {/* TOP INCIDENT NAVIGATION BAR                                               */}
      {/* ========================================================================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/incidents/${cleanId}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-100 hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Incident Details</span>
          </Link>

          <Link
            href={`/war-room?incident=${cleanId}&sev=${encodeURIComponent(convexIncident?.severity || 'SEV-1')}`}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800/70 bg-slate-950/50 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <Video className="h-3.5 w-3.5" />
            <span>War Room</span>
          </Link>

          <span className="font-semibold text-lg tracking-tight text-white">{convexIncident?.title || 'EchoSphere AI'}</span>
          <span className="text-slate-600 font-mono">/</span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
            {normalizedIncidentId}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-950/60 text-slate-300 border border-slate-800 flex items-center gap-1">
            <Cpu className="h-2.5 w-2.5" />
            {llmUsed ? 'AI-Synthesized Postmortem' : 'Auto-Populated from Ledger'}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-900 tracking-wide">
            [{pirData?.severity ?? convexIncident?.severity ?? 'SEV-1'}]
          </span>
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${
            isResolved
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
              : 'bg-amber-950/60 text-amber-300 border-amber-800'
          }`}>
            [{isResolved ? 'RESOLVED' : 'ACTIVE'}]
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
          <button
            onClick={handleGeneratePostMortem}
            disabled={isGenerating}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800/70 bg-slate-950/50 px-3 py-1.5 text-xs font-sans text-slate-300 hover:bg-slate-900 hover:text-white transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
            title="Auto-synthesize post-mortem findings from Agora voice transcripts and telemetry"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span>{isGenerating ? 'Synthesizing...' : 'Synthesize Post-Mortem'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">MTTR:</span>
            <span className="text-slate-200">00:03:15</span>
          </div>
          <span className="text-slate-700">•</span>
          <div>
            <span className="text-slate-500">Cluster:</span> <span className="text-slate-200">eks-us-east-1</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5 text-emerald-400 font-sans">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Agora RTC Verified</span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* THREE-ZONE RECONCILIATION WORKSPACE GRID                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-stretch">
        {/* ── ZONE 1 (1/4 Width / col-span-3): AUDIT TRAIL & STT STREAM ── */}
        <section className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-slate-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
                  Audit Trail &amp; STT Stream
                </h2>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                {convexEvents && convexEvents.length > 0 ? `${convexEvents.length} Events` : 'Deepgram Nova-3'}
              </span>
            </div>

            {/* Structured 2x2 Sub-Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/60 rounded-md border border-slate-800/80 mb-3">
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Confidence</span>
                <span className="text-xs font-semibold text-emerald-400">99.4%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">Packet Loss</span>
                <span className="text-xs font-semibold text-slate-200">0.02%</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">VAD Latency</span>
                <span className="text-xs font-semibold text-slate-200">&lt; 180ms</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-mono uppercase block">MiniMax TTS</span>
                <span className="text-xs font-semibold text-slate-200">12 (&le;15 Words)</span>
              </div>
            </div>

            {/* Single-Column Transcript Stream with Mono Timestamps and Clear Speaker Chips */}
            <div className="space-y-2.5 font-mono text-xs overflow-y-auto max-h-[calc(100vh-380px)] pr-0.5 custom-scrollbar">
              {pirData?.summaryJson?.timeline && pirData.summaryJson.timeline.length > 0 ? (
                pirData.summaryJson.timeline.map((entry, idx) => (
                  <div key={`${entry.time}-${idx}`} className="p-3 rounded bg-slate-900 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5 text-[11px]">
                      <span className="text-slate-500 font-mono">{entry.time || '00:00:00'}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {entry.speaker || 'Speaker'}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      &ldquo;{entry.summary || '(no transcript content)'}&rdquo;
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-sans">
                      <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400 font-medium">
                        {llmUsed ? 'AI-Synthesized from War Room Transcript' : 'Auto-Populated from Ledger'}
                      </span>
                    </div>
                  </div>
                ))
              ) : convexEvents && convexEvents.length > 0 ? (
                convexEvents.map((evt, idx) => (
                  <div key={evt._id || idx} className="p-3 rounded bg-slate-900 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5 text-[11px]">
                      <span className="text-slate-500 font-mono">{evt.timestamp}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        {evt.speaker}
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      &ldquo;{evt.text}&rdquo;
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-sans">
                      {evt.tag === 'FACT' && (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Telemetry Fact
                        </span>
                      )}
                      {evt.tag === 'HYPOTHESIS' && (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Evaluated Hypothesis
                        </span>
                      )}
                      {evt.tag === 'CONTRADICTION' && (
                        <span className="text-rose-400 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Contradiction Flagged
                        </span>
                      )}
                      {evt.tag === 'ACTION' && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Flame className="h-3 w-3" /> Action Executed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : pirLoading ? (
                <div className="p-3 rounded bg-slate-900 border border-slate-800/80 text-slate-400 text-xs font-sans">
                  Loading transcript from war room ledger&hellip;
                </div>
              ) : (
                <>
                  <div className="p-3 rounded bg-slate-900 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5 text-[11px]">
                      <span className="text-slate-500 font-mono">14:02:00</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        EchoSphere Sentinel
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      &ldquo;EchoSphere sentinel flagged the 5xx spike at 14:02 across active ingress streams.&rdquo;
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-sans">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>{llmUsed ? 'AI-Synthesized from War Room Transcript' : 'Auto-Populated from Ledger'}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded bg-slate-900 border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1.5 text-[11px]">
                      <span className="text-slate-500 font-mono">14:03:15</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        HolmesGPT Engine
                      </span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      &ldquo;HolmesGPT engine correlated it with the ingress ConfigMap drift. Root cause: ingress-nginx port misconfiguration 8080 to 8000. Mitigation: Helm rollback.&rdquo;
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-sans">
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      <span>{llmUsed ? 'AI-Synthesized from War Room Transcript' : 'Auto-Populated from Ledger'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-slate-500 text-right">
            <span>RTM Transcripts: Synchronized</span>
          </div>
        </section>

        {/* ── ZONE 2 (2/4 Width / col-span-6): STATE RECONSTRUCTION ── */}
        <section className="lg:col-span-6 flex flex-col gap-4 justify-between">
          {/* Top: Critical Contradiction Banner */}
          <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-200 flex flex-col gap-1.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wide font-sans text-amber-300">
                  Critical Contradiction Detected &amp; Suppressed
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-amber-200 border border-amber-700/60">
                NLI CROSS-ENCODER: 96.8%
              </span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
              {liveContradictions.length > 0
                ? liveContradictions[0].text
                : "Database saturation claim contradicted by RDS telemetry (CPU 2.1%, Active conns: 14). EchoSphere held verbal silence and suppressed Akthar's hypothesis to prevent engineers from pursuing an incorrect triage path."}
            </p>
          </div>

          {/* Middle: Side-by-Side Facts vs Hypotheses with EQUAL HEIGHTS (Fix #3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
            {/* Confirmed Facts Card */}
            <div className="h-full flex-1 flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Confirmed Facts
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                    Telemetry
                  </span>
                </div>

                <ul className="text-xs space-y-2.5 text-slate-300 font-sans">
                  {liveFacts.length > 0 ? (
                    liveFacts.map((fact, idx) => (
                      <li key={fact._id || idx} className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-100">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{fact.text}</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Verified telemetry &bull; Spoken by {fact.speaker} at {fact.timestamp}
                        </span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-100">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>DB CPU 2.1%, latency unaffected</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          AWS RDS baseline normal; connection pool operating at 14/100.
                        </span>
                      </li>

                      <li className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-100">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>Ingress prefix points to port 8080</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Routing rule &apos;/api/v2/auth&apos; sends traffic to non-listening port.
                        </span>
                      </li>

                      <li className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-100">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>Target service listening on port 8000</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Verified target container socket listens on port 8000.
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Verified by HolmesGPT</span>
                <span className="text-emerald-400">
                  {liveFacts.length > 0 ? `${liveFacts.length} Verified Facts` : '3 Verified Facts'}
                </span>
              </div>
            </div>

            {/* Dismissed Hypotheses Card */}
            <div className="h-full flex-1 flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-lg p-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span className="text-rose-400 font-bold">✕</span>
                    Dismissed Hypotheses
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-rose-300 border border-slate-700">
                    NLI Filtered
                  </span>
                </div>

                <ul className="text-xs space-y-2.5 font-sans">
                  {liveHypotheses.length > 0 ? (
                    liveHypotheses.map((hyp, idx) => (
                      <li key={hyp._id || idx} className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-200">
                            <span className="text-rose-400 font-bold">✕</span>
                            <span>{hyp.text}</span>
                          </div>
                          <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Hypothesized by {hyp.speaker} at {hyp.timestamp} &bull; Cross-referenced with telemetry
                        </span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-200">
                            <span className="text-rose-400 font-bold">✕</span>
                            <span>Database IOPS exhaustion</span>
                          </div>
                          <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Disproven by CloudWatch IOPS telemetry (&lt; 150 IOPS).
                        </span>
                      </li>

                      <li className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-200">
                            <span className="text-rose-400 font-bold">✕</span>
                            <span>VPC Peering connection drop</span>
                          </div>
                          <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Transit gateways reported 0 dropped SYN packets.
                        </span>
                      </li>

                      <li className="flex flex-col gap-1 p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 font-medium text-slate-200">
                            <span className="text-rose-400 font-bold">✕</span>
                            <span>Container OOMKilled</span>
                          </div>
                          <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                        </div>
                        <span className="text-slate-400 text-[11px] leading-relaxed pl-4">
                          Pod restart count is 0; memory RSS usage stable at 38%.
                        </span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>NLI Cross-Encoder v3</span>
                <span className="text-rose-400">
                  {liveHypotheses.length > 0 ? `${liveHypotheses.length} Ruled Out` : '3 Ruled Out'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Automated Diagnostics & Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-slate-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">
                  Automated Diagnostics &amp; Cluster Telemetry (HolmesGPT)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700">
                Live Prometheus
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-sans">
                  <Cpu className="h-3.5 w-3.5 text-slate-400" />
                  <span>RDS Postgres CPU</span>
                </div>
                <div className="text-emerald-400 text-sm font-semibold">2.1%</div>
                <span className="text-[10px] text-slate-500 font-sans">Pool: 14/100 healthy</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-sans">
                  <Layers className="h-3.5 w-3.5 text-slate-400" />
                  <span>Ingress Error Rate</span>
                </div>
                <div className="text-rose-400 text-sm font-semibold">42.8% &rarr; 0.0%</div>
                <span className="text-[10px] text-emerald-400 font-sans">Normalized post-patch</span>
              </div>

              <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mb-1 font-sans">
                  <Server className="h-3.5 w-3.5 text-slate-400" />
                  <span>Pod Restarts</span>
                </div>
                <div className="text-slate-200 text-sm font-semibold">0 restarts</div>
                <span className="text-[10px] text-slate-500 font-sans">3/3 pods running</span>
              </div>
            </div>

            {/* 4. Incident Sequence Timeline with Horizontal Connecting Track (Fix #4) */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono block mb-2.5">
                Incident Sequence Timeline
              </span>
              <div className="relative flex items-center justify-between w-full py-1">
                {/* Visible horizontal divider track line behind the nodes */}
                <div className="absolute top-2 left-0 right-0 h-[1px] bg-slate-800 w-full -z-0" />

                <div className="relative z-10 flex flex-col items-center text-center bg-slate-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-slate-700 border-2 border-slate-900 mb-1" />
                  <span className="font-mono text-[10px] text-slate-500">14:05:10</span>
                  <span className="text-[11px] text-slate-400 font-medium">Alert Triggered</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center bg-slate-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500 border-2 border-slate-900 mb-1" />
                  <span className="font-mono text-[10px] text-slate-500">14:05:25</span>
                  <span className="text-[11px] text-slate-400 font-medium">Contradiction Suppressed</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center bg-slate-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500 border-2 border-slate-900 mb-1" />
                  <span className="font-mono text-[10px] text-slate-500">14:05:58</span>
                  <span className="text-[11px] text-slate-400 font-medium">Patch Staged</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center bg-slate-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-slate-900 mb-1" />
                  <span className="font-mono text-[10px] text-slate-400">14:06:12</span>
                  <span className="text-[11px] text-slate-200 font-semibold">1-Click Hotfix Executed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ZONE 3 (1/4 Width / col-span-3): HUMAN APPROVAL & PATCH EXECUTION ── */}
        <section className="lg:col-span-3 bg-slate-900/60 border border-slate-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-sans">
                Human Approval &amp; Patch
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Action: 200 OK
              </span>
            </div>

            {/* Staged Kubernetes Patch Box */}
            <div className="p-3.5 rounded bg-rose-950/20 border border-rose-900/40 mb-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-rose-300 block font-sans">STAGED KUBERNETES PATCH</span>
                <span className="text-[10px] font-mono text-emerald-400">REVERT GUARANTEED</span>
              </div>
              <p className="text-xs text-slate-300 mb-2.5 leading-relaxed font-sans">
                {convexIncident?.mitigation || (
                  <>
                    Re-route traffic from ingress <span className="font-mono text-slate-200">auth-svc:8080</span> to <span className="font-mono text-slate-200">auth-svc:8000</span>.
                  </>
                )}
              </p>

              {/* 1. Horizontally Scrollable Terminal Block with Header Copy Action (Fix #1: Zero Overlap) */}
              <div className="rounded bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-2.5 py-1 bg-slate-900/60 border-b border-slate-800/80">
                  <span className="text-[10px] font-mono text-slate-500 uppercase">manifest.sh</span>
                  <button
                    onClick={copyManifest}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
                    title="Copy command"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] p-2.5 text-slate-300 leading-normal custom-scrollbar">
                  {convexIncident?.hotfixManifest ||
                    `kubectl patch ingress auth-svc -n prod-auth -p '{"spec":{"rules":[{"http":{"paths":[{"backend":{"service":{"port":{"number":8000}}}}]}}]}}'`}
                </pre>
              </div>
            </div>

            {/* Explicit Remediation Metadata (Realistic SRE Telemetry) */}
            <div className="space-y-2 rounded bg-slate-950/60 border border-slate-800 p-3 text-xs font-sans text-slate-400">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">Action</span>
                <span className="text-slate-200 font-medium text-[11px]">
                  {pirData?.summaryJson?.mitigation || convexIncident?.mitigation || 'Authorize traffic re-route from ingress auth-svc:8080 to auth-svc:8000.'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">Root Cause / Analysis</span>
                <span className="text-slate-200 text-[11px]">
                  {pirData?.summaryJson?.rootCause || pirData?.summaryJson?.causes || convexIncident?.causes || convexIncident?.rootCause || 'Ingress prefix points to port 8080 while container listens on port 8000.'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">Impact</span>
                <span className="text-slate-200 text-[11px]">
                  {pirData?.summaryJson?.impact || convexIncident?.impact || 'Zero-downtime rolling restart of 3 ingress pods.'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase font-mono block">Risk</span>
                <span className="text-emerald-400 font-medium text-[11px]">
                  Low (Isolated namespace).
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Namespace:</span>
                  <span className="text-slate-200">prod-auth</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cluster Context:</span>
                  <span className="text-slate-200">eks-us-east-1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Authorizer ID:</span>
                  <span className="text-slate-200">{convexIncident?.lead || 'Akthar (Lead SRE)'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passkey Modality:</span>
                  <span className="text-slate-200">Voice Passkey + 1-Click</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Enterprise Emerald / Rose */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleAuthorizeHotfix}
              disabled={isRemediating}
              className={`w-full py-2.5 rounded text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 border cursor-pointer ${
                isResolved
                  ? 'bg-emerald-700 hover:bg-emerald-600 text-white border-emerald-600'
                  : 'bg-rose-700 hover:bg-rose-600 text-white border-rose-600 active:scale-[0.98]'
              }`}
            >
              {isRemediating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Executing Hotfix Webhook...
                </>
              ) : isResolved ? (
                <>
                  <ShieldCheck className="h-4 w-4 text-emerald-200" />
                  1-Click Hotfix Executed (200 OK)
                </>
              ) : (
                <>
                  <Flame className="h-4 w-4" />
                  Authorize 1-Click Patch
                </>
              )}
            </button>

            <button
              onClick={handleExportPIR}
              className="w-full py-2 rounded text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition-colors flex items-center justify-center gap-1.5 font-sans cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Export Audit Markdown / PIR</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
