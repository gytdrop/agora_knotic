'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
  getFallbackIncident,
  normalizeIncidentId,
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

export function IncidentDetailPage({
  incidentId,
  className,
}: IncidentDetailPageProps) {
  const normId = useMemo(() => normalizeIncidentId(incidentId), [incidentId]);
  const fallbackRecord = useMemo(() => getFallbackIncident(normId), [normId]);

  // Convex reactive queries (safe: null if not yet loaded or if Convex is unconfigured)
  const rawConvexIncident = useQuery(api.incidents.getIncident, { incidentId: normId });
  const rawLedgerEvents = useQuery(api.incidents.listLedgerEvents, { incidentId: normId });

  // Mutations
  const mutateStatus = useMutation(api.incidents.updateIncidentStatus);
  const mutateSeverity = useMutation(api.incidents.updateIncidentSeverity);
  const mutateSummary = useMutation(api.incidents.updateIncidentSummary);

  // Local optimistic state initialized from fallback or Convex
  const [localTitle, setLocalTitle] = useState(fallbackRecord.title);
  const [localStatus, setLocalStatus] = useState<string>(fallbackRecord.status);
  const [localSeverity, setLocalSeverity] = useState<string>(fallbackRecord.severity);
  const [localSummary, setLocalSummary] = useState({
    problem: fallbackRecord.problem,
    impact: fallbackRecord.impact,
    causes: fallbackRecord.causes,
    mitigation: fallbackRecord.mitigation,
  });
  const [activeTab, setActiveTab] = useState<IncidentDetailTab>('timeline');
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync when Convex incident data loads
  useEffect(() => {
    if (rawConvexIncident) {
      if (rawConvexIncident.title) setLocalTitle(rawConvexIncident.title);
      if (rawConvexIncident.status) setLocalStatus(rawConvexIncident.status);
      if (rawConvexIncident.severity) setLocalSeverity(rawConvexIncident.severity);
      setLocalSummary((prev) => ({
        problem: rawConvexIncident.problem || prev.problem,
        impact: rawConvexIncident.impact || prev.impact,
        causes: rawConvexIncident.causes || prev.causes,
        mitigation: rawConvexIncident.mitigation || prev.mitigation,
      }));
    }
  }, [rawConvexIncident]);

  const handleUpdateStatus = async (newStatus: IncidentLifecycleStage) => {
    setLocalStatus(newStatus);
    try {
      await mutateStatus({ incidentId: normId, status: newStatus });
    } catch {
      // Offline fallback: optimistic state persists in UI
    }
  };

  const handleUpdateSeverity = async (newSeverity: 'Critical' | 'Major' | 'Minor') => {
    setLocalSeverity(newSeverity);
    try {
      await mutateSeverity({ incidentId: normId, severity: newSeverity });
    } catch {
      // Offline fallback: optimistic state persists
    }
  };

  const handleUpdateSummary = async (newSummary: {
    problem: string;
    impact: string;
    causes: string;
    mitigation: string;
  }) => {
    setLocalSummary(newSummary);
    try {
      await mutateSummary({
        incidentId: normId,
        problem: newSummary.problem,
        impact: newSummary.impact,
        causes: newSummary.causes,
        mitigation: newSummary.mitigation,
      });
    } catch {
      // Offline fallback: optimistic state persists
    }
  };

  const handleUpdateTitle = (newTitle: string) => {
    setLocalTitle(newTitle);
  };

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
        onUpdateTitle={handleUpdateTitle}
        onResolve={() => handleUpdateStatus('RESOLVED')}
      />

      {/* Floating Lifecycle Stepper & Metadata Strip */}
      <IncidentLifecycleStepper
        status={localStatus}
        severity={activeSeverity}
        durationString={fallbackRecord.durationString}
        onUpdateStatus={handleUpdateStatus}
        onUpdateSeverity={handleUpdateSeverity}
      />

      {/* Two Column Layout: Main Content (Summary, Tabs, Stream) + Right Attributes Sidebar */}
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
            actionCount={fallbackRecord.actions.length}
            isExpanded={isExpanded}
            onToggleExpand={() => setIsExpanded((prev) => !prev)}
            dateIndicator={fallbackRecord.timelineEvents[0]?.timeFormatted ? 'Today' : 'Active'}
          />

          {/* Active Tab View */}
          <div className="min-h-[300px]">
            {activeTab === 'timeline' && (
              <IncidentTimelineView
                timelineEvents={fallbackRecord.timelineEvents}
                ledgerEvents={formattedLedgerEvents}
                isExpanded={isExpanded}
              />
            )}

            {activeTab === 'actions' && (
              <IncidentActionsView actions={fallbackRecord.actions} />
            )}

            {activeTab === 'follow-ups' && (
              <IncidentFollowUpsView followUps={fallbackRecord.followUps} />
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
          lead={rawConvexIncident?.lead || fallbackRecord.lead}
          reporter={fallbackRecord.reporter}
          participants={fallbackRecord.participants}
          slackChannel={rawConvexIncident?.slackChannel || fallbackRecord.slackChannel}
          jiraKey={rawConvexIncident?.jiraKey || fallbackRecord.jiraKey}
          affectedTeam={fallbackRecord.affectedTeam}
          reviewer={fallbackRecord.reviewer}
        />
      </div>
    </div>
  );
}
