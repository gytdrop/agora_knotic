'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Bot, 
  VolumeX, 
  MoreVertical,
  UserCheck
} from 'lucide-react';
import type { ParticipantInfo } from '@/types/war-room';

const DEFAULT_PEOPLE: ParticipantInfo[] = [
  {
    id: 'user-local',
    name: 'Akthar (You)',
    role: 'Lead SRE',
    status: 'Speaking',
    isLocal: true,
    hasAudio: true,
    hasVideo: true,
  },
  {
    id: 'ai-sentinel',
    name: 'EchoSphere AI',
    role: 'Incident AI Sentinel',
    status: 'Muted',
    isAi: true,
    hasAudio: false,
    hasVideo: false,
  },
  {
    id: 'user-aarav',
    name: 'Aarav Sharma',
    role: 'Incident Commander',
    status: 'Speaking',
    hasAudio: true,
    hasVideo: true,
  },
  {
    id: 'user-priya',
    name: 'Priya Mehta',
    role: 'SRE Lead',
    status: 'Muted',
    hasAudio: false,
    hasVideo: true,
  },
  {
    id: 'user-sophia',
    name: 'Sophia Carter',
    role: 'Product Manager',
    status: 'Ambient Mode',
    hasAudio: true,
    hasVideo: true,
  },
  {
    id: 'user-daniel',
    name: 'Daniel Kim',
    role: 'Backend Engineer',
    status: 'Muted',
    hasAudio: false,
    hasVideo: true,
  },
  {
    id: 'user-marcus',
    name: 'Marcus Lee',
    role: 'DevOps Lead',
    status: 'Muted',
    hasAudio: false,
    hasVideo: false,
  },
];

interface PeopleTabProps {
  participants?: ParticipantInfo[];
}

export function PeopleTab({ participants = DEFAULT_PEOPLE }: PeopleTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name
      .replace('(You)', '')
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-[#18191d] text-zinc-200 font-sans text-xs select-none">
      {/* Top Search & Actions */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search participants..."
            className="w-full rounded-xl bg-[#202126] border border-zinc-700/70 pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
          <span>In call ({participants.length})</span>
          <button
            type="button"
            className="text-zinc-400 hover:text-zinc-200 font-medium transition-colors"
          >
            Mute All
          </button>
        </div>
      </div>

      {/* Participant List */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
        {filtered.map((p) => {
          const isSpeaking = p.status === 'Speaking';

          return (
            <div
              key={p.id}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition-colors group"
            >
              {/* Left: Avatar + Name + Role */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold shadow-sm ${
                    p.isAi
                      ? 'bg-indigo-600/80 text-white'
                      : isSpeaking
                      ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/60'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  {p.isAi ? <Bot className="h-4 w-4 text-cyan-300" /> : getInitials(p.name)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-zinc-100 truncate text-xs">
                      {p.name}
                    </span>
                    {p.isLocal && (
                      <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] font-medium text-zinc-400 border border-zinc-700">
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 block truncate">{p.role}</span>
                </div>
              </div>

              {/* Right: Media Indicators */}
              <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                {p.isAi ? (
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-400 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                    <VolumeX className="h-3 w-3 text-rose-400" /> Muted
                  </span>
                ) : (
                  <>
                    {/* Mic */}
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${
                        p.hasAudio
                          ? isSpeaking
                            ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40'
                            : 'text-zinc-300'
                          : 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                      }`}
                      title={p.hasAudio ? 'Microphone Active' : 'Microphone Muted'}
                    >
                      {p.hasAudio ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
                    </div>

                    {/* Camera */}
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md ${
                        p.hasVideo ? 'text-zinc-300' : 'text-zinc-500'
                      }`}
                      title={p.hasVideo ? 'Camera On' : 'Camera Off'}
                    >
                      {p.hasVideo ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
                    </div>
                  </>
                )}

                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-zinc-200 transition-opacity"
                  title="Participant Actions"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PeopleTab;
