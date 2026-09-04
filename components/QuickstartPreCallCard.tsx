"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mic, Volume2, Video, Wifi, ArrowRight, Loader2 } from "lucide-react";

export interface QuickstartPreCallCardProps {
  isLoading?: boolean;
  error?: string | null;
  onStartConversation?: () => void;
}

export function QuickstartPreCallCard({
  isLoading = false,
  error: propError = null,
  onStartConversation,
}: QuickstartPreCallCardProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Default to common incident channel or extract from URL query params
  const channel = searchParams?.get("channel") || "incident-8921";
  const [userName, setUserName] = useState(
    typeof window !== "undefined"
      ? sessionStorage.getItem("echosphere_user_name") || ""
      : ""
  );
  const [error, setError] = useState(propError || "");

  const handleJoin = () => {
    const trimmed = userName.trim();
    if (!trimmed) {
      setError("Please enter your name to join the War Room.");
      return;
    }
    // Store in sessionStorage so the War Room client picks it up
    sessionStorage.setItem("echosphere_user_name", trimmed);
    if (onStartConversation) {
      onStartConversation();
    } else {
      router.push(`/?channel=${channel}`);
    }
  };

  return (
    <div className="w-full max-w-md p-6 rounded-xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
          #{channel.toUpperCase()}
        </span>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-900">
          SEV-1 ACTIVE
        </span>
      </div>

      <h1 className="text-xl font-semibold tracking-tight text-white mb-1">
        Incident War Room
      </h1>
      <p className="text-xs text-zinc-400 mb-5">
        Enter your responder identity to initialize WebRTC streams.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5 uppercase tracking-wider">
            Responder Name
          </label>
          <input
            type="text"
            placeholder="e.g., Sarah (Lead SRE)"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleJoin();
            }}
            className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
          />
          {error && <p className="text-xs text-rose-400 mt-1 font-sans">{error}</p>}
        </div>

        {/* Contained Device Readiness Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs font-sans">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-zinc-400">
            <Mic className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">System Mic</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-zinc-400">
            <Volume2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">Audio Output</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-zinc-400">
            <Video className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
            <span className="truncate text-[11px]">Camera Ready</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950/60 px-2.5 py-1.5 text-emerald-400">
            <Wifi className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="truncate text-[11px]">Agora RTC OK</span>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold tracking-wide transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-zinc-900" />
              <span>Connecting to War Room...</span>
            </>
          ) : (
            <>
              <span>Join War Room</span>
              <ArrowRight className="h-3.5 w-3.5 text-zinc-900" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default QuickstartPreCallCard;
