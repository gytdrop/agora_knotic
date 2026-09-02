'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Play,
  RotateCcw,
} from 'lucide-react';
import { IncidentHeader } from '@/components/war-room/IncidentHeader';
import { VideoGrid, Participant, DEFAULT_PARTICIPANTS } from '@/components/war-room/VideoGrid';
import { ConversationParsingPanel } from '@/components/war-room/ConversationParsingPanel';
import { LedgerItem } from '@/components/war-room/StateLedgerPanel';

export default function WarRoomPage() {
  // Media & Hardware State
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  // Incident & Ledger State
  const [isResolved, setIsResolved] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([
    {
      id: '1',
      timestamp: '12:30:15',
      speaker: 'Akthar',
      text: '"Database is locked up"',
      tag: 'HYPOTHESIS',
      status: 'Hypothesis',
    },
    {
      id: '2',
      timestamp: '12:30:20',
      speaker: 'Ashrith',
      text: '"Ingress pods OOMing"',
      tag: 'FACT',
      status: 'Confirmed Fact (HolmesGPT)',
    },
    {
      id: '3',
      timestamp: '12:30:25',
      speaker: 'Akthar vs. Ashrith',
      text: 'Ingress health contradicts DB lockup',
      tag: 'CONTRADICTION',
      status: 'Suppressed (miniMax voice holding)',
      reason:
        'Contradiction Confirmed. HolmesGPT shows healthy DB connection pools. Suppressing Akthar\'s hypothesis to prevent false path.',
    },
  ]);

  // Demo Simulation State
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const demoTimersRef = useRef<NodeJS.Timeout[]>([]);

  // 1. Webcam Stream Control
  const toggleCamera = useCallback(async () => {
    if (!isVideoOff) {
      // Turn camera OFF
      if (localVideoStream) {
        localVideoStream.getTracks().forEach((t) => t.stop());
      }
      setLocalVideoStream(null);
      setIsVideoOff(true);
    } else {
      // Turn camera ON
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setLocalVideoStream(stream);
        setIsVideoOff(false);
      } catch (err) {
        console.warn('Could not access webcam:', err);
        // Fallback toggle
        setIsVideoOff(false);
      }
    }
  }, [isVideoOff, localVideoStream]);

  // 2. Microphone & Live Voice Activity Detection (VAD)
  const toggleMicrophone = useCallback(async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (micStreamRef.current) {
      micStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }
  }, [isMuted]);

  // Initialize Microphone & Audio VAD on user interaction
  useEffect(() => {
    let unmounted = false;

    async function initAudioVAD() {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (unmounted) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = audioStream;

        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(audioStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVolume = () => {
          if (unmounted) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          // Threshold for speaking detection
          setIsLocalSpeaking(average > 25);
          requestAnimationFrame(checkVolume);
        };
        checkVolume();
      } catch {
        // Mic permission ignored or not yet granted
      }
    }

    initAudioVAD();

    return () => {
      unmounted = true;
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Update Akthar speaking state in participants list
  useEffect(() => {
    setParticipants((prev) =>
      prev.map((p) => {
        if (p.id === 'akthar') {
          return {
            ...p,
            status: !isMuted && isLocalSpeaking ? 'Speaking' : isMuted ? 'Muted' : 'Ambient Mode',
          };
        }
        return p;
      })
    );
  }, [isMuted, isLocalSpeaking]);

  // 3. Hotfix Remediation Handler
  const handleRemediateSuccess = useCallback(async () => {
    try {
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: 'act_hotfix_8080_8000',
          actionType: 'K8S_INGRESS_PATCH',
          targetService: 'ingress/auth-svc',
          authorizedBy: 'Akthar (Lead SRE)',
          passkeyUsed: true,
        }),
      });

      if (res.ok) {
        setIsResolved(true);
        // Append ACTION item to ledger
        setLedgerItems((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            speaker: 'EchoSphere Remediation',
            text: 'kubectl patch ingress auth-svc applied. Ingress route restored to port 8080 -> 8000.',
            tag: 'ACTION',
            status: '200 OK Patch Active',
          },
        ]);
      }
    } catch (err) {
      console.error('Failed to trigger remediation:', err);
      setIsResolved(true);
    }
  }, []);

  // 4. Incident Demo Scenario Flow (record.md 90s scenario)
  const runIncidentDemo = useCallback(() => {
    // Clear any active timers
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsDemoRunning(true);
    setIsResolved(false);

    // Initial state
    setLedgerItems([]);

    // Turn 1 [00:02]: Akthar speaks
    const t1 = setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === 'akthar' ? { ...p, status: 'Speaking', hasContradiction: false } : p))
      );
      setLedgerItems([
        {
          id: '1',
          timestamp: '12:30:15',
          speaker: 'Akthar',
          text: '"Database is dropping connections."',
          tag: 'HYPOTHESIS',
          status: 'Hypothesis Registered',
        },
      ]);
    }, 2000);

    // Turn 2 [00:05]: Agent flags Contradiction (HolmesGPT DB healthy)
    const t2 = setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) =>
          p.id === 'akthar'
            ? {
                ...p,
                status: 'Muted',
                hasContradiction: true,
                statement: '⚠️ Akthar: "Database is down."',
                factCheckTelemetry: 'Fact Check: CPU 2.1%, Active 14 (Healthy)',
              }
            : p
        )
      );
      setLedgerItems((prev) => [
        ...prev,
        {
          id: '2',
          timestamp: '12:30:20',
          speaker: 'HolmesGPT vs. Akthar',
          text: 'DB metrics contradict lockup hypothesis.',
          tag: 'CONTRADICTION',
          status: 'Suppressed on Audio',
          reason: 'HolmesGPT: RDS PostgreSQL connection pool healthy (14 active, max 500). CPU 2.1%.',
        },
      ]);
    }, 5000);

    // Turn 3 [00:08]: Ashrith speaks
    const t3 = setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === 'ashrith' ? { ...p, status: 'Speaking' } : p))
      );
      setLedgerItems((prev) => [
        ...prev,
        {
          id: '3',
          timestamp: '12:30:35',
          speaker: 'Ashrith',
          text: '"Ingress pods are throwing 502 Bad Gateway."',
          tag: 'FACT',
          status: 'Confirmed Fact',
        },
      ]);
    }, 8000);

    // Turn 4 [00:11]: Root Cause Isolated & Hotfix Staged
    const t4 = setTimeout(() => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === 'ashrith' ? { ...p, status: 'Muted' } : p))
      );
      setLedgerItems((prev) => [
        ...prev,
        {
          id: '4',
          timestamp: '12:30:40',
          speaker: 'EchoSphere Engine',
          text: 'Root cause isolated: Ingress /api/v2/auth routed to 8080 instead of containerPort 8000.',
          tag: 'FACT',
          status: 'Staged Patch Ready',
        },
      ]);
      setIsDemoRunning(false);
    }, 11000);

    demoTimersRef.current = [t1, t2, t3, t4];
  }, []);

  const resetDemo = useCallback(() => {
    demoTimersRef.current.forEach(clearTimeout);
    demoTimersRef.current = [];
    setIsDemoRunning(false);
    setIsResolved(false);
    setParticipants(DEFAULT_PARTICIPANTS);
    setLedgerItems([
      {
        id: '1',
        timestamp: '12:30:15',
        speaker: 'Akthar',
        text: '"Database is locked up"',
        tag: 'HYPOTHESIS',
        status: 'Hypothesis',
      },
      {
        id: '2',
        timestamp: '12:30:20',
        speaker: 'Ashrith',
        text: '"Ingress pods OOMing"',
        tag: 'FACT',
        status: 'Confirmed Fact (HolmesGPT)',
      },
      {
        id: '3',
        timestamp: '12:30:25',
        speaker: 'Akthar vs. Ashrith',
        text: 'Ingress health contradicts DB lockup',
        tag: 'CONTRADICTION',
        status: 'Suppressed (miniMax voice holding)',
        reason:
          'Contradiction Confirmed. HolmesGPT shows healthy DB connection pools. Suppressing Akthar\'s hypothesis to prevent false path.',
      },
    ]);
  }, []);

  // 5. Diagnostics Tool Trigger
  const handleRunDiagnostics = useCallback(async () => {
    try {
      const res = await fetch('/api/remediate');
      const data = await res.json();
      setLedgerItems((prev) => [
        ...prev,
        {
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          speaker: 'HolmesGPT Diagnostics',
          text: `Cluster health check: ${data.diagnostics?.targetService ?? 'auth-svc'} -> ${data.status}`,
          tag: 'FACT',
          status: 'Diagnostics Verified',
        },
      ]);
    } catch {
      // Handled
    }
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171717] text-zinc-100 selection:bg-blue-600 selection:text-white font-sans">
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
          <VideoGrid
            participants={participants}
            localVideoStream={localVideoStream}
            isLocalMuted={isMuted}
            onRemediateSuccess={handleRemediateSuccess}
            isResolved={isResolved}
          />
        </section>

        {/* Right Side: Conversation Parsing Side Drawer */}
        {isSideDrawerOpen && (
          <ConversationParsingPanel items={ledgerItems} />
        )}
      </main>

      {/* Bottom Control Toolbar (GMeet Floating Control Dock) */}
      <footer className="flex h-16 w-full items-center justify-between border-t border-zinc-800/80 bg-[#202124] px-6 text-zinc-200">
        {/* Left Status & Demo Flow Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-3.5 py-1.5 border border-zinc-700/60 text-xs font-sans text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Ambient Sentinel Mode (16kHz PCM)</span>
          </div>

          {/* Interactive Incident Simulation Button */}
          <button
            onClick={isDemoRunning ? resetDemo : runIncidentDemo}
            className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 border border-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
            title="Run 90s Incident Scenario (record.md)"
          >
            {isDemoRunning ? (
              <>
                <RotateCcw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                <span>Reset Demo</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                <span>Simulate Incident</span>
              </>
            )}
          </button>
        </div>

        {/* Center Google Meet Circular Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute Toggle Circular Button */}
          <button
            onClick={toggleMicrophone}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              isMuted
                ? 'bg-rose-700 border-rose-600 text-white hover:bg-rose-600'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Camera Toggle Circular Button */}
          <button
            onClick={toggleCamera}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              isVideoOff
                ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                : 'bg-zinc-800 border-zinc-700 text-zinc-100 ring-2 ring-blue-500 hover:bg-zinc-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </button>

          {/* RTM Ledger Drawer Toggle */}
          <button
            onClick={() => setIsSideDrawerOpen(!isSideDrawerOpen)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              isSideDrawerOpen
                ? 'bg-zinc-700 border-zinc-600 text-zinc-100'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
            }`}
            title="Toggle RTM Ledger Drawer"
          >
            <FileText className="h-4 w-4" />
          </button>

          {/* Diagnostics Tool Circular Button */}
          <button
            onClick={handleRunDiagnostics}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors shadow-sm"
            title="Run HolmesGPT Diagnostics"
          >
            <Terminal className="h-4 w-4" />
          </button>

          {/* End Call Circular Button (GMeet Red Button) */}
          <button
            onClick={resetDemo}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-700 text-white hover:bg-rose-600 transition-colors shadow-sm"
            title="Reset / Leave War Room Call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>

        {/* Right Authorize Patch Action Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRemediateSuccess}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium shadow transition-all ${
              isResolved
                ? 'bg-emerald-700 text-zinc-100 cursor-default'
                : 'bg-rose-700 hover:bg-rose-600 active:scale-95 text-white'
            }`}
          >
            {isResolved ? (
              <>
                <ShieldCheck className="h-4 w-4 text-zinc-100" />
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
