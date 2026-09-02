'use client';

import React from 'react';
import { PreCallHeader } from './PreCallHeader';
import { PreCallHardwarePreview } from './PreCallHardwarePreview';
import { PreCallWarRoomCard } from './PreCallWarRoomCard';

interface PreCallViewProps {
  incidentId?: string;
  severity?: string;
  responderCount?: number;
  isLoading?: boolean;
  onEnterWarRoom?: () => void;
  onOtherWaysToJoin?: () => void;
}

export function PreCallView({
  incidentId = '#INC-8921',
  severity = 'SEV-1',
  responderCount = 5,
  isLoading = false,
  onEnterWarRoom,
  onOtherWaysToJoin,
}: PreCallViewProps) {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#171717] text-zinc-100 font-sans">
      {/* Google Meet Style SEV-1 Header */}
      <PreCallHeader incidentId={incidentId} severity={severity} />

      {/* Main Pre-Call Join Layout */}
      <main className="flex flex-1 items-center justify-center px-8 py-6 overflow-y-auto">
        <div className="grid w-full max-w-6xl grid-cols-1 gap-12 lg:grid-cols-12 items-center">
          {/* Left Column: Hardware Ingestion & Media Preview (7 cols) */}
          <section className="flex flex-col items-center lg:col-span-7">
            <PreCallHardwarePreview />
          </section>

          {/* Right Column: Join War Room Action Card (5 cols) */}
          <section className="flex flex-col items-center lg:items-start lg:col-span-5 pl-0 lg:pl-6">
            <PreCallWarRoomCard
              incidentId={incidentId}
              severity={severity}
              responderCount={responderCount}
              isLoading={isLoading}
              onEnterWarRoom={onEnterWarRoom}
              onOtherWaysToJoin={onOtherWaysToJoin}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

export default PreCallView;
