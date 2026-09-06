'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  Loader2 
} from 'lucide-react';

interface AiMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const INITIAL_AI_CHAT: AiMessage[] = [
  {
    id: 'ai-init-1',
    sender: 'ai',
    text: "I'm EchoSphere AI, active on incident INC-2026-0912-001. I've ingested telemetry from Datadog, HolmesGPT, and Agora WebRTC stream. Root cause has been isolated to ingress route mismatch on /api/v2/auth (target port 8080 instead of 8000). How can I assist?",
    timestamp: '10:02 AM',
  },
];

const SUGGESTED_PROMPTS = [
  'Summarize blast radius',
  'Check connection pool metrics',
  'Explain staged patch command',
  'Draft incident update for Slack',
];

export function AiBriefTab() {
  const [messages, setMessages] = useState<AiMessage[]>(INITIAL_AI_CHAT);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendQuery = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isLoading) return;

    const userMsg: AiMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      // Send query to local chat completions endpoint or provide context-grounded response
      const res = await fetch('/api/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are EchoSphere AI, an expert incident commander assistant in a P1 war room.',
            },
            { role: 'user', content: text },
          ],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data.choices?.[0]?.message?.content || 'Telemetry analyzed. All upstream services nominal.';
        setMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: replyText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        throw new Error('API route returned non-200');
      }
    } catch {
      // Graceful fallback for local offline simulation
      let fallback = 'Telemetry confirms recovery in US-East-1. Ingress hotfix is staged and waiting for 1-click execution.';
      const lower = text.toLowerCase();
      if (lower.includes('blast radius')) {
        fallback = 'Blast Radius: 18.4% of authentication traffic affected across US-East-1 and EU-West-1. DB connection pools remain healthy.';
      } else if (lower.includes('metrics') || lower.includes('pool')) {
        fallback = 'Connection pool utilization is at 34% (nominal). DB lockup hypothesis was contradicted by HolmesGPT telemetry.';
      } else if (lower.includes('patch') || lower.includes('explain')) {
        fallback = 'Staged Patch: kubectl patch ingress auth-svc sets rule port to 8080 -> 8000, restoring traffic routing to healthy auth pods.';
      } else if (lower.includes('slack') || lower.includes('draft')) {
        fallback = 'Draft Update: "[INCIDENT UPDATE - P1] Root cause identified (auth-svc ingress route mismatch). Hotfix staged. MTTR: 28m. Remediation pending."';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: fallback,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18191d] text-zinc-200 font-sans text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600/90 text-white">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="font-semibold text-zinc-100 text-xs">EchoSphere AI Assistant</div>
            <div className="text-[10px] text-zinc-400 font-mono">Incident context loaded</div>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Ready
        </span>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="p-2.5 border-b border-zinc-800/60 bg-[#151619] flex flex-wrap gap-1.5">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => handleSendQuery(prompt)}
            className="rounded-full bg-zinc-800/90 hover:bg-zinc-700/90 text-zinc-300 hover:text-white px-2.5 py-1 text-[10px] font-medium border border-zinc-700/60 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-medium ${
                msg.sender === 'user'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'bg-indigo-600/80 text-white'
              }`}
            >
              {msg.sender === 'user' ? 'You' : <Bot className="h-3.5 w-3.5" />}
            </div>

            <div
              className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/80'
                  : 'bg-[#202126] text-zinc-200 border border-zinc-700/60'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <div className="text-[9px] text-zinc-500 mt-1.5 font-mono text-right">
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs pl-8">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
            <span>EchoSphere AI analyzing incident context...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Dock */}
      <div className="p-3 border-t border-zinc-800/80 bg-[#151619]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendQuery();
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask EchoSphere AI about this incident..."
            className="w-full rounded-xl bg-[#202126] border border-zinc-700/80 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors pr-10"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="absolute right-2 p-1.5 rounded-lg bg-indigo-600/90 text-white hover:bg-indigo-500 disabled:opacity-30 transition-all"
            title="Ask AI"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default AiBriefTab;
