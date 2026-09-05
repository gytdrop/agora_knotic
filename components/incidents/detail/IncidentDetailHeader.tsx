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
  Check,
  CheckCircle2,
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
  onUpdateTitle?: (newTitle: string) => void;
  onResolve?: () => void;
  className?: string;
}

export function IncidentDetailHeader({
  incidentId,
  title,
  onUpdateTitle,
  onResolve,
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
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-2',
        className
      )}
    >
      {/* Left: Breadcrumb + Title */}
      <div className="flex flex-col gap-1.5 min-w-0">
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

        {/* Title / Inline Editable H1 */}
        <div className="flex items-center gap-2 group">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              className="text-xl sm:text-2xl font-semibold text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 border border-purple-500 rounded-md px-2 py-0.5 outline-none ring-2 ring-purple-500/20 w-full max-w-2xl"
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 truncate">
                <span className="font-mono text-zinc-500 dark:text-zinc-400 mr-2 font-medium">
                  {formattedId}
                </span>
                {title}
              </h1>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                aria-label="Edit incident title"
                className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
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
    </header>
  );
}
