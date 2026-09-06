'use client';

import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  MessageSquare, 
  CheckCircle2, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';
import { HitlGuardrailCard } from '../HitlGuardrailCard';
import { StateLedgerPanel, type LedgerItem } from '../StateLedgerPanel';

interface ActionsTabProps {
  ledgerItems?: LedgerItem[];
  isHotfixStaged?: boolean;
  isResolved?: boolean;
  onRemediateSuccess?: () => void | Promise<void>;
}

export function ActionsTab({
  ledgerItems,
  isHotfixStaged = true,
  isResolved = false,
  onRemediateSuccess,
}: ActionsTabProps) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'facts' | 'hypotheses' | 'contradictions'>('all');

  const filteredItems = useMemo(() => {
    if (!ledgerItems || activeFilter === 'all') return ledgerItems;
    const tagMap: Record<string, string> = {
      facts: 'FACT',
      hypotheses: 'HYPOTHESIS',
      contradictions: 'CONTRADICTION',
    };
    return ledgerItems.filter((item) => item.tag === tagMap[activeFilter]);
  }, [ledgerItems, activeFilter]);

  return (
    <div className="flex flex-col h-full bg-[#18191d] text-zinc-200 font-sans text-xs select-none">
      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4 custom-scrollbar">
        {/* Section 1: Relocated HITL Guardrail Capsule */}
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-zinc-200 text-xs mb-2">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span>HITL Remediation Capsule</span>
          </div>

          <HitlGuardrailCard
            isStaged={isHotfixStaged}
            isResolved={isResolved}
            onRemediateSuccess={onRemediateSuccess}
          />
        </div>

        {/* Section 2: Conversation Parsing Header & Filter Pills */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-zinc-200 text-xs uppercase tracking-wide">
              Conversation Parsing
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              RTM Live
            </span>
          </div>

          {/* Filter Pills */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800/80 mb-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>All</span>
            </button>

            <button
              onClick={() => setActiveFilter('facts')}
              className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                activeFilter === 'facts'
                  ? 'bg-zinc-800 text-emerald-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400" />
              <span>Facts</span>
            </button>

            <button
              onClick={() => setActiveFilter('hypotheses')}
              className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                activeFilter === 'hypotheses'
                  ? 'bg-zinc-800 text-amber-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Activity className="h-3 w-3 text-amber-400" />
              <span>Hypo</span>
            </button>

            <button
              onClick={() => setActiveFilter('contradictions')}
              className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                activeFilter === 'contradictions'
                  ? 'bg-zinc-800 text-rose-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <AlertTriangle className="h-3 w-3 text-rose-400" />
              <span>Contra</span>
            </button>
          </div>

          {/* State Ledger Feed */}
          <div className="rounded-xl border border-zinc-800/60 bg-[#16171b] overflow-hidden">
            <StateLedgerPanel items={filteredItems} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionsTab;
