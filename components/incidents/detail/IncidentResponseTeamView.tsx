'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface IncidentResponseTeamViewProps {
  lead: string;
  reporter: string;
  participants: string[];
  affectedTeam: string;
  reviewer: string;
  className?: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function PersonRow({ name, role }: { name: string; role: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-slate-800">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[11px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
        {initialsOf(name)}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">
          {name}
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">{role}</div>
      </div>
    </div>
  );
}

export function IncidentResponseTeamView({
  lead,
  reporter,
  participants,
  affectedTeam,
  reviewer,
  className,
}: IncidentResponseTeamViewProps) {
  // Named roles come first; remaining participants are listed once, deduped
  // against the people already shown above them.
  const named = new Set([lead, reporter, reviewer]);
  const others = participants.filter((p) => !named.has(p));

  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
        <span className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
          Response Team
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">{affectedTeam}</span>
      </div>

      <PersonRow name={lead} role="Incident Lead" />
      <PersonRow name={reporter} role="Reporter" />
      {reviewer !== lead && <PersonRow name={reviewer} role="Reviewer" />}
      {others.map((person) => (
        <PersonRow key={person} name={person} role="Responder" />
      ))}
    </div>
  );
}

export default IncidentResponseTeamView;
