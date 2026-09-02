'use client';

import React from 'react';
import { Bot, Radio, Waves } from 'lucide-react';

interface AgentSphereCardProps {
  isSpeaking?: boolean;
  statusText?: string;
}

export function AgentSphereCard({
  isSpeaking = false,
  statusText = 'Ambient Mode',
}: AgentSphereCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#28292c] border shadow-md transition-all ${
        isSpeaking
          ? 'ring-2 ring-blue-500 border-blue-500/80'
          : 'border-zinc-800/80'
      }`}
    >
      {/* Top Bar Badges */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900/90 px-2 py-0.5 font-sans text-[11px] font-medium text-emerald-400 border border-zinc-700 shadow-sm backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          AI Incident Sentinel
        </span>

        {/* Sentinel Radio / Waveform Icon */}
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-950/80 text-zinc-300 backdrop-blur-md border border-zinc-800">
          {isSpeaking ? (
            <Waves className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
          ) : (
            <Radio className="h-3.5 w-3.5 text-emerald-400" />
          )}
        </div>
      </div>

      {/* Center: Vector Animated Rotating Sphere */}
      <div className="relative flex flex-1 items-center justify-center bg-[#202124] overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute h-44 w-44 rounded-full bg-blue-600/10 blur-2xl pointer-events-none animate-pulse" />

        {/* Rotating Vector Sphere Graphic */}
        <div className="relative flex items-center justify-center">
          <svg
            className="h-36 w-36 animate-[spin_12s_linear_infinite]"
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Ring */}
            <circle
              cx="60"
              cy="60"
              r="52"
              stroke="#3b82f6"
              strokeWidth="1.2"
              strokeDasharray="4 6"
              strokeOpacity="0.7"
            />

            {/* Elliptical Orbit 1 (Rotated 45deg) */}
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="24"
              stroke="#60a5fa"
              strokeWidth="1.5"
              strokeOpacity="0.8"
              transform="rotate(45 60 60)"
            />

            {/* Elliptical Orbit 2 (Rotated -45deg) */}
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="24"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeOpacity="0.8"
              transform="rotate(-45 60 60)"
            />

            {/* Vertical Orbit */}
            <ellipse
              cx="60"
              cy="60"
              rx="22"
              ry="52"
              stroke="#818cf8"
              strokeWidth="1.2"
              strokeOpacity="0.7"
            />

            {/* Horizontal Equator Orbit */}
            <ellipse
              cx="60"
              cy="60"
              rx="52"
              ry="16"
              stroke="#22d3ee"
              strokeWidth="1.2"
              strokeOpacity="0.75"
            />

            {/* Inner Core */}
            <circle cx="60" cy="60" r="14" fill="#1e3a8a" fillOpacity="0.8" />
            <circle cx="60" cy="60" r="12" fill="#2563eb" fillOpacity="0.5" />
            <circle cx="60" cy="60" r="6" fill="#60a5fa" />
          </svg>

          {/* Center Overlay AI Bot Badge */}
          <div className="absolute flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/90 border border-blue-500/40 shadow-lg pointer-events-none">
            <Bot className="h-5 w-5 text-blue-400" />
          </div>
        </div>

        {/* Audio Frequency Bars / Status below Sphere */}
        <div className="absolute bottom-11 flex items-center gap-1">
          <span className="h-2 w-1 rounded-full bg-blue-400/80 animate-[bounce_1s_infinite_100ms]" />
          <span className="h-3.5 w-1 rounded-full bg-blue-400/80 animate-[bounce_1s_infinite_200ms]" />
          <span className="h-2.5 w-1 rounded-full bg-blue-400/80 animate-[bounce_1s_infinite_300ms]" />
          <span className="h-4 w-1 rounded-full bg-blue-400/80 animate-[bounce_1s_infinite_400ms]" />
          <span className="h-2 w-1 rounded-full bg-blue-400/80 animate-[bounce_1s_infinite_250ms]" />
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
        <span className="ml-1 text-[10px] font-semibold text-emerald-400">
          [{statusText}]
        </span>
      </div>
    </div>
  );
}
