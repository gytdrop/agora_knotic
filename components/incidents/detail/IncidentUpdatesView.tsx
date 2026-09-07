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
          <Megaphone className="h-4 w-4 text-slate-900 dark:text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Executive & Stakeholder Updates ({updates.length})
          </h3>
        </div>

        {!isPublishing && (
          <button
            type="button"
            onClick={() => setIsPublishing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
          className="rounded-xl border border-slate-200 dark:border-slate-900/60 bg-slate-100/40 dark:bg-slate-950/20 p-4 space-y-3 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              Draft Stakeholder Broadcast
            </span>
            <button
              type="button"
              onClick={() => setIsPublishing(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick Templates */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-slate-700" /> Quick fill:
            </span>
            {TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => setUpdateText(tmpl.text)}
                className="text-[11px] font-medium px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
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
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-700/20"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Broadcast to:</span>
              {['Slack #incident-payments', 'Statuspage (status.acme.com)', 'Executive Email'].map((ch) => (
                <label
                  key={ch}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedChannels.includes(ch)}
                    onChange={() => handleToggleChannel(ch)}
                    className="rounded border border-slate-300 bg-transparent text-slate-900 focus:ring-slate-700 text-xs"
                  />
                  <span>{ch}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPublishing(false)}
                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white px-2.5 py-1 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!updateText.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
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
            className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-2.5 transition-all"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="h-3.5 w-3.5 text-slate-900" />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Update #{updates.length - idx}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-600 dark:text-slate-400 font-medium">{upd.author}</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">{upd.time}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
              {upd.text}
            </p>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[11px] text-slate-400">Published to:</span>
              {upd.channels.map((ch) => (
                <span
                  key={ch}
                  className="inline-flex items-center gap-1 rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
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
