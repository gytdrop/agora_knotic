# EchoSphere — INC-8921 Demo Run Sheet

**Everything runs on the deployed URL. Nothing to install, nothing to start.**

```
https://agora-knotic-5vyh.vercel.app
```

**Cast:** 3 people + the AI. **Target runtime:** 4:00–4:30.

---

## 1 · What each person opens

### Person A — Incident Commander *(shares screen — the audience sees only this)*

Open these four tabs, in this order, before recording:

| Tab | URL |
|---|---|
| **1** | `https://agora-knotic-5vyh.vercel.app` |
| **2** | `https://agora-knotic-5vyh.vercel.app/demo-app` |
| **3** | `https://agora-knotic-5vyh.vercel.app/war-room` |
| **4** | `https://agora-knotic-5vyh.vercel.app/incidents/INC-8921` |

### Person B — Lead SRE
One tab only:
```
https://agora-knotic-5vyh.vercel.app/war-room
```

### Person C — Comms Lead
One tab only:
```
https://agora-knotic-5vyh.vercel.app/war-room
```

**Only A shares their screen.** B and C are in the call as participants — their
faces and voices carry, but nobody sees their browser. This removes most of the
ways a take can be ruined.

> Use the address above, **not** a preview URL with a build hash in it
> (`...-lraoqtwi9-...`). Preview deployments are access-protected and will show a
> "Request Sent" screen instead of the app.

---

## 2 · Casting — this is not arbitrary

Ledger cards are attributed to the **scripted** speaker, not to whoever actually
talks. Two roles are therefore fixed:

| Person | Plays | Must speak |
|---|---|---|
| **A** | Ashley Sawatsky — Incident Commander | Beats **1** and **5** |
| **B** | David Chen — Lead SRE | Beats **2**, **3**, **4** |
| **C** | Sarah Connor — Comms Lead | **No beats** — reaction and comms only |

If B speaks Beat 1, the card still reads "Ashley Sawatsky" and the demo looks
broken. Keep A and B on their own beats.

**C must avoid trigger words** if improvising: *dashboard, socket, downstream,
error rate, memory leak, connection pool, fraud detection, canary rollback,
v2.8.1*. Her scripted lines below are already verified clear of all of them.

---

## 3 · Pre-flight — 3 minutes

1. **A opens the four tabs above.** B and C open the war room.
2. **Check Tab 2 is RED** and reads *504 Gateway Timeout*.
   If it is green, scroll to the bottom of that page and click
   **Reset for next take**, then reload.
3. **All three join the war room** — enter names, allow mic and camera, click
   **Join War Room**. Wait until the EchoSphere AI Sentinel appears as a
   participant. That is your transcription; without it, beats fire only by
   hotkey.
4. **A returns to Tab 1** (the portal). That is the opening shot.
5. **A starts screen share and recording.**

---

## SCENE 1 — The hook (0:00–0:25)

**Screen: Tab 1 — the portal.**

> **A:** "This is EchoSphere. Two surfaces of the same outage — the checkout our
> customers are hitting, and the incident commander that's listening to the call."

**A clicks the acme-pay card** → Tab 2: full red, **504 Gateway Timeout**.

> **A:** "Payments are down. Forty-seven percent of checkouts failing, p99 over
> six seconds. Right now a customer clicking Pay gets nothing."

**A switches to Tab 3 — the war room.**

---

## SCENE 2 — Triage (0:25–1:05) → **BEAT 1**

**Screen: Tab 3.** All three participants visible, plus EchoSphere AI.

> **C:** "Comms is on. I've got the status page staged and I'm holding until you
> confirm what customers are seeing."

> **A — BEAT 1, say this clearly:**
> **"Team, starting triage on INC-8921. Payment processing 5xx error rate is at
> 47.2% and p99 latency spiked to 6.2 seconds. Approximately 1,420 checkout
> attempts per minute are failing."**

▶ **A green `FACT` card appears.** Pause two seconds. Let it land.

> **A:** "EchoSphere is listening. It just committed that as a confirmed fact —
> not a guess. Nobody typed anything."

---

## SCENE 3 — The hypothesis (1:05–1:40) → **BEAT 2**

> **B — BEAT 2:**
> **"Looking at recent deploys. payment-service v2.8.1 went live 20 minutes ago.
> Hypothesis: worker thread recursion memory leak on the new payment
> orchestrator."**

▶ **An amber `HYPOTHESIS` card appears.**

> **A:** "Notice it did not record that as fact. It's tagged as a hypothesis —
> still open."

> **C:** "Do I tell customers it's a bad release? I don't want to publish
> something we walk back."

> **A:** "Hold. We haven't confirmed it."

*(C's line sets up the next scene. Do not cut it.)*

---

## SCENE 4 — The contradiction (1:40–2:20) → **BEATS 3 & 4**

> **B — BEAT 3:**
> **"Wait, disproving that. HolmesGPT telemetry query confirms DB connection pool
> utilization is at 22% and pod memory usage is nominal at 58%. It is NOT a
> memory leak or connection starvation."**

▶ **A red `CONTRADICTION` card appears** with the analysis box.

> **A:** "That's the moment. Two responders disagreed, and EchoSphere caught it
> against telemetry. The memory-leak theory is dead. In a real war room that's
> twenty minutes of people chasing the wrong thing."

> **B — BEAT 4:**
> **"Isolating downstream trace: downstream dependency fraud detection service
> timeout rate is 45%. It is holding open client sockets and exhausting the
> connection backlog."**

▶ **A green `FACT` card — the root cause.**

> **C:** "So it was never the release itself."

> **B:** "The release just made us wait on something slow."

---

## SCENE 5 — Authorize (2:20–3:00) → **BEAT 5**

> **A — BEAT 5:**
> **"Acknowledged. Three immediate action items: first, execute canary rollback on
> payment-service to v2.8.0. Second, page Fraud SRE on-call for socket
> saturation. Third, broadcast customer update on Slack and Statuspage."**

▶ **An `ACTION` card appears and the Human Approval card surfaces**, showing
**Authorize 1-Click**.

> **A:** "Nothing has executed. EchoSphere staged the fix and stopped. A human
> authorizes — always."

**A clicks `Authorize 1-Click`.**

*Riskier but stronger, if the agent has been transcribing reliably all the way
through — A says instead:*
> **"EchoSphere, authorize the rollback."**

Both do exactly the same thing. **Decide before you record; do not improvise
this.**

---

## SCENE 6 — The payoff (3:00–3:30)

**A switches to Tab 2 — acme-pay.**

It is **GREEN**. **200 OK.** *All systems operational.*

> **A:** "Error rate: nought point three percent. p99: under half a second."

**A points at the two greyed-out tiles.**

> **A:** "And look at these two. Pod memory, fifty-eight percent. Database pool,
> twenty-two out of a hundred. Exactly where they were before. They never moved —
> because they were never the problem. That's the hypothesis EchoSphere threw
> out, proven wrong on screen."

*Strongest ten seconds in the demo. Slow down.*

---

## SCENE 7 — Command centre & post-mortem (3:30–4:20)

Authorizing auto-routes to the post-mortem after about a second. **Let it go**,
then A navigates back to Tab 4 for the tour. **A keeps driving; C narrates.**

> **C:** "Status page is going out, and the record's already written."

**On Tab 4 — `/incidents/INC-8921` — show briefly:**

1. **Timeline & Video** — scrub the recording, click a chapter pin
2. The **AI ledger rail** — facts, hypothesis, the contradiction
3. **Actions** — tick a remaining item
4. **Escalate** → Fraud SRE → **Page On-Call Team**

**Then the post-mortem:**

> **A:** "The post-incident review wrote itself. Timeline, the disproven
> hypothesis, the root cause, who authorized the fix. Nobody took a single note."

> **A (close):** "EchoSphere listened to a conversation, separated fact from
> guess, caught the contradiction, and gated the fix behind a human. That's the
> product."

---

## 4 · Between takes — 30 seconds

1. On Tab 2 (**acme-pay**), scroll down, click **Reset for next take**
2. Reload Tab 2 — confirm it is **RED** again
3. Reload Tab 3 (**war room**) and all three re-join
4. A returns to Tab 1

Reloading the war room between takes is correct and necessary — it clears the
ledger. Reloading it *during* a take is fatal. See below.

---

## 5 · DO NOT — read before every take

### 🔴 Ends the take. No recovery.

**Never press `Ctrl+R` / `F5` / `Cmd+R` in the war room tab.**
Beat progress is held in memory with no persistence. A reload wipes every ledger
card and drops you out of the call. You restart from Scene 1.

**Never leave the war room tab during a take.** Same result:
- clicking the sidebar (Dashboard, Metrics, Workflows, anything)
- the browser Back button
- the **Leave** button in the control dock
- `Ctrl+W`
- clicking **Enter War Room** from another tab — starts a fresh session

Need another page mid-call? `Ctrl+click` to open it in a **new tab**.

### 🟠 Visibly breaks it

**Do not press `Ctrl+Alt+N` unless a beat genuinely failed.** It advances
immediately and there is **no undo** — you skip a scene on camera.

**Do not say the next beat's trigger words early.** The guard blocks jumping
*past* a beat, but the next one is always armed:

| During | Do not say yet |
|---|---|
| Scenes 1–2 | memory leak · worker thread · orchestrator · v2.8.1 · recent deploy |
| Scene 3 | disproving · connection pool · nominal at 58 · not a memory leak |
| Scene 4 | downstream · socket · backlog · fraud detection · timeout rate |
| Scene 5 | canary rollback · dashboard · three immediate · broadcast customer |

**Do not click `Authorize 1-Click` before Beat 5.** No confirmation dialog. It
fires and routes away to the post-mortem, ending the scene.

**Do not click Authorize twice.**

**Do not click "Reset for next take"** on acme-pay during a take.

### 🟡 Looks unprofessional

**Do not open DevTools.** The console prints
`[EchoSphere:VoiceMatcher] Matched Demo Beat #N`, which reveals that beats are
keyword-triggered.

**Do not talk over each other.** Speech-to-text merges overlapping speakers and
mangles the trigger phrase. One beat, one speaker, clean air either side.

**Do not toggle mute repeatedly** — it can cut the transcript mid-sentence and
drop the keyword.

**Do not change zoom or resize** while the war room is connected.

### ⚪ Harmless — do not panic

Reloading **acme-pay**, the **portal**, or the **incident page** is safe.
Scrolling the ledger and hovering chapter pins are safe.

### The one-line rule

**Once the war room is live, the only key you press is `Ctrl+Alt+N` and the only
thing you click is `Authorize 1-Click`. Everything else happens in another tab.**

---

## 6 · If something goes wrong

| Symptom | What to do |
|---|---|
| A beat does not fire | Press **Ctrl+Alt+N**. Advances silently — nobody can tell. |
| Beats fire out of order | Cannot happen. Only the next beat is eligible. |
| acme-pay still red after authorize | Reload that tab. State is read on mount. |
| acme-pay opens green | Reset was skipped. Click **Reset for next take**, reload. |
| AI Sentinel never joins | Carry on and drive all five beats with **Ctrl+Alt+N**. Cards are identical. |
| "Request Sent" access screen | You opened a preview URL. Use the address at the top of this sheet. |
| Someone's mic is dead | They can still act; A can cover their beat with **Ctrl+Alt+N**. |

---

## 7 · If asked what is real

Answer plainly — it is a stronger answer than a dodge.

The conversation, the diarization, the fact/hypothesis separation, the
contradiction detection, and the human-in-the-loop gate are all real and running
live. The **backend being recovered is a purpose-built sandbox**, not a
production payment system, and on the deployed URL its figures are fixed rather
than measured.

Running locally, those same figures are measured from live traffic and
`POST /checkout` genuinely fails and genuinely recovers — the sandbox is
deliberately not exposed on the public deployment, because the remediation path
executes code. See `demo-sandbox/README.md`.

---

## Appendix — running it locally instead

Use this only if you want the numbers measured live. All three people must be at
one machine.

```bash
cd demo-sandbox && npm start          # terminal 1
```
```bash
pnpm run dev                          # terminal 2 (needs DEMO_SANDBOX=1 in .env.local)
```
```bash
curl -X POST http://127.0.0.1:4000/load/start   # terminal 3
```

Wait ~30s, then confirm error rate is 43–48%:

```bash
curl -s http://127.0.0.1:4000/metrics
```

Swap `agora-knotic-5vyh.vercel.app` for `localhost:3000` throughout. Keep
`localhost:4000` on a second monitor — **never on camera**. Reset between takes
there instead of on acme-pay.

Extra shot available locally, good in Scene 1:

```bash
curl -i -X POST http://127.0.0.1:4000/checkout
```

> **A:** "Watch this hang… five seconds… and a 504."
