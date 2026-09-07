/**
 * Mutable runtime state and metric counters for acme-pay.
 *
 * Metrics are computed over a rolling window of recent requests so they
 * converge on the scripted values by themselves rather than being asserted.
 * A /metrics reading that is exactly 47.2% on every poll reads as fake.
 */

import {
  BROKEN_VERSION,
  STABLE_VERSION,
  FRAUD_TIMEOUT_RATE,
  resolveCheckout,
  nominalResources,
} from './scenario.mjs';

const WINDOW = 600; // ~25s of traffic at 1,420 req/min
const SOCKET_CAPACITY = 128; // accept backlog depth before shedding

function freshState() {
  return {
    version: BROKEN_VERSION,
    seq: 0,
    window: [], // { ok, status, latencyMs, fraudTimedOut, holdsSocket }
    openSockets: 0,
    startedAt: Date.now(),
    loadTimer: null,
    rolledBackAt: null,
  };
}

let state = freshState();

export const getVersion = () => state.version;
export const isLoadRunning = () => state.loadTimer !== null;

/** Backlog saturation in [0,1] — drives FLAW 1's shedding behaviour. */
function backlogPressure() {
  return Math.min(1, state.openSockets / SOCKET_CAPACITY);
}

/**
 * Advance one checkout through the shared decision function and record it.
 * Used by both the real HTTP handler and the load generator, so the counters
 * are identical whichever drove the request.
 */
export function recordCheckout() {
  const seq = state.seq++;
  const outcome = resolveCheckout(seq, state.version, backlogPressure());

  if (outcome.holdsSocket) {
    // A held socket occupies the backlog for the duration of the timeout.
    state.openSockets++;
    setTimeout(() => {
      state.openSockets = Math.max(0, state.openSockets - 1);
    }, Math.min(outcome.latencyMs, 6000)).unref?.();
  }

  state.window.push(outcome);
  if (state.window.length > WINDOW) state.window.shift();
  return outcome;
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

export function metrics() {
  const w = state.window;
  const n = w.length;
  const res = nominalResources(state.seq);

  if (!n) {
    return {
      version: state.version,
      errorRatePct: 0,
      p99LatencyMs: 0,
      reqPerMin: 0,
      fraudTimeoutPct: 0,
      socketBacklog: state.openSockets,
      socketCapacity: SOCKET_CAPACITY,
      sampleSize: 0,
      ...res,
      note: 'no traffic yet — POST /load/start',
    };
  }

  const failures = w.filter((r) => !r.ok).length;
  const timeouts = w.filter((r) => r.fraudTimedOut).length;
  const latencies = w.map((r) => r.latencyMs).sort((a, b) => a - b);
  const elapsedMin = Math.max((Date.now() - state.startedAt) / 60000, 1 / 60);

  return {
    version: state.version,
    errorRatePct: +((failures / n) * 100).toFixed(1),
    p99LatencyMs: percentile(latencies, 99),
    p50LatencyMs: percentile(latencies, 50),
    reqPerMin: Math.round(Math.min(state.seq, WINDOW * 4) / elapsedMin),
    fraudTimeoutPct: +((timeouts / n) * 100).toFixed(1),
    socketBacklog: state.openSockets,
    socketCapacity: SOCKET_CAPACITY,
    sampleSize: n,
    ...res,
    rolledBackAt: state.rolledBackAt,
  };
}

/** Span breakdown isolating fraud-detection-svc as the dominant cost. */
export function trace() {
  const w = state.window.slice(-120);
  const timedOut = w.filter((r) => r.fraudTimedOut);
  const OTHER_SPANS_MS = 30; // validate_cart + INSERT orders

  // Share-of-request is measured against the SLOW requests, not the whole
  // window. Dividing a 5s fraud span by an average that includes fast requests
  // yields percentages above 100.
  const slowAvg = timedOut.length
    ? Math.round(timedOut.reduce((a, r) => a + r.latencyMs, 0) / timedOut.length)
    : 0;
  const fraudAvg = Math.max(0, slowAvg - OTHER_SPANS_MS);
  const total = w.length
    ? Math.round(w.reduce((a, r) => a + r.latencyMs, 0) / w.length)
    : 0;
  const pctOf = (ms) => (slowAvg ? +((ms / slowAvg) * 100).toFixed(1) : 0);

  return {
    traceId: `trace-${state.seq}`,
    version: state.version,
    rootSpan: 'POST /v1/checkout/charge',
    totalAvgMs: total,
    slowRequestAvgMs: slowAvg,
    spans: [
      { service: 'payment-service', op: 'validate_cart', avgMs: 12, pctOfSlowRequest: pctOf(12) },
      {
        service: 'fraud-detection-svc',
        op: 'POST /v1/score (synchronous)',
        avgMs: fraudAvg,
        pctOfSlowRequest: pctOf(fraudAvg),
        note: fraudAvg ? 'BOTTLENECK — sockets held in SYN_SENT until timeout' : 'within budget',
      },
      { service: 'postgres-replica', op: 'INSERT orders', avgMs: 18, pctOfSlowRequest: pctOf(18) },
    ],
    dominantSpan: 'fraud-detection-svc',
    expectedFraudTimeoutPct: +(FRAUD_TIMEOUT_RATE * 100).toFixed(1),
  };
}

/** The rollback. Returns before/after so the caller can report real numbers. */
export function setVersion(next) {
  if (next !== BROKEN_VERSION && next !== STABLE_VERSION) {
    throw new Error(`unsupported version: ${next}`);
  }
  const before = metrics();
  state.version = next;
  state.window = []; // measure the new version cleanly
  state.rolledBackAt = next === STABLE_VERSION ? new Date().toISOString() : null;
  return { before, version: next };
}

export function startLoad(ratePerMin = 1420) {
  if (state.loadTimer) return { started: false, reason: 'already running', ratePerMin };
  const intervalMs = Math.max(5, Math.round(60000 / ratePerMin));
  state.startedAt = Date.now();
  state.loadTimer = setInterval(recordCheckout, intervalMs);
  state.loadTimer.unref?.();
  return { started: true, ratePerMin, intervalMs };
}

export function stopLoad() {
  if (!state.loadTimer) return { stopped: false, reason: 'not running' };
  clearInterval(state.loadTimer);
  state.loadTimer = null;
  return { stopped: true };
}

/**
 * Restore the broken state for another take.
 *
 * Traffic is resumed if it was running. A reset between takes is meant to
 * return to "broken and under load" — the state a take opens in — so silently
 * stopping the generator left the next take showing zeroes.
 */
export function reset() {
  const wasRunning = state.loadTimer !== null;
  stopLoad();
  state = freshState();
  if (wasRunning) startLoad();
  return { reset: true, version: state.version, loadResumed: wasRunning };
}
