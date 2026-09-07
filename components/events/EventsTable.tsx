'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  MoreVertical,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { EventItem, EventStatus } from './eventsData';

export interface EventsTableProps {
  events: EventItem[];
  onStatusChange?: (id: string, newStatus: EventStatus) => void;
}

export function EventsTable({ events, onStatusChange }: EventsTableProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSelectAll = () => {
    if (selectedIds.size === events.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(events.map((e) => e.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 2000);
  };

  const renderStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'Triggered':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            Triggered
          </span>
        );
      case 'Acknowledged':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Acknowledged
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Resolved
          </span>
        );
      case 'Deferred':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Deferred
          </span>
        );
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-white">
      {/* Scroll Container for 13 Columns Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto min-h-[480px]">
        <div
          className="min-w-[1320px] text-xs divide-y divide-slate-200 border-b border-slate-200"
          role="table"
          aria-label="Events Table"
        >
          {/* Header Grid */}
          <div
            className="grid items-center bg-slate-100/75 text-slate-600 font-semibold text-[11px] uppercase tracking-wider py-2.5 px-3 sticky top-0 z-10 border-b border-slate-200 select-none"
            style={{
              gridTemplateColumns:
                '3rem 7.5rem minmax(16rem, 1fr) 9.5rem 6.5rem 8rem 8.5rem 7rem 7.5rem 7rem 7rem 13rem 5.5rem',
            }}
            role="row"
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                aria-label="Select all events"
                checked={events.length > 0 && selectedIds.size === events.length}
                onChange={handleSelectAll}
                className="h-3.5 w-3.5 rounded border border-slate-300 bg-transparent text-slate-900 focus:ring-slate-700 cursor-pointer"
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
            <div>ID</div>
            <div>Event name</div>
            <div>Event source</div>
            <div>Urgency</div>
            <div>Created at</div>
            <div>Status</div>
            <div>Acted on by</div>
            <div>Active time</div>
            <div>Responders</div>
            <div>Teams</div>
            <div>Services</div>
            <div className="text-right pr-2">Actions</div>
          </div>

          {/* Row Stream */}
          {events.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No events found matching current query or filters.
            </div>
          ) : (
            events.map((event) => {
              const isSelected = selectedIds.has(event.id);
              const isCopied = copiedId === event.id;

              return (
                <div
                  key={event.id}
                  onClick={() => handleToggleRow(event.id)}
                  className={cn(
                    'grid items-center py-3 px-3 transition-colors group cursor-pointer text-slate-800 text-xs',
                    isSelected
                      ? 'bg-slate-100/70 hover:bg-slate-100'
                      : 'hover:bg-slate-50/80 bg-white'
                  )}
                  style={{
                    gridTemplateColumns:
                      '3rem 7.5rem minmax(16rem, 1fr) 9.5rem 6.5rem 8rem 8.5rem 7rem 7.5rem 7rem 7rem 13rem 5.5rem',
                  }}
                  role="row"
                >
                  {/* Column 0: Checkbox */}
                  <div
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Select event ${event.id}`}
                      checked={isSelected}
                      onChange={() => handleToggleRow(event.id)}
                      className="h-3.5 w-3.5 rounded border border-slate-300 bg-transparent text-slate-900 focus:ring-slate-700 cursor-pointer"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </div>

                  {/* Column 1: ID with Tree Connector and Copy Tooltip */}
                  <div className="flex items-center gap-1 relative min-w-0 pr-2">
                    {event.isChild && (
                      <span className="text-slate-300 -ml-1 text-xs select-none">↳</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(event.id, e)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded border border-slate-200/80 transition-colors shrink-0 cursor-pointer"
                      title="Click to copy ID"
                    >
                      <span>#{event.id}</span>
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-2.5 w-2.5 text-slate-400 group-hover:text-slate-600 opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </div>

                  {/* Column 2: Event Name */}
                  <div className="font-semibold text-slate-900 truncate pr-4 group-hover:text-slate-800 transition-colors">
                    {event.alertName}
                  </div>

                  {/* Column 3: Event Source */}
                  <div className="flex items-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-medium text-[11px]">
                      <Radio className="h-3 w-3 text-slate-900" />
                      {event.source}
                    </span>
                  </div>

                  {/* Column 4: Urgency */}
                  <div className="flex items-center gap-1 text-rose-600 font-semibold text-xs">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                    <span>{event.urgency}</span>
                  </div>

                  {/* Column 5: Created at */}
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{event.createdAt}</span>
                  </div>

                  {/* Column 6: Status */}
                  <div className="flex items-center">{renderStatusBadge(event.status)}</div>

                  {/* Column 7: Acted on by */}
                  <div className="text-slate-400">{event.actedOnBy}</div>

                  {/* Column 8: Active time */}
                  <div className="flex items-center gap-1 text-slate-700 font-medium">
                    <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                    <span>{event.activeTime}</span>
                  </div>

                  {/* Column 9: Responders */}
                  <div className="text-slate-400">{event.responders}</div>

                  {/* Column 10: Teams */}
                  <div className="text-slate-400">{event.teams}</div>

                  {/* Column 11: Services */}
                  <div className="truncate pr-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-700 font-medium truncate max-w-full">
                      {event.services}
                    </span>
                  </div>

                  {/* Column 12: Actions Menu */}
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Fast Quick Status Trigger */}
                    {event.status !== 'Resolved' ? (
                      <button
                        type="button"
                        onClick={() => onStatusChange?.(event.id, 'Resolved')}
                        title="Mark as Resolved"
                        className="p-1 text-slate-400 hover:text-emerald-600 rounded transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStatusChange?.(event.id, 'Triggered')}
                        title="Re-open as Triggered"
                        className="p-1 text-emerald-600 hover:text-rose-600 rounded transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}

                    {/* More Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="More actions"
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 text-xs">
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(event.id, 'Acknowledged')}
                          className="cursor-pointer"
                        >
                          Acknowledge
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(event.id, 'Resolved')}
                          className="cursor-pointer"
                        >
                          Resolve
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onStatusChange?.(event.id, 'Deferred')}
                          className="cursor-pointer"
                        >
                          Defer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleCopyId(event.id, e)}
                          className="cursor-pointer"
                        >
                          Copy ID
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Pagination Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 bg-slate-50/60 text-xs text-slate-600">
        <div className="flex items-center gap-1.5 font-medium">
          <span>
            Showing 1 to {events.length} of {events.length} results
          </span>
          <span className="text-slate-400">✏️</span>
        </div>
      </div>
    </div>
  );
}
