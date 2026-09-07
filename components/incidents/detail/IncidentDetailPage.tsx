'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useConvex, useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  getFallbackIncident,
  normalizeIncidentId,
  type IncidentDetailRecord,
  type TimelineEvent,
  type ActionItem,
} from '@/lib/incident-detail-data';
import { normalizeSeverity } from '@/lib/incident-severity';
import { IncidentDetailHeader } from './IncidentDetailHeader';
import {
  IncidentLifecycleStepper,
  type IncidentLifecycleStage,
} from './IncidentLifecycleStepper';
import { IncidentSummaryCard } from './IncidentSummaryCard';
import { IncidentDetailSidebar } from './IncidentDetailSidebar';
import {
  IncidentDetailTabs,
  type IncidentDetailTab,
} from './IncidentDetailTabs';
import { IncidentTimelineView, type LedgerEventItem } from './IncidentTimelineView';
import { IncidentActionsView } from './IncidentActionsView';
import { IncidentFollowUpsView } from './IncidentFollowUpsView';
import { IncidentUpdatesView } from './IncidentUpdatesView';
import { IncidentAlertsView } from './IncidentAlertsView';
import { AskIncidentDrawer } from './AskIncidentDrawer';
import { EscalateModal } from './EscalateModal';
import { demoIncidentStore } from '@/lib/demo/payment-incident-scenario';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IncidentDetailPageProps {
  incidentId: string;
  className?: string;
}

interface IncidentDetailPageViewProps {
  normId: string;
  initialRecord: IncidentDetailRecord;
  ledgerEvents: LedgerEventItem[];
  timelineEvents: TimelineEvent[];
  actions: ActionItem[];
  updates: Array<{ id: string; time: string; author: string; channels: string[]; text: string }>;
  participants: string[];
  onUpdateStatus: (newStatus: IncidentLifecycleStage) => Promise<void> | void;
  onUpdateSeverity: (newSeverity: 'Critical' | 'Major' | 'Minor') => Promise<void> | void;
  onUpdateSummary: (summary: {
    problem: string;
    impact: string;
    causes: string;
    mitigation: string;
  }) => Promise<void> | void;
  onToggleAction?: (actionId: string, completed: boolean) => void;
  onAddAction?: (title: string) => void;
  onPublishUpdate?: (message: string, channels: string[]) => void;
  onAssignRole?: (role: string, name: string) => void;
  onReassignLead?: (newLead: string) => void;
  className?: string;
}

/**
 * Pure presentation view for incident detail page.
 * Manages UI state (tabs, expand/collapse, optimistic edits) and renders layout.
 */
function IncidentDetailPageView({
  normId,
  initialRecord,
  ledgerEvents,
  timelineEvents,
  actions,
  updates,
  participants,
  onUpdateStatus,
  onUpdateSeverity,
  onUpdateSummary,
  onToggleAction,
  onAddAction,
  onPublishUpdate,
  onAssignRole,
  onReassignLead,
  className,
}: IncidentDetailPageViewProps) {
  const [localTitle, setLocalTitle] = useState(initialRecord.title);
  const [localStatus, setLocalStatus] = useState<string>(initialRecord.status);
  const [localSeverity, setLocalSeverity] = useState<string>(initialRecord.severity);
  const [localSummary, setLocalSummary] = useState({
    problem: initialRecord.problem,
    impact: initialRecord.impact,
    causes: initialRecord.causes,
    mitigation: initialRecord.mitigation,
  });
  const [activeTab, setActiveTab] = useState<IncidentDetailTab>('timeline');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState(false);

  const isDemo = normId.includes('8921');
  const [demoActions, setDemoActions] = useState(() =>
    demoIncidentStore.getState().actions.map((a) => ({
      ...a,
      createdAt: Date.now() - 60000,
    })),
  );

  useEffect(() => {
    if (!isDemo) return;
    const unsubscribe = demoIncidentStore.subscribe((state) => {
      setLocalStatus(state.status);
      setLocalSeverity(state.severity);
      setDemoActions(
        state.actions.map((a) => ({
          ...a,
          createdAt: Date.now() - 60000,
        })),
      );
    });
    return unsubscribe;
  }, [isDemo]);

  useEffect(() => {
    if (initialRecord.title) setLocalTitle(initialRecord.title);
    if (initialRecord.status) setLocalStatus(initialRecord.status);
    if (initialRecord.severity) setLocalSeverity(initialRecord.severity);
    setLocalSummary({
      problem: initialRecord.problem,
      impact: initialRecord.impact,
      causes: initialRecord.causes,
      mitigation: initialRecord.mitigation,
    });
  }, [initialRecord]);

  const handleUpdateStatus = (newStatus: IncidentLifecycleStage) => {
    setLocalStatus(newStatus);
    onUpdateStatus(newStatus);
  };

  const handleUpdateSeverity = (newSeverity: 'Critical' | 'Major' | 'Minor') => {
    setLocalSeverity(newSeverity);
    onUpdateSeverity(newSeverity);
  };

  const handleUpdateSummary = (newSummary: {
    problem: string;
    impact: string;
    causes: string;
    mitigation: string;
  }) => {
    setLocalSummary(newSummary);
    onUpdateSummary(newSummary);
  };

  const activeSeverity = normalizeSeverity(localSeverity);

  return (
    <div
      className={cn(
        'min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 antialiased',
        className
      )}
    >
      {/* Top Header Navigation Strip */}
      <IncidentDetailHeader
        incidentId={normId}
        title={localTitle}
        severity={activeSeverity}
        onUpdateTitle={setLocalTitle}
        onResolve={() => handleUpdateStatus('RESOLVED')}
        onOpenAskAi={() => setIsAskAiOpen(true)}
        onOpenEscalate={() => setIsEscalateOpen(true)}
      />

      {/* Floating Lifecycle Stepper & Metadata Strip */}
      <IncidentLifecycleStepper
        status={localStatus}
        severity={activeSeverity}
        durationString={initialRecord.durationString}
        onUpdateStatus={handleUpdateStatus}
        onUpdateSeverity={handleUpdateSeverity}
      />

      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start px-4 sm:px-6 lg:px-8 py-6">
        {/* Main Column */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Summary Card */}
          <IncidentSummaryCard
            problem={localSummary.problem}
            impact={localSummary.impact}
            causes={localSummary.causes}
            mitigation={localSummary.mitigation}
            onUpdateSummary={handleUpdateSummary}
          />

          {/* Tab Navigation */}
          <IncidentDetailTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            actionCount={actions.length}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
            dateIndicator={timelineEvents[0]?.timeFormatted ? 'Today' : 'Active'}
          />

          {/* Active Tab View */}
          <div className="min-h-[300px]">
            {activeTab === 'timeline' && (
              <IncidentTimelineView
                timelineEvents={timelineEvents}
                ledgerEvents={ledgerEvents}
                isExpanded={isExpanded}
              />
            )}

            {activeTab === 'actions' && (
              <IncidentActionsView
                actions={isDemo ? demoActions : actions}
                onToggleAction={onToggleAction}
                onAddAction={onAddAction}
              />
            )}

            {activeTab === 'follow-ups' && (
              <IncidentFollowUpsView followUps={initialRecord.followUps} />
            )}

            {activeTab === 'updates' && (
              <IncidentUpdatesView
                incidentId={normId}
                updates={updates}
                onPublishUpdate={onPublishUpdate}
              />
            )}

            {activeTab === 'alerts' && (
              <IncidentAlertsView incidentId={normId} />
            )}
          </div>
        </div>

        {/* Right Attributes Sidebar */}
        <IncidentDetailSidebar
          incidentId={normId}
          severity={activeSeverity}
          lead={initialRecord.lead}
          reporter={initialRecord.reporter}
          participants={participants.length > 0 ? participants : initialRecord.participants}
          slackChannel={initialRecord.slackChannel}
          jiraKey={initialRecord.jiraKey}
          affectedTeam={initialRecord.affectedTeam}
          reviewer={initialRecord.reviewer}
          onAssignRole={onAssignRole}
          onReassignLead={onReassignLead}
        />
      </div>

      {/* Floating Ask EchoSphere AI Assistant Button */}
      <button
        type="button"
        onClick={() => setIsAskAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl hover:from-purple-700 hover:to-indigo-700 hover:shadow-2xl transition-all duration-150 active:scale-95 cursor-pointer"
      >
        <Sparkles className="h-4 w-4 text-purple-200" />
        <span>Ask EchoSphere AI</span>
      </button>

      {/* Feature 1: Floating AI Assistant Slide-over Drawer */}
      <AskIncidentDrawer
        isOpen={isAskAiOpen}
        onClose={() => setIsAskAiOpen(false)}
        incidentId={normId}
      />

      {/* Escalate to Team On-Call Modal */}
      <EscalateModal
        isOpen={isEscalateOpen}
        onClose={() => setIsEscalateOpen(false)}
        incidentId={normId}
      />
    </div>
  );
}

/**
 * Convex-connected implementation that executes live queries and mutations.
 * Mounted ONLY when an active Convex client is present in the React tree.
 */
function ConvexIncidentDetailPage({
  incidentId,
  className,
}: IncidentDetailPageProps) {
  const normId = useMemo(() => normalizeIncidentId(incidentId), [incidentId]);
  const fallbackRecord = useMemo(() => getFallbackIncident(normId), [normId]);

  const rawConvexIncident = useQuery(api.incidents.getIncident, { incidentId: normId });
  const rawLedgerEvents = useQuery(api.incidents.listLedgerEvents, { incidentId: normId });
  const rawTimelineEvents = useQuery(api.incidents.listTimelineEvents, { incidentId: normId });
  const rawTasks = useQuery(api.incidents.listTasks, { incidentId: normId });
  const rawUpdates = useQuery(api.incidents.listUpdates, { incidentId: normId });
  const rawParticipants = useQuery(api.incidents.listParticipants, { incidentId: normId });

  const mutateStatus = useMutation(api.incidents.updateIncidentStatus);
  const mutateSeverity = useMutation(api.incidents.updateIncidentSeverity);
  const mutateSummary = useMutation(api.incidents.updateIncidentSummary);
  const mutateLead = useMutation(api.incidents.updateIncidentLead);
  const mutateAssignRole = useMutation(api.incidents.assignParticipantRole);
  const mutateCreateTask = useMutation(api.incidents.createTask);
  const mutateUpdateTask = useMutation(api.incidents.updateTask);
  const mutateCreateUpdate = useMutation(api.incidents.createUpdate);

  const mergedRecord: IncidentDetailRecord = useMemo(() => {
    if (!rawConvexIncident) return fallbackRecord;
    return {
      ...fallbackRecord,
      _id: rawConvexIncident._id,
      title: rawConvexIncident.title || fallbackRecord.title,
      severity: (rawConvexIncident.severity as 'Critical' | 'Major' | 'Minor') || fallbackRecord.severity,
      status: (rawConvexIncident.status as 'INVESTIGATING' | 'FIXING' | 'MONITORING' | 'RESOLVED') || fallbackRecord.status,
      problem: rawConvexIncident.problem || fallbackRecord.problem,
      impact: rawConvexIncident.impact || fallbackRecord.impact,
      causes: rawConvexIncident.causes || fallbackRecord.causes,
      mitigation: rawConvexIncident.mitigation || fallbackRecord.mitigation,
      lead: (rawConvexIncident as { lead?: string }).lead || fallbackRecord.lead,
      slackChannel: (rawConvexIncident as { slackChannel?: string }).slackChannel || fallbackRecord.slackChannel,
      jiraKey: (rawConvexIncident as { jiraKey?: string }).jiraKey || fallbackRecord.jiraKey,
    };
  }, [rawConvexIncident, fallbackRecord]);

  const formattedLedgerEvents: LedgerEventItem[] = useMemo(() => {
    if (rawLedgerEvents && rawLedgerEvents.length > 0) {
      return rawLedgerEvents.map((evt) => ({
        _id: evt._id,
        incidentId: evt.incidentId,
        timestamp: evt.timestamp,
        speaker: evt.speaker,
        tag: evt.tag,
        text: evt.text,
      }));
    }
    return [];
  }, [rawLedgerEvents]);

  const formattedTimelineEvents: TimelineEvent[] = useMemo(() => {
    if (rawTimelineEvents && rawTimelineEvents.length > 0) {
      return rawTimelineEvents.map((evt) => ({
        id: evt._id,
        timestamp: evt.timestamp,
        timeFormatted: new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
        type: (evt.type as TimelineEvent['type']) || 'status_changed',
        title: evt.message,
        author: evt.actor,
      }));
    }
    return fallbackRecord.timelineEvents;
  }, [rawTimelineEvents, fallbackRecord.timelineEvents]);

  const formattedActions: ActionItem[] = useMemo(() => {
    if (rawTasks && rawTasks.length > 0) {
      return rawTasks.map((t) => ({
        id: t._id,
        title: t.title,
        completed: t.completed,
        assignee: t.assignee,
        createdAt: t.createdAt,
      }));
    }
    return fallbackRecord.actions;
  }, [rawTasks, fallbackRecord.actions]);

  const formattedUpdates = useMemo(() => {
    if (rawUpdates && rawUpdates.length > 0) {
      return rawUpdates.map((u) => ({
        id: u._id,
        time: new Date(u.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' UTC',
        author: u.author,
        channels: u.channels,
        text: u.message,
      }));
    }
    return [
      {
        id: 'upd-default',
        time: '15:42 UTC',
        author: 'Sarah Connor (Comms Lead)',
        channels: ['Slack #incident-payments', 'Statuspage (status.acme.com)'],
        text: 'Investigating: Customers may experience intermittent 504 timeouts during checkout. Our engineering responders are actively deploying mitigation.',
      },
    ];
  }, [rawUpdates]);

  const participantNames = useMemo(() => {
    if (rawParticipants && rawParticipants.length > 0) {
      return rawParticipants.map((p) => p.name);
    }
    return fallbackRecord.participants;
  }, [rawParticipants, fallbackRecord.participants]);

  const handleUpdateStatus = async (newStatus: IncidentLifecycleStage) => {
    try {
      await mutateStatus({ incidentId: normId, status: newStatus });
    } catch (err) {
      console.warn('Failed to update status in Convex:', err);
    }
  };

  const handleUpdateSeverity = async (newSeverity: 'Critical' | 'Major' | 'Minor') => {
    try {
      await mutateSeverity({ incidentId: normId, severity: newSeverity });
    } catch (err) {
      console.warn('Failed to update severity in Convex:', err);
    }
  };

  const handleUpdateSummary = async (newSummary: {
    problem: string;
    impact: string;
    causes: string;
    mitigation: string;
  }) => {
    try {
      await mutateSummary({
        incidentId: normId,
        problem: newSummary.problem,
        impact: newSummary.impact,
        causes: newSummary.causes,
        mitigation: newSummary.mitigation,
      });
    } catch (err) {
      console.warn('Failed to update summary in Convex:', err);
    }
  };

  const handleToggleAction = async (actionId: string, completed: boolean) => {
    try {
      await mutateUpdateTask({
        taskId: actionId as any,
        completed,
      });
    } catch (err) {
      console.warn('Failed to toggle task in Convex:', err);
    }
  };

  const handleAddAction = async (title: string) => {
    try {
      await mutateCreateTask({
        incidentId: normId,
        title,
        assignee: mergedRecord.lead || 'Incident Lead',
      });
    } catch (err) {
      console.warn('Failed to create task in Convex:', err);
    }
  };

  const handlePublishUpdate = async (message: string, channels: string[]) => {
    try {
      await mutateCreateUpdate({
        incidentId: normId,
        message,
        author: 'Communications Lead',
        channels,
      });
    } catch (err) {
      console.warn('Failed to publish update in Convex:', err);
    }
  };

  const handleAssignRole = async (role: string, name: string) => {
    try {
      await mutateAssignRole({
        incidentId: normId,
        role,
        name,
      });
    } catch (err) {
      console.warn('Failed to assign role in Convex:', err);
    }
  };

  const handleReassignLead = async (newLead: string) => {
    try {
      await mutateLead({
        incidentId: normId,
        lead: newLead,
      });
    } catch (err) {
      console.warn('Failed to reassign lead in Convex:', err);
    }
  };

  return (
    <IncidentDetailPageView
      normId={normId}
      initialRecord={mergedRecord}
      ledgerEvents={formattedLedgerEvents}
      timelineEvents={formattedTimelineEvents}
      actions={formattedActions}
      updates={formattedUpdates}
      participants={participantNames}
      onUpdateStatus={handleUpdateStatus}
      onUpdateSeverity={handleUpdateSeverity}
      onUpdateSummary={handleUpdateSummary}
      onToggleAction={handleToggleAction}
      onAddAction={handleAddAction}
      onPublishUpdate={handlePublishUpdate}
      onAssignRole={handleAssignRole}
      onReassignLead={handleReassignLead}
      className={className}
    />
  );
}

/**
 * Offline resilient implementation rendered when Convex client or provider is not present.
 */
function OfflineIncidentDetailPage({
  incidentId,
  className,
}: IncidentDetailPageProps) {
  const normId = useMemo(() => normalizeIncidentId(incidentId), [incidentId]);
  const fallbackRecord = useMemo(() => getFallbackIncident(normId), [normId]);

  return (
    <IncidentDetailPageView
      normId={normId}
      initialRecord={fallbackRecord}
      ledgerEvents={[]}
      timelineEvents={fallbackRecord.timelineEvents}
      actions={fallbackRecord.actions}
      updates={[]}
      participants={fallbackRecord.participants}
      onUpdateStatus={() => {}}
      onUpdateSeverity={() => {}}
      onUpdateSummary={() => {}}
      className={className}
    />
  );
}

/**
 * Main IncidentDetailPage container export.
 * Automatically adapts between live Convex subscriptions and zero-dependency offline fallback.
 */
export function IncidentDetailPage(props: IncidentDetailPageProps) {
  const convex = useConvex();

  if (convex) {
    return <ConvexIncidentDetailPage {...props} />;
  }

  return <OfflineIncidentDetailPage {...props} />;
}

export default IncidentDetailPage;
