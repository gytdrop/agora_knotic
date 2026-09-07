'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Menu, Search, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RootlyHeaderProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
  avatarInitials?: string;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onCreateIncident?: () => void;
  onToggleMobileMenu?: () => void;
  searchInputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}

export function RootlyHeader({
  userName = 'Ashley',
  avatarUrl,
  avatarInitials = 'AS',
  searchQuery,
  onSearchChange,
  onCreateIncident,
  onToggleMobileMenu,
  searchInputRef,
  className,
}: RootlyHeaderProps) {
  // Default to "Good Afternoon" to preserve deterministic SSR matching screenshot
  const [greeting, setGreeting] = useState('Good Afternoon');
  const [internalSearch, setInternalSearch] = useState('');

  // Dynamically compute greeting on client based on current local time
  useEffect(() => {
    const currentHour = new Date().getHours();
    if (currentHour >= 4 && currentHour < 12) {
      setGreeting('Good Morning');
    } else if (currentHour >= 12 && currentHour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const currentSearchValue = searchQuery !== undefined ? searchQuery : internalSearch;

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (searchQuery === undefined) {
      setInternalSearch(value);
    }
    onSearchChange?.(value);
  };

  const handleClearSearch = () => {
    if (searchQuery === undefined) {
      setInternalSearch('');
    }
    onSearchChange?.('');
  };

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xs select-none transition-all',
        className
      )}
    >
      {/* Left Section: Avatar + Greeting */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            aria-label="Open sidebar menu"
            className="inline-flex md:hidden items-center justify-center p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-700/20 cursor-pointer shrink-0"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}

        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-slate-900 to-slate-900 text-xs font-bold text-white shadow-xs overflow-visible">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={userName}
              width={36}
              height={36}
              unoptimized
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span>{avatarInitials}</span>
          )}
          {/* Active green presence dot */}
          <span
            className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white"
            aria-label="Online status indicator"
          />
        </div>

        <div className="flex min-w-0 flex-col">
          <h1 className="truncate text-sm sm:text-base font-bold tracking-tight text-slate-900">
            {greeting} {userName} 👋
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Operational · Production Environment</span>
          </div>
        </div>
      </div>

      {/* Right Section: Search Bar + Create Incident CTA */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Search Incidents Input */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={currentSearchValue}
            onChange={handleSearchInputChange}
            placeholder="Search Incidents..."
            className="h-9 w-40 sm:w-56 md:w-72 rounded-lg border border-slate-200 bg-transparent pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 shadow-2xs transition-all hover:border-slate-300 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-700/20"
            style={{ backgroundColor: 'transparent' }}
          />
          {currentSearchValue ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              className="absolute right-2.5 rounded p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-700/30 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2.5 hidden sm:inline-flex items-center rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-400 shadow-2xs">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Primary Declare Incident Button */}
        <button
          type="button"
          onClick={onCreateIncident}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:from-slate-800 hover:to-slate-800 hover:shadow active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-700/40 cursor-pointer shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5 text-slate-200" />
          <span className="hidden xs:inline sm:inline">Declare Incident</span>
          <span className="inline xs:hidden sm:hidden">Declare</span>
        </button>
      </div>
    </header>
  );
}

export default RootlyHeader;
