'use client';

import React, { useState } from 'react';
import {
  Loader2,
  Plus,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  ActionType,
  TriggerEventType,
  WorkflowAction,
} from '@/lib/workflow-engine/types';

interface WorkflowBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const ACTION_PRESETS: { type: ActionType; name: string; category: string }[] = [
  { type: 'create_slack_channel', name: 'Create Slack Channel', category: 'Communication' },
  { type: 'post_slack_message', name: 'Post Slack Message', category: 'Communication' },
  { type: 'post_teams_message', name: 'Post to MS Teams', category: 'Communication' },
  { type: 'send_email', name: 'Send Email Alert', category: 'Communication' },
  { type: 'create_war_room', name: 'Provision Agora War Room', category: 'Incident' },
  { type: 'assign_incident_commander', name: 'Assign Incident Commander', category: 'Incident' },
  { type: 'update_incident_severity', name: 'Update Severity', category: 'Incident' },
  { type: 'resolve_incident', name: 'Resolve Incident', category: 'Incident' },
  { type: 'generate_ai_summary', name: 'Generate AI Summary', category: 'AI' },
  { type: 'generate_ai_hypothesis', name: 'Generate AI Hypothesis', category: 'AI' },
  { type: 'generate_ai_post_mortem', name: 'Generate AI Post-Mortem', category: 'AI' },
  { type: 'update_status_page', name: 'Update Status Page', category: 'Internal' },
  { type: 'wait_delay', name: 'Wait / Delay Buffer', category: 'Internal' },
];

export function WorkflowBuilderModal({
  isOpen,
  onClose,
  onCreated,
}: WorkflowBuilderModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folder, setFolder] = useState('Slack');
  const [triggerType, setTriggerType] = useState<TriggerEventType>('incident_created');
  const [severityFilter, setSeverityFilter] = useState('SEV-1');
  const [actions, setActions] = useState<WorkflowAction[]>([
    {
      id: 'act-1',
      name: 'Create Incident Slack Channel',
      type: 'create_slack_channel',
      config: { channelNameTemplate: 'incident-{{incident.id}}' },
    },
    {
      id: 'act-2',
      name: 'Provision Agora Video War Room',
      type: 'create_war_room',
      config: {},
    },
    {
      id: 'act-3',
      name: 'Generate AI Blast Radius Summary',
      type: 'generate_ai_summary',
      config: { detailLevel: 'detailed' },
    },
  ]);
  const [selectedPreset, setSelectedPreset] = useState<ActionType>('send_email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleAddAction = () => {
    const preset = ACTION_PRESETS.find((p) => p.type === selectedPreset);
    if (!preset) return;
    const newAct: WorkflowAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      type: preset.type,
      config: {},
    };
    setActions([...actions, newAct]);
  };

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Workflow name is required');
      return;
    }
    if (actions.length === 0) {
      setErrorMessage('At least one action is required in the pipeline');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        folder,
        type: triggerType === 'incident_resolved' ? 'post-incident' : 'incident',
        integration: folder.toLowerCase() === 'slack' ? 'slack' : 'ai',
        enabled: true,
        trigger: {
          type: triggerType,
          description: `${triggerType} filter: ${severityFilter}`,
          config: {
            severityThreshold: severityFilter ? [severityFilter] : undefined,
          },
        },
        actions,
      };

      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create workflow');
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create workflow');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl border border-zinc-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
              <Zap className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">Create Workflow</h3>
              <p className="text-xs text-zinc-500">Configure automated trigger conditions and action pipeline</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Name & Folder */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800">Workflow Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Production P1 Auto-Triage & War Room"
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-transparent text-zinc-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-800">Folder</label>
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-transparent text-zinc-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                style={{ backgroundColor: 'transparent' }}
              >
                <option value="Slack">Slack</option>
                <option value="PagerDuty">PagerDuty</option>
                <option value="Statuspage">Statuspage</option>
                <option value="AI">AI</option>
                <option value="Jira">Jira</option>
                <option value="General">General</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-800">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what actions and incident conditions this workflow handles"
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-300 bg-transparent text-zinc-900 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
              style={{ backgroundColor: 'transparent' }}
            />
          </div>

          {/* Trigger Condition Box */}
          <div className="p-4 rounded-lg bg-purple-50/50 border border-purple-100 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
              <Zap className="h-4 w-4 text-purple-600" />
              <span>Trigger Criteria</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-600">Event Trigger</label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value as TriggerEventType)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 bg-white text-zinc-900 outline-none"
                >
                  <option value="incident_created">Incident Created</option>
                  <option value="incident_severity_changed">Incident Severity Changed</option>
                  <option value="incident_updated">Incident Updated</option>
                  <option value="incident_resolved">Incident Resolved</option>
                  <option value="manual">Manual Trigger Only</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-600">Severity Threshold</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-md border border-zinc-300 bg-white text-zinc-900 outline-none"
                >
                  <option value="SEV-0">SEV-0 (Critical Blocker)</option>
                  <option value="SEV-1">SEV-1 (Major Outage)</option>
                  <option value="SEV-2">SEV-2 (Moderate Degradation)</option>
                  <option value="SEV-3">SEV-3 (Minor Issue)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Pipeline Box */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-900">
                Action Pipeline ({actions.length} steps)
              </label>
            </div>

            <div className="space-y-2">
              {actions.map((act, index) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-zinc-900">{act.name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono block">({act.type})</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAction(act.id)}
                    className="p-1 text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Remove action"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Action Bar */}
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value as ActionType)}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-zinc-300 bg-white text-zinc-800 outline-none"
              >
                {ACTION_PRESETS.map((preset) => (
                  <option key={preset.type} value={preset.type}>
                    [{preset.category}] {preset.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddAction}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-xs font-semibold text-zinc-700 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Step</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Create Workflow</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
