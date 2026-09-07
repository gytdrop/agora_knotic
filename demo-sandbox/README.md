# acme-pay — INC-8921 demo sandbox

A deliberately broken payment service. It exists so the EchoSphere demo's
telemetry is **measured rather than narrated**: the beat cards read live
numbers, and "Authorize 1-Click" performs a rollback that genuinely changes
system behaviour.

Zero dependencies. `node:http` only. Binds to `127.0.0.1` exclusively, holds no
secrets, makes no outbound calls, and moves no money.

## Run it

```bash
cd demo-sandbox && npm start
```

```bash
curl -X POST http://127.0.0.1:4000/load/start
```

Give it ~25 seconds to fill the metrics window, then:

```bash
curl -s http://127.0.0.1:4000/metrics
```

To surface it inside the Next.js app, set `DEMO_SANDBOX=1` in `.env.local`.
Without it the proxy route 404s and the app falls back to its hardcoded strings.

## The three deliberate flaws

**Do not fix these. They are the product.** Each is isolated in `scenario.mjs`
behind a comment marking it intentional.

### 1. The real root cause — `fraud-detection-svc`
`/checkout` calls fraud detection **synchronously**. ~45% of calls hang until a
5s timeout, holding the client socket the whole time. Sockets accumulate, the
accept backlog saturates, and checkout returns 504. Drives beats 1 and 4.

### 2. The red herring — v2.8.1 recursive retry
v2.8.1 added a recursive retry on failed gateway handshakes. In review it reads
like an unbounded memory leak. It is bounded at depth 3 and costs nothing:
memory stays flat at ~58%, DB pool at 22/100.

This is what makes the demo honest. The SRE's hypothesis is *reasonable* and
*wrong*, and the telemetry is what refutes it. Drives beats 2 and 3.

### 3. The version flag — the fix
v2.8.1 routes checkout through the synchronous fraud call. v2.8.0 budgets it at
300ms with a fallback verdict, so checkout succeeds even while fraud detection
is still slow.

Rolling back does **not** repair `fraud-detection-svc` — the timeout rate stays
~45% afterwards. It stops payment-service being hostage to it.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/checkout` | The flawed endpoint. Really sleeps, so curl sees honest latency. |
| `GET` | `/metrics` | Live counters over a rolling 600-request window |
| `GET` | `/trace` | Span breakdown isolating the bottleneck |
| `GET` | `/health` | Liveness + current version |
| `GET`/`POST` | `/admin/version` | Read / perform the rollback |
| `POST` | `/admin/reset` | Restore the broken state between takes |
| `POST` | `/load/start`, `/load/stop` | Traffic generator (~1,420 req/min) |

## Measured behaviour

Numbers converge on the script's values on their own; they are not asserted.
Expect small run-to-run variation — that is deliberate, since a reading that is
exactly 47.2% every poll looks fabricated.

| | v2.8.1 (broken) | v2.8.0 (rolled back) |
|---|---|---|
| Checkout error rate | ~44% | **~0%** |
| p99 latency | ~6,100ms | **~460ms** |
| Fraud timeout rate | ~43% | ~44% (*unchanged — not repaired*) |
| Pod memory | ~58% | **~58% (unchanged)** |
| DB pool | 22/100 | **22/100 (unchanged)** |

The last two rows are the point: the rollback fixes the outage without moving
memory or pool, proving those were never the cause.

## Determinism

Outcomes derive from a request sequence number hashed through a fixed function,
never `Math.random`. Take three behaves like take one. `POST /admin/reset`
returns to a clean broken state.

The traffic generator resolves each request through the same
`resolveCheckout()` the HTTP handler uses, but computes latency numerically
instead of sleeping — otherwise sustaining 1,420 req/min against a 5s timeout
would need ~118 concurrent sockets. Counters are identical either way; only
`POST /checkout` actually waits.

## Safety

- Never bound to anything but `127.0.0.1`
- The Next.js proxy (`/api/sandbox/*`) is read-only, allowlisted to
  `metrics`/`trace`/`health`, and 404s unless `NODE_ENV !== 'production'` **and**
  `DEMO_SANDBOX=1`
- `/api/remediate` accepts an allowlisted `actionType` key only. It never takes
  a command, path, or URL from the request body.
- This repo ships `vercel.json` and `railway.json`. The whole mechanism is inert
  on a deployed instance.
