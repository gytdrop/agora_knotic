'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Smile, 
  Paperclip, 
  AtSign, 
  Sparkles, 
  FileText, 
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import type { WarRoomChatMessage } from '@/types/war-room';

const INITIAL_MESSAGES: WarRoomChatMessage[] = [
  {
    id: 'msg-1',
    senderName: 'Ecosphere AI',
    timestamp: '10:01 AM',
    text: 'War room started for this incident.',
    isAi: true,
    attachment: {
      type: 'incident_context',
      title: 'Incident context',
      details: 'P1 • Payment service latency and failures',
    },
  },
  {
    id: 'msg-2',
    senderName: 'Priya Mehta',
    senderRole: 'SRE Lead',
    timestamp: '10:02 AM',
    text: 'Hey everyone! 👋',
  },
  {
    id: 'msg-3',
    senderName: 'Aarav Sharma',
    senderRole: 'Incident Commander',
    timestamp: '10:03 AM',
    text: "Let's align on next steps.",
  },
  {
    id: 'msg-4',
    senderName: 'Sophia Carter',
    senderRole: 'Product Manager',
    timestamp: '10:04 AM',
    text: "Here's the latest error graph:",
    attachment: {
      type: 'image',
      title: 'latency-spike.png',
      details: 'PNG • 245 KB',
    },
  },
  {
    id: 'msg-5',
    senderName: 'Daniel Kim',
    senderRole: 'Backend Engineer',
    timestamp: '10:05 AM',
    text: "I'm checking the connection pool metrics.",
  },
  {
    id: 'msg-6',
    senderName: 'Marcus Lee',
    senderRole: 'DevOps Lead',
    timestamp: '10:06 AM',
    text: 'Noticing recovery in some regions ✅',
  },
];

interface ChatTabProps {
  currentUser?: string;
}

export function ChatTab({ currentUser = 'Akthar' }: ChatTabProps) {
  const [messages, setMessages] = useState<WarRoomChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const newMsg: WarRoomChatMessage = {
      id: `msg-${Date.now()}`,
      senderName: currentUser,
      senderRole: 'Lead SRE',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getAvatarColor = (name: string, isAi?: boolean) => {
    if (isAi) return 'bg-indigo-600/80 text-white';
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
      'bg-emerald-700/80 text-emerald-100',
      'bg-sky-700/80 text-sky-100',
      'bg-amber-700/80 text-amber-100',
      'bg-purple-700/80 text-purple-100',
      'bg-teal-700/80 text-teal-100',
    ];
    return colors[hash % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-[#18191d] text-zinc-200 font-sans text-xs select-none">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 custom-scrollbar">
        {messages.map((msg) => {
          const initials = getInitials(msg.senderName);
          const avatarColor = getAvatarColor(msg.senderName, msg.isAi);

          return (
            <div key={msg.id} className="flex items-start gap-2.5 group">
              {/* Avatar */}
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-medium text-[11px] shadow-sm ${avatarColor}`}
              >
                {msg.isAi ? <Sparkles className="h-3.5 w-3.5" /> : initials}
              </div>

              {/* Message Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-zinc-100 text-xs">{msg.senderName}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">{msg.timestamp}</span>
                </div>

                <p className="text-zinc-300 text-xs mt-0.5 leading-relaxed break-words">{msg.text}</p>

                {/* Attachment cards if present */}
                {msg.attachment && (
                  <div className="mt-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 p-2.5 shadow-sm">
                    {msg.attachment.type === 'incident_context' && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
                            <FileText className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-200 text-xs">
                              {msg.attachment.title}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {msg.attachment.details}
                            </div>
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400 hover:text-zinc-200 cursor-pointer" />
                      </div>
                    )}

                    {msg.attachment.type === 'image' && (
                      <div>
                        {/* Mock graph line chart SVG */}
                        <div className="h-16 w-full rounded-lg bg-zinc-950 flex items-center justify-center p-2 border border-zinc-800">
                          <svg className="w-full h-full text-indigo-400" viewBox="0 0 200 40" fill="none">
                            <path
                              d="M 0 30 Q 30 28, 60 25 T 120 10 T 150 35 T 200 15"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 0 30 Q 30 28, 60 25 T 120 10 T 150 35 T 200 15 L 200 40 L 0 40 Z"
                              fill="currentColor"
                              fillOpacity="0.1"
                            />
                          </svg>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px] text-zinc-400">
                          <span className="font-medium text-zinc-300">{msg.attachment.title}</span>
                          <span className="font-mono text-[10px]">{msg.attachment.details}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Dock (Zoom / Teams style) */}
      <div className="border-t border-zinc-800/80 p-3 bg-[#151619]">
        {/* Audience Selector */}
        <div className="flex items-center gap-1 mb-2 text-[11px] text-zinc-400">
          <span className="text-zinc-300 font-medium">Everyone</span>
          <ChevronDown className="h-3 w-3 text-zinc-400" />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="w-full rounded-xl bg-[#202126] border border-zinc-700/80 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors pr-24"
          />

          {/* Action Icons in Input */}
          <div className="absolute right-2 flex items-center gap-1.5 text-zinc-400">
            <button
              type="button"
              className="p-1 rounded hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
              title="Attach File"
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="p-1 rounded hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
              title="Mention"
            >
              <AtSign className="h-4 w-4" />
            </button>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-lg bg-indigo-600/90 text-white hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600/90 transition-all shadow-sm"
              title="Send Message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChatTab;
