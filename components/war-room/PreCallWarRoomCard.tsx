'use client';

import React, { useState } from 'react';
import { Activity, Sparkles, Loader2 } from 'lucide-react';

interface PreCallWarRoomCardProps {
  incidentId?: string;
  severity?: string;
  responderCount?: number;
  isLoading?: boolean;
  onEnterWarRoom?: () => void;
  onOtherWaysToJoin?: () => void;
}

export function PreCallWarRoomCard({
  incidentId = '#INC-8921',
  severity = 'SEV-1',
  responderCount = 5,
  isLoading = false,
  onEnterWarRoom,
  onOtherWaysToJoin,
}: PreCallWarRoomCardProps) {
  const [deploySentinel, setDeploySentinel] = useState(true);

  return (
    <div className="relative flex w-full max-w-md flex-col gap-6 font-sans">
      {/* Join Heading & Metadata */}
      <div className="flex flex-col gap-1.5 text-left">
        <h2 className="text-3xl font-semibold tracking-tight text-white">Ready to join?</h2>
        <p className="text-sm font-medium text-zinc-400">
          Incident <span className="font-mono text-zinc-200">{incidentId}</span> ({severity})
        </p>
        <p className="mt-2 text-sm text-zinc-300">
          <span className="font-semibold text-white">{responderCount} responders</span> currently in the War Room.
        </p>
      </div>

      {/* Deploy Ambient AI Sentinel Feature Glow Card */}
      <div
        onClick={() => setDeploySentinel(!deploySentinel)}
        className={`group relative flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all ${
          deploySentinel
            ? 'border-emerald-500/60 bg-[#142621]/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400">
          <Activity className="h-5 w-5 animate-pulse text-emerald-400" />
        </div>
        <div className="flex flex-col gap-1 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Deploy Ambient AI Sentinel</h3>
            <span className={`h-2 w-2 rounded-full ${deploySentinel ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            EchoSphere silently parses WebRTC audio for contradictions and stages remediations via the state ledger.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {/* Primary ENTER WAR ROOM button */}
        <button
          onClick={onEnterWarRoom}
          disabled={isLoading}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#00a884] text-sm font-semibold text-white shadow-md transition-all hover:bg-[#009273] active:scale-[0.99] disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              Connecting to RTC War Room...
            </>
          ) : (
            'ENTER WAR ROOM'
          )}
        </button>

        {/* Secondary Other Ways to Join button */}
        <button
          onClick={onOtherWaysToJoin}
          className="flex h-10 w-full items-center justify-center rounded-full border border-zinc-700 bg-transparent text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-400 hover:text-white"
        >
          Other ways to join
        </button>
      </div>

      {/* Bottom Right Four-Pointed Sparkle Accent */}
      <div className="absolute -bottom-6 -right-6 text-zinc-600 opacity-60">
        <Sparkles className="h-7 w-7 text-zinc-400" />
      </div>
    </div>
  );
}

export default PreCallWarRoomCard;
