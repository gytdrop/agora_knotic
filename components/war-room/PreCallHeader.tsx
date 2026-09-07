'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, User } from 'lucide-react';

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
  const [userName, setUserName] = useState('SRE');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('echosphere_user_name');
      if (stored && stored.trim()) {
        setUserName(stored.trim());
      }
    }
  }, []);

  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SR';

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-slate-800/80 bg-[#171717] px-6 text-slate-100 font-sans">
      {/* Left Branding & Incident Metadata */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 font-bold text-white text-sm shadow-sm">
            E
          </div>
          <span className="text-sm font-semibold tracking-wide text-white">
            {title}
          </span>
          <span className="text-slate-500 font-light">&#47;&#47;</span>
          <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
            {subTitle}
          </span>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Incident</span>
          <span className="text-xs font-semibold text-slate-200 font-mono">{incidentId}</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-950/60 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <ShieldAlert className="h-3 w-3 text-rose-400" />
            [{severity}]
          </span>
        </div>
      </div>

      {/* Right User Profile Avatar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300">
          <User className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-medium text-slate-200 truncate max-w-[120px]">{userName}</span>
        </div>
        <div className="relative h-8 w-8 overflow-hidden rounded-full border border-slate-700 bg-slate-800 flex items-center justify-center">
          <span className="text-xs font-medium text-slate-200">{initials}</span>
        </div>
      </div>
    </header>
  );
}

export default PreCallHeader;
