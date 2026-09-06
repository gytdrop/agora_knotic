'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useConvex, useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  getFallbackIncident,
  normalizeIncidentId,
  type IncidentDetailRecord,
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
import { cn } from '@/lib/utils';

export interface IncidentDetailPageProps {
  incidentId: string;
  className?: string;
}

interface IncidentDetailPageViewProps {
  normId: string;
  initialRecord: IncidentDetailRecord;
  ledgerEvents: LedgerEventItem[];
  onUpdateStatus: (newStatus: IncidentLifecycleStage) => Promise<void> | void;
  onUpdateSeverity: (newSeverity: 'Critical' | 'Major' | 'Minor') => Promise<void> | void;
  onUpdateSummary: (summary: {
    problem: string;
    impact: string;
    causes: string;
    mitigation: string;
  }) => Promise<void> | void;
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
  onUpdateStatus,
  onUpdateSeverity,
  onUpdateSummary,
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
        'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6',
        className
      )}
    >
      {/* Top Header: Breadcrumb, Title with Inline Edit, Subscribe, Action Menu */}
      <IncidentDetailHeader
        incidentId={normId}
        title={localTitle}
        onUpdateTitle={setLocalTitle}
        onResolve={() => handleUpdateStatus('RESOLVED')}
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
      <div className="flex flex-col lg:flex-row gap-6 items-start">
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
            actionCount={initialRecord.actions.length}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
            dateIndicator={initialRecord.timelineEvents[0]?.timeFormatted ? 'Today' : 'Active'}
          />

          {/* Active Tab View */}
          <div className="min-h-[300px]">
            {activeTab === 'timeline' && (
              <IncidentTimelineView
                timelineEvents={initialRecord.timelineEvents}
                ledgerEvents={ledgerEvents}
                isExpanded={isExpanded}
              />
            )}

            {activeTab === 'actions' && (
              <IncidentActionsView actions={initialRecord.actions} />
            )}

            {activeTab === 'follow-ups' && (
              <IncidentFollowUpsView followUps={initialRecord.followUps} />
            )}

            {activeTab === 'updates' && (
              <IncidentUpdatesView incidentId={normId} />
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
          participants={initialRecord.participants}
          slackChannel={initialRecord.slackChannel}
          jiraKey={initialRecord.jiraKey}
          affectedTeam={initialRecord.affectedTeam}
          reviewer={initialRecord.reviewer}
        />
      </div>
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

  const mutateStatus = useMutation(api.incidents.updateIncidentStatus);
  const mutateSeverity = useMutation(api.incidents.updateIncidentSeverity);
  const mutateSummary = useMutation(api.incidents.updateIncidentSummary);

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

  return (
    <IncidentDetailPageView
      normId={normId}
      initialRecord={mergedRecord}
      ledgerEvents={formattedLedgerEvents}
      onUpdateStatus={handleUpdateStatus}
      onUpdateSeverity={handleUpdateSeverity}
      onUpdateSummary={handleUpdateSummary}
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
