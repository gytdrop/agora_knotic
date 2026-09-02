'use client';

import React, { useState } from 'react';
import { Zap, Loader2 } from 'lucide-react';

interface PreCallWarRoomCardProps {
  incidentId?: string;
  severity?: string;
  responderCount?: number;
  isLoading?: boolean;
  onEnterWarRoom?: () => void;
  onOtherWaysToJoin?: () => void;
}

export function PreCallWarRoomCard({
  incidentId = '#INC-8921',
  severity = 'SEV-1',
  responderCount = 5,
  isLoading = false,
  onEnterWarRoom,
  onOtherWaysToJoin,
}: PreCallWarRoomCardProps) {
  const [deploySentinel, setDeploySentinel] = useState(true);

  return (
    <div className="flex w-full flex-col pt-4 font-sans">
      
      {/* Join Heading & Metadata */}
      <h1 className="text-[40px] font-normal tracking-tight text-[#e8eaed] mb-1.5">
        Ready to join?
      </h1>
      <p className="text-[#9aa0a6] text-[16px] mb-8">
        Incident <span className="font-bold text-[#e8eaed]">{incidentId}</span> ({severity})
      </p>
      
      <p className="text-[#e8eaed] text-[16px] mb-7 font-medium leading-relaxed max-w-[280px]">
        {responderCount} responders currently in the War Room.
      </p>

      {/* Deploy Ambient AI Sentinel Feature Card */}
      <div
        onClick={() => setDeploySentinel(!deploySentinel)}
        className={`mb-7 cursor-pointer rounded-[12px] border p-4 transition-colors flex gap-4 max-w-[340px] ${
          deploySentinel
            ? 'border-[#2b3a55] bg-transparent hover:bg-[rgba(138,180,248,0.04)]'
            : 'border-[#5f6368] bg-transparent opacity-60 hover:bg-[rgba(255,255,255,0.04)]'
        }`}
      >
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#1e293b] text-[#8ab4f8]">
          <Zap className="h-5 w-5" />
        </div>
        <div className="flex-1 pt-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[15px] font-medium text-[#8ab4f8]">
              Deploy Ambient AI Sentinel
            </span>
            <span
              className={`h-2 w-2 rounded-full mt-0.5 ${
                deploySentinel ? 'bg-[#8ab4f8]' : 'border border-[#9aa0a6]'
              }`}
            />
          </div>
          <p className="text-[14px] leading-[20px] text-[#9aa0a6]">
            EchoSphere silently parses WebRTC audio for contradictions and stages remediations via the state ledger.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        {/* Primary Join Button */}
        <button
          onClick={onEnterWarRoom}
          disabled={isLoading}
          className="flex items-center justify-center rounded-full bg-[#8ab4f8] hover:bg-[#aecbfa] hover:shadow-[0_1px_3px_rgba(0,0,0,0.3)] active:bg-[#8ab4f8] px-6 py-2.5 text-[14px] font-medium text-[#202124] transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#202124] mr-2" />
              Joining...
            </>
          ) : (
            'Join now'
          )}
        </button>

        {/* Secondary Button */}
        <button
          onClick={onOtherWaysToJoin}
          className="rounded-full bg-transparent border border-[#5f6368] hover:border-[#9aa0a6] hover:bg-[rgba(255,255,255,0.04)] px-6 py-2.5 text-[14px] font-medium text-[#8ab4f8] transition-all"
        >
          Other ways to join
        </button>
      </div>

    </div>
  );
}

export default PreCallWarRoomCard;
