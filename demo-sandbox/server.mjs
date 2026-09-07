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

/**
 * Operator console served at /. Polls the same endpoints EchoSphere reads, so
 * what is on screen here is exactly what the demo consumes — and it doubles as
 * the control surface for driving a take (start load, roll back, reset).
 */
const INDEX_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>acme-pay sandbox</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{color-scheme:dark}
*{box-sizing:border-box;margin:0;padding:0}
body{font:14px/1.5 ui-sans-serif,system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:32px}
main{max-width:820px;margin:0 auto}
h1{font-size:18px;font-weight:600;letter-spacing:-.01em}
.sub{color:#94a3b8;font-size:12px;margin-top:4px}
.pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:3px 10px;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.bad{background:#4c0519;color:#fda4af}.good{background:#052e2b;color:#6ee7b7}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:24px 0}
.card{background:#1e293b;border:1px solid #334155;border-radius:8px;padding:12px}
.k{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8}
.v{font:600 20px ui-monospace,monospace;margin-top:4px;font-variant-numeric:tabular-nums}
.muted .v{color:#94a3b8}
button{font:inherit;font-size:12px;font-weight:600;background:#334155;color:#e2e8f0;border:1px solid #475569;border-radius:6px;padding:7px 12px;cursor:pointer}
button:hover{background:#475569}
button.primary{background:#e2e8f0;color:#0f172a;border-color:#e2e8f0}
.row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:12px}
td{padding:6px 0;border-bottom:1px solid #1e293b;color:#94a3b8}
td:first-child{font-family:ui-monospace,monospace;color:#e2e8f0;width:230px}
.note{font-size:11px;color:#64748b;margin-top:20px;line-height:1.6}
</style></head><body><main>
<h1>acme-pay <span id="pill" class="pill bad">loading</span></h1>
<div class="sub">Deliberately flawed payment service backing the EchoSphere INC-8921 demo.</div>

<div class="grid">
  <div class="card"><div class="k">Version</div><div class="v" id="ver">-</div></div>
  <div class="card"><div class="k">Error rate</div><div class="v" id="err">-</div></div>
  <div class="card"><div class="k">p99 latency</div><div class="v" id="p99">-</div></div>
  <div class="card"><div class="k">Fraud timeout</div><div class="v" id="fraud">-</div></div>
  <div class="card muted"><div class="k">Pod memory</div><div class="v" id="mem">-</div></div>
  <div class="card muted"><div class="k">DB pool</div><div class="v" id="pool">-</div></div>
</div>

<div class="row">
  <button class="primary" onclick="post('/load/start')">Start traffic</button>
  <button onclick="post('/load/stop')">Stop traffic</button>
  <button onclick="rollback()">Roll back to v2.8.0</button>
  <button onclick="post('/admin/reset')">Reset for next take</button>
</div>

<table>
  <tr><td>GET /metrics</td><td>live counters over a rolling window</td></tr>
  <tr><td>GET /trace</td><td>span breakdown isolating the bottleneck</td></tr>
  <tr><td>POST /checkout</td><td>the flawed endpoint (really waits)</td></tr>
  <tr><td>POST /admin/version</td><td>{"version":"v2.8.0"} performs the rollback</td></tr>
  <tr><td>POST /admin/reset</td><td>restore the broken state</td></tr>
</table>

<p class="note">Memory and DB pool stay flat across the rollback &mdash; they were never the cause.
That is the red herring the demo refutes. Fraud timeout also stays ~45% afterwards: rolling back
does not repair fraud-detection-svc, it stops payment-service depending on it synchronously.</p>

<script>
const $=id=>document.getElementById(id);
async function post(p){await fetch(p,{method:'POST',headers:{'content-type':'application/json'},body:'{}'});tick()}
async function rollback(){await fetch('/admin/version',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({version:'v2.8.0'})});tick()}
async function tick(){
  try{
    const m=await (await fetch('/metrics',{cache:'no-store'})).json();
    const broken=m.errorRatePct>=2;
    $('pill').textContent=broken?'major outage':'operational';
    $('pill').className='pill '+(broken?'bad':'good');
    $('ver').textContent=m.version;
    $('err').textContent=(m.errorRatePct??0)+'%';
    $('p99').textContent=((m.p99LatencyMs??0)/1000).toFixed(2)+'s';
    $('fraud').textContent=(m.fraudTimeoutPct??0)+'%';
    $('mem').textContent=(m.podMemoryPct??0)+'%';
    $('pool').textContent=(m.dbPoolActive??0)+'/'+(m.dbPoolMax??100);
  }catch(e){$('pill').textContent='unreachable'}
}
tick();setInterval(tick,2000);
</script>
</main></body></html>`;

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
    // --- index ---------------------------------------------------------------
    // Opening the port in a browser is the first thing anyone tries, so serve
    // something useful there rather than a 404 that reads as a broken sandbox.
    if (pathname === '/' && method === 'GET') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      return res.end(INDEX_HTML);
    }

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

// A raw EADDRINUSE stack trace is the last thing anyone wants on screen during
// a take. Most often the port is held by a sandbox left over from a previous
// run, so say that plainly and exit quietly.
server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`\nPort ${PORT} is already in use — most likely an earlier sandbox is still running.`);
    console.error('\nFind and stop it:');
    console.error(`  pkill -f "node server.mjs"`);
    console.error('\nOr run this one on a different port:');
    console.error(`  SANDBOX_PORT=4001 npm start`);
    console.error('\nIf it is already running, you may not need a new one:');
    console.error(`  curl -s http://${HOST}:${PORT}/health\n`);
    process.exit(1);
  }
  console.error('sandbox failed to start:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`acme-pay sandbox → http://${HOST}:${PORT}`);
  console.log(`  version ${getVersion()} (broken). POST /load/start to begin traffic.`);
});

// Ctrl-C should stop cleanly rather than leaving the port held for the next run.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log('\nstopping acme-pay sandbox');
    server.close(() => process.exit(0));
    // Force exit if a held socket keeps the server alive past the timeout.
    setTimeout(() => process.exit(0), 500).unref();
  });
}
