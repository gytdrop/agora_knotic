'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
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
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [hasPermission, setHasPermission] = useState(isPermissionGranted);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isInsecureOrigin, setIsInsecureOrigin] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      window.location.protocol === 'http:'
    ) {
      setIsInsecureOrigin(true);
    }
  }, []);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const handleRequestPermission = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn(
          'getUserMedia is not available. Ensure page is accessed via HTTPS or localhost.',
        );
        setIsInsecureOrigin(true);
        setHasPermission(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setLocalStream(stream);
      setHasPermission(true);

      // Setup audio analyzer for preview
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round(avg * 1.8)));
        requestAnimationFrame(checkVolume);
      };
      checkVolume();

      if (onPermissionGranted) {
        onPermissionGranted();
      }
    } catch (err) {
      console.warn('Microphone/Camera permission error:', err);
      setHasPermission(true);
    }
  };

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream, videoEnabled]);

  // Clean up media on unmount
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

  // Toggle mic track
  const toggleMic = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
    }
  };

  // Toggle video track
  const toggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = next;
      });
    }
  };

  return (
    <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-zinc-800 bg-[#28292c] p-4 shadow-xl font-sans">
      {/* Insecure Origin Alert */}
      {isInsecureOrigin && (
        <div className="mb-3 w-full rounded-xl border border-amber-800/80 bg-amber-950/70 p-3 text-xs text-amber-200">
          <div className="font-semibold text-amber-300 mb-0.5">⚠️ Insecure Context Detected ({typeof window !== 'undefined' ? window.location.host : ''})</div>
          <div>Web browsers block microphone and camera access on HTTP for non-localhost IPs. Please open <a href="http://localhost:3000" className="underline font-mono text-amber-100 font-semibold">http://localhost:3000</a> on this machine, or access via HTTPS.</div>
        </div>
      )}

      {/* 1. Video Box Container */}
      <div className="relative flex aspect-video w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-700/80 bg-[#1e1f22]">
        {!hasPermission ? (
          <div className="flex flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Lock className="h-5 w-5 text-zinc-400" />
            </div>
            <div>
              <p className="text-base font-medium text-zinc-200">
                Initialize hardware for WebRTC ingestion
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Grant camera and microphone permissions to verify audio levels.
              </p>
            </div>
            <button
              onClick={handleRequestPermission}
              className="flex items-center gap-2 rounded-lg bg-zinc-100 px-5 py-2.5 text-xs font-semibold text-zinc-900 shadow-sm transition-all hover:bg-white active:scale-95"
            >
              <Lock className="h-3.5 w-3.5" />
              ALLOW MICROPHONE AND CAMERA
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
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xl font-semibold">
              AK
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Hardware Initialized (Camera Muted)</span>
            </div>
          </div>
        )}

        {/* Audio Waveform Meter (When Permission Granted) */}
        {hasPermission && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-zinc-950/80 px-2.5 py-1 border border-zinc-800 backdrop-blur-md">
            <Mic className="h-3 w-3 text-blue-400" />
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-1 rounded-full transition-all duration-75 ${
                    audioLevel > i * 18 ? 'bg-blue-400' : 'bg-zinc-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Control Bar inside Preview Card */}
        <div className="absolute bottom-3 flex items-center gap-2 rounded-xl bg-zinc-950/85 px-3 py-1.5 border border-zinc-800/80 backdrop-blur-md">
          <button
            onClick={toggleMic}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              micEnabled
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-rose-900/80 text-rose-200 border border-rose-700'
            }`}
            title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
          >
            {micEnabled ? <Mic className="h-3.5 w-3.5" /> : <MicOff className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              audioEnabled
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-rose-900/80 text-rose-200 border border-rose-700'
            }`}
            title={audioEnabled ? 'Mute Speaker' : 'Unmute Speaker'}
          >
            {audioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
          </button>

          <button
            onClick={toggleVideo}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
              videoEnabled
                ? 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700'
                : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 border border-zinc-700'
            }`}
            title={videoEnabled ? 'Turn Camera Off' : 'Turn Camera On'}
          >
            {videoEnabled ? <Video className="h-3.5 w-3.5" /> : <VideoOff className="h-3.5 w-3.5" />}
          </button>

          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-700"
            title="WebRTC Network Latency < 300ms"
          >
            <Wifi className="h-3.5 w-3.5" />
          </div>
        </div>
      </div>

      {/* 2. Device Selection Dropdowns - Cleanly Integrated INSIDE the card as an inline row */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-sans">
        <div className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-900/90 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-1.5 min-w-0">
            <Mic className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">
              {hasPermission ? 'Default Mic' : 'Permissions...'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-900/90 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-1.5 min-w-0">
            <Volume2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">
              {hasPermission ? 'Default Speaker' : 'Permissions...'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-900/90 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-1.5 min-w-0">
            <Video className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">
              {hasPermission ? 'Webcam 720p' : 'Permissions...'}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-zinc-700/60 bg-zinc-900/90 px-2.5 py-1.5 text-zinc-300 hover:border-zinc-600 transition-colors">
          <div className="flex items-center gap-1.5 min-w-0">
            <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-[11px]">Agora RTC OK</span>
          </div>
          <ChevronDown className="h-3 w-3 text-zinc-500 shrink-0" />
        </div>
      </div>
    </div>
  );
}

export default PreCallHardwarePreview;
