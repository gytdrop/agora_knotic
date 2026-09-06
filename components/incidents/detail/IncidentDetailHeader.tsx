'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Pencil,
  Bell,
  BellRing,
  MoreHorizontal,
  Copy,
  FileDown,
  FileText,
  Check,
  CheckCircle2,
  PhoneCall,
  Sparkles,
  Video,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface IncidentDetailHeaderProps {
  incidentId: string;
  title: string;
  severity?: string;
  onUpdateTitle?: (newTitle: string) => void;
  onResolve?: () => void;
  onOpenAskAi?: () => void;
  onOpenEscalate?: () => void;
  className?: string;
}

export function IncidentDetailHeader({
  incidentId,
  title,
  severity = 'Critical',
  onUpdateTitle,
  onResolve,
  onOpenAskAi,
  onOpenEscalate,
  className,
}: IncidentDetailHeaderProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    if (editedTitle.trim() && editedTitle !== title) {
      onUpdateTitle?.(editedTitle.trim());
    } else {
      setEditedTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(title);
      setIsEditingTitle(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleExportMarkdown = () => {
    const mdContent = `# ${incidentId}: ${title}\n\nExported from Ecosphere Incident Management on ${new Date().toUTCString()}\n`;
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-${incidentId.replace('#', '')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formattedId = incidentId.replace('#', 'INC - ');

  return (
    <header
      className={cn(
        'flex flex-col gap-2.5 py-1.5',
        className
      )}
    >
      {/* Top Bar: Breadcrumb on left, Actions on right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shadow-2xs">
            <Flame className="h-3 w-3 stroke-[2.5]" />
          </div>
          <Link
            href="/incidents"
            className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            Incidents
          </Link>
          <span className="text-zinc-300 dark:text-zinc-700">/</span>
          <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
            {incidentId}
          </span>
        </nav>

        {/* Right Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
        {onOpenAskAi && (
          <button
            type="button"
            onClick={onOpenAskAi}
            className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span>Ask AI</span>
          </button>
        )}

        {onOpenEscalate && (
          <button
            type="button"
            onClick={onOpenEscalate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <PhoneCall className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
            <span>Escalate</span>
          </button>
        )}

        <Link
          href={`/war-room?incident=${encodeURIComponent(incidentId.replace(/^#/, ''))}&sev=${encodeURIComponent(severity)}&title=${encodeURIComponent(title)}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 dark:border-purple-800/60 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Video className="h-3.5 w-3.5" />
          <span>Enter War Room</span>
        </Link>

        <Link
          href={`/post-mortem/${encodeURIComponent(incidentId.replace(/^#/, ''))}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Post-Mortem</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsSubscribed((prev) => !prev)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer',
            isSubscribed
              ? 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300'
              : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800'
          )}
        >
          {isSubscribed ? (
            <>
              <BellRing className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              <span>Subscribed</span>
            </>
          ) : (
            <>
              <Bell className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
              <span>Subscribe</span>
            </>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Incident actions menu"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 shadow-2xs cursor-pointer"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-xs font-medium">
            <DropdownMenuItem
              onClick={handleCopyLink}
              className="flex items-center gap-2 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Copy Incident Link</span>
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleExportMarkdown}
              className="flex items-center gap-2 cursor-pointer"
            >
              <FileDown className="h-3.5 w-3.5 text-zinc-400" />
              <span>Export to Markdown</span>
            </DropdownMenuItem>
            {onResolve && (
              <DropdownMenuItem
                onClick={onResolve}
                className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark as Resolved</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    {/* Dedicated Title Row: Full width without any button overlap */}
    <div className="flex items-center gap-2 group min-w-0 w-full pt-0.5">
      {isEditingTitle ? (
        <input
          ref={inputRef}
          type="text"
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={handleKeyDown}
          className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-purple-500 rounded-md px-2 py-0.5 outline-none ring-2 ring-purple-500/20 w-full max-w-3xl"
        />
      ) : (
        <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 break-words">
            <span className="font-mono text-zinc-400 dark:text-zinc-500 mr-2.5 font-semibold">
              {formattedId}
            </span>
            {title}
          </h1>
          <button
            type="button"
            onClick={() => setIsEditingTitle(true)}
            aria-label="Edit incident title"
            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  </header>
  );
}
