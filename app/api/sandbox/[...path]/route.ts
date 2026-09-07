import { NextResponse } from 'next/server';

/**
 * Read-only proxy to the acme-pay demo sandbox on 127.0.0.1:4000.
 *
 * Deliberately inert unless BOTH conditions hold:
 *   - not running on Vercel (process.env.VERCEL is unset)
 *   - DEMO_SANDBOX === '1'
 *
 * Keyed on VERCEL rather than NODE_ENV because a production build is also run
 * locally: `next start` behind a tunnel is how remote participants join a demo,
 * and that path legitimately needs the sandbox.
 *
 * This repo ships vercel.json and railway.json, so it can be deployed. The
 * sandbox is a localhost-only demo rig and must never be reachable from a
 * deployed instance. When disabled this route 404s like any unknown path,
 * revealing nothing about its existence.
 *
 * Only an allowlist of sandbox paths is forwarded, and nothing from the caller
 * is interpolated into a command, filesystem path, or arbitrary URL.
 */

const SANDBOX_ORIGIN = 'http://127.0.0.1:4000';

/** Exact paths this proxy will forward. No wildcards, no caller-supplied URLs. */
const ALLOWED = new Set(['metrics', 'trace', 'health']);

function enabled(): boolean {
  return !process.env.VERCEL && process.env.DEMO_SANDBOX === '1';
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  if (!enabled()) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const { path } = await context.params;
  const target = (path ?? []).join('/');

  if (!ALLOWED.has(target)) {
    return NextResponse.json(
      { error: 'not found', allowed: [...ALLOWED] },
      { status: 404 },
    );
  }

  try {
    // Short timeout: the demo must never hang waiting on a sandbox that is not
    // running. Callers fall back to their hardcoded strings instead.
    const res = await fetch(`${SANDBOX_ORIGIN}/${target}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(1500),
    });
    const body = await res.json();
    return NextResponse.json(body, { status: res.status });
  } catch {
    return NextResponse.json(
      { error: 'sandbox unavailable', hint: 'cd demo-sandbox && npm start' },
      { status: 503 },
    );
  }
}
