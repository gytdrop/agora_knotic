/**
 * acme-pay — the three DELIBERATE flaws.
 *
 * These are the product. They exist so the EchoSphere demo has something real
 * to find, refute, and fix. Do not "repair" them.
 *
 * Everything here is deterministic: outcomes derive from a request sequence
 * number, never Math.random. A demo that behaves differently on take three is
 * worthless, and the scripted numbers have to reproduce on camera.
 */

/** Hash a sequence number into a stable [0,1) — our deterministic "randomness". */
function jitter(seq, salt = 0) {
  const x = Math.sin((seq + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

// ---------------------------------------------------------------------------
// FLAW 1 (DELIBERATE) — the real root cause.
//
// payment-service calls fraud-detection-svc SYNCHRONOUSLY. On ~45% of requests
// that call hangs until a 5s timeout, holding the client socket open the whole
// time. Sockets accumulate, the accept backlog fills, and /checkout returns 504.
// ---------------------------------------------------------------------------
export const FRAUD_TIMEOUT_RATE = 0.451;
export const FRAUD_TIMEOUT_MS = 5000;

export function fraudCallTimesOut(seq) {
  return jitter(seq, 1) < FRAUD_TIMEOUT_RATE;
}

// ---------------------------------------------------------------------------
// FLAW 2 (DELIBERATE) — the red herring.
//
// v2.8.1 added a recursive retry on failed gateway handshakes. In review it
// reads like an unbounded memory leak, which is exactly the point: it is the
// hypothesis a competent SRE forms and the telemetry then refutes. The
// recursion is bounded at depth 3, so memory stays flat and thread pools stay
// healthy. Beat 3 is only honest because this really is harmless.
// ---------------------------------------------------------------------------
export const RETRY_MAX_DEPTH = 3;

export function recursiveHandshakeRetry(seq, depth = 0) {
  if (depth >= RETRY_MAX_DEPTH) return { attempts: depth, settled: false };
  if (jitter(seq, depth + 7) > 0.5) return { attempts: depth + 1, settled: true };
  return recursiveHandshakeRetry(seq, depth + 1);
}

/**
 * Memory and DB pool are FLAT and identical across versions. The rollback must
 * not move them — that is what proves the leak hypothesis was wrong.
 */
export function nominalResources(seq) {
  return {
    podMemoryPct: +(58 + jitter(seq, 3) * 0.8 - 0.4).toFixed(1), // ~58%, limit 4GB
    dbPoolActive: 22, // of 100 leases
    dbPoolMax: 100,
    workerThreadsHealthy: true,
  };
}

// ---------------------------------------------------------------------------
// FLAW 3 (DELIBERATE) — the version flag, i.e. the fix.
//
// v2.8.1 routes /checkout through the synchronous fraud call above.
// v2.8.0 routes through a 300ms budget with a fallback verdict, so checkout
// succeeds even while fraud-detection-svc is still slow. Rolling back does not
// repair fraud-detection-svc; it stops payment-service from being hostage to it.
// ---------------------------------------------------------------------------
export const BROKEN_VERSION = 'v2.8.1';
export const STABLE_VERSION = 'v2.8.0';

const FRAUD_BUDGET_MS = 300;
const BASELINE_FAILURE_RATE = 0.002; // unrelated 5xx floor, present in both versions

/**
 * Resolve one checkout without performing any waiting. Returns the outcome and
 * the latency it *would* have taken, so the load generator can sustain
 * ~1,420 req/min while the real HTTP handler replays the same numbers by
 * actually sleeping. Both paths share this function, so counters never diverge.
 *
 * `backlogPressure` is the current socket backlog saturation in [0,1]. Under
 * v2.8.1 a saturated backlog sheds extra requests — this is what lifts the
 * observed error rate above the raw fraud timeout rate, and it is why the
 * script's 47.2% and 45.1% are different numbers.
 */
export function resolveCheckout(seq, version, backlogPressure = 0) {
  const retry = recursiveHandshakeRetry(seq); // FLAW 2: runs, costs nothing
  const baselineFails = jitter(seq, 11) < BASELINE_FAILURE_RATE;

  if (version === STABLE_VERSION) {
    // Fraud check is advisory: budget it, fall back, never block the sale.
    const slow = fraudCallTimesOut(seq);
    return {
      ok: !baselineFails,
      status: baselineFails ? 500 : 200,
      latencyMs: Math.round(45 + jitter(seq, 5) * 120 + (slow ? FRAUD_BUDGET_MS : 0)),
      verdict: slow ? 'ALLOW (fallback: fraud budget exceeded)' : 'ALLOW',
      fraudTimedOut: slow,
      holdsSocket: false,
      retryAttempts: retry.attempts,
    };
  }

  // BROKEN_VERSION — synchronous, socket-holding.
  const timedOut = fraudCallTimesOut(seq);
  if (timedOut) {
    return {
      ok: false,
      status: 504,
      // 5s timeout plus queueing; spreads high enough to put p99 near 6.2s.
      latencyMs: Math.round(FRAUD_TIMEOUT_MS + 400 + jitter(seq, 6) * 1400),
      verdict: null,
      fraudTimedOut: true,
      holdsSocket: true,
      retryAttempts: retry.attempts,
    };
  }

  // Backlog saturation sheds a slice of the requests that would have succeeded.
  const shed = jitter(seq, 9) < backlogPressure * 0.05;
  if (shed || baselineFails) {
    return {
      ok: false,
      status: shed ? 503 : 500,
      latencyMs: Math.round(80 + jitter(seq, 8) * 200),
      verdict: null,
      fraudTimedOut: false,
      holdsSocket: false,
      retryAttempts: retry.attempts,
    };
  }

  return {
    ok: true,
    status: 200,
    latencyMs: Math.round(90 + jitter(seq, 4) * 260),
    verdict: 'ALLOW',
    fraudTimedOut: false,
    holdsSocket: false,
    retryAttempts: retry.attempts,
  };
}
