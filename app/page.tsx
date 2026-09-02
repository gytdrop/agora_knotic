'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  FileText,
  Terminal,
  PhoneOff,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { IncidentHeader } from '@/components/war-room/IncidentHeader';
import { VideoGrid } from '@/components/war-room/VideoGrid';
import { ConversationParsingPanel } from '@/components/war-room/ConversationParsingPanel';

export default function WarRoomPage() {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [isResolved, setIsResolved] = useState(false);

  const handleRemediateSuccess = () => {
    setIsResolved(true);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100 selection:bg-rose-500 selection:text-white">
      {/* Top Bar: Incident Header */}
      <IncidentHeader
        incidentId="#INC-8921"
        severity="SEV-1"
        title="AGORA ECHOSPHERE"
        isConnected={true}
      />

      {/* Main War Room Content: Video Grid + Side Parsing Drawer */}
      <main className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Side: Participant Video Grid */}
        <section className="flex-1 min-w-0 overflow-hidden">
          <VideoGrid onRemediateSuccess={handleRemediateSuccess} />
        </section>

        {/* Right Side: Real-Time Conversation Parsing Drawer */}
        <ConversationParsingPanel />
      </main>

      {/* Bottom Control Toolbar */}
      <footer className="flex h-16 w-full items-center justify-between border-t border-zinc-800/80 bg-zinc-950 px-6 backdrop-blur-md">
        {/* Left Status Summary */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded bg-zinc-900 px-3 py-1.5 border border-zinc-800 text-xs font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Ambient Mode (16kHz PCM Audio Ingestion)</span>
          </div>
        </div>

        {/* Center Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-medium border transition-colors ${
              isMuted
                ? 'bg-rose-950/60 border-rose-800 text-rose-300 hover:bg-rose-900/80'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            {isMuted ? <MicOff className="h-4 w-4 text-rose-400" /> : <Mic className="h-4 w-4 text-emerald-400" />}
            {isMuted ? 'Muted' : 'Inter (Mute)'}
          </button>

          {/* Camera Toggle */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            {isVideoOff ? <VideoOff className="h-4 w-4 text-zinc-400" /> : <Video className="h-4 w-4 text-emerald-400" />}
            {isVideoOff ? '[Cam Off]' : 'Cam On'}
          </button>

          {/* RTM Ledger Button */}
          <button className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            <FileText className="h-4 w-4 text-amber-400" />
            RTM Ledger
          </button>

          {/* Diagnostics Tool */}
          <button className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
            <Terminal className="h-4 w-4 text-emerald-400" />
            [Diagnostics Tool]
          </button>
        </div>

        {/* Right Action Callouts */}
        <div className="flex items-center gap-3">
          {/* Leave Call */}
          <button className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-900/60 transition-colors">
            <PhoneOff className="h-4 w-4" />
            [Leave Call]
          </button>

          {/* Authorize 1-Click Patch Action Pill */}
          <button
            onClick={handleRemediateSuccess}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold shadow-lg transition-all ${
              isResolved
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-rose-600 hover:bg-rose-500 active:scale-95 text-white animate-pulse'
            }`}
          >
            {isResolved ? (
              <>
                <ShieldCheck className="h-4 w-4 text-white" />
                Hotfix Active (200 OK)
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 text-white" />
                Authorize 1-Click Patch
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
