import { NextResponse } from 'next/server';
import { handleCorsPreflight, withCors } from '@/lib/cors';
import { resetIncidentState } from '@/lib/event-store';

/**
 * Reset the demo incident between takes.
 *
 * The ledger event store accumulates: without this it keeps isResolved=true and
 * appends another REMEDIATION_EXECUTED on every run, so the second take's
 * post-incident review shows two remediations.
 *
 * Scoped deliberately to the demo incident only. It clears no real data, takes
 * no identifiers from the caller, and is safe to leave reachable — the
 * alternative would be an operator restarting the server between takes.
 */
const DEMO_INCIDENT_ID = '#INC-8921';

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  const existed = resetIncidentState(DEMO_INCIDENT_ID);

  // Best effort: return the sandbox to its broken release too, when it is
  // running locally. Absent on a deployed instance, which is expected.
  let sandboxReset = false;
  if (!process.env.VERCEL && process.env.DEMO_SANDBOX === '1') {
    try {
      const res = await fetch('http://127.0.0.1:4000/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(1500),
      });
      sandboxReset = res.ok;
    } catch {
      sandboxReset = false;
    }
  }

  return withCors(
    NextResponse.json({
      ok: true,
      incidentId: DEMO_INCIDENT_ID,
      ledgerCleared: existed,
      sandboxReset,
      timestamp: new Date().toISOString(),
    }),
    request,
  );
}
