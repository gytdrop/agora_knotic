'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { RootlySidebar } from './RootlySidebar';
import { RootlyHeader } from './RootlyHeader';
import {
  ActiveIncidentCards,
  DEFAULT_ACTIVE_INCIDENTS,
  type ActiveIncidentItem,
} from './ActiveIncidentCards';
import { IncidentInsightsHeatmap } from './IncidentInsightsHeatmap';
import { CreateIncidentModal, type CreatedIncident } from './CreateIncidentModal';
import { cn } from '@/lib/utils';

export interface IncidentDashboardProps {
  className?: string;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  avatarInitials?: string;
  initialIncidents?: ActiveIncidentItem[];
}

export function IncidentDashboard({
  className,
  userName = 'Ashley',
  userEmail = 'ashley@acme.inc',
  avatarUrl,
  avatarInitials = 'AS',
  initialIncidents,
}: IncidentDashboardProps) {
  // Modal & Search States
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Maintain local incidents for optimistic and offline accumulation
  const [localIncidents, setLocalIncidents] = useState<ActiveIncidentItem[]>(
    () => initialIncidents || DEFAULT_ACTIVE_INCIDENTS
  );

  useEffect(() => {
    if (initialIncidents) {
      setLocalIncidents(initialIncidents);
    }
  }, [initialIncidents]);

  // Search input ref for keyboard shortcut & sidebar search trigger focus
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreateIncident = useCallback(() => {
    setIsCreateIncidentOpen(true);
  }, []);

  const handleCloseCreateIncident = useCallback(() => {
    setIsCreateIncidentOpen(false);
  }, []);

  const handleOpenSearch = useCallback(() => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
    setIsMobileMenuOpen(false);
  }, []);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleIncidentCreated = useCallback((newIncident: CreatedIncident) => {
    const formattedIncident: ActiveIncidentItem = {
      _id: newIncident._id,
      incidentId: newIncident.incidentId,
      title: newIncident.title,
      severity: newIncident.severity,
      status: newIncident.status,
      rootCause: newIncident.rootCause,
      createdAt: newIncident.createdAt,
    };
    setLocalIncidents((prev) => [formattedIncident, ...prev]);
    setIsCreateIncidentOpen(false);
  }, []);

  // Close mobile menu on Escape key press
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isMobileMenuOpen]);

  return (
    <div
      className={cn(
        'flex min-h-screen bg-zinc-50 font-sans text-zinc-900 antialiased',
        className
      )}
    >
      {/* Desktop Fixed Left Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={handleOpenCreateIncident}
        onOpenSearch={handleOpenSearch}
      />

      {/* Mobile Drawer Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity"
            onClick={handleCloseMobileMenu}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10">
            {/* Close button inside drawer */}
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={handleCloseMobileMenu}
                aria-label="Close sidebar menu"
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <RootlySidebar
              className="h-full w-full border-r-0"
              onCreateIncident={() => {
                handleCloseMobileMenu();
                handleOpenCreateIncident();
              }}
              onOpenSearch={handleOpenSearch}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area: Scrollable Column */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen">
        {/* Sticky Header */}
        <RootlyHeader
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
          avatarInitials={avatarInitials}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onCreateIncident={handleOpenCreateIncident}
          onToggleMobileMenu={handleToggleMobileMenu}
          searchInputRef={searchInputRef}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6 max-w-7xl w-full mx-auto">
          {/* Active Incidents Feed Widget */}
          <section id="incidents" aria-label="Active Incidents" className="scroll-mt-20">
            <ActiveIncidentCards
              searchQuery={searchQuery}
              initialIncidents={localIncidents}
            />
          </section>

          {/* Incident Insights & Activity Heatmap Widget */}
          <section id="metrics" aria-label="Incident Insights" className="scroll-mt-20">
            <IncidentInsightsHeatmap />
          </section>
        </main>
      </div>

      {/* Create Incident Modal Dialog */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={handleCloseCreateIncident}
        onCreated={handleIncidentCreated}
      />
    </div>
  );
}

export default IncidentDashboard;
