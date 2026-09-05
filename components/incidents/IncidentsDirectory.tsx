'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useConvex, useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { IncidentsHeader } from './IncidentsHeader';
import {
  IncidentsFilterBar,
  type IncidentsViewTab,
  type IncidentSortOption,
} from './IncidentsFilterBar';
import {
  IncidentsTable,
  getIncidentLead,
  type IncidentItem,
} from './IncidentsTable';
import {
  CreateIncidentModal,
  type CreatedIncident,
} from '@/components/dashboard/CreateIncidentModal';
import { normalizeSeverity } from '@/lib/incident-severity';
import { cn } from '@/lib/utils';

export interface IncidentsDirectoryProps {
  initialIncidents?: IncidentItem[];
  onEnterWarRoom?: (incidentId: string, severity: string) => void;
  className?: string;
}

/**
 * Robust default fallback data matching the reference incidents (#7134, #7126, #7125, #7124, #7123)
 * plus sample resolved incidents (#7119, #7115) to guarantee realistic presentation across all tabs
 * ('active', 'all', 'resolved') when offline or while initial query loads.
 */
export const DEFAULT_DIRECTORY_INCIDENTS: IncidentItem[] = [
  {
    incidentId: '#7134',
    title: 'Alluring Muse',
    severity: 'SEV2',
    status: 'INVESTIGATING',
    rootCause: 'No summary for this incident',
    createdAt: 1709650000000,
    lead: 'Ashley Sawatsky',
    slackChannel: '#incident-7134',
  },
  {
    incidentId: '#7126',
    title: 'Code Deployment Error Leads to Service Degradation',
    severity: 'SEV0',
    status: 'INVESTIGATING',
    rootCause:
      'A recent deployment of new code to the production environment inadvertently introduced an error...',
    createdAt: 1709570000000,
    lead: 'SRE On-Call',
    slackChannel: '#incident-7126',
  },
  {
    incidentId: '#7125',
    title: 'Memory Leak in Main Application Server',
    severity: 'SEV1',
    status: 'FIXING',
    rootCause:
      'Users reported unusual slowdowns and service interruptions traced back to a memory leak...',
    createdAt: 1709570000000,
    lead: 'Ashley Sawatsky',
    slackChannel: '#incident-7125',
  },
  {
    incidentId: '#7124',
    title: 'Security Vulnerability Discovered in Auth Module',
    severity: 'SEV2',
    status: 'MONITORING',
    rootCause:
      'A significant security flaw was identified within the authentication module of our core platform...',
    createdAt: 1709570000000,
    lead: 'SRE On-Call',
    slackChannel: '#incident-7124',
  },
  {
    incidentId: '#7123',
    title: 'Unexpected Database Downtime After Upgrade',
    severity: 'SEV3',
    status: 'ACTIVE',
    rootCause:
      'During a routine update, a critical database unexpectedly went offline, leading to widespread...',
    createdAt: 1709570000000,
    lead: 'Ashley Sawatsky',
    slackChannel: '#incident-7123',
  },
  {
    incidentId: '#7119',
    title: 'Redis Cache Eviction Spike Under High Concurrency',
    severity: 'SEV2',
    status: 'RESOLVED',
    rootCause:
      'Redis eviction policy LRU triggered sudden drop in cache hit ratio under high concurrency traffic spikes.',
    createdAt: 1709400000000,
    resolvedAt: 1709414400000,
    resolvedBy: 'Ashley Sawatsky',
    lead: 'Ashley Sawatsky',
    slackChannel: '#incident-7119',
  },
  {
    incidentId: '#7115',
    title: 'Third-Party Payment Webhook Timeout',
    severity: 'SEV1',
    status: 'RESOLVED',
    rootCause:
      'Upstream payment processor gateway experienced TCP timeout delays affecting stripe webhook acknowledgement.',
    createdAt: 1709310000000,
    resolvedAt: 1709320000000,
    resolvedBy: 'SRE On-Call',
    lead: 'SRE On-Call',
    slackChannel: '#incident-7115',
  },
];

interface IncidentsDirectoryViewProps extends IncidentsDirectoryProps {
  initialIncidents: IncidentItem[];
  isLoading?: boolean;
}

/**
 * Presentation and state management view for the incidents directory.
 * Orchestrates view tabs, multi-column search, severity/status filters, sorting,
 * optimistic declaration updates, and War Room navigation.
 */
function IncidentsDirectoryView({
  initialIncidents,
  isLoading = false,
  onEnterWarRoom,
  className,
}: IncidentsDirectoryViewProps) {
  const router = useRouter();

  // Active tab state: 'active' | 'all' | 'resolved' (default: 'active')
  const [activeTab, setActiveTab] = useState<IncidentsViewTab>('active');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState<IncidentSortOption>('newest');

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Optimistic additions from CreateIncidentModal
  const [optimisticIncidents, setOptimisticIncidents] = useState<IncidentItem[]>([]);

  const handleIncidentCreated = (newIncident: CreatedIncident) => {
    const item: IncidentItem = {
      _id: newIncident._id,
      incidentId: newIncident.incidentId,
      title: newIncident.title,
      severity: newIncident.severity,
      status: newIncident.status,
      rootCause: newIncident.rootCause,
      createdAt: newIncident.createdAt,
      slackChannel: `#incident-${newIncident.incidentId.replace('#', '')}`,
      lead: 'Ashley Sawatsky',
    };
    setOptimisticIncidents((prev) => [item, ...prev]);
  };

  // Combine server/fallback dataset with optimistic additions (deduplicating by incidentId)
  const allIncidents = useMemo(() => {
    const existingIds = new Set(initialIncidents.map((inc) => inc.incidentId));
    const unmergedOptimistic = optimisticIncidents.filter(
      (opt) => !existingIds.has(opt.incidentId)
    );
    return [...unmergedOptimistic, ...initialIncidents];
  }, [initialIncidents, optimisticIncidents]);

  // Calculate accurate tab counts based on current dataset
  const counts = useMemo(() => {
    let active = 0;
    let resolved = 0;
    for (const inc of allIncidents) {
      if (inc.status.toUpperCase() === 'RESOLVED') {
        resolved += 1;
      } else {
        active += 1;
      }
    }
    return {
      active,
      resolved,
      all: allIncidents.length,
    };
  }, [allIncidents]);

  // Multi-attribute client-side filtering
  const filteredIncidents = useMemo(() => {
    return allIncidents.filter((inc) => {
      // 1. Tab filter
      const isResolved = inc.status.toUpperCase() === 'RESOLVED';
      if (activeTab === 'active' && isResolved) return false;
      if (activeTab === 'resolved' && !isResolved) return false;

      // 2. Real-time search across title, incidentId, lead, rootCause, and slackChannel
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const titleMatch = inc.title.toLowerCase().includes(q);
        const idMatch = inc.incidentId.toLowerCase().includes(q);
        const leadMatch = (inc.lead || getIncidentLead(inc)).toLowerCase().includes(q);
        const causeMatch = (inc.rootCause || '').toLowerCase().includes(q);
        const slackMatch = (
          inc.slackChannel || `#incident-${inc.incidentId.replace('#', '')}`
        )
          .toLowerCase()
          .includes(q);

        if (!titleMatch && !idMatch && !leadMatch && !causeMatch && !slackMatch) {
          return false;
        }
      }

      // 3. Severity filter
      if (selectedSeverity !== 'ALL') {
        if (normalizeSeverity(inc.severity) !== normalizeSeverity(selectedSeverity)) {
          return false;
        }
      }

      // 4. Status filter
      if (selectedStatus !== 'ALL') {
        const incStatus = inc.status.toUpperCase().trim();
        const targetStatus = selectedStatus.toUpperCase().trim();
        if (incStatus !== targetStatus) return false;
      }

      return true;
    });
  }, [allIncidents, activeTab, searchQuery, selectedSeverity, selectedStatus]);

  // Sorting
  const sortedIncidents = useMemo(() => {
    const list = [...filteredIncidents];

    if (sortBy === 'newest') {
      return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    if (sortBy === 'oldest') {
      return list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    if (sortBy === 'severity') {
      const severityRank: Record<string, number> = {
        SEV0: 0,
        SEV1: 1,
        SEV2: 2,
        SEV3: 3,
      };
      return list.sort((a, b) => {
        const rankA = severityRank[a.severity.toUpperCase().replace('-', '')] ?? 99;
        const rankB = severityRank[b.severity.toUpperCase().replace('-', '')] ?? 99;
        if (rankA !== rankB) {
          return rankA - rankB;
        }
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    }

    return list;
  }, [filteredIncidents, sortBy]);

  // Reset filter handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSeverity('ALL');
    setSelectedStatus('ALL');
    setSortBy('newest');
    if (activeTab === 'resolved' && counts.resolved === 0) {
      setActiveTab('active');
    }
  };

  // War Room navigation
  const handleEnterWarRoom = (incidentId: string, severity: string) => {
    if (onEnterWarRoom) {
      onEnterWarRoom(incidentId, severity);
    } else {
      router.push(
        `/war-room?incident=${encodeURIComponent(incidentId)}&sev=${encodeURIComponent(severity)}`
      );
    }
  };

  const handleRowClick = (incident: IncidentItem) => {
    handleEnterWarRoom(incident.incidentId, incident.severity);
  };

  return (
    <div
      className={cn(
        'min-h-screen bg-zinc-50/50 dark:bg-zinc-950 px-4 sm:px-6 lg:px-8 py-8',
        className
      )}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header matching incident.io clean layout */}
        <IncidentsHeader
          totalCount={counts.all}
          activeCount={counts.active}
          onDeclareIncident={() => setIsCreateModalOpen(true)}
        />

        {/* View Tabs & Multi-attribute Filter Bar */}
        <IncidentsFilterBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={counts}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedSeverity={selectedSeverity}
          onSeverityChange={setSelectedSeverity}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          sortBy={sortBy}
          onSortChange={setSortBy}
          onResetFilters={handleResetFilters}
        />

        {/* High-density Incident Table */}
        <IncidentsTable
          incidents={sortedIncidents}
          isLoading={isLoading}
          onResetFilters={handleResetFilters}
          onEnterWarRoom={handleEnterWarRoom}
          onRowClick={handleRowClick}
        />

        {/* Declare Incident Dialog Modal */}
        <CreateIncidentModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={handleIncidentCreated}
        />
      </div>
    </div>
  );
}

/**
 * Convex-connected container implementation.
 * Queries `listAllIncidents` and auto-seeds default reference incidents if table is empty.
 */
function ConvexIncidentsDirectory(props: IncidentsDirectoryProps) {
  const rawIncidents = useQuery(api.incidents.listAllIncidents);
  const seedDefault = useMutation(api.incidents.seedDefaultIncidents);
  const [hasTriggeredSeed, setHasTriggeredSeed] = useState(false);

  useEffect(() => {
    if (
      rawIncidents !== undefined &&
      rawIncidents.length === 0 &&
      !hasTriggeredSeed
    ) {
      setHasTriggeredSeed(true);
      seedDefault().catch((err) => {
        console.warn('Convex seedDefaultIncidents encountered an error:', err);
      });
    }
  }, [rawIncidents, hasTriggeredSeed, seedDefault]);

  const incidents: IncidentItem[] = useMemo(() => {
    if (rawIncidents !== undefined) {
      return rawIncidents.map((inc) => ({
        _id: inc._id,
        incidentId: inc.incidentId,
        title: inc.title,
        severity: inc.severity,
        status: inc.status,
        rootCause: inc.rootCause || 'No summary for this incident',
        createdAt: inc.createdAt,
        resolvedAt: inc.resolvedAt,
        resolvedBy: inc.resolvedBy,
        lead: (inc as { lead?: string }).lead,
        slackChannel:
          (inc as { slackChannel?: string }).slackChannel ||
          `#incident-${inc.incidentId.replace('#', '')}`,
      }));
    }
    return props.initialIncidents || DEFAULT_DIRECTORY_INCIDENTS;
  }, [rawIncidents, props.initialIncidents]);

  return (
    <IncidentsDirectoryView
      {...props}
      initialIncidents={incidents}
      isLoading={rawIncidents === undefined}
    />
  );
}

/**
 * Offline fallback container rendered when Convex client or provider is not mounted.
 */
function OfflineIncidentsDirectory(props: IncidentsDirectoryProps) {
  return (
    <IncidentsDirectoryView
      {...props}
      initialIncidents={props.initialIncidents || DEFAULT_DIRECTORY_INCIDENTS}
      isLoading={false}
    />
  );
}

/**
 * Main IncidentsDirectory container export.
 * Automatically adapts between Convex real-time reactive queries and resilient offline fallback.
 */
export function IncidentsDirectory(props: IncidentsDirectoryProps) {
  const convex = useConvex();

  if (convex) {
    return <ConvexIncidentsDirectory {...props} />;
  }

  return <OfflineIncidentsDirectory {...props} />;
}

export default IncidentsDirectory;
