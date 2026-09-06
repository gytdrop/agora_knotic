'use client';

import React, { useState } from 'react';
import { AlertTriangle, Settings, Share2, X } from 'lucide-react';

export interface EventsHeaderProps {
  onShare?: () => void;
  onSettings?: () => void;
}

export function EventsHeader({ onShare, onSettings }: EventsHeaderProps) {
  const [showTrialBanner, setShowTrialBanner] = useState(true);

  return (
    <div className="w-full bg-white border-b border-zinc-200">
      {/* Rootly-Style Trial Banner */}
      {showTrialBanner && (
        <div className="flex items-center justify-between px-4 py-2 text-xs bg-[#fef9c3] border-b border-amber-200/80 text-[#854d0e]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Your trial is ending in 13 days.{' '}
              <a
                href="#upgrade"
                className="underline font-medium hover:text-amber-900 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Rootly Enterprise trial upgrade request sent.');
                }}
              >
                Talk to sales
              </a>{' '}
              to upgrade your account.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="#upgrade"
              className="font-medium hover:underline hidden sm:inline"
              onClick={(e) => {
                e.preventDefault();
                alert('Rootly Enterprise trial upgrade request sent.');
              }}
            >
              Talk to sales
            </a>
            <button
              type="button"
              onClick={() => setShowTrialBanner(false)}
              aria-label="Dismiss trial banner"
              className="text-amber-700 hover:text-amber-900 cursor-pointer p-0.5 rounded transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

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
