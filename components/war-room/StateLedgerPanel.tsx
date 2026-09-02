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
            className="group relative flex flex-col rounded-lg border border-zinc-800 bg-zinc-900/90 p-3 text-xs shadow-sm transition-all hover:border-zinc-700"
          >
            {/* Header timestamp & Speaker tag */}
            <div className="flex items-center justify-between pb-1.5 font-mono text-[11px]">
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span>{item.timestamp}</span>
                {item.cite && <span className="font-semibold">[cite: {item.cite}]</span>}
                <span className="font-semibold text-zinc-200">[{item.speaker}]</span>
              </div>

              {/* Tag pill - Color applied ONLY to tag badge */}
              <span
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border ${
                  isFact
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                    : isHypothesis
                    ? 'bg-amber-950/60 text-amber-400 border-amber-800/60'
                    : 'bg-rose-950/60 text-rose-400 border-rose-800/60'
                }`}
              >
                {item.tag}
              </span>
            </div>

            {/* Main Statement text */}
            <p className="font-sans text-xs leading-relaxed font-medium text-zinc-200">
              {item.text}
              {item.status && (
                <span className="ml-1 font-mono text-[11px] text-zinc-400">
                  -&gt; Tag: {item.status}
                </span>
              )}
            </p>

            {/* Contradiction Analysis Box */}
            {item.reason && (
              <div className="mt-2.5 rounded bg-zinc-950 p-2.5 font-sans text-[11px] text-zinc-300 border border-zinc-800/80 shadow-md">
                <div className="flex items-center gap-1 font-semibold text-rose-400 mb-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-400" /> Contradiction Analysis:
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
