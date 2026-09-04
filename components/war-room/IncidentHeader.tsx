'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Clock } from 'lucide-react';

interface IncidentHeaderProps {
  incidentId?: string;
  severity?: string;
  title?: string;
  isConnected?: boolean;
}

export function IncidentHeader({
  incidentId = '#INC-8921',
  severity = 'SEV-1',
  title = 'AGORA ECHOSPHERE',
  isConnected = true,
}: IncidentHeaderProps) {
  const [secondsElapsed, setSecondsElapsed] = useState(195); // 00:03:15 start

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-[#202124] px-6 text-zinc-100 font-sans">
      {/* Left Branding & Incident Badge */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 font-bold text-zinc-950 shadow-sm">
            E
          </div>
          <span className="text-sm font-semibold tracking-wide text-white uppercase">
            {title}
          </span>
        </div>

        <span className="text-zinc-500 font-light">&#47;&#47;</span>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">INCIDENT:</span>
          <span className="text-xs font-semibold text-zinc-200 font-mono">{incidentId}</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/90 px-2 py-0.5 text-xs font-semibold text-rose-300/90 border border-zinc-700">
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            [{severity}]
          </span>
        </div>
      </div>

      {/* Right Metrics & RTC Status */}
      <div className="flex items-center gap-6">
        {/* MTTR Timer */}
        <div className="flex items-center gap-2 rounded-lg bg-zinc-800/80 px-3 py-1 border border-zinc-700/60">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-xs text-zinc-400 font-medium">MTTR Clock:</span>
          <span className="font-mono text-xs font-medium text-zinc-200">{formatTimer(secondsElapsed)}</span>
        </div>

        {/* Agora RTC Connection Status */}
        <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-3.5 py-1 border border-zinc-700/60">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500' : 'bg-rose-500'
            }`}
          />
          <span className="text-xs font-medium text-zinc-300">
            {isConnected ? 'Agora RTC Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}
export default IncidentHeader;
