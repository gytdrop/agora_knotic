'use client';

import React from 'react';
import { Settings, Share2 } from 'lucide-react';

export interface EventsHeaderProps {
  onShare?: () => void;
  onSettings?: () => void;
}

export function EventsHeader({ onShare, onSettings }: EventsHeaderProps) {
  return (
    <div className="w-full bg-white border-b border-zinc-200">
      {/* Main Header Row: Title and Global Action Buttons */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">Events</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            aria-label="Export or share events"
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Export or share"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onSettings}
            aria-label="Event settings"
            className="flex items-center justify-center h-8 w-8 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            title="Configure settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar: Single Active 'Events' Tab */}
      <div className="flex items-center px-6 border-t border-zinc-100">
        <nav className="flex space-x-6" aria-label="Events sub-tabs">
          <button
            type="button"
            className="relative py-2.5 text-xs font-semibold text-zinc-900 border-b-2 border-purple-600 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Events</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
