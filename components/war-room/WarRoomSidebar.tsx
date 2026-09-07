'use client';

import React from 'react';
import { 
  MessageSquare, 
  Users, 
  Megaphone, 
  Zap, 
  Sparkles, 
  X
} from 'lucide-react';
import type { WarRoomToolTab, ParticipantInfo, IncidentTimelineEvent } from '@/types/war-room';
import type { LedgerItem } from '@/types/conversation';
import { ChatTab } from './tabs/ChatTab';
import { PeopleTab } from './tabs/PeopleTab';
import { UpdatesTab } from './tabs/UpdatesTab';
import { ActionsTab } from './tabs/ActionsTab';
import { AiBriefTab } from './tabs/AiBriefTab';

interface WarRoomSidebarProps {
  activeTab?: WarRoomToolTab;
  onTabChange?: (tab: WarRoomToolTab) => void;
  onClose?: () => void;
  ledgerItems?: LedgerItem[];
  isHotfixStaged?: boolean;
  isResolved?: boolean;
  incidentId?: string;
  onRemediateSuccess?: () => void | Promise<void>;
  participants?: ParticipantInfo[];
  events?: IncidentTimelineEvent[];
}

export function WarRoomSidebar({
  activeTab = 'actions',
  onTabChange,
  onClose,
  ledgerItems,
  isHotfixStaged = true,
  isResolved = false,
  incidentId,
  onRemediateSuccess,
  participants,
  events,
}: WarRoomSidebarProps) {
  const handleTabClick = (tab: WarRoomToolTab) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  const tabs: { id: WarRoomToolTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'people', label: 'People', icon: <Users className="h-4 w-4" /> },
    { id: 'updates', label: 'Updates', icon: <Megaphone className="h-4 w-4" /> },
    { 
      id: 'actions', 
      label: 'Actions', 
      icon: <Zap className="h-4 w-4" />,
      badge: isHotfixStaged && !isResolved ? '1' : undefined
    },
    { id: 'ai-brief', label: 'AI Brief', icon: <Sparkles className="h-4 w-4" /> },
  ];

  return (
    <aside className="relative flex flex-col h-full w-84 sm:w-96 border-l border-slate-800/80 bg-[#18191d] font-sans text-slate-100 shrink-0 shadow-2xl transition-all duration-300">
      {/* ── Top Header Bar ── */}
      <div className="flex h-13 items-center justify-between border-b border-slate-800/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-tight text-white">
            War Room Tools
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-0.5 font-sans text-[10px] font-medium text-emerald-300 border border-emerald-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close War Room Tools"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── 5 Tool Tabs Navigation Bar (Teams / Zoom style) ── */}
      <div className="grid grid-cols-5 border-b border-slate-800/80 bg-[#141518] px-1 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              title={tab.label}
            >
              <div className="relative">
                {tab.icon}
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="truncate">{tab.label}</span>

              {/* Active Tab Underline Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-slate-700" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active Tab Viewport ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'people' && <PeopleTab participants={participants} />}
        {activeTab === 'updates' && <UpdatesTab events={events} />}
        {activeTab === 'actions' && (
          <ActionsTab
            ledgerItems={ledgerItems}
            isHotfixStaged={isHotfixStaged}
            isResolved={isResolved}
            incidentId={incidentId}
            onRemediateSuccess={onRemediateSuccess}
          />
        )}
        {activeTab === 'ai-brief' && <AiBriefTab />}
      </div>
    </aside>
  );
}

export default WarRoomSidebar;
