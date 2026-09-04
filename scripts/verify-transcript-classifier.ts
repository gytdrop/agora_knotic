import assert from 'node:assert';
import { analyzeStatement, classifyTranscriptTurn } from '../lib/incident-analyzer';
import { applyLedgerMutation } from '../lib/ledger';
import type { LedgerItem } from '../types/conversation';

async function testAcceptanceCriteria() {
  console.log('--- Testing Acceptance Criteria (User Required) ---');

  const testCases: { speaker: string; speakerRole: 'agent' | 'user' | 'peer'; text: string; expected: string }[] = [
    { speaker: 'EchoSphere Sentinel', speakerRole: 'agent', text: 'This could be a DNS issue.', expected: 'HYPOTHESIS' },
    { speaker: 'EchoSphere Sentinel', speakerRole: 'agent', text: "Let's verify rollout status.", expected: 'ACTION' },
    { speaker: 'EchoSphere Sentinel', speakerRole: 'agent', text: 'I suspect Redis saturation.', expected: 'HYPOTHESIS' },
    { speaker: 'Akthar', speakerRole: 'user', text: 'CPU utilization is 97%.', expected: 'FACT' },
    { speaker: 'Akthar', speakerRole: 'user', text: 'API returned HTTP 503.', expected: 'FACT' },
    { speaker: 'Akthar', speakerRole: 'user', text: 'Restart auth-service pods.', expected: 'ACTION' },
    { speaker: 'Akthar', speakerRole: 'user', text: 'We rolled back deployment.', expected: 'FACT' },
    { speaker: 'Peer-4412', speakerRole: 'peer', text: 'Maybe ingress is dropping traffic.', expected: 'HYPOTHESIS' },
  ];

  for (const tc of testCases) {
    // 1. Test classifyTranscriptTurn directly
    const directTag = classifyTranscriptTurn(tc.text, tc.speakerRole);
    assert.strictEqual(
      directTag,
      tc.expected,
      `classifyTranscriptTurn('${tc.text}') expected ${tc.expected}, got ${directTag}`,
    );

    // 2. Test analyzeStatement
    const res = analyzeStatement(tc.speaker, tc.text, tc.speakerRole);
    assert.strictEqual(
      res.tag,
      tc.expected,
      `analyzeStatement('${tc.speaker}', '${tc.text}') expected ${tc.expected}, got ${res.tag}`,
    );

    console.log(`✔ PASS: [${tc.speakerRole}] "${tc.text}" -> ${res.tag}`);
  }
}

async function testDeterministicRules() {
  console.log('\n--- Testing Deterministic Linguistic Rules ---');

  // Hypothesis keywords: could, might, may, maybe, probably, possibly, suspect, think, believe, appears, seems, likely
  const hypothesisExamples = [
    'This could be DNS.',
    'It might be a network partition.',
    'We may have an issue with the ingress controller.',
    'Maybe the secret was rotated.',
    'It is probably related to the new build.',
    'It possibly timed out waiting for upstream.',
    'I suspect Redis saturation.',
    'I think there is high memory pressure.',
    'We believe the certificate expired.',
    'The error appears intermittently.',
    'It seems the worker is stuck.',
    'It is likely caused by the latest release.',
    'It probably started after deployment.',
  ];
  for (const text of hypothesisExamples) {
    const tag = classifyTranscriptTurn(text);
    assert.strictEqual(tag, 'HYPOTHESIS', `Expected '${text}' to be HYPOTHESIS, got ${tag}`);
  }
  console.log('✔ PASS: All 13 hypothesis keyword variations classified as HYPOTHESIS');

  // Action keywords: check, verify, inspect, compare, look at, query, restart, rollback, patch, apply, scale, page, drain, kill
  const actionExamples = [
    'Check Grafana.',
    'Verify rollout status.',
    'Inspect network traffic.',
    'Compare response times before and after.',
    'Look at the error rates.',
    'Query the database directly.',
    'Restart auth-service pods.',
    'Roll back deployment.',
    'Patch the deployment manifest.',
    'Apply hotfix configuration.',
    'Scale up the replica count.',
    'Page the on-call engineer.',
    'Drain node ip-10-0-2-15.',
    'Kill the hung container process.',
  ];
  for (const text of actionExamples) {
    const tag = classifyTranscriptTurn(text);
    assert.strictEqual(tag, 'ACTION', `Expected '${text}' to be ACTION, got ${tag}`);
  }
  console.log('✔ PASS: All 14 action keyword variations classified as ACTION');

  // Fact keywords: Metrics, timestamps, percentages, HTTP status codes, completed events, observed outages
  const factExamples = [
    'CPU utilization is 97%.',
    'Memory usage reached 88%.',
    'API returned HTTP 503.',
    'Deployment completed at 09:42.',
    'Error rate dropped from 18% to 2%.',
    'We rolled back deployment.',
    'Service returned HTTP 500 error.',
    'Outage confirmed on US-East region.',
    'Latency is 450ms.',
  ];
  for (const text of factExamples) {
    const tag = classifyTranscriptTurn(text);
    assert.strictEqual(tag, 'FACT', `Expected '${text}' to be FACT, got ${tag}`);
  }
  console.log('✔ PASS: All fact variations classified as FACT');
}

async function testContradictionLogic() {
  console.log('\n--- Testing Contradiction & Ingress Telemetry Logic ---');

  // DB contradiction: spoken failure contradicted by healthy telemetry
  const dbContradiction = analyzeStatement('Akthar', 'I think the postgres database is locked up and dropping conns');
  assert.strictEqual(dbContradiction.tag, 'CONTRADICTION');
  assert.strictEqual(dbContradiction.isContradiction, true);
  assert(dbContradiction.telemetryEvidence, 'DB evidence should be attached');
  console.log('✔ PASS: Spoken database failure hypothesis flagged as CONTRADICTION');

  // Ingress root cause action
  const ingressAction = analyzeStatement('Ashrith', 'The ingress targetport has an 8080 8000 mismatch');
  assert.strictEqual(ingressAction.tag, 'ACTION');
  assert.strictEqual(ingressAction.isHotfixStaged, true);
  assert(ingressAction.telemetryEvidence, 'Ingress evidence should be attached');
  console.log('✔ PASS: Ingress targetport mismatch flagged as ACTION with hotfix staged');
}

async function testSpeakerMetadataPreservation() {
  console.log('\n--- Testing speaker metadata preservation (speakerRole, speaker, speakerUid) ---');

  let ledger: LedgerItem[] = [];

  const turn1 = applyLedgerMutation(ledger, {
    id: 'turn-1',
    speaker: 'EchoSphere Sentinel',
    speakerRole: 'agent',
    speakerUid: '10001',
    text: 'This could be a DNS issue.',
    tag: 'HYPOTHESIS',
    status: 'Hypothesis',
  });
  ledger = turn1.nextItems;
  assert.strictEqual(ledger[0].speakerRole, 'agent');
  assert.strictEqual(ledger[0].speaker, 'EchoSphere Sentinel');
  assert.strictEqual(ledger[0].speakerUid, '10001');

  const turn2 = applyLedgerMutation(ledger, {
    id: 'turn-2',
    speaker: 'Akthar',
    speakerRole: 'user',
    speakerUid: '10002',
    text: 'CPU utilization is 97%.',
    tag: 'FACT',
    status: 'Fact',
  });
  ledger = turn2.nextItems;
  assert.strictEqual(ledger[1].speakerRole, 'user');
  assert.strictEqual(ledger[1].speaker, 'Akthar');
  assert.strictEqual(ledger[1].speakerUid, '10002');

  const turn3 = applyLedgerMutation(ledger, {
    id: 'turn-3',
    speaker: 'Peer-4412',
    speakerRole: 'peer',
    speakerUid: '10003',
    text: 'Maybe ingress is dropping traffic.',
    tag: 'HYPOTHESIS',
    status: 'Hypothesis',
  });
  ledger = turn3.nextItems;
  assert.strictEqual(ledger[2].speakerRole, 'peer');
  assert.strictEqual(ledger[2].speaker, 'Peer-4412');
  assert.strictEqual(ledger[2].speakerUid, '10003');

  console.log('✔ PASS: speaker, speakerRole, and speakerUid fully preserved in ledger items');
}

async function run() {
  await testAcceptanceCriteria();
  await testDeterministicRules();
  await testContradictionLogic();
  await testSpeakerMetadataPreservation();
  console.log('\n======================================================');
  console.log('  ALL TRANSCRIPT CLASSIFIER ACCEPTANCE TESTS PASSED! ');
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
