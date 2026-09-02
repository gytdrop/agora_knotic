'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface PreCallHeaderProps {
  title?: string;
  subTitle?: string;
  incidentId?: string;
  severity?: string;
  avatarUrl?: string;
}

export function PreCallHeader({
  title = 'AGORA ECHOSPHERE',
  subTitle = 'SEV-1 STAGING',
  incidentId = '#INC-8921',
  severity = 'SEV-1',
}: PreCallHeaderProps) {
  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-zinc-800/80 bg-[#171717] px-6 text-zinc-100 font-sans">
      {/* Left Branding & Incident Metadata */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 font-bold text-white text-sm shadow-sm">
            E
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            {title}
          </span>
          <span className="text-zinc-500 font-light">&#47;&#47;</span>
          <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase">
            {subTitle}
          </span>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">Incident</span>
          <span className="text-xs font-semibold text-zinc-200 font-mono">{incidentId}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            [{severity}]
          </span>
        </div>
      </div>

      {/* Right User Profile Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
          <div className="flex h-full w-full items-center justify-center bg-zinc-700 text-xs font-medium text-zinc-200">
            AK
          </div>
        </div>
      </div>
    </header>
  );
}

export default PreCallHeader;
