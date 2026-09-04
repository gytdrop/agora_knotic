import fs from 'node:fs';
import {
  normalizeTranscript,
  normalizeTranscriptSpacing,
  getMessageList,
} from '../lib/conversation';
import { analyzeStatement } from '../lib/incident-analyzer';
import { applyLedgerMutation } from '../lib/ledger';
import {
  recordIncidentEvent,
  getIncidentState,
} from '../lib/event-store';
import type { LedgerItem, LedgerTag } from '../types/conversation';
import { TurnStatus, MessageType, type TranscriptHelperItem, type UserTranscription } from 'agora-agent-client-toolkit';

const TEST_TRANSCRIPT = `### Meeting Start

**Priya (Incident Commander):** Thanks everyone. It's 10:02 AM. Customers are reporting 500 errors on the checkout API in production.

**Rahul (Backend Engineer):** I can confirm checkout API latency jumped from around 80 milliseconds to over 4 seconds starting at approximately 09:56.

**Ananya (SRE):** Datadog also shows error rate increased to about 38% on checkout requests.

**Vikram (Frontend):** Homepage is working. Only checkout appears affected.

**Rahul (Backend Engineer):** I think Redis might be down because cache hit rate looks terrible.

**Ananya (SRE):** Wait, Redis is healthy according to health checks.

**Rahul (Backend Engineer):** You're right. Redis health endpoint is green. My earlier assumption was incorrect.

### Investigation

**Priya (Incident Commander):** What changed around 09:55?

**Meera (Platform):** A deployment finished at 09:54 for checkout-service version v2.8.1.

**Rahul (Backend Engineer):** Confirmed deployment completed successfully.

**Vikram (Frontend):** Could the deployment have introduced the bug?

**Rahul (Backend Engineer):** Possibly. Not confirmed.

**Ananya (SRE):** Database CPU increased from 35% to 92%.

**Rahul (Backend Engineer):** I'm seeing PostgreSQL connection pool exhaustion.

**Meera (Platform):** Connection pool limit is 200 and active connections hit 200 exactly.

**Priya (Incident Commander):** Is the database unavailable?

**Ananya (SRE):** No. Database is responding but slowly.

### Contradictions

**Rahul (Backend Engineer):** I don't think any rollback happened.

**Meera (Platform):** Actually rollback started at 10:09.

**Rahul (Backend Engineer):** Confirmed. Rollback started at 10:09 and completed at 10:12.

**Priya (Incident Commander):** Did rollback fix customer errors?

**Ananya (SRE):** Error rate dropped from 38% to 5%.

**Rahul (Backend Engineer):** Latency is back to 120 milliseconds.

**Vikram (Frontend):** Some customers still report failures though.

**Priya (Incident Commander):** Are those fresh failures or cached browser errors?

**Vikram (Frontend):** Not sure yet.

### Noise / Irrelevant Conversation

**Rahul (Backend Engineer):** Someone's microphone is echoing.

**Priya (Incident Commander):** Ignore that.

**Meera (Platform):** I'll grab coffee after this.

**Vikram (Frontend):** My VPN disconnected for a second.

### More Evidence

**Ananya (SRE):** Logs show repeated timeout waiting for PostgreSQL connection.

**Rahul (Backend Engineer):** Stack trace points to CheckoutRepository.getActiveCart.

**Meera (Platform):** We increased connection timeout from 2 seconds to 10 seconds last week.

**Priya (Incident Commander):** Is that related?

**Rahul (Backend Engineer):** Unknown.

**Ananya (SRE):** No evidence yet.

### Corrections

**Vikram (Frontend):** I said homepage was unaffected. Actually payment confirmation page also returns errors.

**Priya (Incident Commander):** So affected services are checkout API and payment confirmation.

**Rahul (Backend Engineer):** Confirmed.

### Action Items

**Priya (Incident Commander):** Rahul owns root cause analysis.

**Priya (Incident Commander):** Meera owns rollback verification.

**Priya (Incident Commander):** Ananya owns monitoring dashboard.

**Priya (Incident Commander):** ETA for customer update is 10:30 AM.

### Meeting Ends`;

async function runIncidenceIoPipeline() {
  console.log('================================================================');
  console.log('       INCIDENCE.IO FULL PRODUCTION PIPELINE EXECUTION          ');
  console.log('================================================================\n');

  // --- STAGE 1: STT & TRANSCRIPT INGESTION ---
  const t0 = performance.now();
  const preprocessed = normalizeTranscriptSpacing(TEST_TRANSCRIPT);
  const t1 = performance.now();

  console.log('STAGE 1: STT Ingestion & Punctuation Spacing Normalization');
  console.log(`  Raw Text Size:    ${TEST_TRANSCRIPT.length} characters`);
  console.log(`  Preprocessed:     ${preprocessed.length} characters`);
  console.log(`  Execution Time:   ${(t1 - t0).toFixed(2)} ms\n`);

  // --- STAGE 2: PARSER & SPEAKER CHUNKING ---
  const t2 = performance.now();
  const speakerUids: Record<string, string> = {
    'Priya (Incident Commander)': '1001',
    'Rahul (Backend Engineer)': '1002',
    'Ananya (SRE)': '1003',
    'Vikram (Frontend)': '1004',
    'Meera (Platform)': '1005',
  };

  const lines = TEST_TRANSCRIPT.split('\n');
  const parsedTurns: Array<{
    turnId: number;
    speaker: string;
    speakerRole: 'user' | 'peer';
    speakerUid: string;
    text: string;
    timeMs: number;
  }> = [];

  let currentTurnId = 1;
  const baseTime = 1725424920000; // 10:02 AM base

  let pendingSpeaker: string | null = null;
  let pendingTextLines: string[] = [];

  const commitTurn = () => {
    if (pendingSpeaker && pendingTextLines.length > 0) {
      const combinedText = pendingTextLines.join(' ').trim();
      const cleanSpeaker = pendingSpeaker;
      const speakerRole = cleanSpeaker.includes('Incident Commander') ? 'user' : 'peer';
      parsedTurns.push({
        turnId: currentTurnId,
        speaker: cleanSpeaker,
        speakerRole,
        speakerUid: speakerUids[cleanSpeaker] || '1099',
        text: combinedText,
        timeMs: baseTime + (currentTurnId - 1) * 15000,
      });
      currentTurnId++;
    }
    pendingSpeaker = null;
    pendingTextLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const speakerMatch = line.match(/^\*\*([^*]+?)(?::)?\*\*:?\s*(.*)$/);
    if (speakerMatch) {
      commitTurn();
      pendingSpeaker = speakerMatch[1].trim();
      const after = speakerMatch[2].trim();
      if (after) pendingTextLines.push(after);
    } else if (pendingSpeaker) {
      pendingTextLines.push(line);
    }
  }
  commitTurn();

  // Toolkit Transcript normalization
  const toolkitItems: TranscriptHelperItem<Partial<UserTranscription>>[] = parsedTurns.map((turn) => ({
    stream_id: 0,
    turn_id: turn.turnId,
    uid: turn.speakerUid,
    text: turn.text,
    status: TurnStatus.END,
    _time: turn.timeMs,
    metadata: {
      object: MessageType.USER_TRANSCRIPTION,
      final: true,
      text: turn.text,
      start_time: turn.timeMs,
      end_time: turn.timeMs + 2500,
    },
  }));

  const normalizedToolkitItems = normalizeTranscript(toolkitItems, '1001');
  const finalizedMessageList = getMessageList(normalizedToolkitItems);
  const t3 = performance.now();

  console.log('STAGE 2: Speaker Chunking & Turn Normalization');
  console.log(`  Parsed Turns:     ${parsedTurns.length}`);
  console.log(`  Speakers Active:  ${Object.keys(speakerUids).length}`);
  console.log(`  Execution Time:   ${(t3 - t2).toFixed(2)} ms\n`);

  // --- STAGE 3: CLASSIFIER & STATE LEDGER MUTATION ---
  const t4 = performance.now();
  let ledger: LedgerItem[] = [];
  const incidentId = `#INC-CHECKOUT-8921`;

  const evaluationLog: Array<{
    turnId: number;
    speaker: string;
    text: string;
    tag: LedgerTag;
    status: string;
    reason?: string;
  }> = [];

  for (let i = 0; i < finalizedMessageList.length; i++) {
    const turn = finalizedMessageList[i];
    const originalTurn = parsedTurns[i];
    const analyzed = analyzeStatement(originalTurn.speaker, turn.text, originalTurn.speakerRole);

    evaluationLog.push({
      turnId: turn.turn_id,
      speaker: originalTurn.speaker,
      text: turn.text,
      tag: analyzed.tag,
      status: analyzed.status,
      reason: analyzed.reason,
    });

    if (analyzed.isNoise) continue;

    const mutation = applyLedgerMutation(ledger, {
      id: `turn-${turn.turn_id}`,
      turnId: turn.turn_id,
      speakerUid: String(turn.uid),
      speaker: originalTurn.speaker,
      speakerRole: originalTurn.speakerRole,
      text: turn.text,
      tag: analyzed.tag,
      status: analyzed.status,
      reason: analyzed.reason,
      telemetryEvidence: analyzed.telemetryEvidence,
      hypothesisLifecycle: analyzed.hypothesisLifecycle,
      timestampMs: turn.createdAt,
    });
    ledger = mutation.nextItems;

    recordIncidentEvent(
      incidentId,
      analyzed.tag === 'ACTION'
        ? 'HOTFIX_STAGED'
        : analyzed.tag === 'CONTRADICTION'
        ? 'CONTRADICTION_FLAGGED'
        : 'TURN_FINALIZED',
      mutation.committedItem,
    );
  }
  const t5 = performance.now();

  console.log('STAGE 3: Real-Time Classification & Ledger Reducer');
  console.log(`  Total Turns:      ${finalizedMessageList.length}`);
  console.log(`  Filtered Noise:   ${evaluationLog.filter((e) => e.tag === 'NOISE').length}`);
  console.log(`  Ledger Items:     ${ledger.length}`);
  console.log(`  Execution Time:   ${(t5 - t4).toFixed(2)} ms\n`);

  // Breakdown lists
  const facts = ledger.filter((item) => item.tag === 'FACT');
  const hypotheses = ledger.filter((item) => item.tag === 'HYPOTHESIS');
  const contradictions = ledger.filter((item) => item.tag === 'CONTRADICTION');
  const actions = ledger.filter((item) => item.tag === 'ACTION');
  const questions = ledger.filter((item) => item.tag === 'QUESTION');

  // Timeline events from event store
  const incidentState = getIncidentState(incidentId);
  const timelineEvents = incidentState.events || [];

  return {
    parsedTurns,
    evaluationLog,
    ledger,
    facts,
    hypotheses,
    contradictions,
    actions,
    questions,
    timelineEvents,
  };
}

runIncidenceIoPipeline().then((res) => {
  fs.writeFileSync('incidence-io-output.json', JSON.stringify(res, null, 2));
  console.log('Incidence.io pipeline test finished successfully. Output written to incidence-io-output.json');
});
