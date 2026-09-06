'use client';

import React, { useState } from 'react';
import { MessageSquare, Sparkles, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AskIncidentWidgetProps {
  className?: string;
}

/**
 * Floating bottom-right "Ask Ecosphere" widget matching incident.io's "Ask incident" feature.
 * Provides quick AI query capabilities for incidents, runbooks, and current system health.
 */
export function AskIncidentWidget({ className }: AskIncidentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hi! Ask me anything about your active incidents, recent alerts, or runbook mitigations.',
    },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userText = query.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setQuery('');

    // Simulated intelligent incident response
    setTimeout(() => {
      let reply = "I'm monitoring the active incidents. All systems are being tracked in real time.";
      if (userText.toLowerCase().includes('lead') || userText.toLowerCase().includes('who')) {
        reply = 'Ashley Sawatsky is currently assigned as incident lead on #7134 and #7125. SRE On-Call is leading #7126.';
      } else if (userText.toLowerCase().includes('status') || userText.toLowerCase().includes('7134')) {
        reply = 'Incident #7134 ("Alluring Muse") is in INVESTIGATING status with Major severity. War Room is active.';
      } else if (userText.toLowerCase().includes('checkout') || userText.toLowerCase().includes('payment')) {
        reply = 'Payment webhook timeouts were resolved earlier; checkout page error on INC-2 is under active investigation.';
      }
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    }, 600);
  };

  return (
    <div className={cn('fixed bottom-4 right-4 z-40', className)}>
      {/* Popover Panel */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white shadow-2xs">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Ask Ecosphere
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation Stream */}
          <div className="p-3 max-h-60 overflow-y-auto space-y-2.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-xl p-2.5 leading-relaxed max-w-[85%]',
                  m.role === 'user'
                    ? 'ml-auto bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200'
                )}
              >
                {m.text}
              </div>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 bg-white dark:bg-zinc-900">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question about incidents..."
              className="flex-1 bg-transparent px-2.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!query.trim()}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-100 p-1.5 text-white dark:text-zinc-900 hover:bg-black disabled:opacity-30 transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer"
        aria-label="Ask Ecosphere assistant"
      >
        <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
        <span>Ask Ecosphere</span>
      </button>
    </div>
  );
}

export default AskIncidentWidget;
