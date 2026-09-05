'use client';

import React, { useState } from 'react';
import { CheckSquare, Square, Plus, User } from 'lucide-react';
import type { ActionItem } from '@/lib/incident-detail-data';
import { cn } from '@/lib/utils';

export interface IncidentActionsViewProps {
  actions?: ActionItem[];
  onToggleAction?: (actionId: string, completed: boolean) => void;
  onAddAction?: (title: string) => void;
  className?: string;
}

export function IncidentActionsView({
  actions: initialActions = [],
  onToggleAction,
  onAddAction,
  className,
}: IncidentActionsViewProps) {
  const [actions, setActions] = useState<ActionItem[]>(initialActions);
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleToggle = (id: string) => {
    setActions((prev) =>
      prev.map((act) => {
        if (act.id === id) {
          const next = !act.completed;
          onToggleAction?.(id, next);
          return { ...act, completed: next };
        }
        return act;
      })
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const newItem: ActionItem = {
      id: `act-${Date.now()}`,
      title: newTitle.trim(),
      completed: false,
      assignee: 'Incident Lead',
      createdAt: Date.now(),
    };
    setActions((prev) => [...prev, newItem]);
    onAddAction?.(newTitle.trim());
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <div className={cn('py-4 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          In-Incident Action Checklist ({actions.filter((a) => a.completed).length}/{actions.length})
        </h3>

        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Action</span>
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Action description..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/20"
            autoFocus
          />
          <button
            type="submit"
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-purple-500 cursor-pointer"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-500 cursor-pointer"
          >
            Cancel
          </button>
        </form>
      )}

      {actions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-xs text-zinc-400">
          No live incident actions recorded. Click &quot;Add Action&quot; to assign tasks during response.
        </div>
      ) : (
        <div className="space-y-2">
          {actions.map((action) => (
            <div
              key={action.id}
              onClick={() => handleToggle(action.id)}
              className="flex items-center justify-between p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                {action.completed ? (
                  <CheckSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-zinc-400 shrink-0" />
                )}
                <span
                  className={cn(
                    'text-xs font-medium',
                    action.completed
                      ? 'line-through text-zinc-400 dark:text-zinc-500'
                      : 'text-zinc-900 dark:text-zinc-100'
                  )}
                >
                  {action.title}
                </span>
              </div>

              {action.assignee && (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                  <User className="h-3 w-3" />
                  <span>{action.assignee}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
