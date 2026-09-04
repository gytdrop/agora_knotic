'use client';

import React from 'react';
import { Bot, Radio, Waves } from 'lucide-react';

interface AgentSphereCardProps {
  isSpeaking?: boolean;
  statusText?: string;
  statement?: string;
}

export function AgentSphereCard({
  isSpeaking = false,
  statusText = 'Ambient Mode',
  statement,
}: AgentSphereCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border shadow-md transition-all font-sans ${
        isSpeaking
          ? 'ring-2 ring-blue-500 border-blue-500/80'
          : 'border-zinc-800/80'
      }`}
    >
      {/* Top Bar Badges - Strict Matte, Zero Neon */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900/90 px-2 py-0.5 font-sans text-[11px] font-medium text-zinc-300 border border-zinc-700 shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
          AI Incident Sentinel
        </span>

        {/* Sentinel Radio / Waveform Icon */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-400 backdrop-blur-md border border-zinc-800">
          {isSpeaking ? (
            <Waves className="h-3.5 w-3.5 text-blue-400" />
          ) : (
            <Radio className="h-3.5 w-3.5 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Center: Vector Animated Rotating Sphere in Muted Chrome/Slate Tones (Zero Neon) */}
      <div className="relative flex flex-1 items-center justify-center bg-[#202124] overflow-hidden">
        {/* Rotating Vector Sphere Graphic */}
        <div className="relative flex items-center justify-center">
          <svg
            className="h-36 w-36 animate-[spin_16s_linear_infinite]"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Ring - Matte Slate */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#52525b"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              strokeOpacity="0.8"
            />

            {/* Elliptical Orbit 1 (Rotated 45deg) - Muted Zinc */}
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="24"
              stroke="#71717a"
              strokeWidth="1.4"
              strokeOpacity="0.85"
              transform="rotate(45 60 60)"
            />

            {/* Elliptical Orbit 2 (Rotated -45deg) - Slate */}
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="24"
              stroke="#64748b"
              strokeWidth="1.4"
              strokeOpacity="0.85"
              transform="rotate(-45 60 60)"
            />

            {/* Vertical Orbit - Dark Zinc */}
            <ellipse
              cx="60"
              cy="60"
              rx="22"
              ry="52"
              stroke="#71717a"
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />

            {/* Horizontal Equator Orbit */}
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="16"
              stroke="#52525b"
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />

            {/* Inner Core - Solid Charcoal & Slate */}
            <circle cx="60" cy="60" r="14" fill="#18181b" />
            <circle cx="60" cy="60" r="10" fill="#27272a" />
            <circle cx="60" cy="60" r="5" fill="#71717a" />
          </svg>

          {/* Center Overlay AI Bot Badge */}
          <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/90 border border-zinc-700 shadow-md pointer-events-none">
            <Bot className="h-5 w-5 text-zinc-300" />
          </div>
        </div>

        {/* Agent Speech Overlay Bubble */}
        {statement && (
          <div className="absolute bottom-12 left-3 right-3 z-20 rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 text-xs text-zinc-200 backdrop-blur-md shadow-lg">
            <p className="font-sans font-medium text-xs text-zinc-200 leading-relaxed">
              {statement}
            </p>
          </div>
        )}

        {/* Audio Frequency Bars / Status below Sphere - Muted Zinc */}
        <div className="absolute bottom-11 flex items-center gap-1">
          <span className="h-2 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_100ms]" />
          <span className="h-3.5 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_200ms]" />
          <span className="h-2.5 w-1 rounded-full bg-zinc-400 animate-[bounce_1s_infinite_300ms]" />
          <span className="h-4 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_400ms]" />
          <span className="h-2 w-1 rounded-full bg-zinc-500 animate-[bounce_1s_infinite_250ms]" />
        </div>
      </div>

      {/* Bottom Left GMeet Participant Name Pill */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-md bg-zinc-950/85 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md border border-zinc-800/60">
        <span className="font-sans font-medium text-zinc-100">
          EchoSphere AI
        </span>
        <span className="text-[11px] text-zinc-400 font-normal">
          (Incident Commander)
        </span>
        <span className="ml-1 text-[10px] font-medium text-zinc-400">
          [{statusText}]
        </span>
      </div>
    </div>
  );
}
export default AgentSphereCard;
