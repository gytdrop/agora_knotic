'use client';

import React from 'react';
import { 
  AlertOctagon, 
  Bot, 
  ShieldAlert, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import type { IncidentTimelineEvent } from '@/types/war-room';

const DEFAULT_EVENTS: IncidentTimelineEvent[] = [
  {
    id: 'evt-1',
    timestamp: '10:00 AM',
    title: 'Incident Triggered (P1)',
    description: 'Payment service latency exceeded 2000ms threshold. Error rate at 18.4%.',
    severity: 'critical',
    source: 'PagerDuty / Datadog',
  },
  {
    id: 'evt-2',
    timestamp: '10:01 AM',
    title: 'EchoSphere AI Sentinel Active',
    description: 'Ambient Sentinel Mode active. Listening to Agora 16kHz audio stream.',
    severity: 'info',
    source: 'EchoSphere Sentinel',
  },
  {
    id: 'evt-3',
    timestamp: '10:02 AM',
    title: 'HolmesGPT Diagnostics Sync',
    description: 'Cluster diagnostics initiated across ingress-nginx, auth-service, aws-rds.',
    severity: 'info',
    source: 'HolmesGPT Engine',
  },
  {
    id: 'evt-4',
    timestamp: '10:03 AM',
    title: 'Contradiction Flagged',
    description: 'Contradiction confirmed: DB pools healthy. Suppressed DB lockup hypothesis.',
    severity: 'warning',
    source: 'EchoSphere State Ledger',
  },
  {
    id: 'evt-5',
    timestamp: '10:05 AM',
    title: 'Root Cause Isolated',
    description: "Ingress prefix route mismatch ('/api/v2/auth' -> port 8080 instead of 8000).",
    severity: 'warning',
    source: 'HolmesGPT Engine',
  },
  {
    id: 'evt-6',
    timestamp: '10:06 AM',
    title: 'Hotfix Manifest Staged',
    description: 'kubectl patch ingress auth-svc prepared. Verbal trigger: "Authorize Patch".',
    severity: 'info',
    source: 'EchoSphere Remediation',
  },
];

interface UpdatesTabProps {
  events?: IncidentTimelineEvent[];
}

export function UpdatesTab({ events = DEFAULT_EVENTS }: UpdatesTabProps) {
  const getSeverityIcon = (sev?: string) => {
    switch (sev) {
      case 'critical':
        return <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />;
      case 'warning':
        return <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />;
      case 'success':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      default:
        return <Bot className="h-3.5 w-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#18191d] text-slate-200 font-sans text-xs select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-slate-800/80">
        <div className="flex items-center gap-1.5 font-semibold text-slate-100 text-xs">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>Incident Event Timeline</span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">{events.length} milestones</span>
      </div>

      {/* Timeline Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {events.map((evt, idx) => {
          const isLast = idx === events.length - 1;

          return (
            <div key={evt.id} className="relative flex items-start gap-3">
              {/* Vertical line connecting timeline events */}
              {!isLast && (
                <div className="absolute left-3.5 top-6 bottom-0 w-[1px] bg-slate-800" />
              )}

              {/* Node Icon */}
              <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/80 shadow-sm">
                {getSeverityIcon(evt.severity)}
              </div>

              {/* Event Body */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-slate-100 text-xs truncate">{evt.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{evt.timestamp}</span>
                </div>

                {evt.description && (
                  <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">{evt.description}</p>
                )}

                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                    {evt.source}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default UpdatesTab;
