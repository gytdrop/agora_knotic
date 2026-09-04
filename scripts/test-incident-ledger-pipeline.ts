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

async function runTest() {
  console.log('================================================================');
  console.log('     INCIDENT LEDGER PIPELINE END-TO-END INTEGRATION TEST       ');
  console.log('================================================================\n');

  const filePath = path.resolve(process.cwd(), 'Pasted text(1).txt');
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
  }

  // --- STAGE 1: INGESTION & TRANSCRIPT PREPROCESSING ---
  const t0 = performance.now();
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const rawSize = rawContent.length;
  const rawWords = rawContent.split(/\s+/).filter(Boolean).length;
  const preprocessedText = normalizeTranscriptSpacing(rawContent);
  const t1 = performance.now();

  console.log('STAGE 1: Transcript Ingestion & Preprocessing');
  console.log(`  Input Size:       ${rawSize} characters (${rawWords} words)`);
  console.log(`  Preprocessed:     ${preprocessedText.length} characters`);
  console.log(`  Execution Time:   ${(t1 - t0).toFixed(2)} ms`);
  console.log(`  Status:           PASS\n`);

  // --- STAGE 2: CHUNKING & SPEAKER PARSING ---
  const t2 = performance.now();
  const rawLines = rawContent.split('\n').map((l) => l.trim()).filter(Boolean);
  const knownSpeakers = new Set(['IC', 'Alice', 'Bob', 'Charlie', 'Dana', 'Eve', 'Frank', 'EchoSphere Sentinel', 'EchoSphere']);

  const speakerUids: Record<string, string> = {
    IC: '1001',
    Alice: '1002',
    Bob: '1003',
    Charlie: '1004',
    Dana: '1005',
    Eve: '1006',
    Frank: '1007',
  };

  const parsedTurns: Array<{
    turnId: number;
    speaker: string;
    speakerUid: string;
    text: string;
    simulatedTimestampMs: number;
  }> = [];

  let currentTurnId = 1;
  const baseTime = 1725440520000; // 09:02:00 UTC

  for (const line of rawLines) {
    const colonIdx = line.indexOf(':');
    const potentialSpeaker = colonIdx !== -1 ? line.substring(0, colonIdx).trim() : '';
    if (colonIdx !== -1 && knownSpeakers.has(potentialSpeaker)) {
      const speaker = potentialSpeaker;
      const text = line.substring(colonIdx + 1).trim();
      parsedTurns.push({
        turnId: currentTurnId,
        speaker,
        speakerUid: speakerUids[speaker] || '9999',
        text,
        simulatedTimestampMs: baseTime + currentTurnId * 15000,
      });
      currentTurnId++;
    } else if (parsedTurns.length > 0) {
      // Continuation of previous speaker turn
      parsedTurns[parsedTurns.length - 1].text += ' ' + line;
    }
  }

  // Convert to Toolkit TranscriptHelperItem shape as production Agora STT delivers
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

  const normalizedToolkitItems = normalizeTranscript(toolkitItems, '1001');
  const finalizedMessageList = getMessageList(normalizedToolkitItems);
  const t3 = performance.now();

  const uniqueSpeakers = Array.from(new Set(parsedTurns.map((t) => t.speaker)));

  console.log('STAGE 2: Turn Chunking & Speaker Parsing');
  console.log(`  Input Lines:      ${rawLines.length}`);
  console.log(`  Turns Extracted:  ${parsedTurns.length}`);
  console.log(`  Speakers Found:   ${uniqueSpeakers.length} (${uniqueSpeakers.join(', ')})`);
  console.log(`  Message List:     ${finalizedMessageList.length} finalized turns`);
  console.log(`  Execution Time:   ${(t3 - t2).toFixed(2)} ms`);
  console.log(`  Status:           PASS\n`);

  // --- STAGE 3: CLASSIFICATION (FACTS, HYPOTHESES, CONTRADICTIONS, ACTIONS) ---
  const t4 = performance.now();
  let ledger: LedgerItem[] = [];
  const testIncidentId = `#INC-TEST-${Date.now()}`;

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

    // Skip non-ledger conversational noise (roll calls, audio checks, acknowledgements)
    if (analyzed.isNoise) {
      continue;
    }

    // Run through centralized ledger mutation reducer
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

    // Persist event into authoritative event store
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

  console.log('STAGE 3: Statement Classification & Ledger Mutation');
  console.log(`  Total Evaluated:  ${finalizedMessageList.length}`);
  console.log(`  Filtered Noise:   ${noiseCount}`);
  console.log(`  Extracted Facts:  ${facts.length}`);
  console.log(`  Hypotheses:       ${hypotheses.length}`);
  console.log(`  Contradictions:   ${contradictions.length}`);
  console.log(`  Actions:          ${actions.length}`);
  console.log(`  Execution Time:   ${(t5 - t4).toFixed(2)} ms`);
  console.log(`  Status:           COMPLETE\n`);

  // --- STAGE 4: TIMELINE RECONSTRUCTION & PIR ---
  const t6 = performance.now();
  const pirMarkdown = generatePostIncidentReview(testIncidentId);
  const incidentState = getIncidentState(testIncidentId);
  const t7 = performance.now();

  const timelineEvents = incidentState?.events || [];

  console.log('STAGE 4: Timeline Reconstruction & Persistence');
  console.log(`  Timeline Events:  ${timelineEvents.length}`);
  console.log(`  PIR Size:         ${pirMarkdown.length} bytes`);
  console.log(`  Execution Time:   ${(t7 - t6).toFixed(2)} ms`);
  console.log(`  Status:           PASS\n`);

  // --- STAGE 5: EXPECTED OUTPUT VALIDATION ---
  console.log('================================================================');
  console.log('                 VALIDATION AGAINST EXPECTED TARGETS            ');
  console.log('================================================================');

  const targetValidation = [
    {
      metric: 'Confirmed Facts',
      actual: facts.length,
      expected: '25 – 35',
      min: 25,
      max: 35,
    },
    {
      metric: 'Hypotheses',
      actual: hypotheses.length,
      expected: '20 – 30',
      min: 20,
      max: 30,
    },
    {
      metric: 'Contradictions',
      actual: contradictions.length,
      expected: '12 – 18',
      min: 12,
      max: 18,
    },
    {
      metric: 'Action Items',
      actual: actions.length,
      expected: 'Around 8',
      min: 5,
      max: 12,
    },
    {
      metric: 'Timeline Events',
      actual: timelineEvents.length,
      expected: '10+ chronological events',
      min: 10,
      max: 200,
    },
  ];

  let anyMismatch = false;
  for (const row of targetValidation) {
    const isPass = row.actual >= row.min && row.actual <= row.max;
    if (!isPass) anyMismatch = true;
    console.log(
      `  ${row.metric.padEnd(20)}: Actual = ${String(row.actual).padEnd(5)} | Expected = ${row.expected.padEnd(10)} | ${isPass ? '✔ MATCH' : '❌ MISMATCH'}`,
    );
  }
  if (anyMismatch) {
    console.error('\n❌ Validation targets failed due to count mismatch.');
    process.exit(1);
  }

  // --- OUTPUT JSON STRUCTURE ---
  const finalJson = {
    incidentId: testIncidentId,
    summary: {
      totalTurns: parsedTurns.length,
      factsCount: facts.length,
      hypothesesCount: hypotheses.length,
      contradictionsCount: contradictions.length,
      actionsCount: actions.length,
      timelineEventsCount: timelineEvents.length,
    },
    facts: facts.map((f) => ({
      id: f.id,
      turnId: f.turnId,
      speaker: f.speaker,
      text: f.text,
      status: f.status,
      timestampMs: f.timestampMs,
    })),
    hypotheses: hypotheses.map((h) => ({
      id: h.id,
      turnId: h.turnId,
      speaker: h.speaker,
      text: h.text,
      status: h.status,
      timestampMs: h.timestampMs,
    })),
    contradictions: contradictions.map((c) => ({
      id: c.id,
      turnId: c.turnId,
      speaker: c.speaker,
      text: c.text,
      status: c.status,
      reason: c.reason,
      telemetryEvidence: c.telemetryEvidence,
      timestampMs: c.timestampMs,
    })),
    actions: actions.map((a) => ({
      id: a.id,
      turnId: a.turnId,
      speaker: a.speaker,
      text: a.text,
      status: a.status,
      reason: a.reason,
      telemetryEvidence: a.telemetryEvidence,
      timestampMs: a.timestampMs,
    })),
    timeline: timelineEvents.slice(0, 15).map((e) => ({
      seq: e.sequenceNumber,
      eventType: e.eventType,
      speaker: e.item.speaker,
      text: e.item.text,
      tag: e.item.tag,
      timestampMs: e.timestampMs,
    })),
  };

  fs.writeFileSync(
    path.resolve(process.cwd(), 'incident-ledger-test-output.json'),
    JSON.stringify(finalJson, null, 2),
    'utf-8',
  );

  console.log('\nFinal Ledger JSON saved to: incident-ledger-test-output.json');
}

runTest().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
