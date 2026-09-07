'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Asterisk, Menu, X } from 'lucide-react';
import { RootlySidebar } from '@/components/dashboard/RootlySidebar';
import { IncidentsDirectory } from './IncidentsDirectory';
import type { IncidentItem } from './IncidentsTable';
import { cn } from '@/lib/utils';

export interface IncidentsPageLayoutProps {
  className?: string;
  initialIncidents?: IncidentItem[];
  onEnterWarRoom?: (incidentId: string, severity: string) => void;
  onCreateIncident?: () => void;
  onOpenSearch?: () => void;
  children?: React.ReactNode;
}

/**
 * IncidentsPageLayout combines the Rootly navigation sidebar with the IncidentsDirectory or custom children.
 * Provides a responsive desktop sticky sidebar and mobile drawer with dual-theme styling.
 */
export function IncidentsPageLayout({
  className,
  initialIncidents,
  onEnterWarRoom,
  onCreateIncident,
  onOpenSearch,
  children,
}: IncidentsPageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Close mobile drawer on Escape key press
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

  // Lock background scroll when drawer is open
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
        'flex min-h-screen flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans antialiased',
        className
      )}
    >
      {/* Desktop Fixed/Sticky Left Sidebar */}
      <RootlySidebar
        className="hidden md:flex"
        onCreateIncident={onCreateIncident}
        onOpenSearch={onOpenSearch}
      />

      {/* Main Content Area (Mobile Header + Directory Container) */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Responsive top header for mobile */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleMobileMenu}
              aria-label="Toggle navigation menu"
              className="inline-flex items-center justify-center p-1.5 -ml-1 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white shadow-xs">
                <Asterisk className="h-4 w-4 stroke-[2.5]" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Ecosphere <span className="font-normal text-slate-400 dark:text-slate-500">/</span> Incidents
              </span>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Panel */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation drawer"
          >
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
              onClick={handleCloseMobileMenu}
              aria-hidden="true"
            />

            {/* Drawer Panel */}
            <div className="relative flex w-64 max-w-[80vw] flex-1 flex-col bg-white dark:bg-slate-900 shadow-2xl z-10">
              {/* Close button inside drawer */}
              <div className="absolute right-2 top-3 z-40">
                <button
                  type="button"
                  onClick={handleCloseMobileMenu}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-700/30 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <RootlySidebar
                className="h-full w-full border-r-0"
                onCreateIncident={() => {
                  handleCloseMobileMenu();
                  onCreateIncident?.();
                }}
                onOpenSearch={() => {
                  handleCloseMobileMenu();
                  onOpenSearch?.();
                }}
                onNavigate={handleCloseMobileMenu}
              />
            </div>
          </div>
        )}

        {/* Main Content Container with IncidentsDirectory or custom children taking full remaining width */}
        <main className="flex-1 w-full min-w-0">
          {children ?? (
            <IncidentsDirectory
              initialIncidents={initialIncidents}
              onEnterWarRoom={onEnterWarRoom}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default IncidentsPageLayout;
