'use client';

import React from 'react';
import { Mic, MicOff, AlertTriangle, Eye, Radio, Activity } from 'lucide-react';
import {
  LocalVideoTrack,
  RemoteUser,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
} from 'agora-rtc-react';
import { AgentSphereCard } from './AgentSphereCard';

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

export const DEFAULT_LOCAL_USER: Participant = {
  id: 'akthar',
  name: 'Akthar',
  role: 'Lead SRE',
  status: 'Ambient Mode',
  hasContradiction: false,
  isLocal: true,
};

interface VideoGridProps {
  localParticipant?: Participant;
  localCameraTrack?: ICameraVideoTrack | null;
  isVideoOff?: boolean;
  localVideoStream?: MediaStream | null;
  isLocalMuted?: boolean;
  agentSpeaking?: boolean;
  agentStatus?: string;
  agentStatement?: string;
  isHotfixStaged?: boolean;
  isResolved?: boolean;
  onRemediateSuccess?: () => void | Promise<void>;
  remoteParticipants?: Participant[];
  remoteAgoraUsers?: IAgoraRTCRemoteUser[];
}

export function VideoGrid({
  localParticipant = DEFAULT_LOCAL_USER,
  localCameraTrack = null,
  isVideoOff = false,
  localVideoStream = null,
  isLocalMuted = false,
  agentSpeaking = false,
  agentStatus = 'Ambient Mode',
  agentStatement,
  isResolved = false,
  remoteParticipants = [],
  remoteAgoraUsers = [],
}: VideoGridProps) {
  // Combine local user + AI Agent + remote WebRTC peers + custom peers
  const totalCards = 2 + remoteParticipants.length + remoteAgoraUsers.length;

  // Dynamic responsive grid layout (Zoom & Teams style)
  let gridLayoutClass = 'grid-cols-1 md:grid-cols-2 grid-rows-1'; // 2 cards (initial state)
  if (totalCards === 3 || totalCards === 4) {
    gridLayoutClass = 'grid-cols-1 sm:grid-cols-2 grid-rows-2'; // 3-4 cards (classic 2x2 grid)
  } else if (totalCards === 5 || totalCards === 6) {
    gridLayoutClass = 'grid-cols-2 md:grid-cols-3 grid-rows-2'; // 5-6 cards
  } else if (totalCards > 6) {
    gridLayoutClass = 'grid-cols-3 md:grid-cols-4 grid-rows-2 md:grid-rows-3'; // 7+ cards
  }

  const isLocalSpeaking = !isLocalMuted && localParticipant.status === 'Speaking';

  return (
    <div
      className={`grid h-full w-full gap-3.5 p-4 bg-[#121316] font-sans transition-all duration-300 ${gridLayoutClass}`}
    >
      {/* ── CARD 1: Local User (Akthar / You) ── */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1c1d22] border shadow-md transition-all ${
          isLocalSpeaking
            ? 'ring-2 ring-emerald-500/80 border-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : localParticipant.hasContradiction && !isResolved
            ? 'border-amber-600/70'
            : 'border-slate-800/80'
        }`}
      >
        {/* Top Bar Badges */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {localParticipant.hasContradiction && !isResolved ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/90 px-2.5 py-0.5 font-sans text-[11px] font-medium text-amber-300 border border-slate-700 shadow-sm backdrop-blur-md">
              <AlertTriangle className="h-3 w-3 text-amber-400" /> Contradiction Flag
            </span>
          ) : (
            <span />
          )}

          {/* Top-Right Mic Status Pill */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 backdrop-blur-md border border-slate-800 shadow-sm">
            {isLocalSpeaking ? (
              <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            ) : isLocalMuted ? (
              <MicOff className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-slate-300" />
            )}
          </div>
        </div>

        {/* Video Feed Area */}
        <div className="relative flex flex-1 items-center justify-center bg-[#18191d] overflow-hidden">
          {!isVideoOff && localCameraTrack ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              className="h-full w-full object-cover"
            />
          ) : !isVideoOff && localVideoStream ? (
            <video
              ref={(videoEl) => {
                if (videoEl) {
                  if (localVideoStream && videoEl.srcObject !== localVideoStream) {
                    videoEl.srcObject = localVideoStream;
                    const p = videoEl.play?.();
                    if (p !== undefined) {
                      p.catch(() => {});
                    }
                  } else if (!localVideoStream && videoEl.srcObject) {
                    try {
                      videoEl.pause();
                      videoEl.srcObject = null;
                    } catch {}
                  }
                }
              }}
              playsInline
              muted
              className="h-full w-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="flex flex-col items-center">
              <div
                className={`flex h-20 w-20 items-center justify-center rounded-full border bg-slate-800/90 font-sans shadow-lg ${
                  isLocalSpeaking
                    ? 'border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
                    : 'border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-semibold text-xl">
                  {localParticipant.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="mt-2.5 text-xs text-slate-400 font-medium">
                Camera Off
              </span>
            </div>
          )}

          {/* Speech Overlay Bubble - Non-intrusive Subtitle */}
          {localParticipant.statement && !isResolved && (
            <div className="absolute bottom-12 left-3 right-3 rounded-xl border border-slate-700/80 bg-slate-950/90 p-3 text-xs text-slate-200 backdrop-blur-md shadow-lg transition-all duration-200">
              <p className="font-sans font-medium text-xs text-amber-300 leading-relaxed">
                {localParticipant.statement}
              </p>
              {localParticipant.factCheckTelemetry && (
                <p className="mt-1 font-mono text-[11px] text-slate-300 leading-normal">
                  {localParticipant.factCheckTelemetry}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom-Left Zoom/Teams Style Frosted Participant Name Pill */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
          {/* Audio Activity Icon */}
          {isLocalSpeaking ? (
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          ) : isLocalMuted ? (
            <MicOff className="h-3 w-3 text-rose-400" />
          ) : (
            <Mic className="h-3 w-3 text-emerald-400" />
          )}

          <span className="font-sans font-medium text-slate-100">
            {localParticipant.name}
          </span>
          <span className="text-[11px] text-slate-400 font-normal">
            ({localParticipant.role})
          </span>
        </div>
      </div>

      {/* ── CARD 2: EchoSphere AI Agent (Rotating Vector Sphere) ── */}
      <AgentSphereCard
        isSpeaking={agentSpeaking}
        statusText={agentStatus}
        statement={agentStatement}
      />

      {/* ── CARD 3+: LIVE AGORA WEBRTC REMOTE USERS (When peers join) ── */}
      {remoteAgoraUsers.map((user) => {
        const uidStr = String(user.uid);
        const shortName = `Peer-${uidStr.slice(-4)}`;

        return (
          <div
            key={user.uid}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1c1d22] border border-slate-800/80 shadow-md transition-all"
          >
            {/* Top Bar Status */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900/90 px-2.5 py-0.5 font-sans text-[11px] font-medium text-slate-300 border border-slate-700 shadow-sm backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network Peer
              </span>

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 backdrop-blur-md border border-slate-800 shadow-sm">
                {user.hasAudio ? (
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-rose-400" />
                )}
              </div>
            </div>

            {/* Video Feed Area */}
            <div className="relative flex flex-1 items-center justify-center bg-[#18191d] overflow-hidden">
              {user.hasVideo ? (
                <RemoteUser
                  user={user}
                  playVideo={true}
                  playAudio={false}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-700 bg-slate-800 font-sans shadow-md text-slate-300">
                    <span className="font-semibold text-xl">
                      {shortName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="mt-2.5 text-xs text-slate-400 font-medium">Remote Camera Off</span>
                </div>
              )}
            </div>

            {/* Bottom-Left Frosted Participant Name Pill */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
              {user.hasAudio ? (
                <Mic className="h-3 w-3 text-emerald-400" />
              ) : (
                <MicOff className="h-3 w-3 text-rose-400" />
              )}
              <span className="font-sans font-medium text-slate-100">
                {shortName}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                (Remote SRE)
              </span>
            </div>
          </div>
        );
      })}

      {/* ── EXTRA SIMULATED PEERS (If configured) ── */}
      {remoteParticipants.map((peer) => {
        const isPeerSpeaking = peer.status === 'Speaking';
        const isPeerMuted = peer.status === 'Muted';
        const isPeerViewpoint = peer.status === 'Viewpoint';

        return (
          <div
            key={peer.id}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#1c1d22] border shadow-md transition-all ${
              isPeerSpeaking
                ? 'ring-2 ring-emerald-500/80 border-emerald-500/80'
                : peer.hasContradiction && !isResolved
                ? 'border-amber-600/70'
                : 'border-slate-800/80'
            }`}
          >
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              {peer.hasContradiction && !isResolved ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/90 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-300 border border-slate-700 shadow-sm backdrop-blur-md">
                  <AlertTriangle className="h-3 w-3 text-amber-400" /> Contradiction Flag
                </span>
              ) : (
                <span />
              )}

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-slate-300 backdrop-blur-md border border-slate-800">
                {isPeerSpeaking ? (
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                ) : isPeerViewpoint ? (
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                ) : isPeerMuted ? (
                  <MicOff className="h-3.5 w-3.5 text-rose-400" />
                ) : (
                  <Radio className="h-3.5 w-3.5 text-slate-500" />
                )}
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center bg-[#18191d] overflow-hidden">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border bg-slate-800 font-sans shadow-md ${
                    isPeerSpeaking
                      ? 'border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
                      : 'border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="font-semibold text-xl">
                    {peer.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 rounded-lg bg-slate-950/80 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md border border-white/10 shadow-sm">
              {isPeerSpeaking ? (
                <Mic className="h-3 w-3 text-emerald-400" />
              ) : (
                <MicOff className="h-3 w-3 text-rose-400" />
              )}
              <span className="font-sans font-medium text-slate-100">
                {peer.name}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                ({peer.role})
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VideoGrid;
