'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function PostIncidentDashboard({ params }: PageProps) {
  const resolvedParams = use(params);
  const rawId = resolvedParams?.id || 'INC-8921';
  const incidentNumber = rawId.startsWith('INC-') ? rawId : `INC-${rawId}`;

  const [isRemediating, setIsRemediating] = useState(false);
  const [isResolved, setIsResolved] = useState(true);
  const [copied, setCopied] = useState(false);

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
          authorizedBy: 'Akthar (Lead SRE)',
          passkeyUsed: true,
        }),
      });
      if (res.ok) {
        setIsResolved(true);
      }
    } catch (err) {
      console.error('Failed to remediate:', err);
    } finally {
      setIsRemediating(false);
    }
  };

  const copyManifest = () => {
    navigator.clipboard.writeText(
      `kubectl patch ingress auth-svc -n prod-auth -p '{"spec":{"rules":[{"http":{"paths":[{"backend":{"service":{"port":{"number":8000}}}}]}}]}}'`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col gap-5 font-sans antialiased">
      {/* ========================================================================= */}
      {/* TOP INCIDENT NAVIGATION BAR                                               */}
      {/* ========================================================================= */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-zinc-800 pb-4 gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>War Room</span>
          </Link>

          <span className="font-semibold text-lg tracking-tight text-white">EchoSphere AI</span>
          <span className="text-zinc-600 font-mono">/</span>
          <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
            #{incidentNumber}
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-950/60 text-rose-300 border border-rose-900 tracking-wide">
            [SEV-1]
          </span>
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800">
            [RESOLVED]
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">MTTR:</span>
            <span className="text-zinc-200">00:03:15</span>
          </div>
          <span className="text-zinc-700">•</span>
          <div>
            <span className="text-zinc-500">Cluster:</span> <span className="text-zinc-200">eks-us-east-1</span>
          </div>
          <span className="text-zinc-700">•</span>
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
        <section className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-zinc-400" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 font-sans">
                  Audit Trail &amp; STT Stream
                </h2>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                Deepgram Nova-3
              </span>
            </div>

            {/* 2. Structured 2x2 Sub-Telemetry Metrics Grid (Fix #2) */}
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-zinc-950/60 rounded-md border border-zinc-800/80 mb-3">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">Confidence</span>
                <span className="text-xs font-semibold text-emerald-400">99.4%</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">Packet Loss</span>
                <span className="text-xs font-semibold text-zinc-200">0.02%</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">VAD Latency</span>
                <span className="text-xs font-semibold text-zinc-200">&lt; 180ms</span>
              </div>
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase block">MiniMax TTS</span>
                <span className="text-xs font-semibold text-zinc-200">12 (&le;15 Words)</span>
              </div>
            </div>

            {/* Single-Column Transcript Stream with Mono Timestamps and Clear Speaker Chips */}
            <div className="space-y-2.5 font-mono text-xs overflow-y-auto max-h-[calc(100vh-380px)] pr-0.5 custom-scrollbar">
              <div className="p-3 rounded bg-zinc-900 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-zinc-500 font-mono">14:05:22</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 text-amber-300 border border-zinc-700">
                    Akthar (Lead SRE)
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  &ldquo;Database connection pools are throwing timeouts. We might have a deadlocked RDS instance.&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-400 font-sans">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  <span>Tagged as Unverified Hypothesis</span>
                </div>
              </div>

              <div className="p-3 rounded bg-zinc-900 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-zinc-500 font-mono">14:05:40</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                    Ashrith (Infra)
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  &ldquo;Ingress controllers are dropping routes on auth-svc. Checking pod network endpoints.&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-sans">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Correlated with Prometheus 502 Metrics</span>
                </div>
              </div>

              <div className="p-3 rounded bg-zinc-900 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-zinc-500 font-mono">14:05:58</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 text-zinc-200 border border-zinc-700">
                    EchoSphere Sentinel
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  &ldquo;Ingress prefix route points to 8080. Pod listens on 8000. Staging hotfix patch.&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-rose-300 font-sans">
                  <Flame className="h-3 w-3 shrink-0 text-rose-400" />
                  <span>Voice Cap: 12 words used &bull; MiniMax TTS</span>
                </div>
              </div>

              <div className="p-3 rounded bg-zinc-900 border border-zinc-800/80">
                <div className="flex items-center justify-between mb-1.5 text-[11px]">
                  <span className="text-zinc-500 font-mono">14:06:12</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-sans font-medium bg-zinc-800 text-emerald-300 border border-zinc-700">
                    Akthar (Lead SRE)
                  </span>
                </div>
                <p className="text-zinc-300 font-sans text-xs leading-relaxed">
                  &ldquo;Understood. EchoSphere, authorize patch.&rdquo;
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-sans">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  <span>Dual-Modal Voice Passkey Accepted</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 text-[10px] font-mono text-zinc-500 text-right">
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
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-amber-200 border border-amber-700/60">
                NLI CROSS-ENCODER: 96.8%
              </span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed font-sans">
              Database saturation claim contradicted by RDS telemetry (CPU 2.1%, Active conns: 14).
              EchoSphere held verbal silence and suppressed Akthar&apos;s hypothesis to prevent engineers from pursuing an incorrect triage path.
            </p>
          </div>

          {/* Middle: Side-by-Side Facts vs Hypotheses with EQUAL HEIGHTS (Fix #3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 items-stretch">
            {/* Confirmed Facts Card */}
            <div className="h-full flex-1 flex flex-col justify-between bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Confirmed Facts
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 border border-zinc-700">
                    Telemetry
                  </span>
                </div>

                <ul className="text-xs space-y-2.5 text-zinc-300 font-sans">
                  <li className="flex flex-col gap-1 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-zinc-100">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>DB CPU 2.1%, latency unaffected</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] leading-relaxed pl-4">
                      AWS RDS baseline normal; connection pool operating at 14/100.
                    </span>
                  </li>

                  <li className="flex flex-col gap-1 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-zinc-100">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Ingress prefix points to port 8080</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] leading-relaxed pl-4">
                      Routing rule &apos;/api/v2/auth&apos; sends traffic to non-listening port.
                    </span>
                  </li>

                  <li className="flex flex-col gap-1 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-zinc-100">
                        <span className="text-emerald-400 font-bold">✓</span>
                        <span>Target service listening on port 8000</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-medium">[CONFIRMED]</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] leading-relaxed pl-4">
                      Verified target container socket listens on port 8000.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>Verified by HolmesGPT</span>
                <span className="text-emerald-400">3 Verified Facts</span>
              </div>
            </div>

            {/* Dismissed Hypotheses Card */}
            <div className="h-full flex-1 flex flex-col justify-between bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                  <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                    <span className="text-rose-400 font-bold">✕</span>
                    Dismissed Hypotheses
                  </h3>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-300 border border-zinc-700">
                    NLI Filtered
                  </span>
                </div>

                <ul className="text-xs space-y-2.5 font-sans">
                  <li className="flex flex-col gap-1 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-zinc-200">
                        <span className="text-rose-400 font-bold">✕</span>
                        <span>Database IOPS exhaustion</span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] leading-relaxed pl-4">
                      Disproven by CloudWatch IOPS telemetry (&lt; 150 IOPS).
                    </span>
                  </li>

                  <li className="flex flex-col gap-1 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-zinc-200">
                        <span className="text-rose-400 font-bold">✕</span>
                        <span>VPC Peering connection drop</span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] leading-relaxed pl-4">
                      Transit gateways reported 0 dropped SYN packets.
                    </span>
                  </li>

                  <li className="flex flex-col gap-1 p-2.5 rounded bg-zinc-950/60 border border-zinc-800/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-zinc-200">
                        <span className="text-rose-400 font-bold">✕</span>
                        <span>Container OOMKilled</span>
                      </div>
                      <span className="text-[10px] font-mono text-rose-400 font-semibold">[RULED OUT]</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] leading-relaxed pl-4">
                      Pod restart count is 0; memory RSS usage stable at 38%.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>NLI Cross-Encoder v3</span>
                <span className="text-rose-400">3 Ruled Out</span>
              </div>
            </div>
          </div>

          {/* Bottom Card: Automated Diagnostics & Timeline */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2">
                <Server className="h-3.5 w-3.5 text-zinc-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-sans">
                  Automated Diagnostics &amp; Cluster Telemetry (HolmesGPT)
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 border border-zinc-700">
                Live Prometheus
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1 font-sans">
                  <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                  <span>RDS Postgres CPU</span>
                </div>
                <div className="text-emerald-400 text-sm font-semibold">2.1%</div>
                <span className="text-[10px] text-zinc-500 font-sans">Pool: 14/100 healthy</span>
              </div>

              <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1 font-sans">
                  <Layers className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Ingress Error Rate</span>
                </div>
                <div className="text-rose-400 text-sm font-semibold">42.8% &rarr; 0.0%</div>
                <span className="text-[10px] text-emerald-400 font-sans">Normalized post-patch</span>
              </div>

              <div className="p-2.5 rounded bg-zinc-950/70 border border-zinc-800">
                <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] mb-1 font-sans">
                  <Server className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Pod Restarts</span>
                </div>
                <div className="text-zinc-200 text-sm font-semibold">0 restarts</div>
                <span className="text-[10px] text-zinc-500 font-sans">3/3 pods running</span>
              </div>
            </div>

            {/* 4. Incident Sequence Timeline with Horizontal Connecting Track (Fix #4) */}
            <div className="pt-3 border-t border-zinc-800">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-mono block mb-2.5">
                Incident Sequence Timeline
              </span>
              <div className="relative flex items-center justify-between w-full py-1">
                {/* Visible horizontal divider track line behind the nodes */}
                <div className="absolute top-2 left-0 right-0 h-[1px] bg-zinc-800 w-full -z-0" />

                <div className="relative z-10 flex flex-col items-center text-center bg-zinc-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-zinc-700 border-2 border-zinc-900 mb-1" />
                  <span className="font-mono text-[10px] text-zinc-500">14:05:10</span>
                  <span className="text-[11px] text-zinc-400 font-medium">Alert Triggered</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center bg-zinc-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-amber-500 border-2 border-zinc-900 mb-1" />
                  <span className="font-mono text-[10px] text-zinc-500">14:05:25</span>
                  <span className="text-[11px] text-zinc-400 font-medium">Contradiction Suppressed</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center bg-zinc-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500 border-2 border-zinc-900 mb-1" />
                  <span className="font-mono text-[10px] text-zinc-500">14:05:58</span>
                  <span className="text-[11px] text-zinc-400 font-medium">Patch Staged</span>
                </div>

                <div className="relative z-10 flex flex-col items-center text-center bg-zinc-900/90 px-1.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-zinc-900 mb-1" />
                  <span className="font-mono text-[10px] text-zinc-400">14:06:12</span>
                  <span className="text-[11px] text-zinc-200 font-semibold">1-Click Hotfix Executed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── ZONE 3 (1/4 Width / col-span-3): HUMAN APPROVAL & PATCH EXECUTION ── */}
        <section className="lg:col-span-3 bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 font-sans">
                Human Approval &amp; Patch
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Action: 200 OK
              </span>
            </div>

            {/* Staged Kubernetes Patch Box */}
            <div className="p-3.5 rounded bg-rose-950/20 border border-rose-900/40 mb-3.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-rose-300 block font-sans">STAGED KUBERNETES PATCH</span>
                <span className="text-[10px] font-mono text-emerald-400">REVERT GUARANTEED</span>
              </div>
              <p className="text-xs text-zinc-300 mb-2.5 leading-relaxed font-sans">
                Re-route traffic from ingress <span className="font-mono text-zinc-200">auth-svc:8080</span> to <span className="font-mono text-zinc-200">auth-svc:8000</span>.
              </p>

              {/* 1. Horizontally Scrollable Terminal Block with Header Copy Action (Fix #1: Zero Overlap) */}
              <div className="rounded bg-zinc-950 border border-zinc-800 overflow-hidden">
                <div className="flex items-center justify-between px-2.5 py-1 bg-zinc-900/60 border-b border-zinc-800/80">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">manifest.sh</span>
                  <button
                    onClick={copyManifest}
                    className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Copy command"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="overflow-x-auto whitespace-pre font-mono text-[11px] p-2.5 text-zinc-300 leading-normal custom-scrollbar">
                  {`kubectl patch ingress auth-svc -n prod-auth -p '{"spec":{"rules":[{"http":{"paths":[{"backend":{"service":{"port":{"number":8000}}}}]}}]}}'`}
                </pre>
              </div>
            </div>

            {/* Explicit Remediation Metadata (Realistic SRE Telemetry) */}
            <div className="space-y-2 rounded bg-zinc-950/60 border border-zinc-800 p-3 text-xs font-sans text-zinc-400">
              <div>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono block">Action</span>
                <span className="text-zinc-200 font-medium text-[11px]">
                  Authorize traffic re-route from ingress auth-svc:8080 to auth-svc:8000.
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono block">Impact</span>
                <span className="text-zinc-200 text-[11px]">
                  Zero-downtime rolling restart of 3 ingress pods.
                </span>
              </div>

              <div>
                <span className="text-[10px] font-semibold text-zinc-500 uppercase font-mono block">Risk</span>
                <span className="text-emerald-400 font-medium text-[11px]">
                  Low (Isolated namespace).
                </span>
              </div>

              <div className="pt-2 border-t border-zinc-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Target Namespace:</span>
                  <span className="text-zinc-200">prod-auth</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Cluster Context:</span>
                  <span className="text-zinc-200">eks-us-east-1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Authorizer ID:</span>
                  <span className="text-zinc-200">Akthar (Lead SRE)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Passkey Modality:</span>
                  <span className="text-zinc-200">Voice Passkey + 1-Click</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Enterprise Emerald / Rose */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleAuthorizeHotfix}
              disabled={isRemediating}
              className={`w-full py-2.5 rounded text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-2 border ${
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
              onClick={() => {
                alert('PIR report downloaded as audit-INC-8921.json');
              }}
              className="w-full py-2 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 border border-zinc-700/80 hover:border-zinc-600 transition-colors flex items-center justify-center gap-1.5 font-sans"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Export Audit JSON / PIR</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
