/**
 * acme-pay demo sandbox — zero dependencies, node:http only.
 *
 * Binds to 127.0.0.1 exclusively. It holds no secrets, makes no outbound
 * calls, and moves no money. See README.md for the three deliberate flaws.
 */

import http from 'node:http';
import {
  metrics,
  trace,
  setVersion,
  startLoad,
  stopLoad,
  reset,
  recordCheckout,
  getVersion,
  isLoadRunning,
} from './state.mjs';
import { STABLE_VERSION, BROKEN_VERSION } from './scenario.mjs';

const HOST = '127.0.0.1';
const PORT = Number(process.env.SANDBOX_PORT || 4000);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function send(res, status, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    // Same-origin is not assumed: the Next proxy runs on :3000.
    'access-control-allow-origin': 'http://localhost:3000',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
  });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    return {};
  }
}

const server = http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, `http://${HOST}:${PORT}`);
  const method = req.method || 'GET';

  if (method === 'OPTIONS') return send(res, 204, {});

  try {
    // --- the flawed endpoint -------------------------------------------------
    if (pathname === '/checkout' && method === 'POST') {
      const outcome = recordCheckout();
      // Replay the decided latency for real, so curl and the browser observe
      // the same behaviour the metrics describe.
      await sleep(Math.min(outcome.latencyMs, 6500));
      return outcome.ok
        ? send(res, 200, {
            orderId: `ord_${Date.now().toString(36)}`,
            verdict: outcome.verdict,
            latencyMs: outcome.latencyMs,
            version: getVersion(),
          })
        : send(res, outcome.status, {
            error:
              outcome.status === 504
                ? 'gateway timeout: fraud-detection-svc did not respond within 5000ms'
                : 'checkout failed',
            latencyMs: outcome.latencyMs,
            version: getVersion(),
          });
    }

    // --- observability -------------------------------------------------------
    if (pathname === '/metrics' && method === 'GET') return send(res, 200, metrics());
    if (pathname === '/trace' && method === 'GET') return send(res, 200, trace());
    if (pathname === '/health' && method === 'GET') {
      return send(res, 200, { ok: true, version: getVersion(), loadRunning: isLoadRunning() });
    }

    // --- admin ---------------------------------------------------------------
    if (pathname === '/admin/version') {
      if (method === 'GET') return send(res, 200, { version: getVersion() });
      if (method === 'POST') {
        const { version } = await readJson(req);
        try {
          const { before, version: now } = setVersion(version);
          return send(res, 200, {
            ok: true,
            from: before.version,
            to: now,
            before: {
              errorRatePct: before.errorRatePct,
              p99LatencyMs: before.p99LatencyMs,
              podMemoryPct: before.podMemoryPct,
              dbPoolActive: before.dbPoolActive,
            },
            note:
              now === STABLE_VERSION
                ? 'Rolled back. Fraud check is now budgeted at 300ms with a fallback verdict. Memory and DB pool are unchanged — they were never the cause.'
                : 'Restored the broken release.',
          });
        } catch (err) {
          return send(res, 400, {
            error: String(err.message),
            allowed: [BROKEN_VERSION, STABLE_VERSION],
          });
        }
      }
    }

    if (pathname === '/admin/reset' && method === 'POST') return send(res, 200, reset());
    if (pathname === '/load/start' && method === 'POST') {
      const { ratePerMin } = await readJson(req);
      return send(res, 200, startLoad(ratePerMin || 1420));
    }
    if (pathname === '/load/stop' && method === 'POST') return send(res, 200, stopLoad());

    return send(res, 404, { error: 'not found', pathname });
  } catch (err) {
    return send(res, 500, { error: 'sandbox failure', detail: String(err?.message ?? err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`acme-pay sandbox → http://${HOST}:${PORT}`);
  console.log(`  version ${getVersion()} (broken). POST /load/start to begin traffic.`);
});
