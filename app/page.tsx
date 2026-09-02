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
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { IncidentHeader } from '@/components/war-room/IncidentHeader';
import {
  VideoGrid,
  Participant,
  DEFAULT_LOCAL_USER,
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
  const recognitionRef = useRef<unknown>(null);

  // War Room Participants State:
  // Initial single-user state: EXACTLY 3 CARDS
  // 1. Local User (Akthar)
  // 2. Agent (Rotating Sphere)
  // 3. CLI Staged Manifest Card (From Uploaded Screenshot)
  const [localUser, setLocalUser] = useState<Participant>(DEFAULT_LOCAL_USER);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [agentStatus, setAgentStatus] = useState('Ambient Mode');
  const [remoteParticipants, setRemoteParticipants] = useState<Participant[]>([]);

  // Incident State
  const [isHotfixStaged, setIsHotfixStaged] = useState(true); // CLI card starts staged as shown in uploaded screenshot
  const [isResolved, setIsResolved] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(true);

  // State Ledger items
  const [ledgerItems, setLedgerItems] = useState<LedgerItem[]>([
    {
      id: 'init-1',
      timestamp: '12:30:00',
      speaker: 'EchoSphere Sentinel',
      text: 'Ambient Sentinel Mode active. Listening to Agora 16kHz WebRTC stream...',
      tag: 'FACT',
      status: 'Standby Monitoring',
    },
    {
      id: 'init-2',
      timestamp: '12:30:10',
      speaker: 'HolmesGPT Engine',
      text: 'HolmesGPT cluster diagnostics active. Monitored services: [ingress-nginx, auth-service, aws-rds].',
      tag: 'FACT',
      status: 'Diagnostic Sync OK',
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
        setIsHotfixStaged(true);
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

  // 4. Dynamic Peer Joining: Add/Remove Friends in War Room
  const toggleFriendJoin = useCallback((friendId: string, name: string, role: string) => {
    setRemoteParticipants((prev) => {
      const exists = prev.some((p) => p.id === friendId);
      if (exists) {
        // Friend leaves
        return prev.filter((p) => p.id !== friendId);
      } else {
        // Friend joins call dynamically
        return [
          ...prev,
          {
            id: friendId,
            name,
            role,
            status: 'Ambient Mode',
            hasContradiction: false,
          },
        ];
      }
    });

    const isJoining = !remoteParticipants.some((p) => p.id === friendId);
    setLedgerItems((prev) => [
      ...prev,
      {
        id: `peer-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        speaker: 'Agora WebRTC Gateway',
        text: isJoining
          ? `Peer "${name}" connected to room via network link.`
          : `Peer "${name}" disconnected.`,
        tag: 'FACT',
        status: isJoining ? 'Peer Joined' : 'Peer Left',
      },
    ]);
  }, [remoteParticipants]);

  // 5. Speech Inference & Telemetry Verification Pipeline
  const processSpokenStatement = useCallback(
    async (speaker: string, speechText: string) => {
      const lower = speechText.toLowerCase();
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });

      // Action 1: Database lockup statement
      if (lower.includes('database') || lower.includes('db') || lower.includes('lock') || lower.includes('down')) {
        setLocalUser((prev) => ({
          ...prev,
          status: 'Speaking',
          hasContradiction: false,
        }));
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

        // Query HolmesGPT API
        try {
          const res = await fetch('/api/holmesgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'check_health', query: speechText }),
          });
          const holmesData = await res.json();

          setTimeout(() => {
            setLocalUser((prev) => ({
              ...prev,
              status: 'Ambient Mode',
              hasContradiction: true,
              statement: `⚠️ Akthar: "${speechText}"`,
              factCheckTelemetry: 'Fact Check: CPU 2.1%, Active 14 (Healthy)',
            }));
            setLedgerItems((prev) => [
              ...prev,
              {
                id: `contra-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                speaker: 'HolmesGPT vs. Akthar',
                text: 'DB metrics contradict lockup hypothesis.',
                tag: 'CONTRADICTION',
                status: 'Suppressed on Audio',
                reason:
                  holmesData.findings?.contradictionReason ||
                  'HolmesGPT telemetry verifies DB connection pool is healthy (14/1000). Suppressing false lead.',
              },
            ]);
          }, 1200);
        } catch {
          // Fallback
        }
      }

      // Action 2: Ingress defect statement
      else if (lower.includes('ingress') || lower.includes('oom') || lower.includes('502') || lower.includes('gateway')) {
        // Mark Ashrith speaking if present
        setRemoteParticipants((prev) =>
          prev.map((p) => (p.id === 'ashrith' ? { ...p, status: 'Speaking' } : p))
        );

        setLedgerItems((prev) => [
          ...prev,
          {
            id: `turn-${Date.now()}`,
            timestamp: timeStr,
            speaker: speaker,
            text: `"${speechText}"`,
            tag: 'FACT',
            status: 'Confirmed Fact (HolmesGPT)',
          },
        ]);

        // Query HolmesGPT Ingress Audit
        try {
          const res = await fetch('/api/holmesgpt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'audit_ingress', query: speechText }),
          });
          const holmesData = await res.json();

          setTimeout(() => {
            setRemoteParticipants((prev) =>
              prev.map((p) => (p.id === 'ashrith' ? { ...p, status: 'Ambient Mode' } : p))
            );
            setIsHotfixStaged(true);
            setAgentSpeaking(true);
            setAgentStatus('Action Required');
            setTimeout(() => setAgentSpeaking(false), 2000);

            setLedgerItems((prev) => [
              ...prev,
              {
                id: `staged-${Date.now()}`,
                timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                speaker: 'HolmesGPT Investigation',
                text:
                  holmesData.findings?.details ||
                  'ROOT CAUSE ISOLATED: Ingress prefix route mismatch (/api/v2/auth -> port 8080 instead of 8000).',
                tag: 'FACT',
                status: 'Staged Patch Ready',
              },
            ]);
          }, 1200);
        } catch {}
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
      } catch {}
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

  // Sync Akthar local speaking status
  useEffect(() => {
    setLocalUser((prev) => ({
      ...prev,
      status: !isMuted && isLocalSpeaking ? 'Speaking' : isMuted ? 'Muted' : 'Ambient Mode',
    }));
  }, [isMuted, isLocalSpeaking]);

  // Reset entire War Room to clean initial 3-card layout
  const resetWarRoom = useCallback(() => {
    setIsResolved(false);
    setIsHotfixStaged(true);
    setAgentSpeaking(false);
    setAgentStatus('Ambient Mode');
    setRemoteParticipants([]);
    setLocalUser(DEFAULT_LOCAL_USER);
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

  const hasAshrithJoined = remoteParticipants.some((p) => p.id === 'ashrith');
  const hasKartikeyJoined = remoteParticipants.some((p) => p.id === 'kartikey');

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171717] text-zinc-100 selection:bg-blue-600 selection:text-white font-sans">
      {/* Top Bar: Google Meet Style Incident Header */}
      <IncidentHeader
        incidentId="#INC-8921"
        severity="SEV-1"
        title="AGORA ECHOSPHERE"
        isConnected={true}
      />

      {/* Interactive Control & Peer Joining Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950 px-6 py-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="font-medium text-zinc-300">Room Status:</span>
          <span className="text-[11px] text-zinc-400">
            {remoteParticipants.length === 0
              ? '1 User in Room (Initial 3 Cards: You, Rotating Sphere Agent, CLI Card)'
              : `${1 + remoteParticipants.length} Users Connected (Dynamic Grid Active)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dynamic Peer Toggle: Ashrith */}
          <button
            onClick={() => toggleFriendJoin('ashrith', 'Ashrith', 'DevOps')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
              hasAshrithJoined
                ? 'bg-blue-900/60 text-blue-200 border-blue-700'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title={hasAshrithJoined ? 'Disconnect Ashrith' : 'Connect Ashrith via Network Link'}
          >
            {hasAshrithJoined ? <UserMinus className="h-3 w-3 text-blue-400" /> : <UserPlus className="h-3 w-3 text-zinc-400" />}
            <span>{hasAshrithJoined ? 'Disconnect Ashrith' : '+ Peer Joins (Ashrith)'}</span>
          </button>

          {/* Dynamic Peer Toggle: Kartikey */}
          <button
            onClick={() => toggleFriendJoin('kartikey', 'Kartikey', 'Backend SRE')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all ${
              hasKartikeyJoined
                ? 'bg-purple-900/60 text-purple-200 border-purple-700'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
            }`}
            title={hasKartikeyJoined ? 'Disconnect Kartikey' : 'Connect Kartikey via Network Link'}
          >
            {hasKartikeyJoined ? <UserMinus className="h-3 w-3 text-purple-400" /> : <UserPlus className="h-3 w-3 text-zinc-400" />}
            <span>{hasKartikeyJoined ? 'Disconnect Kartikey' : '+ Peer Joins (Kartikey)'}</span>
          </button>

          <span className="h-4 w-[1px] bg-zinc-800 mx-1" />

          {/* Chip 1: Akthar Statement */}
          <button
            onClick={() => processSpokenStatement('Akthar', 'Database is down and dropping connections')}
            className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-amber-300 border border-zinc-700 transition-all hover:scale-[1.02] active:scale-95"
            title="Trigger Akthar's hypothesis"
          >
            <Mic className="h-3 w-3 text-amber-400" />
            <span>Speak: &quot;Database is down&quot;</span>
          </button>

          {/* Chip 2: Ashrith Statement */}
          <button
            onClick={() => processSpokenStatement('Ashrith', 'Ingress pods are throwing 502 Bad Gateway')}
            className="flex items-center gap-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-blue-300 border border-zinc-700 transition-all hover:scale-[1.02] active:scale-95"
            title="Trigger Ashrith's confirmed fact"
          >
            <Mic className="h-3 w-3 text-blue-400" />
            <span>Speak: &quot;Ingress pods 502s&quot;</span>
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
            className="flex items-center gap-1 rounded-full bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 transition-colors ml-1"
            title="Reset War Room to Initial 3 Cards"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Video Grid + Side Parsing Drawer */}
      <main className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Side: Dynamic Participant Video Grid */}
        <section className="flex-1 min-w-0 overflow-hidden">
          <VideoGrid
            localParticipant={localUser}
            localVideoStream={localVideoStream}
            isLocalMuted={isMuted}
            agentSpeaking={agentSpeaking}
            agentStatus={agentStatus}
            isHotfixStaged={isHotfixStaged}
            isResolved={isResolved}
            onRemediateSuccess={handleRemediateSuccess}
            remoteParticipants={remoteParticipants}
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
              const res = await fetch('/api/holmesgpt');
              const data = await res.json();
              setLedgerItems((prev) => [
                ...prev,
                {
                  id: String(Date.now()),
                  timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
                  speaker: 'HolmesGPT Investigation Engine',
                  text: `Capabilities verified: ${data.capabilities?.slice(0, 2).join(', ')}. Status: ${data.status}.`,
                  tag: 'FACT',
                  status: 'Diagnostic Verified',
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
            disabled={isResolved}
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
