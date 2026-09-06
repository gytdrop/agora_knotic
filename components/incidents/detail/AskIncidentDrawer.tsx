'use client';

import React, { useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  Send,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AskIncidentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
}

export function AskIncidentDrawer({
  isOpen,
  onClose,
  incidentId,
}: AskIncidentDrawerProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: `Hello! I am your AI Incident Assistant for ${incidentId}. I have real-time access to the Agora War Room transcript, state ledger telemetry, and deployment logs. How can I assist?`,
      time: 'Just now',
    },
  ]);
  const [isThinking, setIsThinking] = useState(false);

  if (!isOpen) return null;

  const quickPrompts = [
    'What is the estimated blast radius & revenue impact?',
    'Who is currently on-call for downstream services?',
    'What deployments occurred in the last 60 minutes?',
    'Summarize active hypotheses and telemetry contradictions',
  ];

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;
    const userQ = textToSend.trim();
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userQ, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setQuery('');
    setIsThinking(true);

    setTimeout(() => {
      let answer = '';
      const q = userQ.toLowerCase();
      if (q.includes('blast') || q.includes('impact') || q.includes('revenue')) {
        answer =
          'Blast Radius Assessment:\n• Affected Endpoints: /v1/checkout/charge\n• Error Rate: 47.2% HTTP 504 Gateway Timeout\n• Transaction Velocity: ~1,420 checkout attempts/min failing\n• Est. Financial Velocity at Risk: $14,200/min across North America & Europe\n• Ingress ALB & Authentication services are healthy.';
      } else if (q.includes('on-call') || q.includes('who') || q.includes('team')) {
        answer =
          'Active On-Call Responders:\n• Payments Core: Ashley Sawatsky (Primary, Incident Lead)\n• Lead SRE / Investigator: David Chen (Secondary)\n• Downstream Fraud SRE: Meera Patel (Follow-the-Sun Primary)\n• Escalation policy: PagerDuty high-urgency SMS & voice paging enabled.';
      } else if (q.includes('deploy') || q.includes('release') || q.includes('recent')) {
        answer =
          'Recent Deployments (Past 60m):\n• 15:20 UTC: payment-service:v2.8.1 deployed to production via CI/CD build #4412.\n• Rollback target identified: payment-service:v2.8.0 (commit 4b21a8).\n• Canary cluster nodes currently serving 20% traffic.';
      } else if (q.includes('hypothes') || q.includes('contradiction') || q.includes('root cause')) {
        answer =
          'Telemetry Synthesis & Hypotheses:\n• [HYPOTHESIS]: David Chen hypothesized worker thread recursion memory leak in v2.8.1.\n• [CONTRADICTION]: HolmesGPT confirmed DB pool is nominal at 22% and pod memory stable at 58%.\n• [VERIFIED ROOT CAUSE]: Downstream socket backlog saturation on fraud-detection-svc (45% timeout rate).';
      } else {
        answer = `Analysis complete for "${userQ}": Telemetry confirms system is transitioning to FIXING stage. Canary rollback and Fraud SRE escalation are underway.`;
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: answer, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setIsThinking(false);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-purple-50/70 to-indigo-50/70 dark:from-purple-950/30 dark:to-indigo-950/30">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>Ask EchoSphere AI</span>
                  <span className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.2 rounded-full border border-purple-200 dark:border-purple-800">
                    Live
                  </span>
                </h2>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {incidentId} Telemetry Assistant
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/80 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200/80 dark:border-zinc-800 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-left text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 px-2.5 py-1 rounded-lg text-zinc-700 dark:text-zinc-300 hover:border-purple-300 hover:text-purple-600 dark:hover:border-purple-700 transition-colors shadow-2xs cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex gap-2.5 max-w-[90%]',
                  m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full shrink-0 text-[10px] font-bold',
                    m.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  )}
                >
                  {m.role === 'user' ? 'You' : 'AI'}
                </div>
                <div
                  className={cn(
                    'p-3 rounded-xl leading-relaxed whitespace-pre-line',
                    m.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  <div>{m.text}</div>
                  <div
                    className={cn(
                      'text-[9px] mt-1',
                      m.role === 'user' ? 'text-purple-200 text-right' : 'text-zinc-400'
                    )}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs italic">
                <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                <span>Reading state ledger & traces...</span>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(query);
            }}
            className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about this incident..."
              className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/30"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AskIncidentDrawer;
