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
    <div className="grid h-full w-full grid-cols-3 grid-rows-3 gap-3 p-3 bg-zinc-950">
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
            className={`relative flex flex-col justify-between overflow-hidden rounded-xl border bg-zinc-900/90 shadow-sm transition-all ${
              isSpeaking
                ? 'border-emerald-500/80 ring-1 ring-emerald-500/50'
                : participant.hasContradiction
                ? 'border-amber-600/70'
                : 'border-zinc-800/80'
            }`}
          >
            {/* Top Bar Badges */}
            <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
              {participant.hasContradiction ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-950/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400 border border-amber-800/60 shadow">
                  <AlertTriangle className="h-3 w-3" /> Contradiction Flag
                </span>
              ) : (
                <span />
              )}

              {/* Status Icon */}
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-400 backdrop-blur-sm">
                {isSpeaking ? (
                  <Mic className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                ) : isViewpoint ? (
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </div>
            </div>

            {/* Video Feed Placeholder / Avatar Simulation */}
            <div className="relative flex flex-1 items-center justify-center bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-950">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full border bg-zinc-800 ${
                    isSpeaking
                      ? 'border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
                      : 'border-zinc-700 text-zinc-400'
                  }`}
                >
                  <span className="font-semibold text-lg">
                    {participant.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Fact Check Speech Bubble Overlay for Akthar */}
              {participant.factCheckOverlay && (
                <div className="absolute bottom-3 left-3 right-3 rounded-lg border border-amber-800/60 bg-amber-950/90 p-2 text-xs text-amber-200 backdrop-blur-md shadow-lg">
                  <div className="font-mono text-[11px] leading-relaxed whitespace-pre-line">
                    {participant.factCheckOverlay}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Label Tag */}
            <div className="flex h-8 items-center justify-between border-t border-zinc-800/60 bg-zinc-950/80 px-3">
              <span className="font-sans text-xs font-medium text-zinc-200">
                {participant.name}{' '}
                <span className="text-zinc-500">({participant.role})</span>
              </span>
              <span
                className={`text-[10px] font-medium ${
                  isSpeaking
                    ? 'text-emerald-400 font-semibold'
                    : isViewpoint
                    ? 'text-amber-400'
                    : 'text-zinc-500'
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
