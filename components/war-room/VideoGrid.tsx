'use client';

import React from 'react';
import { Mic, MicOff, AlertTriangle, Eye } from 'lucide-react';
import { HitlGuardrailCard } from './HitlGuardrailCard';

interface Participant {
  id: string;
  name: string;
  role: string;
  status: 'Speaking' | 'Muted' | 'Viewpoint' | 'Ambient Mode';
  avatarUrl?: string;
  hasContradiction?: boolean;
  factCheckOverlay?: string;
}

const PARTICIPANTS: Participant[] = [
  {
    id: 'akthar',
    name: 'Akthar',
    role: 'Lead SRE',
    status: 'Speaking',
    hasContradiction: true,
    factCheckOverlay: '⚠️ Akthar: "Database is down."\n| Fact Check: CPU 2.1%, Active 14 -> [OK]',
  },
  {
    id: 'ashrith',
    name: 'Ashrith',
    role: 'DevOps',
    status: 'Muted',
  },
  {
    id: 'tushar',
    name: 'Tushar',
    role: 'Backend',
    status: 'Muted',
  },
  {
    id: 'sarah',
    name: 'Sarah',
    role: 'Lead SRE',
    status: 'Viewpoint',
  },
  {
    id: 'aksha',
    name: 'Aksha',
    role: 'Network',
    status: 'Muted',
  },
  {
    id: 'deepak',
    name: 'Deepak',
    role: 'Observability',
    status: 'Muted',
  },
  {
    id: 'hitl-slot',
    name: 'HITL Guardrail Capsule',
    role: 'Action Required',
    status: 'Muted',
  },
  {
    id: 'rishi',
    name: 'Rishi',
    role: 'Storage SRE',
    status: 'Muted',
  },
  {
    id: 'manish',
    name: 'Manish',
    role: 'SRE',
    status: 'Muted',
  },
];

interface VideoGridProps {
  onRemediateSuccess?: () => void;
}

export function VideoGrid({ onRemediateSuccess }: VideoGridProps) {
  return (
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-3.5 p-4 bg-[#171717]">
      {PARTICIPANTS.map((participant) => {
        // Special rendering for HITL Slot
        if (participant.id === 'hitl-slot') {
          return (
            <HitlGuardrailCard
              key={participant.id}
              onRemediateSuccess={onRemediateSuccess}
            />
          );
        }

        const isSpeaking = participant.status === 'Speaking';
        const isViewpoint = participant.status === 'Viewpoint';

        return (
          <div
            key={participant.id}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border border-zinc-800/80 shadow-md transition-all ${
              isSpeaking
                ? 'ring-2 ring-blue-500 border-blue-500/80'
                : participant.hasContradiction
                ? 'border-amber-600/60'
                : 'border-zinc-800'
            }`}
          >
            {/* Top Bar Badges */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              {participant.hasContradiction ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-950/80 px-2 py-0.5 font-sans text-[11px] font-semibold text-amber-400 border border-amber-800/60 shadow">
                  <AlertTriangle className="h-3 w-3" /> Contradiction Flag
                </span>
              ) : (
                <span />
              )}

              {/* Status Icon */}
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/70 text-zinc-300 backdrop-blur-md border border-zinc-800">
                {isSpeaking ? (
                  <Mic className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                ) : isViewpoint ? (
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </div>
            </div>

            {/* Video Feed Avatar Area (GMeet style avatar card) */}
            <div className="relative flex flex-1 items-center justify-center bg-[#28292c]">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border bg-zinc-800 font-sans shadow-md ${
                    isSpeaking
                      ? 'border-blue-400 text-blue-400 ring-4 ring-blue-500/20'
                      : 'border-zinc-700 text-zinc-300'
                  }`}
                >
                  <span className="font-semibold text-lg">
                    {participant.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Fact Check Speech Bubble Overlay for Akthar */}
              {participant.factCheckOverlay && (
                <div className="absolute bottom-12 left-3 right-3 rounded-xl border border-amber-800/60 bg-zinc-950/90 p-2.5 text-xs text-amber-200 backdrop-blur-md shadow-xl">
                  <div className="font-mono text-[11px] leading-relaxed whitespace-pre-line">
                    {participant.factCheckOverlay}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Left GMeet Participant Name Pill */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/80 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-zinc-800/60">
              <span className="font-sans font-medium text-zinc-100">
                {participant.name}
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                ({participant.role})
              </span>
              <span
                className={`ml-1 text-[10px] font-medium ${
                  isSpeaking
                    ? 'text-blue-400 font-semibold'
                    : isViewpoint
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                }`}
              >
                [{participant.status}]
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default VideoGrid;
