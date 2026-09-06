'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AgoraRTC, {
  useRTCClient,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  useRemoteUsers,
  useClientEvent,
  useJoin,
  usePublish,
  type IAgoraRTCRemoteUser,
  UID,
} from 'agora-rtc-react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  AgentState,
  MessageSalStatus,
  TranscriptHelperMode,
  TurnStatus,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from 'agora-agent-client-toolkit';
import { DEFAULT_AGENT_UID } from '@/lib/agora';
import {
  getCurrentInProgressMessage,
  getMessageList,
  isRtmLedgerPayload,
  normalizeTimestampMs,
  normalizeTranscript,
  parseLedgerItem,
} from '@/lib/conversation';
import { analyzeStatement } from '@/lib/incident-analyzer';
import { IncidentHeader } from './war-room/IncidentHeader';
import { VideoGrid } from './war-room/VideoGrid';
import { WarRoomSidebar } from './war-room/WarRoomSidebar';
import { FloatingControlDock } from './war-room/FloatingControlDock';
import type { WarRoomToolTab } from '@/types/war-room';
import type { ConversationComponentProps, LedgerItem, LedgerTag, SpeakerRole } from '@/types/conversation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { applyLedgerMutation, type LedgerItemInput } from '@/lib/ledger';
import { getApiUrl, getAgoraAppId } from '@/lib/api-config';
import { demoIncidentStore, PAYMENT_INCIDENT_BEATS } from '@/lib/demo/payment-incident-scenario';

// Cap the displayed issues list to avoid overwhelming the UI during a cascade of errors.
const MAX_CONNECTION_ISSUES = 6;

type AgoraRtcWithParameters = typeof AgoraRTC & {
  setParameter?: (key: string, value: unknown) => void;
};

function resolveSpeaker(
  uid: number | string,
  agentUID: string,
  localUID: UID | null | undefined,
  remoteUsers: IAgoraRTCRemoteUser[],
  localUserName: string = 'Responder',
): string {
  const uidStr = String(uid);
  if (uidStr === agentUID) return 'EchoSphere Sentinel';
  if (
    uidStr === '0' ||
    (localUID !== null && localUID !== undefined && uidStr === String(localUID))
  ) {
    return localUserName;
  }
  const remote = remoteUsers.find((u) => String(u.uid) === uidStr);
  if (remote) return `Peer-${uidStr.slice(-4)}`;
  return localUserName;
}

export default function ConversationComponent({
  agoraData,
  rtmClient,
  onTokenWillExpire,
  onEndConversation,
  onLedgerItemReceived,
  initialVideoEnabled = true,
  initialMicEnabled = true,
  incidentId: propIncidentId,
  incidentTitle: propIncidentTitle,
  incidentSeverity: propIncidentSeverity,
}: ConversationComponentProps) {
  const client = useRTCClient();
  const remoteUsers = useRemoteUsers();
  const [isEnabled, setIsEnabled] = useState(initialMicEnabled);
  const [isAgentConnected, setIsAgentConnected] = useState(false);
  const [localUserName, setLocalUserName] = useState<string>('Responder');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('echosphere_user_name');
      if (stored && stored.trim()) {
        setLocalUserName(stored.trim());
      }
    }
  }, []);

  // Hardware & Video State
  const [isVideoOff, setIsVideoOff] = useState(!initialVideoEnabled);
  const [localVideoStream, _setLocalVideoStream] = useState<MediaStream | null>(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<WarRoomToolTab>('actions');

  // Dynamic Incident State (Derived from props, URL, or sessionStorage)
  const initialIncId = propIncidentId
    ? (propIncidentId.startsWith('#') ? propIncidentId : `#${propIncidentId}`)
    : '#INC-8921';
  const [incidentId, setIncidentId] = useState<string>(initialIncId);
  const [incidentTitle, setIncidentTitle] = useState<string>(
    propIncidentTitle || 'Payment service latency and failures',
  );
  const [incidentSeverity, setIncidentSeverity] = useState<string>(
    propIncidentSeverity || 'SEV-1',
  );

  useEffect(() => {
    if (propIncidentId) {
      setIncidentId(propIncidentId.startsWith('#') ? propIncidentId : `#${propIncidentId}`);
    }
    if (propIncidentTitle) setIncidentTitle(propIncidentTitle);
    if (propIncidentSeverity) setIncidentSeverity(propIncidentSeverity);

    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const qId =
        urlParams.get('incident') ||
        urlParams.get('incidentId') ||
        urlParams.get('id') ||
        sessionStorage.getItem('echosphere_incident_id');
      if (qId && !propIncidentId) {
        setIncidentId(qId.startsWith('#') ? qId : `#${qId}`);
      }

      const qTitle =
        urlParams.get('title') ||
        urlParams.get('incidentName') ||
        sessionStorage.getItem('echosphere_incident_title') ||
        sessionStorage.getItem('echosphere_incident_name');
      if (qTitle && !propIncidentTitle) setIncidentTitle(qTitle);

      const qSev =
        urlParams.get('severity') ||
        urlParams.get('sev') ||
        sessionStorage.getItem('echosphere_incident_severity');
      if (qSev && !propIncidentSeverity) setIncidentSeverity(qSev);
    }
  }, [propIncidentId, propIncidentTitle, propIncidentSeverity]);

  // Incident & Remediation State
  const [isHotfixStaged, setIsHotfixStaged] = useState(false);
  const [hasContradiction, setHasContradiction] = useState(false);
  const [isResolved, setIsResolved] = useState(false);
  const processedTurnsMapRef = useRef<Map<number, string>>(new Map());

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
      timestampMs: Date.now() - 20000,
      speaker: 'EchoSphere Sentinel',
      speakerRole: 'agent',
      text: 'Ambient Sentinel Mode active. Listening to Agora 16kHz WebRTC stream...',
      tag: 'FACT',
      status: 'Standby Monitoring',
    },
    {
      id: 'init-2',
      timestampMs: Date.now() - 10000,
      speaker: 'HolmesGPT Engine',
      speakerRole: 'agent',
      text: 'HolmesGPT cluster diagnostics active. Monitored: [ingress-nginx, auth-service, aws-rds].',
      tag: 'FACT',
      status: 'Diagnostic Sync OK',
    },
  ]);

  // Convex-backed live incident data & ledger events
  const activeIncidentId = incidentId || '#INC-8921';
  const convexEvents = useQuery(api.incidents.listLedgerEvents, {
    incidentId: activeIncidentId,
  });
  const convexIncident = useQuery(api.incidents.getIncident, {
    incidentId: activeIncidentId,
  });
  const appendConvexLedger = useMutation(api.incidents.appendLedgerEvent);

  // Sync incoming Convex events to live ledger state
  useEffect(() => {
    if (!convexEvents || convexEvents.length === 0) return;
    setLedgerItems((prev) => {
      const existingIds = new Set(prev.map((i) => i.id));
      const newItems: LedgerItem[] = [];
      for (const ev of convexEvents) {
        if (!existingIds.has(ev._id)) {
          newItems.push({
            id: ev._id,
            timestampMs: ev.createdAt,
            speaker: ev.speaker,
            speakerRole: (ev.speaker.includes('Engine') || ev.speaker.includes('Sentinel')
              ? 'agent'
              : 'peer') as SpeakerRole,
            text: ev.text,
            tag: ev.tag,
            status: 'Synced from Convex',
          });
        }
      }
      if (newItems.length === 0) return prev;
      return [...prev, ...newItems];
    });
  }, [convexEvents]);

  // Sync Convex incident status
  useEffect(() => {
    if (convexIncident?.status === 'RESOLVED') {
      setIsResolved(true);
    }
  }, [convexIncident]);

  // Centralized Ledger Mutation Function
  // All additions and modifications to ledgerItems MUST pass through this function.
  const commitLedgerMutation = useCallback(
    (input: LedgerItemInput | LedgerItem) => {
      let committed: LedgerItem | null = null;
      setLedgerItems((prev) => {
        const { nextItems, committedItem } = applyLedgerMutation(prev, input);
        committed = committedItem;
        return nextItems;
      });
      const itemToSync = committed as LedgerItem | null;
      if (itemToSync) {
        onLedgerItemReceived?.(itemToSync);
        // Authoritative event store sync
        fetch(getApiUrl('/api/incident/events'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            incidentId: activeIncidentId,
            eventType:
              itemToSync.tag === 'ACTION'
                ? 'HOTFIX_STAGED'
                : itemToSync.tag === 'CONTRADICTION'
                ? 'CONTRADICTION_FLAGGED'
                : 'TURN_FINALIZED',
            item: itemToSync,
          }),
        }).catch(() => {});

        // Sync to Convex
        appendConvexLedger({
          incidentId: activeIncidentId,
          timestamp: new Date(itemToSync.timestampMs || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
          speaker: itemToSync.speaker || 'System',
          tag: (itemToSync.tag as 'FACT' | 'HYPOTHESIS' | 'CONTRADICTION' | 'ACTION') || 'FACT',
          text: itemToSync.text,
        }).catch((err) => console.warn('[Convex] append error:', err));

        // Capture high-signal alerts while muted so they can be replayed on unmute.
        // Uses the ref (not state) to avoid stale-closure issues in this stable callback.
        if (
          speechMutedRef.current &&
          (itemToSync.tag === 'CONTRADICTION' || itemToSync.tag === 'ACTION')
        ) {
          const prefix = itemToSync.tag === 'CONTRADICTION' ? '[CONTRADICTION]' : '[ACTION]';
          const summary = itemToSync.reason
            ? `${prefix} ${itemToSync.reason}`
            : `${prefix} ${itemToSync.text.slice(0, 120)}`;
          mutedAlertQueueRef.current.push(summary);
        }
      }
      return itemToSync;
    },
    [onLedgerItemReceived, appendConvexLedger, activeIncidentId],
  );

  // Demo Beat State & Deterministic Failsafe Synchronization
  const [currentDemoBeat, setCurrentDemoBeat] = useState<number>(
    () => demoIncidentStore.getState().currentBeat,
  );

  useEffect(() => {
    const unsubscribe = demoIncidentStore.subscribe((state) => {
      setCurrentDemoBeat(state.currentBeat);
    });
    return unsubscribe;
  }, []);

  const commitBeatCard = useCallback(
    (beatNumber: number) => {
      const beat = PAYMENT_INCIDENT_BEATS.find((b) => b.beatNumber === beatNumber);
      if (!beat) return;

      const rawTag = beat.card.tag.replace(/[\[\]]/g, '') as LedgerTag;
      if (rawTag === 'CONTRADICTION') {
        setHasContradiction(true);
      }
      if (rawTag === 'ACTION') {
        setIsHotfixStaged(true);
      }

      commitLedgerMutation({
        id: `turn-beat-${beat.beatNumber}`,
        turnId: beat.beatNumber,
        speakerUid: beat.role === 'Incident Commander' ? '0' : '999',
        speaker: beat.speaker,
        speakerRole: beat.role === 'Incident Commander' ? 'user' : 'peer',
        text: beat.spokenCue,
        tag: rawTag,
        status:
          rawTag === 'CONTRADICTION'
            ? 'DISPROVEN'
            : rawTag === 'HYPOTHESIS'
            ? 'ACTIVE'
            : 'CONFIRMED',
        reason: beat.card.details,
        telemetryEvidence: beat.card.metrics
          ? {
              source: 'HolmesGPT Telemetry',
              component: beat.card.title,
              metrics: beat.card.metrics,
              details: beat.card.details,
            }
          : undefined,
        timestampMs: Date.now(),
      });
    },
    [commitLedgerMutation],
  );

  // Global Hotkey (Ctrl + Alt + N or Cmd + Option + N) to advance beat deterministically
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        const nextBeat = demoIncidentStore.advanceBeat();
        console.log(`[EchoSphere:HotKey] Advancing demo beat to #${nextBeat}`);
        commitBeatCard(nextBeat);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commitBeatCard]);

  // Demo safety net: Inject a diagnostic turn into the live ledger & Convex pipeline
  const injectDemoTurn = useCallback(
    (customText?: string) => {
      if (!customText) {
        const nextBeat = demoIncidentStore.advanceBeat();
        commitBeatCard(nextBeat);
        return;
      }

      const chosen = { speaker: localUserName, speakerRole: 'user' as SpeakerRole, text: customText };
      const analyzed = analyzeStatement(chosen.speaker, chosen.text, chosen.speakerRole);
      const turnId = Date.now();

      if (analyzed.isContradiction) {
        setHasContradiction(true);
      }
      if (analyzed.isHotfixStaged) {
        setIsHotfixStaged(true);
      }

      commitLedgerMutation({
        id: `turn-demo-${turnId}`,
        turnId,
        speaker: chosen.speaker,
        speakerRole: chosen.speakerRole,
        text: chosen.text,
        tag: analyzed.tag,
        status: analyzed.status,
        reason: analyzed.reason,
        telemetryEvidence: analyzed.telemetryEvidence,
        hypothesisLifecycle: analyzed.hypothesisLifecycle,
        timestampMs: Date.now(),
      });
    },
    [localUserName, commitLedgerMutation, commitBeatCard],
  );

  // Hydrate ledger from authoritative event store on mount / reconnect
  useEffect(() => {
    let isCancelled = false;
    fetch(getApiUrl(`/api/incident/events?incidentId=${encodeURIComponent(activeIncidentId)}`))
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data?.ledgerItems && Array.isArray(data.ledgerItems) && data.ledgerItems.length > 0) {
          setLedgerItems(data.ledgerItems);
          if (data.isResolved) setIsResolved(true);
        }
      })
      .catch(() => {});
    return () => {
      isCancelled = true;
    };
  }, [activeIncidentId]);

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
  const [agentStatement, setAgentStatement] = useState<string>('');
  const [isSpeakingLocal, setIsSpeakingLocal] = useState(false);
  const [isMonitoringSelf, setIsMonitoringSelf] = useState(false);

  // Agent Speech Mute — silences TTS playback while keeping all analysis pipelines running (Default: 100% Muted, Console Parsing Only).
  const [speechMuted, setSpeechMuted] = useState(true);
  // Ref mirrors state so commitLedgerMutation (a stable useCallback) always reads the latest value.
  const speechMutedRef = useRef(true);
  // Accumulates [TAG] alert strings generated while muted; drained to TTS on unmute.
  const mutedAlertQueueRef = useRef<string[]>([]);

  // Keep speechMutedRef in sync with state so stable callbacks read current value without stale closures.
  useEffect(() => {
    speechMutedRef.current = speechMuted;
  }, [speechMuted]);

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
      appid: (getAgoraAppId() || process.env.AGORA_APP_ID || process.env.NEXT_PUBLIC_AGORA_APP_ID)!,
      channel: agoraData.channel,
      token: agoraData.token,
      uid: parseInt(agoraData.uid, 10),
    },
    isReady,
  );

  const { localMicrophoneTrack } = useLocalMicrophoneTrack(isReady, {
    ANS: true,
    AEC: true,
    AGC: true,
  });

  const { localCameraTrack, error: cameraError } = useLocalCameraTrack(isReady, {
    encoderConfig: '720p_1',
  });

  useEffect(() => {
    if (cameraError) {
      console.warn('[Agora RTC] Camera track error:', cameraError);
    }
  }, [cameraError]);

  // Keep camera track enabled/muted state synchronized with isVideoOff
  useEffect(() => {
    if (localCameraTrack) {
      localCameraTrack.setEnabled(!isVideoOff).catch((err) => {
        console.warn('Failed to sync camera enabled state:', err);
      });
    }
  }, [localCameraTrack, isVideoOff]);

  // Keep mic track enabled/muted state synchronized with isEnabled
  useEffect(() => {
    if (localMicrophoneTrack) {
      localMicrophoneTrack.setEnabled(isEnabled).catch((err) => {
        console.warn('Failed to sync mic enabled state:', err);
      });
    }
  }, [localMicrophoneTrack, isEnabled]);

  // Monitor voice activity and audio levels on local mic
  useEffect(() => {
    if (!localMicrophoneTrack || !isEnabled) {
      setIsSpeakingLocal(false);
      return;
    }

    let prevSpeaking = false;
    const interval = setInterval(() => {
      try {
        const level = localMicrophoneTrack.getVolumeLevel();
        const isSpeaking = level > 0.04;
        if (isSpeaking !== prevSpeaking) {
          console.log(
            `[VoicePipeline:VAD] Local speech activity: ${
              isSpeaking ? 'SPEECH_START' : 'SPEECH_END'
            } (volume=${level.toFixed(3)})`,
          );
          prevSpeaking = isSpeaking;
        }
        setIsSpeakingLocal(isSpeaking);
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
      try {
        const p: unknown = localMicrophoneTrack.play();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch((err: unknown) => {
            if ((err as Error)?.name !== 'AbortError') {
              console.warn('[Mic Monitor] play error:', err);
            }
          });
        }
      } catch (err) {
        if ((err as Error)?.name !== 'AbortError') {
          console.warn('[Mic Monitor] play error:', err);
        }
      }
      setIsMonitoringSelf(true);
    }
  }, [localMicrophoneTrack, isMonitoringSelf]);

  useEffect(() => {
    if (localMicrophoneTrack) {
      try {
        localMicrophoneTrack.setVolume(100);
        console.log('[VoicePipeline:AudioTrack] Local mic track ready:', {
          trackId: localMicrophoneTrack.getTrackId(),
          enabled: isEnabled,
          muted: localMicrophoneTrack.muted,
        });
      } catch {}
    }
  }, [localMicrophoneTrack, isEnabled]);

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
          t.forEach((item) => {
            const meta = item.metadata as Partial<UserTranscription | AgentTranscription> | null;
            const isFinal =
              meta && meta.object === 'user.transcription'
                ? (meta as UserTranscription).final
                : item.status === TurnStatus.END;
            const words = (meta as UserTranscription)?.words;
            const confidence =
              words && words.length > 0
                ? words.filter((w) => w.stable).length / words.length
                : undefined;

            console.log('[VoicePipeline:Transcript]', {
              text: item.text,
              isFinal,
              confidence,
              timestamp: item._time,
              speakerUid: item.uid,
              turnId: item.turn_id,
              status: item.status,
            });
          });
          setRawTranscript([...t]);
        });
        ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (agentUserId, event) => {
          console.log('[VoicePipeline:VAD] Agent state changed:', {
            agentUserId,
            state: event.state,
            turnId: event.turnID,
            reason: event.reason,
            timestamp: event.timestamp,
          });
          setAgentState(event.state);
        });
        ai.on(AgoraVoiceAIEvents.AGENT_INTERRUPTED, (agentUserId, event) => {
          console.log('[VoicePipeline:VAD] Agent interrupted:', {
            agentUserId,
            turnId: event.turnID,
            timestamp: event.timestamp,
          });
        });
        ai.on(AgoraVoiceAIEvents.AGENT_METRICS, (agentUserId, metrics) => {
          console.log('[VoicePipeline:Metrics]', {
            agentUserId,
            module: metrics.type,
            metric: metrics.name,
            latencyMs: metrics.value,
          });
        });
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

  // Handle RTM Messages (Custom Ledger Items)
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
        commitLedgerMutation(item);
        return;
      }
    };

    rtmClient.addEventListener('message', handleRtmMessage);
    return () => {
      rtmClient.removeEventListener('message', handleRtmMessage);
    };
  }, [rtmClient, commitLedgerMutation]);

  // 1-Click Hotfix Remediation
  const handleRemediateSuccess = useCallback(async () => {
    try {
      const res = await fetch(getApiUrl('/api/remediate'), {
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

      if (!res.ok) {
        throw new Error('Remediation webhook returned non-200 status');
      }

      setIsResolved(true);
      setIsHotfixStaged(true);
      commitLedgerMutation({
        speaker: 'EchoSphere Remediation',
        text: 'kubectl patch ingress auth-svc applied. TargetPort restored to 8080 -> 8000.',
        tag: 'ACTION',
        status: '200 OK Patch Active',
        timestampMs: Date.now(),
      });
    } catch (err) {
      console.error('Failed to trigger remediation:', err);
      setIsResolved(true);
      throw err;
    }
  }, [commitLedgerMutation]);

  // Transcripts converted to Ledger Items
  const transcript = useMemo(() => {
    return normalizeTranscript(rawTranscript, String(client.uid));
  }, [rawTranscript, client.uid]);

  const messageList = useMemo(() => getMessageList(transcript), [transcript]);
  const currentInProgressMessage = useMemo(() => {
    return getCurrentInProgressMessage(transcript);
  }, [transcript]);

  // Clean subtitle for local participant (current in-progress speech or last completed sentence)
  const localSubtitle = useMemo(() => {
    const isLocalInProgress =
      currentInProgressMessage &&
      (String(currentInProgressMessage.uid) === String(client.uid) ||
        currentInProgressMessage.uid === 0);

    if (isLocalInProgress && currentInProgressMessage?.text) {
      return currentInProgressMessage.text;
    }

    const localHistory = messageList.filter(
      (m) =>
        (String(m.uid) === String(client.uid) || m.uid === 0) &&
        Boolean(m.text),
    );

    if (localHistory.length > 0) {
      return localHistory[localHistory.length - 1].text;
    }

    return spokenStatement || undefined;
  }, [currentInProgressMessage, client.uid, messageList, spokenStatement]);

  // Console Parsing Banner on War Room mount
  useEffect(() => {
    console.log(
      '%c[EchoSphere] 🚀 WAR ROOM ONLINE | MODE: 100% MUTE (CONSOLE PARSING ONLY)',
      'color: #10b981; font-weight: bold; background: #09090b; padding: 4px 8px; border: 1px solid #27272a; border-radius: 4px;',
    );
    console.log(
      '%c[EchoSphere] ℹ️ Real-time WebRTC audio playback for EchoSphere Sentinel is suppressed. All incoming transcripts, telemetry validations, contradiction detections, and AI responses stream exclusively to this console and the state ledger.',
      'color: #a1a1aa;',
    );
  }, []);

  // Real-time Console Parsing of In-Progress Speech Streams
  const lastLoggedStreamRef = useRef<string>('');
  useEffect(() => {
    if (
      currentInProgressMessage?.text &&
      currentInProgressMessage.text !== lastLoggedStreamRef.current
    ) {
      lastLoggedStreamRef.current = currentInProgressMessage.text;
      const isAgent = String(currentInProgressMessage.uid) === agentUID;
      const speaker = isAgent ? 'EchoSphere Sentinel (AI)' : localUserName;
      console.log(
        `%c[EchoSphere:ConsoleParser:Streaming] 💭 ${speaker}: "${currentInProgressMessage.text}"`,
        isAgent ? 'color: #c084fc; font-weight: 500;' : 'color: #94a3b8;',
      );
    }
  }, [currentInProgressMessage?.text, currentInProgressMessage?.uid, agentUID, localUserName]);

  // Clean subtitle for AI Agent (current in-progress speech or last completed sentence)
  const agentSubtitle = useMemo(() => {
    const isAgentInProgress =
      currentInProgressMessage &&
      String(currentInProgressMessage.uid) === agentUID;

    if (isAgentInProgress && currentInProgressMessage?.text) {
      return currentInProgressMessage.text;
    }

    const agentHistory = messageList.filter(
      (m) => String(m.uid) === agentUID && Boolean(m.text),
    );

    if (agentHistory.length > 0) {
      return agentHistory[agentHistory.length - 1].text;
    }

    return agentStatement || undefined;
  }, [currentInProgressMessage, agentUID, messageList, agentStatement]);

  // Idempotent sync of finalized turns into State Ledger & HolmesGPT Telemetry Engine
  useEffect(() => {
    for (const turn of messageList) {
      if (!turn.text) continue;

      const speaker = resolveSpeaker(turn.uid, agentUID, client?.uid, remoteUsers, localUserName);
      const isAgent = String(turn.uid) === agentUID;
      const isLocal =
        String(turn.uid) === '0' ||
        (client?.uid !== null &&
          client?.uid !== undefined &&
          String(turn.uid) === String(client.uid));
      const speakerRole: SpeakerRole = isAgent
        ? 'agent'
        : isLocal
        ? 'user'
        : 'peer';

      if (!isAgent) {
        setSpokenStatement(turn.text);
      } else {
        setAgentStatement(turn.text);
      }

      // Skip if this exact text has already been processed for this turn_id
      const existingText = processedTurnsMapRef.current.get(turn.turn_id);
      if (existingText === turn.text) {
        continue;
      }
      processedTurnsMapRef.current.set(turn.turn_id, turn.text);

      const turnCreatedAt =
        typeof turn.createdAt === 'number' ? turn.createdAt : Date.now();
      const turnIdNum =
        typeof turn.turn_id === 'number'
          ? turn.turn_id
          : parseInt(String(turn.turn_id), 10) || undefined;

      const analyzed = analyzeStatement(speaker, turn.text, speakerRole);

      // Detailed Console Parsing Output
      console.log(
        `%c[EchoSphere:ConsoleParser] 🎙️ TURN #${turn.turn_id} | ${speaker} (${speakerRole}) | UID: ${turn.uid}`,
        'color: #38bdf8; font-weight: bold;',
      );
      console.log(`%c  Transcript: "${turn.text}"`, 'color: #f4f4f5;');
      console.log(
        `%c  Analysis: Tag=[${analyzed.tag}] Status=[${analyzed.status}] Contradiction=${analyzed.isContradiction} HotfixStaged=${analyzed.isHotfixStaged} Noise=${analyzed.isNoise}`,
        'color: #a1a1aa;',
      );
      if (analyzed.reason) {
        console.log(`%c  ⚠️ Reason: ${analyzed.reason}`, 'color: #f59e0b;');
      }
      if (analyzed.telemetryEvidence) {
        console.log(`%c  📊 Telemetry Evidence: ${analyzed.telemetryEvidence}`, 'color: #10b981;');
      }
      if (isAgent) {
        console.log(
          `%c[EchoSphere:AI:Muted] 🤖 AI Sentinel Response (AUDIO 100% MUTED - CONSOLE PARSING ONLY): "${turn.text}"`,
          'color: #c084fc; font-weight: bold; background: #18181b; padding: 3px 8px; border: 1px solid #7c3aed; border-radius: 4px;',
        );
      }

      // Skip non-ledger conversational noise (roll calls, audio checks, acknowledgements)
      if (analyzed.isNoise) {
        console.log('[IncidentAnalyzer] Skipped conversational noise turn:', turn.text);
        continue;
      }

      if (analyzed.isContradiction) {
        setHasContradiction(true);
      }
      if (analyzed.isHotfixStaged) {
        setIsHotfixStaged(true);
      }

      const lower = turn.text.toLowerCase();

      // Check for pre-scripted Demo Beat keyword triggers
      const matchedBeat = PAYMENT_INCIDENT_BEATS.find((b) =>
        b.matchKeywords.some((keyword) => lower.includes(keyword.toLowerCase())),
      );
      if (matchedBeat) {
        console.log(
          `%c[EchoSphere:VoiceMatcher] 🎯 Matched Demo Beat #${matchedBeat.beatNumber}: "${turn.text}"`,
          'color: #10b981; font-weight: bold; background: #064e3b; padding: 2px 6px; border-radius: 4px;',
        );
        demoIncidentStore.advanceBeat(matchedBeat.beatNumber);
        commitBeatCard(matchedBeat.beatNumber);
        continue;
      }

      // Require explicit voice passkey ("EchoSphere, authorize [patch/hotfix]") to prevent accidental execution
      if (
        lower.includes('echosphere, authorize') ||
        lower.includes('echosphere authorize')
      ) {
        handleRemediateSuccess().catch(() => {});
      }

      commitLedgerMutation({
        id: `turn-${turn.turn_id}`,
        turnId: turnIdNum,
        speakerUid: String(turn.uid),
        speaker,
        speakerRole,
        text: turn.text,
        tag: analyzed.tag,
        status: analyzed.status,
        reason: analyzed.reason,
        telemetryEvidence: analyzed.telemetryEvidence,
        hypothesisLifecycle: analyzed.hypothesisLifecycle,
        timestampMs: turnCreatedAt,
      });
    }
  }, [messageList, agentUID, client, remoteUsers, handleRemediateSuccess, commitLedgerMutation, localUserName, commitBeatCard]);

  // Publish microphone and camera tracks once created
  usePublish([localMicrophoneTrack, localCameraTrack]);

  useClientEvent(client, 'user-joined', (user) => {
    console.log(`[VoicePipeline:RTC] Remote user joined: uid=${user.uid}`);
    if (user.uid.toString() === agentUID) setIsAgentConnected(true);
  });

  useClientEvent(client, 'user-left', (user) => {
    console.log(`[VoicePipeline:RTC] Remote user left: uid=${user.uid}`);
    if (user.uid.toString() === agentUID) setIsAgentConnected(false);
  });

  useClientEvent(client, 'user-published', async (user, mediaType) => {
    console.log(
      `[VoicePipeline:RTC] Remote user published track: uid=${user.uid}, mediaType=${mediaType}`,
    );
    if (mediaType === 'audio') {
      try {
        await client.subscribe(user, 'audio');
        const isAgent = user.uid.toString() === agentUID;
        if (isAgent) {
          try {
            if (speechMuted) {
              user.audioTrack?.stop();
              user.audioTrack?.setVolume(0);
            } else {
              user.audioTrack?.setVolume(100);
              const p: unknown = user.audioTrack?.play();
              if (p && typeof (p as Promise<void>).catch === 'function') {
                (p as Promise<void>).catch((playErr: unknown) => {
                  if ((playErr as Error)?.name !== 'AbortError') {
                    console.warn('[Agora RTC] Failed to play agent audio track:', playErr);
                  }
                });
              }
            }
          } catch {}
          console.log(
            `%c[VoicePipeline:RTC] ${speechMuted ? '🔇 AI Agent (uid=' + user.uid + ') audio track MUTED' : '🔊 AI Agent (uid=' + user.uid + ') audio track UNMUTED'}`,
            'color: #f43f5e; font-weight: bold; background: #18181b; padding: 2px 6px; border-radius: 4px;',
          );
        } else {
          try {
            const p: unknown = user.audioTrack?.play();
            if (p && typeof (p as Promise<void>).catch === 'function') {
              (p as Promise<void>).catch((playErr: unknown) => {
                if ((playErr as Error)?.name !== 'AbortError') {
                  console.warn('[Agora RTC] Failed to play audio track:', playErr);
                }
              });
            }
          } catch (playErr) {
            if ((playErr as Error)?.name !== 'AbortError') {
              console.warn('[Agora RTC] Failed to play audio track:', playErr);
            }
          }
        }
      } catch (err) {
        console.warn('[Agora RTC] Failed to subscribe/play audio track:', err);
      }
    }
  });

  // Enforce mute/unmute on AI Agent audio track whenever remoteUsers or speechMuted updates
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.uid.toString() === agentUID && user.audioTrack) {
        try {
          if (speechMuted) {
            user.audioTrack.stop();
            user.audioTrack.setVolume(0);
          } else {
            user.audioTrack.setVolume(100);
            const p: unknown = user.audioTrack.play();
            if (p && typeof (p as Promise<void>).catch === 'function') {
              (p as Promise<void>).catch((playErr: unknown) => {
                if ((playErr as Error)?.name !== 'AbortError') {
                  console.warn('[Agora RTC] Failed to play agent audio track:', playErr);
                }
              });
            }
          }
        } catch {}
      }
    });
  }, [remoteUsers, agentUID, speechMuted]);

  useEffect(() => {
    const isAgentInRemoteUsers = remoteUsers.some(
      (user) => user.uid.toString() === agentUID,
    );
    setIsAgentConnected(isAgentInRemoteUsers);
  }, [remoteUsers, agentUID]);

  useClientEvent(client, 'connection-state-change', (curState, revState) => {
    console.log(
      `[VoicePipeline:RTC] Connection state changed: ${revState} -> ${curState}`,
    );
    setConnectionState(curState);
  });

  useClientEvent(client, 'network-quality', (stats) => {
    console.log('[VoicePipeline:RTC:NetworkQuality]', {
      uplinkNetworkQuality: stats.uplinkNetworkQuality,
      downlinkNetworkQuality: stats.downlinkNetworkQuality,
    });
  });

  // Periodic audio transmission & packet loss verification
  useEffect(() => {
    if (!joinSuccess || !client || !localMicrophoneTrack || !isEnabled) return;

    const interval = setInterval(() => {
      try {
        const audioStats = client.getLocalAudioStats();
        const rtcStats = client.getRTCStats();
        console.log('[VoicePipeline:AudioIngestionStats]', {
          codec: audioStats.codecType,
          sendBitrateBps: audioStats.sendBitrate,
          sendPackets: audioStats.sendPackets,
          sendPacketsLost: audioStats.sendPacketsLost,
          currentPacketLossRate: `${(audioStats.currentPacketLossRate ?? 0).toFixed(2)}%`,
          sendJitterMs: audioStats.sendJitterMs,
          rttMs: audioStats.sendRttMs ?? rtcStats.RTT,
          outgoingAvailableBandwidthKbps: rtcStats.OutgoingAvailableBandwidth,
        });
      } catch {}
    }, 3000);

    return () => clearInterval(interval);
  }, [joinSuccess, client, localMicrophoneTrack, isEnabled]);

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

  // Agent Speech Mute Toggle
  // Flips speechMuted and immediately updates agent track volume/playback.
  // On unmute, drains the alert queue to the agent TTS (best-effort).
  const handleSpeechMuteToggle = useCallback(async () => {
    const next = !speechMuted;
    setSpeechMuted(next);

    // Immediately update remote agent audio tracks
    remoteUsers.forEach((user) => {
      if (user.uid.toString() === agentUID && user.audioTrack) {
        try {
          if (next) {
            user.audioTrack.stop();
            user.audioTrack.setVolume(0);
          } else {
            user.audioTrack.setVolume(100);
            const p: unknown = user.audioTrack.play();
            if (p && typeof (p as Promise<void>).catch === 'function') {
              (p as Promise<void>).catch((playErr: unknown) => {
                if ((playErr as Error)?.name !== 'AbortError') {
                  console.warn('[Agora RTC] Failed to play agent audio track on unmute:', playErr);
                }
              });
            }
          }
        } catch (err) {
          console.warn('[Agora RTC] Error updating agent audio track on toggle:', err);
        }
      }
    });

    if (!next && mutedAlertQueueRef.current.length > 0) {
      const alerts = [...mutedAlertQueueRef.current];
      mutedAlertQueueRef.current = [];
      console.log(`[SilentMode] Unmuted — replaying ${alerts.length} queued alert(s) via TTS.`);
      fetch(getApiUrl('/api/agent-speak'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: agoraData.agentId, alerts }),
      }).catch(() => {
        console.warn('[SilentMode] TTS replay request failed (alerts already in ledger).');
      });
    } else if (!next) {
      console.log('[SilentMode] Unmuted — no queued alerts.');
    }
  }, [speechMuted, agoraData.agentId, remoteUsers, agentUID]);

  // Camera Toggle
  const toggleCamera = useCallback(async () => {
    const nextVideoOff = !isVideoOff;
    if (localCameraTrack) {
      try {
        await localCameraTrack.setEnabled(!nextVideoOff);
      } catch (error) {
        console.error('Failed to toggle camera track:', error);
      }
    }
    if (localVideoStream && nextVideoOff) {
      localVideoStream.getTracks().forEach((t) => t.stop());
      _setLocalVideoStream(null);
    }
    setIsVideoOff(nextVideoOff);
  }, [isVideoOff, localCameraTrack, localVideoStream]);

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
      {/* Top Bar: Zoom/Teams Style Incident Header */}
      <IncidentHeader
        incidentId={incidentId}
        severity={incidentSeverity}
        title={incidentTitle}
        isConnected={connectionState === 'CONNECTED'}
        speechMuted={speechMuted}
        participantCount={humanRemoteUsers.length + 2}
        onInjectDemoTurn={() => injectDemoTurn()}
      />

      {/* Main War Room Content */}
      <main className="relative flex flex-1 min-h-0 w-full overflow-hidden bg-[#121316]">
        {/* Left Side: Dynamic Video Grid */}
        <section className="relative flex-1 min-w-0 overflow-hidden pb-16">
          {/* Discreet Demo Beat Failsafe Indicator & Hotkey Control */}
          <div className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 rounded-full px-3 py-1.5 text-xs text-zinc-300 shadow-xl transition-all select-none">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-zinc-100">Beat {currentDemoBeat}/5</span>
            </div>
            <span className="text-zinc-600">•</span>
            <button
              type="button"
              onClick={() => {
                const nextBeat = demoIncidentStore.advanceBeat();
                commitBeatCard(nextBeat);
              }}
              className="inline-flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white transition-colors bg-zinc-800/80 hover:bg-zinc-700 px-2 py-0.5 rounded border border-zinc-700/60 cursor-pointer"
              title="Advance to next demo beat (Hotkeys: Ctrl+Alt+N or Cmd+Option+N)"
            >
              <span>Next</span>
              <kbd className="font-mono text-[9px] bg-zinc-900 px-1 py-0.2 rounded border border-zinc-700 text-zinc-400">
                Ctrl+Alt+N
              </kbd>
            </button>
          </div>

          <VideoGrid
            localParticipant={{
              id: 'local-user',
              name: localUserName,
              role: 'Lead SRE',
              status: isSpeakingLocal
                ? 'Speaking'
                : isEnabled
                ? 'Ambient Mode'
                : 'Muted',
              isLocal: true,
              statement: localSubtitle,
              hasContradiction: hasContradiction,
            }}
            localCameraTrack={localCameraTrack}
            isVideoOff={isVideoOff}
            localVideoStream={localVideoStream}
            isLocalMuted={!isEnabled}
            agentSpeaking={agentState === 'speaking'}
            agentStatus={
              agentState === 'speaking'
                ? 'Console Parsing'
                : isAgentConnected
                ? '100% Muted · Console Parsing'
                : 'Connecting'
            }
            agentStatement={agentSubtitle}
            isHotfixStaged={isHotfixStaged}
            isResolved={isResolved}
            onRemediateSuccess={handleRemediateSuccess}
            remoteAgoraUsers={humanRemoteUsers}
          />
        </section>

        {/* Right Side: 5-Tool War Room Sidebar */}
        {isSideDrawerOpen && (
          <WarRoomSidebar
            activeTab={activeSidebarTab}
            onTabChange={(tab) => setActiveSidebarTab(tab)}
            onClose={() => setIsSideDrawerOpen(false)}
            ledgerItems={ledgerItems}
            isHotfixStaged={isHotfixStaged}
            isResolved={isResolved}
            incidentId={activeIncidentId}
            onRemediateSuccess={handleRemediateSuccess}
          />
        )}

        {/* Floating Meeting Control Dock (Zoom / Teams 2.1 floating pill bar) */}
        <div className="absolute bottom-5 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <FloatingControlDock
            isMicMuted={!isEnabled}
            isVideoOff={isVideoOff}
            isSharing={false}
            participantCount={humanRemoteUsers.length + 2}
            activeSidebarTab={activeSidebarTab}
            isSidebarOpen={isSideDrawerOpen}
            speechMuted={speechMuted}
            isMonitoringSelf={isMonitoringSelf}
            onToggleMic={handleMicToggle}
            onToggleVideo={toggleCamera}
            onToggleSpeechMute={handleSpeechMuteToggle}
            onToggleSelfMonitor={toggleSelfMonitor}
            onSelectSidebarTab={(tab) => {
              setActiveSidebarTab(tab);
              setIsSideDrawerOpen(true);
            }}
            onToggleSidebar={() => setIsSideDrawerOpen(!isSideDrawerOpen)}
            onEndCall={handleEndConversation}
          />
        </div>
      </main>
    </div>
  );
}
