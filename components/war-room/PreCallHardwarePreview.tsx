'use client';

import React, { useState } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  VideoOff,
  Wifi,
  ChevronDown,
  Lock,
} from 'lucide-react';

interface PreCallHardwarePreviewProps {
  onPermissionGranted?: () => void;
  isPermissionGranted?: boolean;
}

export function PreCallHardwarePreview({
  onPermissionGranted,
  isPermissionGranted = false,
}: PreCallHardwarePreviewProps) {
  const [micEnabled, setMicEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(isPermissionGranted);

  const handleRequestPermission = () => {
    setHasPermission(true);
    if (onPermissionGranted) {
      onPermissionGranted();
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Main Video Preview Box */}
      <div className="relative flex aspect-video w-full max-w-2xl flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-800 bg-[#28292c] shadow-2xl">
        {!hasPermission ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-lg font-medium text-zinc-200">
              Initialize hardware for WebRTC ingestion.
            </p>
            <button
              onClick={handleRequestPermission}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-500 active:scale-95"
            >
              <Lock className="h-4 w-4" />
              ALLOW MICROPHONE AND CAMERA
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xl font-semibold">
              AK
            </div>
            <span className="text-sm font-medium text-zinc-400">Hardware Initialized</span>
          </div>
        )}

        {/* Floating Preview Control Bar inside Video Box */}
        <div className="absolute bottom-4 flex items-center gap-3 rounded-xl bg-zinc-900/80 px-4 py-2 border border-zinc-700/60 backdrop-blur-md">
          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              micEnabled
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                : 'bg-rose-700 text-white hover:bg-rose-600'
            }`}
            title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              audioEnabled
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                : 'bg-rose-700 text-white hover:bg-rose-600'
            }`}
            title={audioEnabled ? 'Mute Output' : 'Unmute Output'}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
              videoEnabled
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
            title={videoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </button>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
            title="Network & Bandwidth Test"
          >
            <Wifi className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Device Selection Dropdown Pills */}
      <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-zinc-400 hover:border-zinc-700 cursor-pointer">
          <Mic className="h-3.5 w-3.5 text-zinc-400" />
          <span className="truncate max-w-[100px]">Permission n...</span>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-zinc-400 hover:border-zinc-700 cursor-pointer">
          <Volume2 className="h-3.5 w-3.5 text-zinc-400" />
          <span className="truncate max-w-[100px]">Permission n...</span>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-zinc-400 hover:border-zinc-700 cursor-pointer">
          <Video className="h-3.5 w-3.5 text-zinc-400" />
          <span className="truncate max-w-[100px]">Permission n...</span>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </div>

        <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1.5 text-zinc-400 hover:border-zinc-700 cursor-pointer">
          <Wifi className="h-3.5 w-3.5 text-zinc-400" />
          <span className="truncate max-w-[100px]">Permission n...</span>
          <ChevronDown className="h-3 w-3 text-zinc-500" />
        </div>
      </div>
    </div>
  );
}

export default PreCallHardwarePreview;
