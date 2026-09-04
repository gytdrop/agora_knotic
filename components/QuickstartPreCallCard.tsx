'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Wifi,
  ChevronDown,
  Lock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

type QuickstartPreCallCardProps = {
  isLoading: boolean;
  error: string | null;
  onStartConversation: () => void;
};

export function QuickstartPreCallCard({
  isLoading,
  error,
  onStartConversation,
}: QuickstartPreCallCardProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionRequested, setPermissionRequested] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleRequestHardware = async () => {
    setPermissionRequested(true);
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setHasPermission(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 } },
        audio: true,
      });
      setLocalStream(stream);
      setHasPermission(true);

      // Setup Web Audio Analyser for live microphone feedback
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const pollVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 1.8)));
        requestAnimationFrame(pollVolume);
      };
      pollVolume();
    } catch (err) {
      console.warn('Hardware permission prompt error or rejected:', err);
      setHasPermission(true); // Allow proceeding regardless in dev/fallback
    }
  };

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, videoEnabled]);

  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [localStream]);

  const toggleMic = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = next));
    }
  };

  const toggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (localStream) {
      localStream.getVideoTracks().forEach((t) => (t.enabled = next));
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md animate-fade-up flex-col items-center rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 text-center shadow-2xl font-sans antialiased">
      {/* Header Badge */}
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-xs text-zinc-300">
        <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
        <span className="font-mono text-zinc-400">#INC-8921</span>
        <span className="text-zinc-600">•</span>
        <span className="text-rose-400 font-semibold">[SEV-1]</span>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-white">
        Join War Room
      </h1>
      <p className="mt-1 text-xs text-zinc-400 leading-relaxed max-w-sm">
        EchoSphere ambient sentinel monitors WebRTC audio streams to isolate contradictions and stage 1-click hotfixes.
      </p>

      {/* Live Hardware Feedback Preview Container */}
      <div className="relative mt-4 flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
        {!hasPermission ? (
          <div className="flex flex-col items-center justify-center gap-3 p-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Lock className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-200">
                Hardware Initializer
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Enable mic and camera for real-time audio telemetry.
              </p>
            </div>
            <button
              onClick={handleRequestHardware}
              disabled={permissionRequested}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3.5 py-1.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-white active:scale-95 border border-zinc-300"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-zinc-900" />
              <span>Authorize Hardware</span>
            </button>
          </div>
        ) : videoEnabled && localStream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover scale-x-[-1]"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-zinc-200 text-lg font-semibold font-mono">
              AK
            </div>
            <div className="flex items-center gap-1 text-[11px] text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Hardware Approved ({videoEnabled ? 'Camera Active' : 'Camera Off'})</span>
            </div>
          </div>
        )}

        {/* Live Audio Feedback Waveform Meter */}
        {hasPermission && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 rounded-full bg-zinc-950/85 px-2.5 py-1 border border-zinc-800/80 backdrop-blur-md">
            <Mic className="h-3 w-3 text-emerald-400" />
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-1 rounded-full transition-all duration-75 ${
                    audioLevel > i * 18 ? 'bg-emerald-400' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* In-Preview Quick Hardware Controls */}
        {hasPermission && (
          <div className="absolute bottom-2.5 flex items-center gap-2 rounded-xl bg-zinc-950/85 px-2.5 py-1 border border-zinc-800/80 backdrop-blur-md">
            <button
              onClick={toggleMic}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors border ${
                micEnabled
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700'
                  : 'bg-rose-950/80 text-rose-300 border-rose-800'
              }`}
              title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micEnabled ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors border ${
                videoEnabled
                  ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-zinc-700'
                  : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 border-zinc-700'
              }`}
              title={videoEnabled ? 'Turn Off Video' : 'Turn On Video'}
            >
              {videoEnabled ? <Video className="h-3 w-3" /> : <VideoOff className="h-3 w-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Contained Device Selection Dropdown Pills: No Floating Overflow */}
      <div className="mt-3.5 w-full grid grid-cols-2 gap-2 text-xs font-sans">
        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-zinc-300 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Mic className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">
              {hasPermission ? 'Default Mic' : 'Microphone'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0 ml-1" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-zinc-300 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Volume2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">
              {hasPermission ? 'Default Output' : 'Speaker'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0 ml-1" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-zinc-300 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Video className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">
              {hasPermission ? 'Webcam 720p' : 'Camera'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0 ml-1" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/80 px-2.5 py-1.5 text-zinc-300 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
            <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-[11px] text-emerald-400">
              Agora RTC OK
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0 ml-1" />
        </div>
      </div>

      {/* Enterprise Slate/Zinc Primary Action Button (Zero Light Blue) */}
      <button
        onClick={onStartConversation}
        disabled={isLoading}
        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 text-xs font-semibold text-zinc-950 shadow-sm transition-all hover:bg-white hover:text-black active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        aria-label={isLoading ? 'Connecting to War Room' : 'Join War Room'}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-zinc-900" />
            <span>Connecting to Agora RTC...</span>
          </>
        ) : (
          <>
            <span>Join War Room</span>
            <ArrowRight className="h-3.5 w-3.5 text-zinc-900" />
          </>
        )}
      </button>

      {error && (
        <p className="mt-2.5 text-xs text-rose-400 font-sans">{error}</p>
      )}
    </div>
  );
}

export default QuickstartPreCallCard;
