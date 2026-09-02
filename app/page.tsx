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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171717] text-zinc-100 selection:bg-blue-500 selection:text-white font-sans">
      {/* Top Bar: Google Meet Style Incident Header */}
      <IncidentHeader
        incidentId="#INC-8921"
        severity="SEV-1"
        title="AGORA ECHOSPHERE"
        isConnected={true}
      />

      {/* Main Content Area: Video Grid + Side Parsing Drawer */}
      <main className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Side: Participant Video Grid */}
        <section className="flex-1 min-w-0 overflow-hidden">
          <VideoGrid onRemediateSuccess={handleRemediateSuccess} />
        </section>

        {/* Right Side: Conversation Parsing Side Drawer */}
        <ConversationParsingPanel />
      </main>

      {/* Bottom Control Toolbar (GMeet Floating Control Dock) */}
      <footer className="flex h-16 w-full items-center justify-between border-t border-zinc-800/80 bg-[#202124] px-6 text-zinc-200">
        {/* Left Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-3.5 py-1.5 border border-zinc-700/60 text-xs font-sans text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Ambient Sentinel Mode (16kHz PCM)</span>
          </div>
        </div>

        {/* Center Google Meet Circular Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute Toggle Circular Button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              isMuted
                ? 'bg-rose-600 border-rose-500 text-white hover:bg-rose-700'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Camera Toggle Circular Button */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              isVideoOff
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                : 'bg-zinc-800 border-zinc-700 text-emerald-400 hover:bg-zinc-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </button>

          {/* RTM Ledger Circular Button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 hover:bg-zinc-700 transition-colors shadow-sm"
            title="RTM Ledger"
          >
            <FileText className="h-4 w-4" />
          </button>

          {/* Diagnostics Tool Circular Button */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-blue-400 hover:bg-zinc-700 transition-colors shadow-sm"
            title="Diagnostics Tool"
          >
            <Terminal className="h-4 w-4" />
          </button>

          {/* End Call Circular Button (GMeet Red Button) */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-sm"
            title="Leave War Room Call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>

        {/* Right Authorize Patch Action Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRemediateSuccess}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold shadow-md transition-all ${
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
