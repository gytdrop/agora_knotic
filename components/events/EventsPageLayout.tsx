'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Asterisk, Menu, X } from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { CreateIncidentModal } from '@/components/dashboard/CreateIncidentModal';
import { EventsHeader } from './EventsHeader';
import { EventsToolbar } from './EventsToolbar';
import { EventsTable } from './EventsTable';
import { ROOTLY_EVENTS_DATASET, type EventItem, type EventStatus } from './eventsData';

export function EventsPageLayout() {
  const [events, setEvents] = useState<EventItem[]>(ROOTLY_EVENTS_DATASET);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('All Events');
  const [isLiveMode, setIsLiveMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCreateIncidentOpen, setIsCreateIncidentOpen] = useState(false);

  const handleStatusChange = useCallback((id: string, newStatus: EventStatus) => {
    setEvents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // Filter by View
      if (selectedView === 'Triggered' && e.status !== 'Triggered') return false;
      if (selectedView === 'Acknowledged' && e.status !== 'Acknowledged') return false;
      if (selectedView === 'Resolved' && e.status !== 'Resolved') return false;

      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = e.alertName.toLowerCase().includes(q);
        const matchesId = e.id.toLowerCase().includes(q);
        const matchesService = e.services.toLowerCase().includes(q);
        const matchesSource = e.source.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesService && !matchesSource) {
          return false;
        }
      }

      return true;
    });
  }, [events, selectedView, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-white text-slate-900 font-sans antialiased">
      {/* Desktop Persistent Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={() => setIsCreateIncidentOpen(true)}
      />

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white shadow-2xl z-10">
            <div className="absolute right-2 top-3 z-40">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close sidebar menu"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <RootlySidebar
              className="h-full w-full border-r-0"
              onCreateIncident={() => {
                setIsMobileMenuOpen(false);
                setIsCreateIncidentOpen(true);
              }}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Responsive Canvas */}
      <div className="flex flex-1 flex-col min-w-0 min-h-screen bg-white">
        {/* Mobile Header Bar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Toggle navigation menu"
              className="p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs">
                <Asterisk className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900">
                Ecosphere <span className="font-normal text-slate-400">/</span> Events
              </span>
            </div>
          </div>
        </div>

        {/* Rootly Events Header */}
        <EventsHeader
          onShare={() => alert('Events stream exported.')}
          onSettings={() => alert('Events settings modal opened.')}
        />

        {/* Rootly Events Toolbar */}
        <EventsToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isLiveMode={isLiveMode}
          onToggleLiveMode={() => setIsLiveMode((prev) => !prev)}
          selectedView={selectedView}
          onSelectView={setSelectedView}
          onOpenFilter={() => alert('Events filter drawer toggled.')}
          onOpenColumns={() => alert('Column configuration modal toggled.')}
          onStartPaging={() => alert('Triggering paging for active events.')}
        />

        {/* 13-Column Events Table */}
        <EventsTable events={filteredEvents} onStatusChange={handleStatusChange} />
      </div>

      {/* Declare Incident Dialog */}
      <CreateIncidentModal
        isOpen={isCreateIncidentOpen}
        onClose={() => setIsCreateIncidentOpen(false)}
        onCreated={() => setIsCreateIncidentOpen(false)}
      />
    </div>
  );
}
