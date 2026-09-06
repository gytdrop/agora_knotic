'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Clock, 
  VolumeX, 
  ExternalLink, 
  MoreHorizontal, 
  Users, 
  ChevronRight,
  Flame
} from 'lucide-react';

interface IncidentHeaderProps {
  incidentId?: string;
  severity?: string;
  title?: string;
  incidentName?: string;
  isConnected?: boolean;
  speechMuted?: boolean;
  participantCount?: number;
  onViewIncident?: () => void;
}

export function IncidentHeader({
  incidentId = 'INC-2026-0912-001',
  severity = 'P1',
  title,
  incidentName,
  isConnected = true,
  speechMuted = false,
  participantCount = 2,
}: IncidentHeaderProps) {
  // Use dynamic title/name passed in, with dynamic fallback from sessionStorage or defaults
  const [displayTitle, setDisplayTitle] = useState<string>(
    title || incidentName || 'Payment service latency and failures'
  );
  const [displayId, setDisplayId] = useState<string>(incidentId);
  const [displaySeverity, setDisplaySeverity] = useState<string>(severity);
  const [secondsElapsed, setSecondsElapsed] = useState(1694); // 00:28:14 start
  const [userName, setUserName] = useState('SRE');

  useEffect(() => {
    if (title || incidentName) {
      setDisplayTitle(title || incidentName || 'Payment service latency and failures');
    }
  }, [title, incidentName]);

  useEffect(() => {
    if (incidentId) {
      setDisplayId(incidentId);
    }
  }, [incidentId]);

  useEffect(() => {
    if (severity) {
      setDisplaySeverity(severity);
    }
  }, [severity]);

  // Read any stored dynamic incident details from sessionStorage if not passed directly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedId = sessionStorage.getItem('echosphere_incident_id');
      if (storedId && !incidentId) setDisplayId(storedId);

      const storedTitle = sessionStorage.getItem('echosphere_incident_title') || sessionStorage.getItem('echosphere_incident_name');
      if (storedTitle && !title && !incidentName) setDisplayTitle(storedTitle);

      const storedSev = sessionStorage.getItem('echosphere_incident_severity');
      if (storedSev && !severity) setDisplaySeverity(storedSev);

      const storedUser = sessionStorage.getItem('echosphere_user_name');
      if (storedUser && storedUser.trim()) {
        setUserName(storedUser.trim());
      }
    }
  }, [incidentId, title, incidentName, severity]);

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
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const cleanIncidentId = displayId.startsWith('#') ? displayId.slice(1) : displayId;

  return (
    <header className="flex flex-col w-full border-b border-zinc-800/80 bg-[#16171a] px-5 py-2.5 text-zinc-200 font-sans select-none transition-colors">
      {/* Top Row: Zoom/Teams Style Clean Breadcrumb Navigation */}
      <div className="flex items-center justify-between pb-1 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="flex items-center gap-1.5 font-semibold text-zinc-100">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600/90 text-white font-bold text-[11px] shadow-sm">
              E
            </div>
            <span className="text-xs font-semibold tracking-tight text-white">Ecosphere</span>
          </div>

          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <Link href="/incidents" className="hover:text-zinc-200 transition-colors">
            Incidents
          </Link>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="font-mono text-zinc-300 font-medium">{cleanIncidentId}</span>
          <ChevronRight className="h-3 w-3 text-zinc-600" />
          <span className="text-zinc-100 font-medium">War Room</span>
        </div>

        {/* Right Quick Status (Agora RTC & Silent mode indicator) */}
        <div className="flex items-center gap-3">
          {speechMuted && (
            <div className="flex items-center gap-1 rounded-full bg-amber-950/60 px-2.5 py-0.5 border border-amber-800/60 text-[11px] font-medium text-amber-300">
              <VolumeX className="h-3 w-3 text-amber-400" />
              <span>Silent Mode</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-full bg-zinc-900/90 px-2.5 py-0.5 border border-zinc-800 text-[11px] text-zinc-300">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'
              }`}
            />
            <span className="text-zinc-400">{isConnected ? 'Agora RTC Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Dynamic Incident Title & Meta Strip (Zoom Dark Mode) */}
      <div className="flex items-center justify-between pt-1">
        {/* Left: Dynamic Severity Pill & Incident Title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Muted Zoom-Style Severity Badge (No harsh neon) */}
          <div className="flex items-center gap-1 rounded-md bg-rose-950/60 px-2.5 py-0.5 border border-rose-800/70 text-xs font-semibold text-rose-300 shadow-sm shrink-0">
            <Flame className="h-3 w-3 text-rose-400" />
            <span>{displaySeverity}</span>
          </div>

          {/* Dynamic Incident Title */}
          <h1 className="text-sm font-semibold text-zinc-100 truncate tracking-tight" title={displayTitle}>
            {displayTitle}
          </h1>

          {/* Live Pulsing Badge */}
          <div className="flex items-center gap-1.5 rounded-full bg-rose-950/40 px-2.5 py-0.5 border border-rose-800/50 text-[11px] font-medium text-rose-300 shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Live</span>
          </div>

          {/* MTTR Timer */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-mono shrink-0 pl-1">
            <Clock className="h-3.5 w-3.5 text-zinc-400" />
            <span>{formatTimer(secondsElapsed)}</span>
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0 pl-1">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span>{participantCount} in call</span>
          </div>
        </div>

        {/* Right Actions: View Incident & More */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/post-mortem/${cleanIncidentId}`}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-800/80 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors shadow-sm"
          >
            <span>View Incident</span>
            <ExternalLink className="h-3 w-3 text-zinc-400" />
          </Link>

          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Incident Settings & Actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default IncidentHeader;
