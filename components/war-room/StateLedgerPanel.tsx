'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

export interface LedgerItem {
  id: string;
  timestamp: string;
  speaker: string;
  text: string;
  tag: 'FACT' | 'HYPOTHESIS' | 'CONTRADICTION' | 'ACTION';
  status?: string;
  reason?: string;
  cite?: string;
}

const DEFAULT_ITEMS: LedgerItem[] = [
  {
    id: '1',
    timestamp: '12:30:15',
    speaker: 'Akthar',
    text: "'Database is locked up'",
    tag: 'HYPOTHESIS',
    status: 'Hypothesis',
  },
  {
    id: '2',
    timestamp: '12:30:20',
    speaker: 'Ashrith',
    text: "'Ingress pods OOMing'",
    tag: 'FACT',
    status: 'Confirmed Fact (HolmesGPT)',
    cite: 'Ashrith',
  },
  {
    id: '3',
    timestamp: '12:30:25',
    speaker: 'Akthar vs. Ashrith',
    text: 'Ingress health contradicts DB lockup',
    tag: 'CONTRADICTION',
    status: 'Suppressed (miniMax voice holding)',
    reason:
      'Contradiction Confirmed. HolmesGPT shows healthy DB connection pools. Suppressing Akthar\'s hypothesis to prevent false path.',
    cite: '1',
  },
];

interface StateLedgerPanelProps {
  items?: LedgerItem[];
}

export function StateLedgerPanel({ items = DEFAULT_ITEMS }: StateLedgerPanelProps) {
  return (
    <div className="flex flex-col gap-2.5 p-3">
      {items.map((item) => {
        const isFact = item.tag === 'FACT';
        const isHypothesis = item.tag === 'HYPOTHESIS';

        return (
          <div
            key={item.id}
            className={`group relative flex flex-col rounded-lg border p-3 text-xs transition-all ${
              isFact
                ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-200'
                : isHypothesis
                ? 'border-amber-800/50 bg-amber-950/40 text-amber-200'
                : 'border-rose-800/60 bg-rose-950/50 text-rose-200'
            }`}
          >
            {/* Header timestamp & Speaker tag */}
            <div className="flex items-center justify-between pb-1 font-mono text-[11px] opacity-90">
              <div className="flex items-center gap-1.5">
                <span className="text-zinc-400">{item.timestamp}</span>
                {item.cite && (
                  <span className="text-zinc-400 font-semibold">[cite: {item.cite}]</span>
                )}
                <span className="font-semibold text-zinc-100">[{item.speaker}]</span>
              </div>

              {/* Tag pill */}
              <span
                className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
                  isFact
                    ? 'bg-emerald-900/60 text-emerald-300'
                    : isHypothesis
                    ? 'bg-amber-900/60 text-amber-300'
                    : 'bg-rose-900/70 text-rose-300'
                }`}
              >
                {item.tag}
              </span>
            </div>

            {/* Main Statement text */}
            <p className="font-sans text-xs leading-relaxed font-medium">
              {item.text}
              {item.status && (
                <span className="ml-1 opacity-80 font-mono text-[11px]">
                  -&gt; Tag: {item.status}
                </span>
              )}
            </p>

            {/* Contradiction Hover Tooltip Reason Box */}
            {item.reason && (
              <div className="mt-2 rounded bg-zinc-950/90 p-2 font-sans text-[11px] text-zinc-300 border border-zinc-800 shadow-md">
                <div className="flex items-center gap-1 font-semibold text-rose-400 mb-0.5">
                  <ShieldAlert className="h-3 w-3" /> Contradiction Analysis:
                </div>
                <p className="leading-snug text-zinc-300">{item.reason}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
export default StateLedgerPanel;
