'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Settings,
  Radio,
} from 'lucide-react';
import { StateLedgerPanel, LedgerItem } from './StateLedgerPanel';

interface ConversationParsingPanelProps {
  items?: LedgerItem[];
}

export function ConversationParsingPanel({ items }: ConversationParsingPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'facts' | 'hypotheses' | 'contradictions'>('all');

  return (
    <aside
      className={`relative flex flex-col border-l border-zinc-800 bg-zinc-950 transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-80 md:w-96'
      }`}
    >
      {/* Drawer Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold tracking-wider text-zinc-100 uppercase">
              CONVERSATION PARSING
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-emerald-950/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-800/60">
              <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
              [RTM ACTIVE]
            </span>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex h-7 w-7 items-center justify-center rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title={isCollapsed ? 'Expand Side Drawer' : 'Collapse Side Drawer'}
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Drawer Body with Icon Rail */}
      <div className="flex flex-1 min-h-0">
        {/* Expanded Content Area */}
        {!isCollapsed && (
          <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
            <StateLedgerPanel items={items} />
          </div>
        )}

        {/* Right Icon Rail */}
        <div className="flex w-12 flex-col items-center gap-4 border-l border-zinc-800/80 bg-zinc-900/60 py-4 text-zinc-400">
          <button
            onClick={() => setActiveTab('all')}
            className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
              activeTab === 'all' ? 'text-emerald-400 bg-zinc-800' : ''
            }`}
            title="All Dialogue Turns"
          >
            <MessageSquare className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('facts')}
            className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
              activeTab === 'facts' ? 'text-emerald-400 bg-zinc-800' : ''
            }`}
            title="Confirmed Facts"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('hypotheses')}
            className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
              activeTab === 'hypotheses' ? 'text-amber-400 bg-zinc-800' : ''
            }`}
            title="Unverified Hypotheses"
          >
            <Activity className="h-4 w-4" />
          </button>

          <button
            onClick={() => setActiveTab('contradictions')}
            className={`p-2 rounded hover:bg-zinc-800 transition-colors ${
              activeTab === 'contradictions' ? 'text-rose-400 bg-zinc-800' : ''
            }`}
            title="Contradiction Alerts"
          >
            <AlertTriangle className="h-4 w-4" />
          </button>

          <div className="mt-auto">
            <button className="p-2 rounded hover:bg-zinc-800 transition-colors" title="Settings">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
export default ConversationParsingPanel;
