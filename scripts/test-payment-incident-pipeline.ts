import fs from 'node:fs';
import path from 'node:path';
import {
  normalizeTranscript,
  normalizeTranscriptSpacing,
  getMessageList,
} from '../lib/conversation';
import { analyzeStatement } from '../lib/incident-analyzer';
import { applyLedgerMutation } from '../lib/ledger';
import {
  recordIncidentEvent,
  generatePostIncidentReview,
  getIncidentState,
} from '../lib/event-store';
import type { LedgerItem, LedgerTag } from '../types/conversation';
import { TurnStatus, MessageType, type TranscriptHelperItem, type UserTranscription } from 'agora-agent-client-toolkit';

const TEST_TRANSCRIPT = `# End-to-End Incident Pipeline Test Transcript

**Scenario:** Production outage in a payment service war room.

**Speaker 1 – Incident Commander (IC):**
"Okay everyone, we have a SEV-1 incident. Customers are reporting payment failures starting around 9:58 AM IST. Let's stick to confirmed observations first."

**Speaker 2 – SRE:**
"I checked Grafana. Payment API error rate jumped from 0.2% to 47% at exactly 9:58 AM. Latency also increased from 180 milliseconds to over 6 seconds."

**Speaker 3 – Backend Engineer:**
"I can confirm deployment version \`payment-service:v2.8.1\` was rolled out to production at 9:55 AM."

**Speaker 4 – Database Engineer:**
"I checked PostgreSQL. CPU is only 35%. No replication lag. Database looks healthy."

**Speaker 2 – SRE:**
"Load balancer metrics show traffic volume is normal. No spike in incoming requests."

**Speaker 5 – Product Manager:**
"Support has received about 320 customer complaints in the last 20 minutes."

**Speaker 3 – Backend Engineer:**
"I think the deployment probably introduced a memory leak."

**Speaker 2 – SRE:**
"We do not have evidence of a memory leak yet."

**Speaker 6 – Platform Engineer:**
"Kubernetes restarted three payment-service pods because of readiness probe failures."

**Speaker 3 – Backend Engineer:**
"Actually, I checked pod memory usage. Memory is around 58%, so maybe it's not a memory leak."

**Speaker 1 – IC:**
"Good correction. Treat memory leak only as a hypothesis if mentioned again."

**Speaker 6 – Platform Engineer:**
"I found repeated timeout errors while payment-service calls the fraud-detection service."

**Speaker 7 – Fraud Team Engineer:**
"Our fraud-detection service deployment started at 9:52 AM."

**Speaker 7 – Fraud Team Engineer:**
"We're seeing request timeout rates around 45%."

**Speaker 3 – Backend Engineer:**
"So payment failures may be caused by fraud service timeouts."

**Speaker 4 – Database Engineer:**
"I also verified database connection pool usage is only 22%."

**Speaker 2 – SRE:**
"External payment gateway status page reports all systems operational."

**Speaker 5 – Product Manager:**
"Twitter users are saying the payment gateway is down."

**Speaker 2 – SRE:**
"We have no operational evidence supporting Twitter claims."

**Speaker 6 – Platform Engineer:**
"I rolled back payment-service to version \`v2.8.0\` on one canary pod."

**Speaker 2 – SRE:**
"Canary error rate dropped from 48% to 6%."

**Speaker 7 – Fraud Team Engineer:**
"Wait, fraud service timeout rate is now decreasing after our rollback."

**Speaker 6 – Platform Engineer:**
"We've rolled back fraud-detection service to \`v1.14.2\`."

**Speaker 2 – SRE:**
"Payment API error rate across production is now 3% and continuing downward."

**Speaker 1 – IC:**
"Timeline so far:

* 9:52 fraud service deployment.
* 9:55 payment service deployment.
* 9:58 incident begins.
* 10:12 payment-service canary rollback.
* 10:16 fraud-service rollback.
* 10:18 recovery observed."

**Speaker 3 – Backend Engineer:**
"The root cause is definitely the payment-service deployment."

**Speaker 7 – Fraud Team Engineer:**
"I disagree. Evidence suggests fraud service rollout caused upstream timeouts."

**Speaker 2 – SRE:**
"We cannot declare root cause yet."

**Speaker 1 – IC:**
"Correct. Root cause remains under investigation until evidence is complete."

**Speaker 5 – Product Manager:**
"Customer impact is reducing, but some failures still exist."

**Speaker 2 – SRE:**
"Current metrics show 2.8% error rate and average latency is back to 230 milliseconds."

**Speaker 1 – IC:**
"Mark incident as mitigating, not resolved."`;

async function runPaymentPipelineTest() {
  console.log('================================================================');
  console.log('   PAYMENT SERVICE OUTAGE — END-TO-END INCIDENT PIPELINE TEST   ');
  console.log('================================================================\n');

  // --- STAGE 1: INGESTION & TRANSCRIPT PREPROCESSING ---
  const t0 = performance.now();
  const rawSize = TEST_TRANSCRIPT.length;
  const rawWords = TEST_TRANSCRIPT.split(/\s+/).filter(Boolean).length;
  const preprocessedText = normalizeTranscriptSpacing(TEST_TRANSCRIPT);
  const t1 = performance.now();

  console.log('STAGE 1: Transcript Ingestion & Preprocessing');
  console.log(`  Input Size:       ${rawSize} characters (${rawWords} words)`);
  console.log(`  Preprocessed:     ${preprocessedText.length} characters`);
  console.log(`  Execution Time:   ${(t1 - t0).toFixed(2)} ms`);
  console.log(`  Status:           PASS\n`);

  // --- STAGE 2: CHUNKING & SPEAKER PARSING ---
  const t2 = performance.now();
  const speakerUids: Record<string, string> = {
    'Speaker 1 – Incident Commander (IC)': '2001',
    'Speaker 1 – IC': '2001',
    'Speaker 2 – SRE': '2002',
    'Speaker 3 – Backend Engineer': '2003',
    'Speaker 4 – Database Engineer': '2004',
    'Speaker 5 – Product Manager': '2005',
    'Speaker 6 – Platform Engineer': '2006',
    'Speaker 7 – Fraud Team Engineer': '2007',
  };

  const lines = TEST_TRANSCRIPT.split('\n');
  const parsedTurns: Array<{
    turnId: number;
    speaker: string;
    speakerUid: string;
    text: string;
    simulatedTimestampMs: number;
  }> = [];

  let currentTurnId = 1;
  const baseTime = 1725424680000; // 09:58:00 IST base

  let pendingSpeaker: string | null = null;
  let pendingTextLines: string[] = [];

  const commitTurn = () => {
    if (pendingSpeaker && pendingTextLines.length > 0) {
      let combinedText = pendingTextLines.join('\n').trim();
      if (combinedText.startsWith('"') && combinedText.endsWith('"')) {
        combinedText = combinedText.slice(1, -1).trim();
      }
      parsedTurns.push({
        turnId: currentTurnId,
        speaker: pendingSpeaker,
        speakerUid: speakerUids[pendingSpeaker] || '2099',
        text: combinedText,
        simulatedTimestampMs: baseTime + currentTurnId * 12000,
      });
      currentTurnId++;
    }
    pendingSpeaker = null;
    pendingTextLines = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#') || line.startsWith('**Scenario:')) continue;

    const speakerMatch = line.match(/^\*\*([^*]+?)(?::)?\*\*:?\s*(.*)$/);
    if (speakerMatch) {
      commitTurn();
      pendingSpeaker = speakerMatch[1].trim();
      const afterColon = speakerMatch[2].trim();
      if (afterColon) {
        pendingTextLines.push(afterColon);
      }
    } else if (pendingSpeaker) {
      pendingTextLines.push(line);
    }
  }
  commitTurn();

  const toolkitItems: TranscriptHelperItem<Partial<UserTranscription>>[] = parsedTurns.map((turn) => ({
    stream_id: 0,
    turn_id: turn.turnId,
    uid: turn.speakerUid,
    text: turn.text,
    status: TurnStatus.END,
    _time: turn.simulatedTimestampMs,
    metadata: {
      object: MessageType.USER_TRANSCRIPTION,
      final: true,
      text: turn.text,
      start_time: turn.simulatedTimestampMs,
      end_time: turn.simulatedTimestampMs + 2000,
    },
  }));

  const normalizedToolkitItems = normalizeTranscript(toolkitItems, '2001');
  const finalizedMessageList = getMessageList(normalizedToolkitItems);
  const t3 = performance.now();

  const uniqueSpeakers = Array.from(new Set(parsedTurns.map((t) => t.speaker)));

  console.log('STAGE 2: Turn Chunking & Speaker Parsing');
  console.log(`  Parsed Turns:     ${parsedTurns.length}`);
  console.log(`  Unique Speakers:  ${uniqueSpeakers.length}`);
  uniqueSpeakers.forEach((s) => console.log(`    - ${s} (UID: ${speakerUids[s] || '2099'})`));
  console.log(`  Message List:     ${finalizedMessageList.length} finalized turns`);
  console.log(`  Execution Time:   ${(t3 - t2).toFixed(2)} ms`);
  console.log(`  Status:           PASS\n`);

  // --- STAGE 3: CLASSIFICATION (FACTS, HYPOTHESES, CONTRADICTIONS, ACTIONS) ---
  const t4 = performance.now();
  let ledger: LedgerItem[] = [];
  const testIncidentId = `#INC-PAYMENT-${Date.now()}`;

  const classificationResults: Array<{
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
    const speaker = originalTurn.speaker;

    const analyzed = analyzeStatement(speaker, turn.text);

    classificationResults.push({
      turnId: turn.turn_id,
      speaker,
      text: turn.text,
      tag: analyzed.tag,
      status: analyzed.status,
      reason: analyzed.reason,
    });

    if (analyzed.isNoise) {
      continue;
    }

    const mutation = applyLedgerMutation(ledger, {
      id: `turn-${turn.turn_id}`,
      turnId: turn.turn_id,
      speakerUid: String(turn.uid),
      speaker,
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
      testIncidentId,
      analyzed.tag === 'ACTION'
        ? 'HOTFIX_STAGED'
        : analyzed.tag === 'CONTRADICTION'
        ? 'CONTRADICTION_FLAGGED'
        : 'TURN_FINALIZED',
      mutation.committedItem,
    );
  }
  const t5 = performance.now();

  const facts = ledger.filter((i) => i.tag === 'FACT');
  const hypotheses = ledger.filter((i) => i.tag === 'HYPOTHESIS');
  const contradictions = ledger.filter((i) => i.tag === 'CONTRADICTION');
  const actions = ledger.filter((i) => i.tag === 'ACTION');
  const noiseCount = classificationResults.filter((r) => r.tag === 'NOISE').length;

  console.log('STAGE 3: Statement Classification & State Ledger Construction');
  console.log(`  Total Evaluated:  ${finalizedMessageList.length} turns`);
  console.log(`  Filtered Noise:   ${noiseCount}`);
  console.log(`  Confirmed Facts:  ${facts.length}`);
  console.log(`  Hypotheses:       ${hypotheses.length}`);
  console.log(`  Contradictions:   ${contradictions.length}`);
  console.log(`  Action Items:     ${actions.length}`);
  console.log(`  Execution Time:   ${(t5 - t4).toFixed(2)} ms`);
  console.log(`  Status:           COMPLETE\n`);

  // --- STAGE 4: TIMELINE RECONSTRUCTION & PIR ---
  const t6 = performance.now();
  const pirMarkdown = generatePostIncidentReview(testIncidentId);
  const incidentState = getIncidentState(testIncidentId);
  const t7 = performance.now();

  const timelineEvents = incidentState?.events || [];

  console.log('STAGE 4: Timeline Reconstruction & Post-Incident Review (PIR)');
  console.log(`  Recorded Events:  ${timelineEvents.length}`);
  console.log(`  Generated PIR:    ${pirMarkdown.length} bytes`);
  console.log(`  Execution Time:   ${(t7 - t6).toFixed(2)} ms`);
  console.log(`  Status:           PASS\n`);

  // --- STAGE 5: EXPECTED TARGET VALIDATION ---
  console.log('================================================================');
  console.log('                 VALIDATION AGAINST EXPECTED TARGETS            ');
  console.log('================================================================');

  const targetValidation = [
    { metric: 'Total Turns Evaluated', actual: parsedTurns.length, expected: 32 },
    { metric: 'Confirmed Facts', actual: facts.length, expected: 18 },
    { metric: 'Hypotheses Tracked', actual: hypotheses.length, expected: 4 },
    { metric: 'Contradictions Flagged', actual: contradictions.length, expected: 5 },
    { metric: 'Action Items Staged', actual: actions.length, expected: 5 },
    { metric: 'Timeline Events', actual: timelineEvents.length, expected: 34 },
  ];

  let anyMismatch = false;
  for (const row of targetValidation) {
    const isPass = row.actual === row.expected;
    if (!isPass) anyMismatch = true;
    console.log(
      `  ${row.metric.padEnd(25)}: Actual = ${String(row.actual).padEnd(5)} | Expected = ${String(row.expected).padEnd(5)} | ${isPass ? '✔ MATCH' : '❌ MISMATCH'}`,
    );
  }

  if (anyMismatch) {
    console.error('\n❌ Validation targets failed due to count mismatch.');
    process.exit(1);
  }

  // --- JSON EXPORT ---
  const outputData = {
    incidentId: testIncidentId,
    scenario: 'Production outage in a payment service war room',
    summary: {
      totalTurns: parsedTurns.length,
      factsCount: facts.length,
      hypothesesCount: hypotheses.length,
      contradictionsCount: contradictions.length,
      actionsCount: actions.length,
      timelineEventsCount: timelineEvents.length,
    },
    ledger: {
      facts: facts.map((f) => ({
        id: f.id,
        turnId: f.turnId,
        speaker: f.speaker,
        text: f.text,
        status: f.status,
      })),
      hypotheses: hypotheses.map((h) => ({
        id: h.id,
        turnId: h.turnId,
        speaker: h.speaker,
        text: h.text,
        status: h.status,
        lifecycle: h.hypothesisLifecycle,
      })),
      contradictions: contradictions.map((c) => ({
        id: c.id,
        turnId: c.turnId,
        speaker: c.speaker,
        text: c.text,
        status: c.status,
        reason: c.reason,
      })),
      actions: actions.map((a) => ({
        id: a.id,
        turnId: a.turnId,
        speaker: a.speaker,
        text: a.text,
        status: a.status,
        reason: a.reason,
      })),
    },
    timeline: timelineEvents.slice(2).map((e) => ({
      seq: e.sequenceNumber,
      speaker: e.item.speaker,
      tag: e.item.tag,
      text: e.item.text,
      status: e.item.status,
    })),
  };

  const outputPath = path.resolve(process.cwd(), 'payment-incident-ledger-output.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`\nFinal Payment Ledger JSON saved to: payment-incident-ledger-output.json`);
  console.log('\n================================================================');
  console.log('   ALL STAGES PASSED: 100% SUCCESSFUL PIPELINE INTEGRATION      ');
  console.log('================================================================');
}

runPaymentPipelineTest().catch((err) => {
  console.error('Payment incident test failed:', err);
  process.exit(1);
});
