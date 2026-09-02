'use client';

import React from 'react';
import { Mic, MicOff, AlertTriangle, Eye, Radio } from 'lucide-react';
import { HitlGuardrailCard } from './HitlGuardrailCard';

export interface Participant {
  id: string;
  name: string;
  role: string;
  status: 'Speaking' | 'Muted' | 'Viewpoint' | 'Ambient Mode';
  avatarUrl?: string;
  hasContradiction?: boolean;
  statement?: string;
  factCheckTelemetry?: string;
  isLocal?: boolean;
}

export const INITIAL_CLEAN_PARTICIPANTS: Participant[] = [
  {
    id: 'akthar',
    name: 'Akthar',
    role: 'Lead SRE',
    status: 'Ambient Mode',
    hasContradiction: false,
    isLocal: true,
  },
  {
    id: 'ashrith',
    name: 'Ashrith',
    role: 'DevOps',
    status: 'Ambient Mode',
  },
  {
    id: 'kartikey',
    name: 'Kartikey',
    role: 'Backend SRE',
    status: 'Ambient Mode',
  },
  {
    id: 'hitl-slot',
    name: 'HITL Guardrail Capsule',
    role: 'Action Required',
    status: 'Ambient Mode',
  },
];

export const DEFAULT_PARTICIPANTS = INITIAL_CLEAN_PARTICIPANTS;

interface VideoGridProps {
  participants?: Participant[];
  localVideoStream?: MediaStream | null;
  isLocalMuted?: boolean;
  isHotfixStaged?: boolean;
  isResolved?: boolean;
  onRemediateSuccess?: () => void;
}

export function VideoGrid({
  participants = INITIAL_CLEAN_PARTICIPANTS,
  localVideoStream = null,
  isLocalMuted = false,
  isHotfixStaged = false,
  isResolved = false,
  onRemediateSuccess,
}: VideoGridProps) {
  
  const total = participants.length;
  // Google Meet style dynamic grid layout
  let gridClass = "grid-cols-2 grid-rows-2"; // Default for 3 or 4 cards
  if (total === 1) gridClass = "grid-cols-1 grid-rows-1";
  else if (total === 2) gridClass = "grid-cols-2 grid-rows-1";
  else if (total > 4 && total <= 6) gridClass = "grid-cols-3 grid-rows-2";
  else if (total > 6) gridClass = "grid-cols-3 grid-rows-3";

  return (
    <div className={`grid h-full w-full gap-3.5 p-4 bg-[#171717] font-sans ${gridClass}`}>
      {participants.map((participant) => {
        // Special rendering for HITL Slot
        if (participant.id === 'hitl-slot') {
          return (
            <HitlGuardrailCard
              key={participant.id}
              isStaged={isHotfixStaged}
              isResolved={isResolved}
              onRemediateSuccess={onRemediateSuccess}
            />
          );
        }

        const isLocal = participant.isLocal ?? (participant.id === 'akthar');
        const isSpeaking = isLocal
          ? !isLocalMuted && participant.status === 'Speaking'
          : participant.status === 'Speaking';
        const isMuted = isLocal ? isLocalMuted : participant.status === 'Muted';
        const isViewpoint = participant.status === 'Viewpoint';

        return (
          <div
            key={participant.id}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border shadow-md transition-all ${
              isSpeaking
                ? 'ring-2 ring-blue-500 border-blue-500/80'
                : participant.hasContradiction && !isResolved
                ? 'border-amber-600/60'
                : 'border-zinc-800/80'
            }`}
          >
            {/* Top Bar Badges */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              {participant.hasContradiction && !isResolved ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-300 border border-zinc-700 shadow-sm">
                  <AlertTriangle className="h-3 w-3 text-amber-400" /> Contradiction Flag
                </span>
              ) : (
                <span />
              )}

              {/* Status Icon */}
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md border border-zinc-800">
                {isSpeaking ? (
                  <Mic className="h-3.5 w-3.5 text-blue-400" />
                ) : isViewpoint ? (
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                ) : isMuted ? (
                  <MicOff className="h-3.5 w-3.5 text-zinc-500" />
                ) : (
                  <Radio className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </div>
            </div>

            {/* Video Feed Area: Live Webcam Stream OR GMeet Avatar Card */}
            <div className="relative flex flex-1 items-center justify-center bg-[#28292c] overflow-hidden">
              {isLocal && localVideoStream ? (
                <video
                  ref={(videoEl) => {
                    if (videoEl && localVideoStream) {
                      videoEl.srcObject = localVideoStream;
                    }
                  }}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover scale-x-[-1]"
                />
              ) : (
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
              )}

              {/* Speech Overlay Bubble */}
              {participant.statement && !isResolved && (
                <div className="absolute bottom-12 left-3 right-3 rounded-xl border border-zinc-700 bg-zinc-950/90 p-2.5 text-xs text-zinc-200 backdrop-blur-md shadow-lg">
                  <p className="font-sans font-medium text-xs text-amber-300 leading-relaxed">
                    {participant.statement}
                  </p>
                  {participant.factCheckTelemetry && (
                    <p className="mt-1 font-mono text-[11px] text-zinc-300 leading-normal">
                      {participant.factCheckTelemetry}
                    </p>
                  )}
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
                    : isMuted
                    ? 'text-zinc-400'
                    : isViewpoint
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                }`}
              >
                [{isSpeaking ? 'Speaking' : isMuted ? 'Muted' : participant.status}]
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
export default VideoGrid;
