'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  PhoneCall,
  Shield,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { demoIncidentStore } from '@/lib/demo/payment-incident-scenario';

export interface EscalateModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string;
}

export function EscalateModal({
  isOpen,
  onClose,
  incidentId,
}: EscalateModalProps) {
  const [selectedTeam, setSelectedTeam] = useState('Fraud SRE');
  const [selectedEngineer, setSelectedEngineer] = useState('Meera Patel (Primary On-Call)');
  const [urgency, setUrgency] = useState<'high' | 'low'>('high');
  const [isPaging, setIsPaging] = useState(false);
  const [pagedSuccess, setPagedSuccess] = useState(false);

  if (!isOpen) return null;

  const teams = [
    { name: 'Fraud SRE', engineer: 'Meera Patel (Primary On-Call)', rotation: 'Follow-the-Sun' },
    { name: 'Payments Core', engineer: 'David Chen (Secondary)', rotation: '24/7 Tiered' },
    { name: 'Database Infrastructure', engineer: 'Sarah Connor (Primary)', rotation: '24/7 Global' },
    { name: 'Core Platform', engineer: 'Alex Mercer (Backup)', rotation: 'Business Hours' },
  ];

  const handleTeamChange = (teamName: string) => {
    setSelectedTeam(teamName);
    const found = teams.find((t) => t.name === teamName);
    if (found) setSelectedEngineer(found.engineer);
  };

  const handleEscalate = async () => {
    setIsPaging(true);
    try {
      await fetch(`/api/incidents/${encodeURIComponent(incidentId.replace(/^#/, ''))}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: urgency === 'high' ? 'Critical' : 'Major',
          team: selectedTeam,
          engineer: selectedEngineer,
          reason: `Escalated to ${selectedTeam} on-call via Escalate Modal`,
        }),
      });
      demoIncidentStore.escalate(selectedTeam, selectedEngineer);
    } catch (e) {
      console.warn('Failed to call escalate API:', e);
      demoIncidentStore.escalate(selectedTeam, selectedEngineer);
    } finally {
      setIsPaging(false);
      setPagedSuccess(true);
      setTimeout(() => {
        setPagedSuccess(false);
        onClose();
      }, 1400);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <PhoneCall className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                Escalate Incident to On-Call Team
              </h3>
              <span className="text-[10px] text-zinc-400 font-mono">{incidentId}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {pagedSuccess ? (
          <div className="py-8 text-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto" />
            <div>
              High-priority page dispatched to {selectedTeam} ({selectedEngineer}) via SMS & PagerDuty.
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Team Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Target Escalation Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => handleTeamChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2.5 text-xs text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-purple-500/30"
              >
                {teams.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} ({t.rotation})
                  </option>
                ))}
              </select>
            </div>

            {/* Engineer Target */}
            <div className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 space-y-1">
              <div className="text-[11px] font-medium text-zinc-400">Current On-Call Responder</div>
              <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200">
                <User className="h-3.5 w-3.5 text-purple-600" />
                <span>{selectedEngineer}</span>
              </div>
            </div>

            {/* Urgency */}
            <div className="space-y-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                Escalation Urgency
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setUrgency('high')}
                  className={cn(
                    'p-2.5 rounded-lg border text-left transition-colors cursor-pointer',
                    urgency === 'high'
                      ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Zap className="h-3 w-3 text-rose-600" />
                    <span>High Urgency</span>
                  </div>
                  <div className="text-[10px] opacity-75 mt-0.5">Page immediately via phone & SMS</div>
                </button>

                <button
                  type="button"
                  onClick={() => setUrgency('low')}
                  className={cn(
                    'p-2.5 rounded-lg border text-left transition-colors cursor-pointer',
                    urgency === 'low'
                      ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200'
                      : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  )}
                >
                  <div className="font-bold">Low Urgency</div>
                  <div className="text-[10px] opacity-75 mt-0.5">Notify in Slack channel only</div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEscalate}
                disabled={isPaging}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isPaging ? (
                  <span>Paging responder...</span>
                ) : (
                  <>
                    <PhoneCall className="h-3.5 w-3.5" />
                    <span>Page On-Call Team</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EscalateModal;
