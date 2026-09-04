'use client';

import React from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import type { LedgerItem } from '@/types/conversation';
import { formatLedgerTimestamp } from '@/lib/ledger';

export type { LedgerItem } from '@/types/conversation';

const DEFAULT_ITEMS: LedgerItem[] = [
  {
    id: '1',
    timestampMs: 1725432015000,
    speaker: 'Akthar',
    text: '"Database is locked up"',
    tag: 'HYPOTHESIS',
    status: 'Hypothesis',
  },
  {
    id: '2',
    timestampMs: 1725432020000,
    speaker: 'Ashrith',
    text: '"Ingress pods OOMing"',
    tag: 'FACT',
    status: 'Confirmed Fact (HolmesGPT)',
  },
  {
    id: '3',
    timestampMs: 1725432025000,
    speaker: 'Akthar vs. Ashrith',
    text: 'Ingress health contradicts DB lockup',
    tag: 'CONTRADICTION',
    status: 'Suppressed (miniMax voice holding)',
    reason:
      'Contradiction Confirmed. HolmesGPT shows healthy DB connection pools. Suppressing Akthar\'s hypothesis to prevent false path.',
  },
];

interface StateLedgerPanelProps {
  items?: LedgerItem[];
}

export function StateLedgerPanel({ items = DEFAULT_ITEMS }: StateLedgerPanelProps) {
  return (
    <div className="flex flex-col gap-3 p-3.5 font-sans">
      {items.map((item) => {
        const isFact = item.tag === 'FACT';
        const isHypothesis = item.tag === 'HYPOTHESIS';

        return (
          <div
            key={item.id}
            className="group relative flex flex-col rounded-xl border border-zinc-800/80 bg-[#28292c] p-3.5 text-xs shadow-sm transition-all hover:border-zinc-700"
          >
            {/* Header row: Timestamp (font-mono), Speaker (font-sans), Matte Tag Badge */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-zinc-400 text-xs">
                  {formatLedgerTimestamp(item)}
                </span>
                <span className="font-sans font-medium text-zinc-100 text-xs">
                  {item.speaker}
                </span>
              </div>

              {/* Muted Matte Tag Pill Badge - Zero neon */}
              <span
                className={`rounded px-2 py-0.5 font-sans text-[10px] font-medium tracking-wide uppercase border ${
                  isFact
                    ? 'bg-zinc-800 text-emerald-300 border-zinc-700'
                    : isHypothesis
                    ? 'bg-zinc-800 text-amber-300 border-zinc-700'
                    : 'bg-zinc-800 text-rose-300 border-zinc-700'
                }`}
              >
                {item.tag}
              </span>
            </div>

            {/* Main Statement text - font-sans, font-normal, leading-relaxed */}
            <p className="font-sans text-xs text-zinc-200 tracking-normal font-normal leading-relaxed">
              {item.text}
              {item.status && (
                <span className="ml-1 text-zinc-400 font-normal">
                  → Tag: {item.status}
                </span>
              )}
            </p>

            {/* Contradiction Analysis Reason Box */}
            {item.tag === 'CONTRADICTION' && item.reason && (
              <div className="mt-2.5 rounded-lg bg-zinc-950/90 p-2.5 font-sans text-xs leading-relaxed text-zinc-300 border border-rose-900/50 shadow-sm">
                <div className="flex items-center gap-1.5 font-medium text-rose-300 mb-1 text-xs">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Contradiction Analysis:
                </div>
                <p className="font-sans font-normal text-xs text-zinc-300 leading-relaxed">
                  {item.reason}
                </p>
              </div>
            )}

            {/* Diagnostic Root Cause Action Box */}
            {item.tag === 'ACTION' && item.reason && (
              <div className="mt-2.5 rounded-lg bg-zinc-950/90 p-2.5 font-sans text-xs leading-relaxed text-zinc-300 border border-amber-900/50 shadow-sm">
                <div className="flex items-center gap-1.5 font-medium text-amber-300 mb-1 text-xs">
                  <Activity className="h-3.5 w-3.5 text-amber-400" /> Diagnostic Root Cause:
                </div>
                <p className="font-sans font-normal text-xs text-zinc-300 leading-relaxed">
                  {item.reason}
                </p>
              </div>
            )}

            {/* Structured Telemetry Evidence Badge */}
            {item.telemetryEvidence && (
              <div className="mt-2 rounded bg-zinc-900/90 px-2.5 py-1.5 font-mono text-[10px] text-zinc-300 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-zinc-400 truncate">
                  Telemetry: <span className="text-zinc-200 font-medium">{item.telemetryEvidence.component}</span>
                </span>
                {typeof item.telemetryEvidence.confidence === 'number' && (
                  <span className="ml-2 shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-emerald-400 border border-zinc-700">
                    {Math.round(item.telemetryEvidence.confidence * 100)}% Conf
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
export default StateLedgerPanel;
