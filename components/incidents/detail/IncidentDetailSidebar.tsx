'use client';

import React from 'react';
import Link from 'next/link';
import {
  Video,
  Plus,
  Info,
  ExternalLink,
  FileText,
  Users,
} from 'lucide-react';
import { SlackIcon } from '@/components/incidents/IncidentsTable';
import { cn } from '@/lib/utils';

export interface IncidentDetailSidebarProps {
  incidentId: string;
  severity: string;
  lead?: string;
  reporter?: string;
  participants?: string[];
  slackChannel?: string;
  jiraKey?: string;
  affectedTeam?: string;
  impactField?: string;
  reviewer?: string;
  onReassignLead?: (newLead: string) => void;
  className?: string;
}

export function IncidentDetailSidebar({
  incidentId,
  severity,
  lead = 'Ashley Sawatsky',
  reporter = 'SRE On-Call',
  participants = ['Ashley Sawatsky', 'David Chen', 'Sarah Connor'],
  slackChannel = '#incident-7134',
  jiraKey = 'INC-7134',
  affectedTeam = 'Engineering / Core Platform',
  impactField = 'Increased errors & latency',
  reviewer = 'Ashley Sawatsky',
  onReassignLead,
  className,
}: IncidentDetailSidebarProps) {
  const warRoomUrl = `/war-room?incident=${encodeURIComponent(
    incidentId
  )}&sev=${encodeURIComponent(severity)}&severity=${encodeURIComponent(
    severity
  )}`;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside
      aria-label="Incident Attributes"
      className={cn('w-full lg:w-80 shrink-0 space-y-4 text-xs', className)}
    >
      {/* 1. People & Roles Card (Feature 5: Dynamic Role Assignment) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span>Incident Roles</span>
          </h3>
          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            Dynamic Paging
          </span>
        </div>

        {/* Incident Lead */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Incident Lead</span>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-semibold text-[10px]">
              {getInitials(lead)}
            </div>
            <select
              value={lead}
              onChange={(e) => onReassignLead?.(e.target.value)}
              className="font-medium text-zinc-800 dark:text-zinc-200 bg-transparent border-0 outline-none text-xs cursor-pointer hover:text-purple-600"
            >
              <option value="Ashley Sawatsky">Ashley Sawatsky</option>
              <option value="David Chen">David Chen</option>
              <option value="Meera Patel">Meera Patel</option>
            </select>
          </div>
        </div>

        {/* SRE Lead */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">SRE Lead</span>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold text-[10px]">
              DC
            </div>
            <select
              defaultValue="David Chen"
              onChange={(e) => alert(`Reassigned SRE Lead to ${e.target.value}`)}
              className="font-medium text-zinc-800 dark:text-zinc-200 bg-transparent border-0 outline-none text-xs cursor-pointer hover:text-purple-600"
            >
              <option value="David Chen">David Chen</option>
              <option value="Meera Patel">Meera Patel (Fraud)</option>
              <option value="Sarah Connor">Sarah Connor (DB)</option>
            </select>
          </div>
        </div>

        {/* Comms Lead */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Comms Lead</span>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold text-[10px]">
              SC
            </div>
            <span className="font-medium text-zinc-800 dark:text-zinc-200">Sarah Connor</span>
          </div>
        </div>

        {/* Scribe */}
        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Scribe</span>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white font-semibold text-[9px]">
              AI
            </div>
            <span className="font-medium text-purple-700 dark:text-purple-300">EchoSphere AI Sentinel</span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-zinc-500 dark:text-zinc-400">Responders ({participants.length})</span>
          <div className="flex -space-x-1.5 overflow-hidden">
            {participants.map((person, idx) => (
              <div
                key={person + idx}
                title={person}
                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-semibold text-[9px] ring-1 ring-white dark:ring-zinc-900"
              >
                {getInitials(person)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Communications Card (Slack & Jira) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-2.5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
          Communications
        </h3>

        {/* Slack Channel */}
        <a
          href={`https://slack.com/app_redirect?channel=${slackChannel.replace('#', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <SlackIcon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">
              View Slack channel
            </span>
          </div>
          <ExternalLink className="h-3 w-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
        </a>

        {/* Jira Incident */}
        <a
          href={`https://jira.atlassian.net/browse/${jiraKey}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="flex h-4 w-4 items-center justify-center rounded-xs bg-blue-600 text-white text-[9px] font-bold">
              ◇
            </span>
            <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              View Jira incident
            </span>
          </div>
          <span className="text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
            {jiraKey}
          </span>
        </a>
      </div>

      {/* 3. Calls Section & War Room Bridge [DELIBERATE PLATFORM DEVIATION] */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
              Calls
            </h3>
            <span
              title="Native Agora WebRTC War Room bridge integrated into incident.io call slot"
              className="text-zinc-400 hover:text-zinc-600 cursor-help"
            >
              <Info className="h-3 w-3" />
            </span>
          </div>
          <button
            type="button"
            aria-label="Add call"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* War Room Bridge CTA */}
        <Link
          href={warRoomUrl}
          className="flex items-center justify-between w-full p-2.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-semibold transition-all shadow-2xs group"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-600 text-white shadow-2xs">
              <Video className="h-3.5 w-3.5" />
            </div>
            <span>Enter War Room</span>
          </div>
          {/* Static live indicator dot */}
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Live WebRTC</span>
          </span>
        </Link>
      </div>

      {/* 4. Post-Mortem Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-3">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
          Post-Mortem
        </h3>
        <div className="flex items-center justify-between">
          <Link
            href={`/post-mortem/${encodeURIComponent(incidentId.replace('#', ''))}`}
            className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200 font-medium hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-zinc-400" />
            <span>View Post-Mortem</span>
          </Link>
          {/* Status pill: • In progress [confirmed – screenshot 2] */}
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>In progress</span>
          </span>
        </div>
      </div>

      {/* 5. Custom Fields Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-4 shadow-2xs space-y-2.5">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-xs">
          Custom Fields
        </h3>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Affected team</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {affectedTeam}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Impact</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {impactField}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-500 dark:text-zinc-400">Reviewer</span>
          <span className="font-medium text-zinc-800 dark:text-zinc-200">
            {reviewer}
          </span>
        </div>
      </div>
    </aside>
  );
}
