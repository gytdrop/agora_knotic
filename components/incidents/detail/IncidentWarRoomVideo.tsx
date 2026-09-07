'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Rewind, FastForward, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Total length of the war room recording, in seconds. */
export const WAR_ROOM_DURATION_SECONDS = 28;

export type ChapterKind = 'fact' | 'hypothesis' | 'action' | 'contradiction';

export interface WarRoomChapter {
  /** Offset into the recording, in seconds. */
  atSecond: number;
  kind: ChapterKind;
  label: string;
}

export interface WarRoomSpeaker {
  id: string;
  name: string;
  role: string;
  initials: string;
  /** Half-open [from, to) windows during which this speaker holds the floor. */
  speakingWindows: [number, number][];
}

export const DEFAULT_CHAPTERS: WarRoomChapter[] = [
  { atSecond: 4, kind: 'fact', label: 'Fact: DB latency 800ms' },
  { atSecond: 6, kind: 'hypothesis', label: 'Hypothesis: network issue' },
  { atSecond: 10, kind: 'fact', label: 'Fact: cache hit rate 12%' },
  { atSecond: 14, kind: 'action', label: 'Action: restart replica nodes' },
  { atSecond: 16, kind: 'contradiction', label: 'Contradiction: root cause disagreement' },
  { atSecond: 18, kind: 'fact', label: 'Fact: packet loss 0.8%' },
  { atSecond: 24, kind: 'action', label: 'Status set to STABLE' },
];

export const DEFAULT_SPEAKERS: WarRoomSpeaker[] = [
  {
    id: 'network-lead',
    name: 'Network_Lead',
    role: 'Network Infra',
    initials: 'NL',
    speakingWindows: [
      [0, 6],
      [18, 22],
    ],
  },
  {
    id: 'dba',
    name: 'DBA',
    role: 'Database Lead',
    initials: 'DB',
    speakingWindows: [
      [6, 12],
      [22, 28],
    ],
  },
  {
    id: 'sre-lead',
    name: 'SRE_Lead',
    role: 'Incident Lead',
    initials: 'SR',
    speakingWindows: [[12, 18]],
  },
];

function formatClock(seconds: number): string {
  const clamped = Math.max(0, seconds);
  const mm = Math.floor(clamped / 60)
    .toString()
    .padStart(2, '0');
  const ss = Math.floor(clamped % 60)
    .toString()
    .padStart(2, '0');
  return `${mm}:${ss}`;
}

function isSpeaking(speaker: WarRoomSpeaker, at: number): boolean {
  return speaker.speakingWindows.some(([from, to]) => at >= from && at < to);
}

/**
 * Renders the audio trace into the monitor canvas. Bars left of the playhead
 * are filled slate-600; upcoming audio stays slate-300. The envelope is derived
 * from the bar index rather than Math.random so the waveform is stable across
 * re-renders and matches on every repaint.
 */
function paintWaveform(canvas: HTMLCanvasElement, progress: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 250;
  const cssHeight = canvas.clientHeight || 96;

  if (canvas.width !== cssWidth * dpr || canvas.height !== cssHeight * dpr) {
    canvas.width = cssWidth * dpr;
    canvas.height = cssHeight * dpr;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const bars = 88;
  const step = cssWidth / bars;
  const mid = cssHeight / 2;

  for (let i = 0; i < bars; i += 1) {
    const seed = Math.sin(i * 12.9898) * 43758.5453;
    const noise = seed - Math.floor(seed);
    const envelope = 0.35 + 0.65 * Math.abs(Math.sin(i * 0.18));
    const height = 3 + noise * (cssHeight - 18) * envelope;

    ctx.fillStyle = i / bars <= progress ? '#475569' : '#cbd5e1';
    ctx.fillRect(i * step + 1, mid - height / 2, Math.max(1, step - 1.6), height);
  }

  // Playhead
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(progress * cssWidth, 0);
  ctx.lineTo(progress * cssWidth, cssHeight);
  ctx.stroke();
}

const CHAPTER_TONE: Record<ChapterKind, string> = {
  // Neutral nodes for routine events; only contradictions get high contrast.
  fact: 'bg-slate-400',
  hypothesis: 'bg-slate-400',
  action: 'bg-slate-400',
  contradiction: 'bg-critical ring-2 ring-white dark:ring-slate-900',
};

export interface IncidentWarRoomVideoProps {
  chapters?: WarRoomChapter[];
  speakers?: WarRoomSpeaker[];
  /** Notified whenever playback position changes, so the timeline can follow. */
  onTimeChange?: (seconds: number) => void;
  className?: string;
}

export function IncidentWarRoomVideo({
  chapters = DEFAULT_CHAPTERS,
  speakers = DEFAULT_SPEAKERS,
  onTimeChange,
  className,
}: IncidentWarRoomVideoProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);

  const progress = currentTime / WAR_ROOM_DURATION_SECONDS;

  const seek = useCallback(
    (seconds: number) => {
      const next = Math.min(WAR_ROOM_DURATION_SECONDS, Math.max(0, seconds));
      setCurrentTime(next);
      onTimeChange?.(next);
    },
    [onTimeChange],
  );

  // Playback loop. Advancing by the real frame delta keeps the clock honest
  // regardless of refresh rate, and the loop tears down whenever play stops.
  useEffect(() => {
    if (!isPlaying) {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      lastTickRef.current = null;
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTickRef.current === null) lastTickRef.current = timestamp;
      const delta = (timestamp - lastTickRef.current) / 1000;
      lastTickRef.current = timestamp;

      setCurrentTime((prev) => {
        const next = prev + delta * speed;
        if (next >= WAR_ROOM_DURATION_SECONDS) {
          setIsPlaying(false);
          onTimeChange?.(WAR_ROOM_DURATION_SECONDS);
          return WAR_ROOM_DURATION_SECONDS;
        }
        onTimeChange?.(next);
        return next;
      });

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [isPlaying, speed, onTimeChange]);

  // Repaint the monitor whenever the playhead moves.
  useEffect(() => {
    if (canvasRef.current) paintWaveform(canvasRef.current, progress);
  }, [progress]);

  const latencyDegraded = currentTime >= 4 && currentTime <= 20;
  const cacheDropped = currentTime >= 10 && currentTime <= 22;

  const activeSpeakerId = useMemo(
    () => speakers.find((s) => isSpeaking(s, currentTime))?.id ?? null,
    [speakers, currentTime],
  );

  const handleScrubberClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    seek(ratio * WAR_ROOM_DURATION_SECONDS);
  };

  const cycleSpeed = () => {
    const steps = [1, 1.5, 2, 0.5];
    setSpeed(steps[(steps.indexOf(speed) + 1) % steps.length]);
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="flex flex-col gap-4 p-3 lg:flex-row">
        {/* War room monitor */}
        <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-md border border-slate-200 bg-slate-100/70 lg:w-[250px] dark:border-slate-800 dark:bg-slate-800/50">
          <div className="truncate border-b border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Incident Commander War Room Monitor
          </div>
          <canvas ref={canvasRef} className="h-[96px] w-full" />
          <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-2.5 py-1.5 text-[10.5px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <span>
              Latency:{' '}
              <strong
                className={cn(
                  'font-semibold tabular-nums',
                  latencyDegraded ? 'text-critical' : 'text-slate-900 dark:text-slate-100',
                )}
              >
                {latencyDegraded ? '800ms' : '85ms'}
              </strong>
            </span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>
              Cache:{' '}
              <strong
                className={cn(
                  'font-semibold tabular-nums',
                  cacheDropped ? 'text-hypothesis' : 'text-slate-900 dark:text-slate-100',
                )}
              >
                {cacheDropped ? '12%' : '88%'}
              </strong>
            </span>
          </div>
        </div>

        {/* Stream details */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div className="flex items-center justify-between gap-3 pb-2">
            <span className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">
              Incident Stream Recording — Audio/Video Diarization
            </span>
            <span className="shrink-0 rounded border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Grafana Monitor + Camera Grid
            </span>
          </div>

          {/* Speaker diarization row */}
          <div className="mb-2.5 grid gap-2.5 sm:grid-cols-3">
            {speakers.map((speaker) => {
              const speaking = activeSpeakerId === speaker.id;
              return (
                <div
                  key={speaker.id}
                  className={cn(
                    'flex min-w-0 items-center gap-2 rounded-md border px-2.5 py-1.5 transition-colors',
                    speaking
                      ? 'border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-slate-800'
                      : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
                  )}
                >
                  <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    {speaker.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11.5px] font-semibold text-slate-900 dark:text-slate-100">
                      {speaker.name}
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {speaker.role}
                    </div>
                  </div>
                  <div className="flex h-3 items-end gap-[2px]" aria-hidden="true">
                    {[0, 1, 2].map((bar) => (
                      <span
                        key={bar}
                        className={cn(
                          'w-[2px] rounded-sm transition-all',
                          speaking ? 'bg-slate-600 dark:bg-slate-300' : 'bg-slate-300 dark:bg-slate-700',
                        )}
                        style={{ height: speaking ? `${5 + ((bar * 3 + 4) % 8)}px` : '4px' }}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    aria-label={`${speaker.name} audio channel options`}
                    className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  >
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Transport controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
              className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-slate-900 text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => seek(currentTime - 5)}
              aria-label="Rewind 5 seconds"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <Rewind className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => seek(currentTime + 5)}
              aria-label="Forward 5 seconds"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              <FastForward className="h-3.5 w-3.5" />
            </button>

            <div className="min-w-[90px] font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
              {formatClock(currentTime)} / {formatClock(WAR_ROOM_DURATION_SECONDS)}
            </div>

            <button
              type="button"
              onClick={cycleSpeed}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 font-mono text-[11px] font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              {speed.toFixed(1)}x
            </button>

            <span className="ml-auto hidden text-[11px] text-slate-400 lg:inline dark:text-slate-500">
              Click chapter markers or timestamps to seek
            </span>
          </div>
        </div>
      </div>

      {/* Scrubber with chapter pins */}
      <div className="px-3 pb-4 pt-2">
        <div
          role="presentation"
          onClick={handleScrubberClick}
          className="relative h-1.5 cursor-pointer rounded-full bg-slate-200 dark:bg-slate-800"
        >
          <div
            className="h-full rounded-full bg-slate-700 dark:bg-slate-300"
            style={{ width: `${progress * 100}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-800 bg-white shadow dark:border-slate-300"
            style={{ left: `${progress * 100}%` }}
          />

          {chapters.map((chapter) => (
            <button
              key={`${chapter.kind}-${chapter.atSecond}`}
              type="button"
              title={`${formatClock(chapter.atSecond)} — ${chapter.label}`}
              aria-label={`Seek to ${formatClock(chapter.atSecond)}: ${chapter.label}`}
              onClick={(event) => {
                event.stopPropagation();
                seek(chapter.atSecond);
              }}
              style={{ left: `${(chapter.atSecond / WAR_ROOM_DURATION_SECONDS) * 100}%` }}
              className={cn(
                'absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white transition-transform hover:scale-125 dark:border-slate-900',
                CHAPTER_TONE[chapter.kind],
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default IncidentWarRoomVideo;
