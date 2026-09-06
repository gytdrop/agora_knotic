'use client';

import React, { useState } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IncidentSummaryCardProps {
  problem?: string;
  impact?: string;
  causes?: string;
  mitigation?: string;
  onUpdateSummary?: (summary: {
    problem: string;
    impact: string;
    causes: string;
    mitigation: string;
  }) => void;
  className?: string;
}

export function IncidentSummaryCard({
  problem = 'No problem description recorded yet.',
  impact = 'No customer or system impact recorded yet.',
  causes = 'Under active investigation.',
  mitigation = 'Mitigation steps will be documented as actions occur.',
  onUpdateSummary,
  className,
}: IncidentSummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProblem, setEditedProblem] = useState(problem);
  const [editedImpact, setEditedImpact] = useState(impact);
  const [editedCauses, setEditedCauses] = useState(causes);
  const [editedMitigation, setEditedMitigation] = useState(mitigation);

  const handleStartEdit = () => {
    setEditedProblem(problem);
    setEditedImpact(impact);
    setEditedCauses(causes);
    setEditedMitigation(mitigation);
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
    onUpdateSummary?.({
      problem: editedProblem,
      impact: editedImpact,
      causes: editedCauses,
      mitigation: editedMitigation,
    });
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <section
      aria-label="Incident Summary"
      className={cn(
        'bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-xl p-5 sm:p-6 shadow-2xs transition-colors',
        className
      )}
    >
      {/* Header with Title and Edit Button */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase text-[12px] text-zinc-500 dark:text-zinc-400">
          Summary
        </h2>

        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer px-2 py-1 rounded-md"
            >
              <X className="h-3 w-3" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-500 shadow-2xs cursor-pointer"
            >
              <Check className="h-3 w-3" />
              <span>Save</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 cursor-pointer px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="h-3 w-3 text-zinc-400" />
            <span>Edit summary</span>
          </button>
        )}
      </div>

      {/* 4 Prompt Breakdown Sections */}
      {isEditing ? (
        <div className="pt-4 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Problem:
            </label>
            <textarea
              rows={2}
              value={editedProblem}
              onChange={(e) => setEditedProblem(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Impact:
            </label>
            <textarea
              rows={2}
              value={editedImpact}
              onChange={(e) => setEditedImpact(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Causes:
            </label>
            <textarea
              rows={2}
              value={editedCauses}
              onChange={(e) => setEditedCauses(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Steps to mitigate:
            </label>
            <textarea
              rows={2}
              value={editedMitigation}
              onChange={(e) => setEditedMitigation(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2 text-zinc-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="pt-4 space-y-3.5 text-xs sm:text-sm leading-relaxed">
          <p className="text-zinc-700 dark:text-zinc-300">
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1.5">
              Problem:
            </strong>
            {problem}
          </p>

          <p className="text-zinc-700 dark:text-zinc-300">
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1.5">
              Impact:
            </strong>
            {impact}
          </p>

          <p className="text-zinc-700 dark:text-zinc-300">
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1.5">
              Causes:
            </strong>
            {causes}
          </p>

          <p className="text-zinc-700 dark:text-zinc-300">
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1.5">
              Steps to mitigate:
            </strong>
            {mitigation}
          </p>
        </div>
      )}
    </section>
  );
}
