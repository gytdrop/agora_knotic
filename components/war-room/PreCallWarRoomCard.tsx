'use client';

import React, { useState } from 'react';
import { Bot, Loader2, Users, ArrowRight } from 'lucide-react';

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
    <div className="flex w-full flex-col font-sans max-w-md">
      {/* 1. Header & Incident Badges */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-md bg-zinc-800/90 px-2.5 py-1 text-xs font-mono font-medium text-zinc-300 border border-zinc-700 mb-3">
          <span>{incidentId}</span>
          <span className="text-zinc-500">•</span>
          <span className="text-rose-400 font-semibold">[{severity}]</span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-zinc-100">
          Ready to join?
        </h1>

        {/* Responder Count with clean active green indicator dot right below heading */}
        <div className="mt-2 flex items-center gap-2 text-xs text-zinc-400">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-medium text-zinc-300">{responderCount} active responders</span>
          <span>currently connected in the War Room</span>
        </div>
      </div>

      {/* 2. Deploy Ambient AI Sentinel Feature Card - Clean Dark Slate Theme */}
      <div
        onClick={() => setDeploySentinel(!deploySentinel)}
        className={`mb-6 cursor-pointer rounded-xl border p-4 transition-all ${
          deploySentinel
            ? 'border-zinc-700 bg-zinc-900/90 shadow-sm'
            : 'border-zinc-800 bg-zinc-950/60 opacity-60'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
            <Bot className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-zinc-200">
                Deploy Ambient AI Sentinel
              </span>
              <span
                className={`h-2 w-2 rounded-full ${
                  deploySentinel ? 'bg-blue-400' : 'border border-zinc-600'
                }`}
              />
            </div>
            <p className="text-xs leading-relaxed text-zinc-400">
              EchoSphere silently parses WebRTC audio streams for contradictions and stages hotfixes via the state ledger.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Action Buttons - Professional Enterprise Zinc Theme (Zero Bright Consumer Blue) */}
      <div className="flex items-center gap-3">
        {/* Primary Join Button */}
        <button
          onClick={onEnterWarRoom}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-6 py-2.5 text-xs font-semibold text-zinc-950 shadow-sm transition-all hover:bg-white active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-900" />
              Connecting to Agora...
            </>
          ) : (
            <>
              Join War Room
              <ArrowRight className="h-3.5 w-3.5 text-zinc-900" />
            </>
          )}
        </button>

        {/* Secondary Button */}
        <button
          onClick={onOtherWaysToJoin}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/80 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <Users className="h-3.5 w-3.5 text-zinc-400" />
          <span>Other ways to join</span>
        </button>
      </div>
    </div>
  );
}

export default PreCallWarRoomCard;
