'use client';

import React, { useState } from 'react';
import {
  Bot,
  Brain,
  CheckCircle2,
  Cpu,
  Flame,
  Menu,
  MessageSquare,
  Mic,
  Play,
  Send,
  Sparkles,
  Terminal,
  Users,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { cn } from '@/lib/utils';

export function EcosphereAiPageLayout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [playgroundQuery, setPlaygroundQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string; time: string }[]>([
    {
      role: 'assistant',
      text: 'I am Ecosphere AI, grounded in live incident telemetry and historical postmortems. Ask me about blast radius, active hypotheses, on-call responders, or recent deployments.',
      time: '15:40 UTC',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const promptChips = [
    'What caused the payment outage in #INC-8921?',
    'Who is currently on-call for downstream fraud services?',
    'Summarize recent deployments in the last 60 minutes',
    'What is the estimated blast radius and financial impact?',
  ];

  const handleSendPrompt = (promptText: string) => {
    if (!promptText.trim()) return;
    const userMsg = promptText.trim();
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setPlaygroundQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = 'Analyzing live incident context and telemetry state ledger...';
      const q = userMsg.toLowerCase();
      if (q.includes('cause') || q.includes('payment') || q.includes('8921')) {
        reply = 'Root Cause (#INC-8921): Deployment of payment-service:v2.8.1 introduced downstream connection timeouts to fraud-detection-svc. HolmesGPT verified pod memory (58%) and DB pools (22%) were nominal; the bottleneck was socket backlog saturation.';
      } else if (q.includes('on-call') || q.includes('fraud')) {
        reply = 'On-Call Roster: Meera Patel is currently Primary On-Call for Fraud SRE (Follow-the-Sun shift until 20:00 UTC). Backup: Alex Mercer. Secondary policy: Page SRE Manager if unacknowledged in 5 minutes.';
      } else if (q.includes('deploy') || q.includes('recent')) {
        reply = 'Recent Deployments: payment-service:v2.8.1 was deployed at 15:20 UTC by CI/CD build #4412. All other microservices (auth-service, gateway-alb) are on stable builds from yesterday.';
      } else if (q.includes('blast') || q.includes('radius') || q.includes('impact')) {
        reply = 'Blast Radius: 1,420 checkout attempts/min failing with 504 Gateway Timeout across North America and EU. Estimated revenue impact: $14,200/min. API Gateway ingress and User Auth remain fully functional.';
      } else {
        reply = `Telemetry & Incident Analysis: Cross-referenced query "${userMsg}". No conflicting anomaly logs found. System health is currently recovering following the canary rollback.`;
      }

      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
      setIsTyping(false);
    }, 800);
  };

  const agents = [
    {
      title: 'AgoraVoiceAI Scribe & War Room Copilot',
      category: 'Real-Time Voice Intelligence',
      status: 'Active in War Room',
      icon: Mic,
      color: 'purple',
      description:
        'Listens to Agora WebRTC multi-speaker voice calls, extracts facts, hypotheses, and contradictions, and commits rich cards directly into the State Ledger.',
    },
    {
      title: 'HolmesGPT Telemetry Investigator',
      category: 'Autonomous Root Cause Diagnostics',
      status: 'Active Sensor',
      icon: Cpu,
      color: 'emerald',
      description:
        'Auto-inspects Kubernetes pod memory metrics, database replica pool exhaustion, and network socket backlogs to disprove false hypotheses within seconds.',
    },
    {
      title: 'AI Post-Mortem Synthesizer',
      category: 'Post-Incident Review Automation',
      status: 'Ready on Resolution',
      icon: Wand2,
      color: 'blue',
      description:
        'Synthesizes complete Five-Whys post-mortems, contributing timelines, and remediation action items directly into Jira and Confluence within 60 seconds.',
    },
    {
      title: 'Action Item & Follow-Up Extractor',
      category: 'Workflow Automation',
      status: 'Active',
      icon: Zap,
      color: 'indigo',
      description:
        'Detects spoken delegate commitments in live calls (e.g., "I will roll back the canary") and creates interactive checklists and ticket drafts automatically.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={() => setIsCreateIncidentOpen(true)}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white dark:bg-zinc-900 shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RootlySidebar
              className="h-full w-full border-r-0"
              onCreateIncident={() => {
                setIsMobileMenuOpen(false);
                setIsCreateIncidentOpen(true);
              }}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Responsive Canvas */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Toggle navigation menu"
            className="p-1.5 -ml-1 rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-bold tracking-tight">Ecosphere AI</span>
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Ecosphere AI & Autonomous Agents
                </h1>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/80 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  New
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                AI agents grounded in live WebRTC voice transcripts, HolmesGPT telemetry, and automated incident retrospectives.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-3 py-1.5 rounded-lg">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                4 Active AI Agents
              </span>
            </div>
          </div>

          {/* AI Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((ag, idx) => {
              const Icon = ag.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                          {ag.title}
                        </h3>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {ag.category}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                      {ag.status}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {ag.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive AI Playground Simulator */}
          <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Ask Ecosphere AI Simulator
                </h3>
              </div>
              <span className="text-xs text-zinc-400">
                Connected to Active State Ledger (#INC-8921)
              </span>
            </div>

            {/* Quick Prompt Chips */}
            <div className="p-3 bg-zinc-50/70 dark:bg-zinc-800/40 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[11px] font-semibold text-zinc-400 shrink-0">Quick Queries:</span>
              {promptChips.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(chip)}
                  className="shrink-0 text-[11px] font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-full text-zinc-700 dark:text-zinc-300 hover:border-purple-300 hover:text-purple-600 dark:hover:border-purple-700 transition-colors cursor-pointer"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Log Window */}
            <div className="p-4 space-y-3 min-h-[220px] max-h-[360px] overflow-y-auto text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex gap-2.5 max-w-2xl',
                    msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full shrink-0 text-[10px] font-bold',
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
                    )}
                  >
                    {msg.role === 'user' ? 'You' : 'AI'}
                  </div>
                  <div
                    className={cn(
                      'p-3 rounded-xl leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100'
                    )}
                  >
                    <div>{msg.text}</div>
                    <div
                      className={cn(
                        'text-[10px] mt-1',
                        msg.role === 'user' ? 'text-purple-200 text-right' : 'text-zinc-400'
                      )}
                    >
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-zinc-400 text-xs italic">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                  <span>Synthesizing incident context...</span>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(playgroundQuery);
              }}
              className="p-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={playgroundQuery}
                onChange={(e) => setPlaygroundQuery(e.target.value)}
                placeholder="Ask about active alerts, root cause, or deployment rollback instructions..."
                className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/30"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Ask</span>
              </button>
            </form>
          </div>
        </main>
      </div>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={() => setIsCreateIncidentOpen(false)}
        onCreated={() => setIsCreateIncidentOpen(false)}
      />
    </div>
  );
}

export default EcosphereAiPageLayout;
