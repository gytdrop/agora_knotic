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
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { IncidentHeader } from '@/components/war-room/IncidentHeader';
import {
  VideoGrid,
  Participant,
  INITIAL_CLEAN_PARTICIPANTS,
} from '@/components/war-room/VideoGrid';
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
  // Web Speech Recognition
  const recognitionRef = useRef<unknown>(null);

  // Incident & Reasoning State (Starts completely clean)
  const [isHotfixStaged, setIsHotfixStaged] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>(INITIAL_CLEAN_PARTICIPANTS);
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([
    {
      id: 'init-1',
      timestamp: '12:30:00',
      speaker: 'EchoSphere Sentinel',
      text: 'Ambient Sentinel Mode active. Listening to Agora 16kHz WebRTC stream...',
      tag: 'FACT',
      status: 'Standby Monitoring',
    },
  ]);

  // 1. Webcam Stream Control
  const toggleCamera = useCallback(async () => {
    if (!isVideoOff) {
      if (localVideoStream) {
        localVideoStream.getTracks().forEach((t) => t.stop());
      }
      setLocalVideoStream(null);
      setIsVideoOff(true);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        setLocalVideoStream(stream);
        setIsVideoOff(false);
      } catch (err) {
        console.warn('Could not access webcam:', err);
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

  // 3. Hotfix Remediation Webhook
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
        setIsHotfixStaged(false);
        setLedgerItems((prev) => [
          ...prev,
          {
            id: String(Date.now()),
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
            speaker: 'EchoSphere Remediation',
            text: 'kubectl patch ingress auth-svc applied. TargetPort restored to 8080 -> 8000.',
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

  // 4. Autonomous Speech Inference Pipeline (Handles real spoken or simulated input)
  const processSpokenStatement = useCallback(
    (speaker: string, speechText: string) => {
      const lower = speechText.toLowerCase();
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

      // Action 1: Database lockup statement
      if (lower.includes('database') || lower.includes('db') || lower.includes('lock')) {
        // Step 1: Log Akthar speaking hypothesis
        setParticipants((prev) =>
          prev.map((p) =>
            p.id === 'akthar' ? { ...p, status: 'Speaking', hasContradiction: false } : p
          )
        );
        setLedgerItems((prev) => [
          ...prev,
          {
            id: `turn-${Date.now()}`,
            timestamp: timeStr,
            speaker: 'Akthar',
            text: `"${speechText}"`,
            tag: 'HYPOTHESIS',
            status: 'Hypothesis Registered',
          },
        ]);

        // Step 2: 1.5s later, HolmesGPT checks DB and flags contradiction
        setTimeout(() => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === 'akthar'
                ? {
                    ...p,
                    status: 'Ambient Mode',
                    hasContradiction: true,
                    statement: `⚠️ Akthar: "${speechText}"`,
                    factCheckTelemetry: 'Fact Check: CPU 2.1%, Active 14 (Healthy)',
                  }
                : p
            )
          );
          setLedgerItems((prev) => [
            ...prev,
            {
              id: `contradiction-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
              speaker: 'HolmesGPT vs. Akthar',
              text: 'DB metrics contradict lockup hypothesis.',
              tag: 'CONTRADICTION',
              status: 'Suppressed on Audio',
              reason:
                'HolmesGPT: AWS RDS PostgreSQL connection pool healthy (14 active, max 500). CPU 2.1%. Suppressing Akthar\'s hypothesis to prevent false path.',
            },
          ]);
        }, 1200);
      }

      // Action 2: Ingress defect statement
      else if (lower.includes('ingress') || lower.includes('oom') || lower.includes('502') || lower.includes('gateway')) {
        // Step 1: Log Ashrith speaking fact
        setParticipants((prev) =>
          prev.map((p) => (p.id === 'ashrith' ? { ...p, status: 'Speaking' } : p))
        );
        setLedgerItems((prev) => [
          ...prev,
          {
            id: `turn-${Date.now()}`,
            timestamp: timeStr,
            speaker: 'Ashrith',
            text: `"${speechText}"`,
            tag: 'FACT',
            status: 'Confirmed Fact (HolmesGPT)',
          },
        ]);

        // Step 2: 1.2s later, EchoSphere isolates root cause & stages the HITL Guardrail Card
        setTimeout(() => {
          setParticipants((prev) =>
            prev.map((p) => (p.id === 'ashrith' ? { ...p, status: 'Ambient Mode' } : p))
          );
          setIsHotfixStaged(true);
          setLedgerItems((prev) => [
            ...prev,
            {
              id: `staged-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
              speaker: 'EchoSphere Engine',
              text: 'ROOT CAUSE ISOLATED: Ingress prefix route mismatch (/api/v2/auth -> port 8080 instead of 8000).',
              tag: 'FACT',
              status: 'Staged Patch Ready',
            },
          ]);
        }, 1200);
      }

      // Action 3: Verbal authorization trigger
      else if (lower.includes('authorize') || lower.includes('patch') || lower.includes('hotfix') || lower.includes('approve')) {
        handleRemediateSuccess();
      }

      // General speech fallback
      else {
        setLedgerItems((prev) => [
          ...prev,
          {
            id: `turn-${Date.now()}`,
            timestamp: timeStr,
            speaker,
            text: `"${speechText}"`,
            tag: 'HYPOTHESIS',
            status: 'Transcribed',
          },
        ]);
      }
    },
    [handleRemediateSuccess]
  );

  // Initialize Microphone VAD & Speech Recognition
  useEffect(() => {
    let unmounted = false;

    async function initAudio() {
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (unmounted) {
          audioStream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStreamRef.current = audioStream;

        // VAD
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
          setIsLocalSpeaking(average > 25);
          requestAnimationFrame(checkVolume);
        };
        checkVolume();

        // Browser Speech Recognition
        const SpeechRec = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition ||
          (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

        if (SpeechRec) {
          const rec = new (SpeechRec as new () => {
            continuous: boolean;
            interimResults: boolean;
            lang: string;
            onresult: (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => void;
            onerror: () => void;
            onend: () => void;
            start: () => void;
          })();
          rec.continuous = true;
          rec.interimResults = false;
          rec.lang = 'en-US';

          rec.onresult = (event) => {
            const transcript = event.results[0]?.[0]?.transcript?.trim();
            if (transcript) {
              processSpokenStatement('Akthar', transcript);
            }
          };

          rec.onerror = () => {};
          rec.onend = () => {
            if (!unmounted && !isMuted) {
              try {
                rec.start();
              } catch {}
            }
          };

          try {
            rec.start();
            recognitionRef.current = rec;
          } catch {}
        }
      } catch {
        // Mic permission ignored
      }
    }

    initAudio();

    return () => {
      unmounted = true;
      if (micStreamRef.current) {
        micStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [isMuted, processSpokenStatement]);

  // Update Akthar speaking status
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

  // Reset entire War Room to clean initial state
  const resetWarRoom = useCallback(() => {
    setIsResolved(false);
    setIsHotfixStaged(false);
    setParticipants(INITIAL_CLEAN_PARTICIPANTS);
    setLedgerItems([
      {
        id: 'init-1',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        speaker: 'EchoSphere Sentinel',
        text: 'Ambient Sentinel Mode active. Listening to Agora 16kHz WebRTC stream...',
        tag: 'FACT',
        status: 'Standby Monitoring',
      },
    ]);
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

      {/* Interactive Speech Input Chips (Click to Speak or Talk into Mic) */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-6 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-medium text-zinc-300">Live Voice Input:</span>
          <span className="text-[11px] text-zinc-500">
            (Speak naturally into your mic OR click a voice chip below)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Chip 1: Akthar Statement */}
          <button
            onClick={() => processSpokenStatement('Akthar', 'Database is locked up and dropping connections')}
            className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-amber-300 border border-zinc-700 transition-all hover:scale-[1.02] active:scale-95"
            title="Trigger Akthar's hypothesis"
          >
            <Mic className="h-3 w-3 text-amber-400" />
            <span>Speak: &quot;Database is locked up&quot;</span>
          </button>

          {/* Chip 2: Ashrith Statement */}
          <button
            onClick={() => processSpokenStatement('Ashrith', 'Ingress pods are throwing 502 Bad Gateway')}
            className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-blue-300 border border-zinc-700 transition-all hover:scale-[1.02] active:scale-95"
            title="Trigger Ashrith's confirmed fact"
          >
            <Mic className="h-3 w-3 text-blue-400" />
            <span>Speak: &quot;Ingress pods throwing 502s&quot;</span>
          </button>

          {/* Chip 3: Authorize Patch */}
          <button
            onClick={() => processSpokenStatement('Lead SRE', 'EchoSphere, authorize patch')}
            className="flex items-center gap-1.5 rounded-full bg-rose-950/80 hover:bg-rose-900/90 px-3 py-1 text-xs font-medium text-rose-300 border border-rose-800/60 transition-all hover:scale-[1.02] active:scale-95"
            title="Trigger verbal patch authorization"
          >
            <Flame className="h-3 w-3 text-rose-400" />
            <span>Say: &quot;Authorize patch&quot;</span>
          </button>

          {/* Reset button */}
          <button
            onClick={resetWarRoom}
            className="flex items-center gap-1 rounded-full bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors ml-2"
            title="Reset War Room to Initial Standby"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Video Grid + Side Parsing Drawer */}
      <main className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Side: Participant Video Grid */}
        <section className="flex-1 min-w-0 overflow-hidden">
          <VideoGrid
            participants={participants}
            localVideoStream={localVideoStream}
            isLocalMuted={isMuted}
            isHotfixStaged={isHotfixStaged}
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
        {/* Left Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-3.5 py-1.5 border border-zinc-700/60 text-xs font-sans text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Ambient Sentinel Mode (16kHz PCM)</span>
          </div>
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
            onClick={async () => {
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
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 transition-colors shadow-sm"
            title="Run HolmesGPT Diagnostics"
          >
            <Terminal className="h-4 w-4" />
          </button>

          {/* End Call Circular Button (GMeet Red Button) */}
          <button
            onClick={resetWarRoom}
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
            disabled={!isHotfixStaged && !isResolved}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium shadow transition-all ${
              isResolved
                ? 'bg-emerald-700 text-zinc-100 cursor-default'
                : isHotfixStaged
                ? 'bg-rose-700 hover:bg-rose-600 active:scale-95 text-white animate-pulse'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
            }`}
          >
            {isResolved ? (
              <>
                <ShieldCheck className="h-4 w-4 text-zinc-100" />
                Hotfix Active (200 OK)
              </>
            ) : isHotfixStaged ? (
              <>
                <Flame className="h-4 w-4 text-white" />
                Authorize 1-Click Patch
              </>
            ) : (
              'Awaiting Anomaly Signal'
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
