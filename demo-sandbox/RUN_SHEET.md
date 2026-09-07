# EchoSphere — INC-8921 Demo Run Sheet

**Cast:** 3 people + the AI. **Target runtime:** 4:00–4:30.

---

## Casting — this is not arbitrary

Ledger cards are attributed to the **scripted** speaker, not to whoever actually
talks. So the first two roles are fixed:

| Person | Plays | Must speak |
|---|---|---|
| **A** | Ashley Sawatsky — Incident Commander | Beats **1** and **5** |
| **B** | David Chen — Lead SRE | Beats **2**, **3**, **4** |
| **C** | Sarah Connor — Comms Lead | **No beats.** Colour, comms, dashboard tour |

If B speaks beat 1, the card still says "Ashley Sawatsky" and the demo reads
wrong. Keep A and B on their own beats.

**A drives the screen share** throughout. C takes over the browser only for the
dashboard tour in Scene 5 — or A keeps driving and C narrates. Decide beforehand.

**C must avoid trigger words.** Her lines below are written to be safe. If she
improvises, keep her clear of: *dashboard, socket, downstream, error rate,
memory leak, connection pool, fraud detection, canary rollback, v2.8.1*.

---

## Pre-flight — 10 minutes before recording

**1. Start the sandbox** (terminal 1):

```bash
cd demo-sandbox && npm start
```

If it says the port is in use, a previous one is still alive:

```bash
pkill -f "node server.mjs" && cd demo-sandbox && npm start
```

**2. Confirm `.env.local` has `DEMO_SANDBOX=1`**, then start the app (terminal 2):

```bash
pnpm run dev
```

**3. Start traffic** (terminal 3, or click **Start traffic** at `localhost:4000`):

```bash
curl -X POST http://127.0.0.1:4000/load/start
```

**4. Wait ~30 seconds**, then confirm the numbers have converged:

```bash
curl -s http://127.0.0.1:4000/metrics
```

Expect error rate 43–48%, p99 ~6,100–6,800ms. If they are still at 0, traffic
did not start.

**5. Open tabs in this order** (A's screen):

| Tab | URL | Role |
|---|---|---|
| 1 | `localhost:3000` | Portal — the opening shot |
| 2 | `localhost:3000/demo-app` | acme-pay — should be **RED** |
| 3 | `localhost:3000/war-room` | The call |
| 4 | `localhost:3000/incidents/INC-8921` | Command center, for Scene 5 |

Keep `localhost:4000` open on a **second monitor** or minimised. It is your
control panel — never show it on camera.

**6. Verify the reset state.** Tab 2 must be red and say *504 Gateway Timeout*.
If it is green, click **Reset for next take** on `localhost:4000`, then reload.

**7. B and C join the war room** from their own machines using the production
URL (`agora-knotic-5vyh.vercel.app/war-room`) — or all three on one machine with
separate browser profiles if you are recording solo-style.

---

## SCENE 1 — The hook (0:00–0:25)

**Screen:** Tab 1, the portal.

> **A:** "This is EchoSphere. Two surfaces of the same outage — the checkout our
> customers are hitting, and the incident commander watching the call."

**A clicks the acme-pay card.** Tab 2 opens: full red, **504 Gateway Timeout**,
error rate climbing live.

> **A:** "Payments are down. Forty-seven percent of checkouts are failing right
> now, and p99 is over six seconds. These numbers are live — that is real traffic
> hitting a real service."

*Optional, strong if you have the terminal on screen:*

```bash
curl -i -X POST http://127.0.0.1:4000/checkout
```

> **A:** "Watch this hang… five seconds… and a 504."

**A switches to Tab 3 — the war room.**

---

## SCENE 2 — Triage (0:25–1:05) → **BEAT 1**

**Screen:** Tab 3. All three visible, EchoSphere AI listed as a silent participant.

> **C (Sarah):** "Comms is on. I have the status page staged and I am holding
> until you confirm what customers are seeing."

*(Safe — no trigger words. Noise filter may skip it entirely, which is fine.)*

> **A (Ashley) — BEAT 1, say this clearly:**
> **"Team, starting triage on INC-8921. Payment processing 5xx error rate is at
> 47.2% and p99 latency spiked to 6.2 seconds. Approximately 1,420 checkout
> attempts per minute are failing."**

▶ **A green `FACT` card appears in the ledger.** Pause two seconds and let the
audience see it land.

> **A:** "EchoSphere is listening. It just committed that as a confirmed fact —
> not a guess."

---

## SCENE 3 — The hypothesis (1:05–1:40) → **BEAT 2**

> **B (David) — BEAT 2:**
> **"Looking at recent deploys. payment-service v2.8.1 went live 20 minutes ago.
> Hypothesis: worker thread recursion memory leak on the new payment
> orchestrator."**

▶ **An amber `HYPOTHESIS` card appears.**

> **A:** "Note it did not record that as fact. It is tagged as a hypothesis,
> still open."

> **C:** "Do I tell customers it is a bad release? I do not want to publish
> something we walk back."

> **A:** "Hold. We have not confirmed it."

*(C's line is the reason the next beat matters — do not cut it.)*

---

## SCENE 4 — The contradiction (1:40–2:20) → **BEATS 3 & 4**

> **B (David) — BEAT 3:**
> **"Wait, disproving that. HolmesGPT telemetry query confirms DB connection pool
> utilization is at 22% and pod memory usage is nominal at 58%. It is NOT a
> memory leak or connection starvation."**

▶ **A red `CONTRADICTION` card appears** with the analysis box.

> **A:** "That is the moment. Two responders disagreed, and EchoSphere caught it
> against live telemetry — the memory-leak theory is dead. In a real war room
> that is twenty minutes of people chasing the wrong thing."

> **B (David) — BEAT 4:**
> **"Isolating downstream trace: downstream dependency fraud detection service
> timeout rate is 45%. It is holding open client sockets and exhausting the
> connection backlog."**

▶ **A green `FACT` card — the root cause.**

> **C:** "So it was never the release itself."

> **B:** "The release just made us wait on something slow."

---

## SCENE 5 — Authorize (2:20–3:00) → **BEAT 5**

> **A (Ashley) — BEAT 5:**
> **"Acknowledged. Three immediate action items: first, execute canary rollback on
> payment-service to v2.8.0. Second, page Fraud SRE on-call for socket
> saturation. Third, broadcast customer update on Slack and Statuspage."**

▶ **An `ACTION` card appears, and the Human Approval card surfaces** with
**Authorize 1-Click**.

> **A:** "Nothing has executed. EchoSphere staged the fix and stopped — a human
> authorizes, always."

**A clicks `Authorize 1-Click`.**

*Alternative, more impressive if the agent is reliable — A says instead:*
> **"EchoSphere, authorize the rollback."**

Both do exactly the same thing.

---

## SCENE 6 — The payoff (3:00–3:30)

**A switches to Tab 2 — acme-pay.**

Within about two seconds it flips **GREEN**, **200 OK**, *All systems
operational*.

> **A:** "Error rate: zero point three percent. p99: under half a second."

**Point at the two greyed-out tiles.**

> **A:** "And look at these. Pod memory: fifty-eight percent. DB pool:
> twenty-two of a hundred. Exactly where they were before. They never moved —
> because they were never the problem. That is the hypothesis EchoSphere threw
> out, proven wrong on screen."

*This is the strongest ten seconds in the demo. Do not rush it.*

---

## SCENE 7 — Command center & post-mortem (3:30–4:20)

The authorize action auto-routes to the post-mortem after ~1.2s. Let it, or go
to Tab 4 first for the tour.

**C drives here.**

> **C:** "Status page is going out now, and the record is already written."

**On `/incidents/INC-8921` show, briefly:**

1. **Timeline & Video** tab — scrub the recording, click a chapter pin
2. The **AI ledger rail** — facts, hypotheses, the contradiction
3. **Actions** tab — tick a remaining item
4. **Escalate** → Fraud SRE → **Page On-Call Team**

**Then the post-mortem** (`/post-mortem/INC-8921`):

> **A:** "The post-incident review wrote itself — timeline, the disproven
> hypothesis, the root cause, and who authorized the fix. Nobody took notes."

> **A (close):** "EchoSphere listened to a conversation, separated fact from
> guess, caught the contradiction, and gated the fix behind a human. That is the
> whole product."

---

## Between takes — 15 seconds

1. Click **Reset for next take** on `localhost:4000`
2. Click **Start traffic**
3. Reload Tab 2 — confirm it is **RED** again
4. Reload Tab 3 for a fresh war room

The demo is deterministic: same inputs, same numbers, every take.

---

## If something goes wrong

| Symptom | Fix |
|---|---|
| A beat does not fire | Press **Ctrl+Alt+N**. Advances the next beat silently. Nobody watching can tell. |
| Beats fire out of order | Cannot happen — only `currentBeat + 1` is eligible. |
| acme-pay stays red after authorize | Reload the tab. State is read on mount. |
| acme-pay opens green | Reset was skipped. Click **Reset for next take**. |
| Numbers show 0 | Traffic is not running. Click **Start traffic**. |
| Sandbox will not start | `pkill -f "node server.mjs"` then start again. |
| Agent does not join | Carry on. Drive every beat with **Ctrl+Alt+N** — cards look identical. |

---

## What is real, and what is not

Say this if asked; it is a strength, not a weakness.

**Real, locally:** the traffic, the error rates, the 5-second socket timeouts, the
rollback, and the recovery. `POST /checkout` genuinely fails and genuinely
recovers.

**Staged:** the spoken script, and the fact that the backend is a purpose-built
sandbox rather than a production payment system.

**On the deployed Vercel URL** the sandbox cannot run — deliberately, since the
remediation path executes code. There the numbers are scripted and the red-to-green
flip rides a cross-tab signal. It looks identical. **Record locally** if you want
the numbers to be genuine.
