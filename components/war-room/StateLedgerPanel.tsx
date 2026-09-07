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
  /**
   * Surface the panel is mounted on. The app never applies a `.dark` class —
   * the war room is dark because it hard-codes dark surfaces — so the theme
   * has to be passed in explicitly rather than inferred from `dark:` variants.
   * Defaults to 'dark' for the war room, its original home.
   */
  variant?: 'dark' | 'light';
}

/**
 * Category is carried by a 3px left rule and nothing else — no glow, no neon
 * outline. Everything else on the card resolves to the neutral slate spine.
 */
const CATEGORY_RULE: Record<string, string> = {
  FACT: 'border-l-emerald-600',
  HYPOTHESIS: 'border-l-amber-500',
  CONTRADICTION: 'border-l-rose-600',
  ACTION: 'border-l-slate-600',
  QUESTION: 'border-l-slate-400',
};

const SURFACE = {
  dark: {
    card: 'border-slate-800 bg-[#28292c] hover:bg-[#303134]',
    meta: 'text-slate-400',
    speaker: 'text-slate-100',
    tag: 'border-slate-700 bg-slate-800 text-slate-300',
    body: 'text-slate-200',
    status: 'text-slate-400',
    inset: 'border-slate-700 bg-slate-950 text-slate-300',
    insetStrong: 'text-slate-200',
    chip: 'border-slate-700 bg-slate-800 text-emerald-400',
  },
  light: {
    card: 'border-slate-200 bg-slate-50 hover:bg-slate-100',
    meta: 'text-slate-500',
    speaker: 'text-slate-900',
    tag: 'border-slate-200 bg-white text-slate-600',
    body: 'text-slate-900',
    status: 'text-slate-500',
    inset: 'border-slate-200 bg-white text-slate-600',
    insetStrong: 'text-slate-900',
    chip: 'border-slate-200 bg-slate-50 text-emerald-700',
  },
} as const;

export function StateLedgerPanel({
  items = DEFAULT_ITEMS,
  variant = 'dark',
}: StateLedgerPanelProps) {
  const tone = SURFACE[variant];
  return (
    <div className="flex flex-col gap-3 p-3.5 font-sans">
      {items.map((item) => {
        const rule = CATEGORY_RULE[item.tag] ?? 'border-l-slate-400';

        return (
          <div
            key={item.id}
            className={`group relative flex flex-col rounded-r-md border border-l-[3px] p-3.5 text-xs transition-colors ${tone.card} ${rule}`}
          >
            {/* Header row: Timestamp (font-mono), Speaker (font-sans), Matte Tag Badge */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`font-mono text-xs ${tone.meta}`}>
                  {formatLedgerTimestamp(item)}
                </span>
                <span className={`font-sans font-medium text-xs ${tone.speaker}`}>
                  {item.speaker}
                </span>
              </div>

              {/* Muted matte tag pill — monochrome, the left rule carries category */}
              <span
                className={`rounded border px-2 py-0.5 font-sans text-[10px] font-medium uppercase tracking-wide ${tone.tag}`}
              >
                {item.tag}
              </span>
            </div>

            {/* Main Statement text - font-sans, font-normal, leading-relaxed */}
            <p
              className={`font-sans text-xs tracking-normal font-normal leading-relaxed ${tone.body}`}
            >
              {item.text}
              {item.status && (
                <span className={`ml-1 font-normal ${tone.status}`}>
                  → Tag: {item.status}
                </span>
              )}
            </p>

            {/* Contradiction Analysis Reason Box */}
            {item.tag === 'CONTRADICTION' && item.reason && (
              <div
                className={`mt-2.5 rounded-md border p-2.5 font-sans text-xs leading-relaxed ${tone.inset}`}
              >
                <div
                  className={`flex items-center gap-1.5 font-medium mb-1 text-xs ${
                    variant === 'dark' ? 'text-rose-400' : 'text-rose-600'
                  }`}
                >
                  <ShieldAlert className="h-3.5 w-3.5" /> Contradiction Analysis:
                </div>
                <p className="font-sans font-normal text-xs leading-relaxed">{item.reason}</p>
              </div>
            )}

            {/* Diagnostic Root Cause Action Box */}
            {item.tag === 'ACTION' && item.reason && (
              <div
                className={`mt-2.5 rounded-md border p-2.5 font-sans text-xs leading-relaxed ${tone.inset}`}
              >
                <div
                  className={`flex items-center gap-1.5 font-medium mb-1 text-xs ${
                    variant === 'dark' ? 'text-amber-400' : 'text-amber-600'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5" /> Diagnostic Root Cause:
                </div>
                <p className="font-sans font-normal text-xs leading-relaxed">{item.reason}</p>
              </div>
            )}

            {/* Structured Telemetry Evidence Badge */}
            {item.telemetryEvidence && (
              <div
                className={`mt-2 flex items-center justify-between rounded border px-2.5 py-1.5 font-mono text-[10px] ${tone.inset}`}
              >
                <span className="truncate">
                  Telemetry:{' '}
                  <span className={`font-medium ${tone.insetStrong}`}>
                    {item.telemetryEvidence.component}
                  </span>
                </span>
                {typeof item.telemetryEvidence.confidence === 'number' && (
                  <span
                    className={`ml-2 shrink-0 rounded border px-1.5 py-0.5 text-[9px] ${tone.chip}`}
                  >
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
