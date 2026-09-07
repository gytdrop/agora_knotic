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
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-100/70 to-slate-100/70 dark:from-slate-950/30 dark:to-slate-950/30">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Ask EchoSphere AI</span>
                  <span className="text-[10px] font-semibold text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/60 px-1.5 py-0.2 rounded-full border border-slate-200 dark:border-slate-800">
                    Live
                  </span>
                </h2>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  {incidentId} Telemetry Assistant
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Suggested Questions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(prompt)}
                  className="text-left text-[11px] bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-300 hover:border-slate-300 hover:text-slate-900 dark:hover:border-slate-800 transition-colors shadow-2xs cursor-pointer"
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
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {m.role === 'user' ? 'You' : 'AI'}
                </div>
                <div
                  className={cn(
                    'p-3 rounded-xl leading-relaxed whitespace-pre-line',
                    m.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100'
                  )}
                >
                  <div>{m.text}</div>
                  <div
                    className={cn(
                      'text-[9px] mt-1',
                      m.role === 'user' ? 'text-slate-200 text-right' : 'text-slate-400'
                    )}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                <span className="h-2 w-2 rounded-full bg-slate-700 animate-ping" />
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
            className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about this incident..."
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-slate-700/30"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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
