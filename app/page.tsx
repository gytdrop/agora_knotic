'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreditCard, Radar, ArrowRight, Video } from 'lucide-react';
import { type AppStatus, readStatus, subscribeStatus } from '@/lib/demo/app-status';

/**
 * Demo portal.
 *
 * The two surfaces of INC-8921 side by side: the customer-facing payment app
 * that is failing, and the incident commander that resolves it. Opening the
 * deployment lands here so the narrative is legible before anything is clicked.
 *
 * The acme-pay card mirrors live status, so once remediation is authorized this
 * page turns green too — the portal itself is evidence the fix propagated.
 */
export default function Portal() {
  const [status, setStatus] = useState<AppStatus>('CRITICAL');

  useEffect(() => {
    setStatus(readStatus());
    return subscribeStatus(setStatus);
  }, []);

  const degraded = status === 'CRITICAL';

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16">
        <header>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
              E
            </div>
            <span className="text-lg font-semibold tracking-tight">EchoSphere</span>
            <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Demo
            </span>
          </div>
          <h1 className="mt-6 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            An AI incident commander that listens to the call.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            Two surfaces of the same outage. Open them side by side: watch checkout fail,
            then watch EchoSphere separate fact from hypothesis, catch the contradiction,
            and stage the fix that brings it back.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* The failing customer app */}
          <Link
            href="/demo-app"
            className={`group relative flex flex-col justify-between gap-6 rounded-xl border p-6 transition-all hover:-translate-y-0.5 hover:shadow-md ${
              degraded
                ? 'border-rose-200 bg-white hover:border-rose-300'
                : 'border-emerald-200 bg-white hover:border-emerald-300'
            }`}
          >
            <div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                  degraded ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">acme-pay</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                The customer-facing checkout. This is what your users see while the
                incident is open.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${
                  degraded ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    degraded ? 'animate-pulse bg-rose-500' : 'bg-emerald-500'
                  }`}
                />
                {degraded ? '504 — major outage' : '200 — operational'}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* The incident commander */}
          <Link
            href="/incidents/INC-8921"
            className="group relative flex flex-col justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Radar className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-semibold">EchoSphere</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
                The incident command center. Timeline, diarized war room video, and the
                AI ledger of facts, hypotheses, and contradictions.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                INC-8921 · SEV-1
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-slate-200 pt-6 text-[13px]">
          <Link
            href="/war-room"
            className="inline-flex items-center gap-1.5 font-medium text-slate-900 hover:underline"
          >
            <Video className="h-3.5 w-3.5" />
            Join the live war room
          </Link>
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-900">
            All incidents
          </Link>
          <Link href="/post-mortem/INC-8921" className="text-slate-500 hover:text-slate-900">
            Post-incident review
          </Link>
        </div>
      </div>
    </main>
  );
}
