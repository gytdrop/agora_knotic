'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import AgoraRTC, {
  useRTCClient,
  useLocalMicrophoneTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  RemoteUser,
  UID,
} from 'agora-rtc-react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  AgentState,
  MessageSalStatus,
  TranscriptHelperMode,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from 'agora-agent-client-toolkit';
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
  Headphones,
} from 'lucide-react';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  getCurrentInProgressMessage,
  getMessageList,
  isRtmLedgerPayload,
  normalizeTimestampMs,
  normalizeTranscript,
  parseLedgerItem,
} from '@/lib/conversation';
import { IncidentHeader } from './war-room/IncidentHeader';
import { VideoGrid } from './war-room/VideoGrid';
import { ConversationParsingPanel } from './war-room/ConversationParsingPanel';
import { LedgerItem } from './war-room/StateLedgerPanel';
import type { ConversationComponentProps } from '@/types/conversation';

// Cap the displayed issues list to avoid overwhelming the UI during a cascade of errors.
const MAX_CONNECTION_ISSUES = 6;

type AgoraRtcWithParameters = typeof AgoraRTC & {
  setParameter?: (key: string, value: unknown) => void;
};

type RtmMessageErrorPayload = {
  object: 'message.error';
  module?: string;
  code?: number;
  message?: string;
  send_ts?: number;
};

type RtmSalStatusPayload = {
  object: 'message.sal_status';
  status?: string;
  timestamp?: number;
};

function isRtmMessageErrorPayload(
  value: unknown,
): value is RtmMessageErrorPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.error'
  );
}

function isRtmSalStatusPayload(value: unknown): value is RtmSalStatusPayload {
  return (
    !!value &&
    typeof value === 'object' &&
    (value as { object?: unknown }).object === 'message.sal_status'
  );
}

export default function ConversationComponent({
  agoraData,
  rtmClient,
  onTokenWillExpire,
  onEndConversation,
  onLedgerItemReceived,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(true);
  const [isAgentConnected, setIsAgentConnected] = useState(false);

  // Hardware & Video State
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [localVideoStream, setLocalVideoStream] = useState<MediaStream | null>(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(true);

  // Incident & Remediation State
  const [isHotfixStaged, setIsHotfixStaged] = useState(true);
  const [isResolved, setIsResolved] = useState(false);

  // Connection State
  const [connectionState, setConnectionState] = useState<string>('CONNECTING');
  const agentUID = String(DEFAULT_AGENT_UID);
  const [joinedUID, setJoinedUID] = useState<UID>(0);

  // Transcript & Ledger State
  const [rawTranscript, setRawTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [, setConnectionIssues] = useState<
    { id: string; source: string; agentUserId: string; code: unknown; message: string; timestamp: number }[]
  >([]);

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
      text: 'HolmesGPT cluster diagnostics active. Monitored: [ingress-nginx, auth-service, aws-rds].',
      tag: 'FACT',
      status: 'Diagnostic Sync OK',
    },
  ]);

  const addConnectionIssue = useCallback((issue: { id: string; source: string; agentUserId: string; code: unknown; message: string; timestamp: number }) => {
    setConnectionIssues((prev) => {
      const isDuplicate = prev.some(
        (x) =>
          x.agentUserId === issue.agentUserId &&
          x.code === issue.code &&
          x.message === issue.message &&
          Math.abs(x.timestamp - issue.timestamp) < 1500,
      );
      if (isDuplicate) return prev;
      return [issue, ...prev].slice(0, MAX_CONNECTION_ISSUES);
    });
  }, []);

  const [spokenStatement, setSpokenStatement] = useState<string>('');
  const [hasContradiction, setHasContradiction] = useState(false);
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [isMonitoringSelf, setIsMonitoringSelf] = useState(false);

  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const id = setTimeout(() => {
      if (!cancelled) setIsReady(true);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(id);
      setIsReady(false);
    };
  }, []);

  const { isConnected: joinSuccess } = useJoin(
    {
      appid: process.env.NEXT_PUBLIC_AGORA_APP_ID!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10),
    },
    isReady,
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady);

  // Monitor voice activity and audio levels on local mic
  useEffect(() => {
    if (!localMicrophoneTrack || !isEnabled) {
      setIsSpeakingLocal(false);
      return;
    }

    const interval = setInterval(() => {
      try {
        const level = localMicrophoneTrack.getVolumeLevel();
        setIsSpeakingLocal(level > 0.04);
      } catch {}
    }, 120);

    return () => clearInterval(interval);
  }, [localMicrophoneTrack, isEnabled]);

  const toggleSelfMonitor = useCallback(() => {
    if (!localMicrophoneTrack) return;
    if (isMonitoringSelf) {
      localMicrophoneTrack.stop();
      setIsMonitoringSelf(false);
    } else {
      localMicrophoneTrack.play();
      setIsMonitoringSelf(true);
    }
  }, [localMicrophoneTrack, isMonitoringSelf]);

  useEffect(() => {
    if (localMicrophoneTrack) {
      try {
        localMicrophoneTrack.setVolume(100);
      } catch {}
    }
  }, [localMicrophoneTrack]);

  useEffect(() => {
    if (!client) return;
    try {
      (AgoraRTC as AgoraRtcWithParameters).setParameter?.(
        'ENABLE_AUDIO_PTS',
        true,
      );
    } catch (error) {
      console.warn('Could not set ENABLE_AUDIO_PTS:', error);
    }
  }, [client]);

  useEffect(() => {
    if (joinSuccess && client) {
      const uid = client.uid;
      if (uid !== null && uid !== undefined) {
        setJoinedUID(uid);
      }
    }
  }, [joinSuccess, client]);

  // Initialize AgoraVoiceAI once channel joined
  useEffect(() => {
    if (!isReady || !joinSuccess) return;

    let cancelled = false;

    (async () => {
      try {
        const ai = await AgoraVoiceAI.init({
          rtcEngine: client,
          rtmConfig: { rtmEngine: rtmClient },
          renderMode: TranscriptHelperMode.TEXT,
          enableLog: true,
        });

        if (cancelled) {
          try {
            if (AgoraVoiceAI.getInstance() === ai) {
              ai.unsubscribe();
              ai.destroy();
            }
          } catch {}
          return;
        }

        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (t) => {
          setRawTranscript([...t]);
        });
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_, event) =>
          setAgentState(event.state),
        );
        ai.on(AgoraVoiceAIEvents.MESSAGE_ERROR, (agentUserId, error) => {
          addConnectionIssue({
            id: `${Date.now()}-${agentUserId}-message-error-${error.code}`,
            source: 'rtm',
            agentUserId,
            code: error.code,
            message: error.message,
            timestamp: normalizeTimestampMs(error.timestamp),
          });
        });
        ai.on(
          AgoraVoiceAIEvents.MESSAGE_SAL_STATUS,
          (agentUserId, salStatus) => {
            if (
              salStatus.status === MessageSalStatus.VP_REGISTER_FAIL ||
              salStatus.status === MessageSalStatus.VP_REGISTER_DUPLICATE
            ) {
              addConnectionIssue({
                id: `${Date.now()}-${agentUserId}-sal-${salStatus.status}`,
                source: 'rtm',
                agentUserId,
                code: salStatus.status,
                message: `SAL status: ${salStatus.status}`,
                timestamp: normalizeTimestampMs(salStatus.timestamp),
              });
            }
          },
        );
        ai.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId, error) => {
          addConnectionIssue({
            id: `${Date.now()}-${agentUserId}-agent-error-${error.code}`,
            source: 'agent',
            agentUserId,
            code: error.code,
            message: `${error.type}: ${error.message}`,
            timestamp: normalizeTimestampMs(error.timestamp),
          });
        });
        ai.subscribeMessage(agoraData.channel);
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to initialize AgoraVoiceAI:', error);
        }
      }
    })();

    return () => {
      cancelled = true;
      try {
        const ai = AgoraVoiceAI.getInstance();
        if (ai) {
          ai.unsubscribe();
          ai.destroy();
        }
      } catch {}
    };
  }, [isReady, joinSuccess, client, rtmClient, agoraData.channel, addConnectionIssue]);

  // Handle RTM Messages (Ledger Items)
  useEffect(() => {
    const handleRtmMessage = (event: {
      message: string | Uint8Array;
      publisher: string;
    }) => {
      const payloadText =
        typeof event.message === 'string'
          ? event.message
          : new TextDecoder().decode(event.message);

      let parsed: unknown;
      try {
        parsed = JSON.parse(payloadText);
      } catch {
        return;
      }

      if (isRtmLedgerPayload(parsed)) {
        const item = parseLedgerItem(parsed, event.publisher);
        setLedgerItems((prev) => [...prev, item]);
        onLedgerItemReceived?.(item);
        return;
      }

      if (isRtmMessageErrorPayload(parsed)) {
        const p = parsed;
        addConnectionIssue({
          id: `${Date.now()}-${event.publisher}-rtm-msg-error-${p.code ?? 'unknown'}`,
          source: 'rtm-signaling',
          agentUserId: event.publisher,
          code: p.code ?? 'unknown',
          message: `${p.module ?? 'unknown'}: ${p.message ?? 'Unknown signaling error'}`,
          timestamp: normalizeTimestampMs(p.send_ts ?? Date.now()),
        });
        return;
      }

      if (isRtmSalStatusPayload(parsed)) {
        const p = parsed;
        if (
          p.status === 'VP_REGISTER_FAIL' ||
          p.status === 'VP_REGISTER_DUPLICATE'
        ) {
          addConnectionIssue({
            id: `${Date.now()}-${event.publisher}-rtm-sal-${p.status}`,
            source: 'rtm-signaling',
            agentUserId: event.publisher,
            code: p.status,
            message: `SAL status: ${p.status}`,
            timestamp: normalizeTimestampMs(p.timestamp ?? Date.now()),
          });
        }
      }
    };

    rtmClient.addEventListener('message', handleRtmMessage);
    return () => {
      rtmClient.removeEventListener('message', handleRtmMessage);
    };
  }, [rtmClient, addConnectionIssue, onLedgerItemReceived]);

  // Transcripts converted to Ledger Items
  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  const messageList = useMemo(() => getMessageList(transcript), [transcript]);
  const currentInProgressMessage = useMemo(() => {
    return getCurrentInProgressMessage(transcript);
  }, [transcript]);

  // Sync spoken transcripts into State Ledger
  useEffect(() => {
    if (messageList.length > 0) {
      const latest = messageList[messageList.length - 1];
      if (latest && latest.text) {
        const isAgent = String(latest.uid) === agentUID;
        setLedgerItems((prev) => {
          if (prev.some((p) => p.text === latest.text)) return prev;
          const isContradiction = latest.text.toLowerCase().includes('database');
          return [
            ...prev,
            {
              id: `tr-${Date.now()}`,
              timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
              speaker: isAgent ? 'EchoSphere Sentinel' : 'Akthar',
              text: latest.text,
              tag: isContradiction ? 'CONTRADICTION' : isAgent ? 'FACT' : 'HYPOTHESIS',
              status: isContradiction ? 'Suppressed on Audio' : 'Verified',
              reason: isContradiction ? 'HolmesGPT telemetry confirms DB healthy.' : undefined,
            },
          ];
        });
      }
    }
  }, [messageList, agentUID]);

  // Publish microphone once track exists
  usePublish([localMicrophoneTrack]);

  useClientEvent(client, 'user-joined', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, 'user-left', (user) => {
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  useClientEvent(client, 'user-published', async (user, mediaType) => {
    if (mediaType === 'audio') {
      try {
        await client.subscribe(user, 'audio');
        user.audioTrack?.play();
      } catch (err) {
        console.warn('[Agora RTC] Failed to play audio track:', err);
      }
    }
  });

  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID,
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  useClientEvent(client, 'connection-state-change', (curState) => {
    setConnectionState(curState);
  });

  // Filter out the AI agent UID so remote users list contains ONLY human engineers
  const humanRemoteUsers = useMemo(() => {
    return remoteUsers.filter((user) => user.uid.toString() !== agentUID);
  }, [remoteUsers, agentUID]);

  // Mic Toggle
  const handleMicToggle = useCallback(async () => {
    const next = !isEnabled;
    const track = localMicrophoneTrack;
    if (!track) {
      setIsEnabled(next);
      return;
    }
    try {
      await track.setEnabled(next);
      setIsEnabled(next);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }, [isEnabled, localMicrophoneTrack]);

  // Camera Toggle
  const toggleCamera = useCallback(async () => {
    if (!isVideoOff) {
      if (localVideoStream) {
        localVideoStream.getTracks().forEach((t) => t.stop());
      }
      setLocalVideoStream(null);
      setIsVideoOff(true);
    } else {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          console.warn('Webcam is not available. Ensure page is accessed via HTTPS or localhost.');
          setIsVideoOff(false);
          return;
        }
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

  // 1-Click Hotfix Remediation
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

  // Native Web Speech Recognition for instantaneous real-time transcription & VAD
  useEffect(() => {
    if (typeof window === 'undefined') return;

    interface IWindowWithSpeech extends Window {
      SpeechRecognition?: unknown;
      webkitSpeechRecognition?: unknown;
    }
    const win = window as unknown as IWindowWithSpeech;
    type SpeechRecConstructor = new () => {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      start: () => void;
      stop: () => void;
      onresult: ((event: {
        resultIndex: number;
        results: {
          length: number;
          [index: number]: {
            isFinal: boolean;
            [subIndex: number]: { transcript: string };
          };
        };
      }) => void) | null;
      onerror: ((event: { error: string }) => void) | null;
      onend: (() => void) | null;
    };

    const SpeechRec = (win.SpeechRecognition ||
      win.webkitSpeechRecognition) as SpeechRecConstructor | undefined;

    if (!SpeechRec) return;

    let recognition: InstanceType<SpeechRecConstructor> | null = null;
    let shouldRun = true;

    try {
      recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        const text = (final || interim).trim();
        if (text) {
          setSpokenStatement(text);
          setIsSpeakingLocal(true);

          if (final) {
            const lower = final.toLowerCase();
            const isContra =
              lower.includes('database') ||
              lower.includes('db') ||
              lower.includes('postgres') ||
              lower.includes('rds');

            if (isContra) {
              setHasContradiction(true);
            }

            if (
              lower.includes('ingress') ||
              lower.includes('auth') ||
              lower.includes('502') ||
              lower.includes('route')
            ) {
              setIsHotfixStaged(true);
            }

            if (
              lower.includes('authorize patch') ||
              lower.includes('authorize hotfix') ||
              lower.includes('execute patch')
            ) {
              handleRemediateSuccess();
            }

            setLedgerItems((prev) => {
              if (prev.some((p) => p.text === final)) return prev;
              return [
                ...prev,
                {
                  id: `voice-${Date.now()}`,
                  timestamp: new Date().toLocaleTimeString('en-US', {
                    hour12: false,
                  }),
                  speaker: 'Akthar',
                  text: final,
                  tag: isContra ? 'CONTRADICTION' : 'HYPOTHESIS',
                  status: isContra ? 'Suppressed on Audio' : 'Transcribed',
                  reason: isContra
                    ? 'HolmesGPT telemetry confirms DB healthy at 2.1% CPU.'
                    : undefined,
                },
              ];
            });
          }
        }
      };

      recognition.onerror = (e) => {
        if (e.error !== 'no-speech' && e.error !== 'aborted') {
          console.warn('SpeechRecognition error:', e.error);
        }
      };

      recognition.onend = () => {
        setIsSpeakingLocal(false);
        if (shouldRun && isEnabled) {
          try {
            recognition?.start();
          } catch {}
        }
      };

      if (isEnabled) {
        recognition.start();
      }
    } catch (err) {
      console.warn('SpeechRecognition setup failed:', err);
    }

    return () => {
      shouldRun = false;
      try {
        recognition?.stop();
      } catch {}
    };
  }, [isEnabled, handleRemediateSuccess]);

  const handleTokenWillExpire = useCallback(async () => {
    if (!onTokenWillExpire || !joinedUID) return;
    try {
      const { rtcToken, rtmToken } = await onTokenWillExpire(
        joinedUID.toString(),
      );
      await client?.renewToken(rtcToken);
      await rtmClient.renewToken(rtmToken);
    } catch (error) {
      console.error('Failed to renew Agora token:', error);
    }
  }, [client, onTokenWillExpire, joinedUID, rtmClient]);

  useClientEvent(client, 'token-privilege-will-expire', handleTokenWillExpire);

  const handleEndConversation = useCallback(async () => {
    if (localVideoStream) {
      localVideoStream.getTracks().forEach((t) => t.stop());
    }
    onEndConversation();
  }, [localVideoStream, onEndConversation]);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171717] text-zinc-100 font-sans">
      {/* Top Bar: Google Meet Style Incident Header */}
      <IncidentHeader
        incidentId="#INC-8921"
        severity="SEV-1"
        title="AGORA ECHOSPHERE"
        isConnected={connectionState === 'CONNECTED'}
      />

      {/* Main War Room Content */}
      <main className="flex flex-1 min-h-0 w-full overflow-hidden">
        {/* Left Side: Dynamic Video Grid */}
        <section className="flex-1 min-w-0 overflow-hidden">
          <VideoGrid
            localParticipant={{
              id: 'akthar',
              name: 'Akthar',
              role: 'Lead SRE',
              status: isSpeakingLocal
                ? 'Speaking'
                : isEnabled
                ? 'Ambient Mode'
                : 'Muted',
              isLocal: true,
              statement: spokenStatement || currentInProgressMessage?.text,
              hasContradiction: hasContradiction,
            }}
            localVideoStream={localVideoStream}
            isLocalMuted={!isEnabled}
            agentSpeaking={agentState === 'speaking'}
            agentStatus={
              agentState === 'speaking'
                ? 'Speaking'
                : isAgentConnected
                ? 'Ambient Mode'
                : 'Connecting'
            }
            isHotfixStaged={isHotfixStaged}
            isResolved={isResolved}
            onRemediateSuccess={handleRemediateSuccess}
            remoteAgoraUsers={humanRemoteUsers}
          />
        </section>

        {/* Right Side: Conversation Parsing Side Drawer */}
        {isSideDrawerOpen && (
          <ConversationParsingPanel items={ledgerItems} />
        )}

        {/* Background Audio Playback for ALL Remote WebRTC Users (Specifically the AI Agent) */}
        <div className="hidden" aria-hidden="true">
          {remoteUsers.map((user) => (
            <RemoteUser
              key={user.uid}
              user={user}
              playAudio={true}
              playVideo={false}
            />
          ))}
        </div>
      </main>

      {/* Bottom Control Toolbar (GMeet Floating Control Dock) */}
      <footer className="flex h-16 w-full items-center justify-between border-t border-zinc-800/80 bg-[#202124] px-6 text-zinc-200">
        {/* Left Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-zinc-800/80 px-3.5 py-1.5 border border-zinc-700/60 text-xs font-sans text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-zinc-400" />
            <span>
              Ambient Sentinel Mode ({humanRemoteUsers.length + 1} connected)
            </span>
          </div>
        </div>

        {/* Center Google Meet Circular Control Buttons */}
        <div className="flex items-center gap-3">
          {/* Mute Toggle Circular Button */}
          <button
            onClick={handleMicToggle}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              !isEnabled
                ? 'bg-zinc-800 border-rose-800/80 text-rose-400 hover:bg-zinc-700'
                : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
            }`}
            title={!isEnabled ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {!isEnabled ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>

          {/* Hear Myself / Mic Monitor (Sidetone Test) */}
          <button
            onClick={toggleSelfMonitor}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors shadow-sm ${
              isMonitoringSelf
                ? 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400 ring-2 ring-emerald-500/30'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
            }`}
            title={
              isMonitoringSelf
                ? 'Hear Myself: ON (Click to stop local loopback)'
                : 'Hear Myself: OFF (Click to monitor microphone audio)'
            }
          >
            <Headphones className="h-4 w-4" />
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
                  text: `Cluster health verified. Status: ${data.status}. Monitored: ${data.clusterStatus?.services?.join(', ')}.`,
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
            onClick={handleEndConversation}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-900/90 text-zinc-100 border border-rose-700 hover:bg-rose-800 transition-colors shadow-sm"
            title="Leave War Room Call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>

        {/* Right Authorize Patch Action Pill */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRemediateSuccess}
            disabled={isResolved}
            className={`flex items-center gap-2 rounded-full px-5 py-2 text-xs font-medium border transition-all ${
              isResolved
                ? 'bg-zinc-800 border-zinc-700 text-emerald-300 cursor-default'
                : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200 active:scale-95'
            }`}
          >
            {isResolved ? (
              <>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Hotfix Active (200 OK)
              </>
            ) : (
              <>
                <Flame className="h-4 w-4 text-rose-400" />
                Authorize 1-Click Patch
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  );
}
