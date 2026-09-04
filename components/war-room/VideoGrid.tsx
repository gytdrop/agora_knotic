'use client';

import React from 'react';
import { Mic, MicOff, AlertTriangle, Eye, Radio } from 'lucide-react';
import {
  LocalVideoTrack,
  RemoteUser,
  type IAgoraRTCRemoteUser,
  type ICameraVideoTrack,
} from 'agora-rtc-react';
import { HitlGuardrailCard } from './HitlGuardrailCard';
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
  isHotfixStaged = false,
  isResolved = false,
  onRemediateSuccess,
  remoteParticipants = [],
  remoteAgoraUsers = [],
}: VideoGridProps) {
  // Combine custom participant objects with live Agora WebRTC remote users
  const totalCards = 3 + remoteParticipants.length + remoteAgoraUsers.length;

  // Dynamic Google Meet responsive layout
  let gridLayoutClass = 'grid-cols-3 grid-rows-1'; // Exactly 3 cards (initial single-user state)
  if (totalCards === 4) {
    gridLayoutClass = 'grid-cols-2 grid-rows-2'; // 4 cards (1 friend joined)
  } else if (totalCards === 5 || totalCards === 6) {
    gridLayoutClass = 'grid-cols-3 grid-rows-2'; // 5-6 cards (2-3 friends joined)
  } else if (totalCards > 6) {
    gridLayoutClass = 'grid-cols-3 grid-rows-3'; // 7-9 cards
  }

  const isLocalSpeaking = !isLocalMuted && localParticipant.status === 'Speaking';

  return (
    <div
      className={`grid h-full w-full gap-3.5 p-4 bg-[#171717] font-sans transition-all duration-300 ${gridLayoutClass}`}
    >
      {/* ── CARD 1: Local User (Akthar / You) ── */}
      <div
        className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border shadow-md transition-all ${
          isLocalSpeaking
            ? 'ring-2 ring-emerald-500 border-emerald-500/80'
            : localParticipant.hasContradiction && !isResolved
            ? 'border-amber-600/70'
            : 'border-zinc-800/80'
        }`}
      >
        {/* Top Bar Badges */}
        <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
          {localParticipant.hasContradiction && !isResolved ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900/90 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-300 border border-zinc-700 shadow-sm backdrop-blur-md">
              <AlertTriangle className="h-3 w-3 text-amber-400" /> Contradiction Flag
            </span>
          ) : (
            <span />
          )}

          {/* Mic Status Icon */}
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md border border-zinc-800">
            {isLocalSpeaking ? (
              <Mic className="h-3.5 w-3.5 text-emerald-400" />
            ) : isLocalMuted ? (
              <MicOff className="h-3.5 w-3.5 text-zinc-500" />
            ) : (
              <Radio className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </div>
        </div>

        {/* Video Feed Area: Live Agora Webcam Stream OR MediaStream OR GMeet Avatar Card */}
        <div className="relative flex flex-1 items-center justify-center bg-[#28292c] overflow-hidden">
          {!isVideoOff && localCameraTrack ? (
            <LocalVideoTrack
              track={localCameraTrack}
              play={true}
              className="h-full w-full object-cover"
            />
          ) : !isVideoOff && localVideoStream ? (
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
                className={`flex h-20 w-20 items-center justify-center rounded-full border bg-zinc-800 font-sans shadow-md ${
                  isLocalSpeaking
                    ? 'border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
                    : 'border-zinc-700 text-zinc-300'
                }`}
              >
                <span className="font-semibold text-xl">
                  {localParticipant.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="mt-2 text-xs text-zinc-400 font-medium">
                Camera Off
              </span>
            </div>
          )}

          {/* Speech Overlay Bubble - Continuous Subtitle */}
          {localParticipant.statement && !isResolved && (
            <div className="absolute bottom-12 left-3 right-3 rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 text-xs text-zinc-200 backdrop-blur-md shadow-lg transition-all duration-200">
              <p className="font-sans font-medium text-xs text-amber-300 leading-relaxed">
                {localParticipant.statement}
              </p>
              {localParticipant.factCheckTelemetry && (
                <p className="mt-1 font-mono text-[11px] text-zinc-300 leading-normal">
                  {localParticipant.factCheckTelemetry}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom Left GMeet Participant Name Pill */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-zinc-800/60">
          <span className="font-sans font-medium text-zinc-100">
            {localParticipant.name}
          </span>
          <span className="text-[11px] text-zinc-400 font-normal">
            ({localParticipant.role})
          </span>
          <span
            className={`ml-1 text-[10px] font-medium ${
              isLocalSpeaking
                ? 'text-emerald-400 font-semibold'
                : isLocalMuted
                ? 'text-zinc-500'
                : !isVideoOff
                ? 'text-emerald-400 font-semibold'
                : 'text-zinc-400'
            }`}
          >
            [{isLocalSpeaking ? 'Speaking' : isLocalMuted ? 'Muted' : !isVideoOff ? 'Video Active' : 'Ambient Mode'}]
          </span>
        </div>
      </div>

      {/* ── CARD 2: EchoSphere AI Agent (Rotating Vector Sphere) ── */}
      <AgentSphereCard
        isSpeaking={agentSpeaking}
        statusText={agentStatus}
        statement={agentStatement}
      />

      {/* ── CARD 3: CLI Staged Hotfix Manifest (From Uploaded Screenshot) ── */}
      <HitlGuardrailCard
        isStaged={isHotfixStaged}
        isResolved={isResolved}
        onRemediateSuccess={onRemediateSuccess}
      />

      {/* ── CARD 4+: LIVE AGORA WEBRTC REMOTE USERS (When friends join via URL) ── */}
      {remoteAgoraUsers.map((user) => {
        const uidStr = String(user.uid);
        const shortName = `Peer-${uidStr.slice(-4)}`;

        return (
          <div
            key={user.uid}
            className="relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border border-zinc-800/80 shadow-md transition-all"
          >
            {/* Top Bar Status */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900/90 px-2 py-0.5 font-sans text-[11px] font-medium text-zinc-300 border border-zinc-700 shadow-sm backdrop-blur-md">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network Peer
              </span>

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md border border-zinc-800">
                {user.hasAudio ? (
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <MicOff className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </div>
            </div>

            {/* Video Feed Area: Real Remote Track via Agora RTC */}
            <div className="relative flex flex-1 items-center justify-center bg-[#28292c] overflow-hidden">
              {user.hasVideo ? (
                <RemoteUser
                  user={user}
                  playVideo={true}
                  playAudio={true}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 font-sans shadow-md text-zinc-300">
                    <span className="font-semibold text-xl">
                      {shortName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Left GMeet Participant Name Pill */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-zinc-800/60">
              <span className="font-sans font-medium text-zinc-100">
                {shortName}
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                (Remote SRE)
              </span>
              <span className="ml-1 text-[10px] font-medium text-emerald-400">
                [Connected]
              </span>
            </div>
          </div>
        );
      })}

      {/* ── EXTRA SIMULATED PEERS (If added) ── */}
      {remoteParticipants.map((peer) => {
        const isPeerSpeaking = peer.status === 'Speaking';
        const isPeerMuted = peer.status === 'Muted';
        const isPeerViewpoint = peer.status === 'Viewpoint';

        return (
          <div
            key={peer.id}
            className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border shadow-md transition-all ${
              isPeerSpeaking
                ? 'ring-2 ring-emerald-500 border-emerald-500/80'
                : peer.hasContradiction && !isResolved
                ? 'border-amber-600/70'
                : 'border-zinc-800/80'
            }`}
          >
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              {peer.hasContradiction && !isResolved ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-zinc-900/90 px-2 py-0.5 font-sans text-[11px] font-medium text-amber-300 border border-zinc-700 shadow-sm backdrop-blur-md">
                  <AlertTriangle className="h-3 w-3 text-amber-400" /> Contradiction Flag
                </span>
              ) : (
                <span />
              )}

              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md border border-zinc-800">
                {isPeerSpeaking ? (
                  <Mic className="h-3.5 w-3.5 text-emerald-400" />
                ) : isPeerViewpoint ? (
                  <Eye className="h-3.5 w-3.5 text-amber-400" />
                ) : isPeerMuted ? (
                  <MicOff className="h-3.5 w-3.5 text-zinc-500" />
                ) : (
                  <Radio className="h-3.5 w-3.5 text-zinc-500" />
                )}
              </div>
            </div>

            <div className="relative flex flex-1 items-center justify-center bg-[#28292c] overflow-hidden">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-20 w-20 items-center justify-center rounded-full border bg-zinc-800 font-sans shadow-md ${
                    isPeerSpeaking
                      ? 'border-emerald-400 text-emerald-400 ring-4 ring-emerald-500/20'
                      : 'border-zinc-700 text-zinc-300'
                  }`}
                >
                  <span className="font-semibold text-xl">
                    {peer.name.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-zinc-800/60">
              <span className="font-sans font-medium text-zinc-100">
                {peer.name}
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                ({peer.role})
              </span>
              <span className="ml-1 text-[10px] font-medium text-zinc-400">
                [{peer.status}]
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VideoGrid;
