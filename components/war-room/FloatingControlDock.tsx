'use client';

import React, { useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Share2, 
  Users, 
  MessageSquare, 
  Heart, 
  Disc, 
  MoreHorizontal, 
  PhoneOff,
  ChevronUp,
  Smile,
  Volume2,
  Settings,
  Sparkles
} from 'lucide-react';
import type { WarRoomToolTab } from '@/types/war-room';

interface FloatingControlDockProps {
  isMicMuted?: boolean;
  isVideoOff?: boolean;
  isSharing?: boolean;
  participantCount?: number;
  activeSidebarTab?: WarRoomToolTab;
  isSidebarOpen?: boolean;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleShare?: () => void;
  onSelectSidebarTab: (tab: WarRoomToolTab) => void;
  onToggleSidebar?: () => void;
  onEndCall: () => void;
}

export function FloatingControlDock({
  isMicMuted = false,
  isVideoOff = false,
  isSharing = false,
  participantCount = 2,
  activeSidebarTab = 'actions',
  isSidebarOpen = true,
  onToggleMic,
  onToggleVideo,
  onToggleShare,
  onSelectSidebarTab,
  onToggleSidebar,
  onEndCall,
}: FloatingControlDockProps) {
  const [showReactions, setShowReactions] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);

  const triggerReaction = (emoji: string) => {
    setFloatingReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setFloatingReaction(null), 2000);
  };

  const handleTabClick = (tab: WarRoomToolTab) => {
    if (isSidebarOpen && activeSidebarTab === tab) {
      if (onToggleSidebar) onToggleSidebar();
    } else {
      onSelectSidebarTab(tab);
    }
  };

  return (
    <div className="relative flex items-center justify-center font-sans select-none pointer-events-none">
      {/* Floating Reaction Animation */}
      {floatingReaction && (
        <div className="absolute -top-16 text-3xl animate-bounce pointer-events-none z-50">
          {floatingReaction}
        </div>
      )}

      {/* Floating Dock Container (Zoom & Teams style) */}
      <div className="pointer-events-auto relative flex items-center gap-1.5 sm:gap-2 rounded-2xl bg-[#18191dc4] px-3 sm:px-4 py-2 border border-zinc-700/60 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-zinc-300">
        
        {/* ── 1. Microphone Toggle ── */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onToggleMic}
            className={`flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border transition-all ${
              isMicMuted
                ? 'bg-rose-950/60 border-rose-800/70 text-rose-400 hover:bg-rose-900/60'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-100 hover:bg-zinc-700/80'
            }`}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            {isMicMuted ? 'Unmute' : 'Mute'}
          </span>
        </div>

        {/* ── 2. Camera Toggle ── */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onToggleVideo}
            className={`flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border transition-all ${
              isVideoOff
                ? 'bg-rose-950/60 border-rose-800/70 text-rose-400 hover:bg-rose-900/60'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-100 hover:bg-zinc-700/80'
            }`}
            title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            {isVideoOff ? 'Start Video' : 'Stop Video'}
          </span>
        </div>

        {/* ── 3. Screen Share (Zoom Green Accent) ── */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onToggleShare}
            className={`flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border transition-all ${
              isSharing
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                : 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300'
            }`}
            title="Share Screen"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-emerald-400 mt-1 font-medium">
            Share
          </span>
        </div>

        {/* Subtle Divider */}
        <div className="h-8 w-[1px] bg-zinc-700/60 mx-0.5 sm:mx-1" />

        {/* ── 4. Participants (Triggers People tab) ── */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleTabClick('people')}
            className={`relative flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border transition-all ${
              isSidebarOpen && activeSidebarTab === 'people'
                ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-sm'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-200 hover:bg-zinc-700/80'
            }`}
            title="View In-Call Participants"
          >
            <Users className="h-4 w-4" />
            <span className="absolute -top-1.5 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-zinc-700 border border-zinc-600 text-[9px] font-semibold text-zinc-200">
              {participantCount}
            </span>
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            People
          </span>
        </div>

        {/* ── 5. Chat (Triggers Chat tab) ── */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => handleTabClick('chat')}
            className={`relative flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border transition-all ${
              isSidebarOpen && activeSidebarTab === 'chat'
                ? 'bg-indigo-600/80 border-indigo-500 text-white shadow-sm'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-200 hover:bg-zinc-700/80'
            }`}
            title="Meeting Chat"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            Chat
          </span>
        </div>

        {/* ── 6. Reactions Popover ── */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowReactions(!showReactions)}
            className="flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border bg-zinc-800/80 border-zinc-700/60 text-zinc-200 hover:bg-zinc-700/80 transition-all"
            title="Reactions"
          >
            <Heart className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            React
          </span>

          {showReactions && (
            <div className="absolute bottom-16 -left-6 flex items-center gap-2 rounded-2xl bg-zinc-900 border border-zinc-700/80 p-2 shadow-2xl backdrop-blur-xl z-50">
              {['👍', '❤️', '👏', '🎉', '🔥', '🚀'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => triggerReaction(emoji)}
                  className="p-2 rounded-xl text-lg hover:scale-125 hover:bg-zinc-800 transition-all"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── 7. Record Toggle ── */}
        <div className="hidden sm:flex flex-col items-center">
          <button
            type="button"
            onClick={() => setIsRecording(!isRecording)}
            className={`flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border transition-all ${
              isRecording
                ? 'bg-rose-950/60 border-rose-700 text-rose-400'
                : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-200 hover:bg-zinc-700/80'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            <Disc className={`h-4 w-4 ${isRecording ? 'animate-pulse text-rose-400' : ''}`} />
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            {isRecording ? 'Rec...' : 'Record'}
          </span>
        </div>

        {/* ── 8. More Options ── */}
        <div className="relative flex flex-col items-center">
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex h-10 w-10 sm:h-10 sm:w-11 items-center justify-center rounded-xl border bg-zinc-800/80 border-zinc-700/60 text-zinc-200 hover:bg-zinc-700/80 transition-all"
            title="More Options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium">
            More
          </span>

          {showMoreMenu && (
            <div className="absolute bottom-16 right-0 w-48 rounded-xl bg-zinc-900 border border-zinc-700/80 p-1.5 shadow-2xl z-50 text-xs text-zinc-200">
              <button
                type="button"
                onClick={() => {
                  handleTabClick('updates');
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-left transition-colors"
              >
                <span>Incident Updates</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTabClick('ai-brief');
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-left transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>AI Brief</span>
              </button>
              <div className="h-[1px] bg-zinc-800 my-1" />
              <button
                type="button"
                onClick={() => {
                  if (onToggleSidebar) onToggleSidebar();
                  setShowMoreMenu(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800 text-left transition-colors"
              >
                <span>{isSidebarOpen ? 'Hide Tools' : 'Show Tools'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Subtle Divider */}
        <div className="h-8 w-[1px] bg-zinc-700/60 mx-0.5 sm:mx-1" />

        {/* ── 9. Leave Meeting Button (Red) ── */}
        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={onEndCall}
            className="flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-semibold shadow-lg shadow-rose-900/30 transition-all cursor-pointer"
            title="Leave War Room"
          >
            <PhoneOff className="h-4 w-4" />
            <span className="text-xs font-semibold">Leave</span>
          </button>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium invisible">
            Leave
          </span>
        </div>

      </div>
    </div>
  );
}

export default FloatingControlDock;
