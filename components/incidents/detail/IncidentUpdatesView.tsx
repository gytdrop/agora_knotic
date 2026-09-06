'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Send, CheckCircle2, Megaphone, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoIncidentStore } from '@/lib/demo/payment-incident-scenario';

export interface IncidentUpdateItem {
  id: string;
  time: string;
  author: string;
  channels: string[];
  text: string;
}

export interface IncidentUpdatesViewProps {
  incidentId: string;
  updates?: IncidentUpdateItem[];
  onPublishUpdate?: (text: string, channels: string[]) => void;
  className?: string;
}

const TEMPLATES = [
  {
    label: 'Identified Cause',
    text: 'Identified: Downstream dependency fraud-detection-svc socket saturation has been isolated as the root cause. Traffic failover and rolling restart initiated.',
  },
  {
    label: 'Mitigation Deployed',
    text: 'Monitoring: Canary rollback to payment-service:v2.8.0 completed. 5xx error rate has dropped below 0.1% and checkout traffic has normalized.',
  },
  {
    label: 'Resolved',
    text: 'Resolved: All payment processing transactions are operating nominally. Root cause review scheduled for tomorrow at 10:00 UTC.',
  },
];

export function IncidentUpdatesView({
  incidentId,
  updates: initialUpdates,
  onPublishUpdate,
  className,
}: IncidentUpdatesViewProps) {
  const isDemo = incidentId.includes('8921');
  const [updates, setUpdates] = useState<IncidentUpdateItem[]>(() => {
    if (initialUpdates && initialUpdates.length > 0) return initialUpdates;
    if (isDemo) return demoIncidentStore.getState().updates;
    return [
      {
        id: 'upd-default',
        time: '15:42 UTC',
        author: 'Sarah Connor (Comms Lead)',
        channels: ['Slack #incident-payments', 'Statuspage (status.acme.com)'],
        text: 'Investigating: Customers may experience intermittent 504 timeouts during checkout. Our engineering responders are actively deploying mitigation.',
      },
    ];
  });

  const [isPublishing, setIsPublishing] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    'Slack #incident-payments',
    'Statuspage (status.acme.com)',
  ]);

  useEffect(() => {
    if (!isDemo) return;
    const unsubscribe = demoIncidentStore.subscribe((state) => {
      setUpdates(state.updates);
    });
    return unsubscribe;
  }, [isDemo]);

  const handleToggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updateText.trim()) return;

    if (isDemo) {
      demoIncidentStore.publishUpdate(updateText.trim(), selectedChannels);
    } else {
      const newUpd: IncidentUpdateItem = {
        id: `upd-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
        author: 'Incident Lead',
        channels: selectedChannels,
        text: updateText.trim(),
      };
      setUpdates((prev) => [newUpd, ...prev]);
    }

    onPublishUpdate?.(updateText.trim(), selectedChannels);
    setUpdateText('');
    setIsPublishing(false);
  };

  return (
    <div className={cn('py-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Executive & Stakeholder Updates ({updates.length})
          </h3>
        </div>

        {!isPublishing && (
          <button
            type="button"
            onClick={() => setIsPublishing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Publish Update</span>
          </button>
        )}
      </div>

      {/* Publish Update Form */}
      {isPublishing && (
        <form
          onSubmit={handlePublish}
          className="rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-900 dark:text-purple-200">
              Draft Stakeholder Broadcast
            </span>
            <button
              type="button"
              onClick={() => setIsPublishing(false)}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Templates */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-purple-500" /> Quick fill:
            </span>
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => setUpdateText(tmpl.text)}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-purple-400 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                {tmpl.label}
              </button>
            ))}
          </div>

          <textarea
            rows={3}
            value={updateText}
            onChange={(e) => setUpdateText(e.target.value)}
            placeholder="Describe current status, mitigation progress, or next check-in..."
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-purple-500/20"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Broadcast to:</span>
              {['Slack #incident-payments', 'Statuspage (status.acme.com)', 'Executive Email'].map((ch) => (
                <label
                  key={ch}
                  className="inline-flex items-center gap-1 text-[11px] text-zinc-700 dark:text-zinc-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(ch)}
                    onChange={() => handleToggleChannel(ch)}
                    className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 text-xs"
                  />
                  <span>{ch}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPublishing(false)}
                className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white px-2.5 py-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!updateText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Publish</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Updates Stream */}
      <div className="space-y-3">
        {updates.map((upd, idx) => (
          <div
            key={upd.id}
            className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-2xs space-y-2.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-purple-600" />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  Update #{updates.length - idx}
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-600 dark:text-zinc-400 font-medium">{upd.author}</span>
              </div>
              <span className="font-mono text-[11px] text-zinc-400">{upd.time}</span>
            </div>

            <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
              {upd.text}
            </p>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[11px] text-zinc-400">Published to:</span>
              {upd.channels.map((ch) => (
                <span
                  key={ch}
                  className="inline-flex items-center gap-1 rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60"
                >
                  <CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />
                  {ch}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
