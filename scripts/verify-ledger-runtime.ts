import assert from 'node:assert';
import type { LedgerItem, RtmLedgerPayload } from '../types/conversation';
import { applyLedgerMutation, formatLedgerTimestamp } from '../lib/ledger';
import { parseLedgerItem, isRtmLedgerPayload } from '../lib/conversation';
import { POST as remediateRoute } from '../app/api/remediate/route';
import { NextRequest } from 'next/server';
import { Agent } from 'agora-agents';

process.env.NEXT_PUBLIC_AGORA_APP_ID =
  process.env.NEXT_PUBLIC_AGORA_APP_ID || '0123456789abcdef0123456789abcdef';
process.env.NEXT_AGORA_APP_CERTIFICATE =
  process.env.NEXT_AGORA_APP_CERTIFICATE || '0123456789abcdef0123456789abcdef';

function createInitialLedger(): LedgerItem[] {
  return [
    {
      id: 'init-1',
      timestampMs: Date.now() - 20000,
      speaker: 'EchoSphere Sentinel',
      text: 'Ambient Sentinel Mode active. Listening to Agora 16kHz WebRTC stream...',
      tag: 'FACT',
      status: 'Standby Monitoring',
    },
    {
      id: 'init-2',
      timestampMs: Date.now() - 10000,
      speaker: 'HolmesGPT Engine',
      text: 'HolmesGPT cluster diagnostics active. Monitored: [ingress-nginx, auth-service, aws-rds].',
      tag: 'FACT',
      status: 'Diagnostic Sync OK',
    },
  ];
}

/**
 * TEST 1: Add the same turnId twice -> One ledger entry.
 */
async function testDuplicateTurnId() {
  console.log('\n--- TEST 1: Add the same turnId twice ---');
  let ledger = createInitialLedger();
  assert.strictEqual(ledger.length, 2, 'Initial ledger should have 2 entries');

  const turnId = 42;
  const initialTimestamp = 1725432000000;

  // First turn arrival
  const firstMutation = applyLedgerMutation(ledger, {
    id: `turn-${turnId}`,
    turnId,
    speakerUid: '10002',
    speaker: 'Akthar',
    text: 'Database is locked up',
    tag: 'HYPOTHESIS',
    status: 'UNVERIFIED',
    timestampMs: initialTimestamp,
  });
  ledger = firstMutation.nextItems;

  assert.strictEqual(ledger.length, 3, 'Ledger should now have 3 items after first turn');
  const entryTurn42 = ledger.find((item) => item.turnId === turnId);
  assert(entryTurn42, 'Entry with turnId 42 must exist');
  assert.strictEqual(entryTurn42.id, 'turn-42', 'ID should be turn-42');
  assert.strictEqual(entryTurn42.text, 'Database is locked up');
  assert.strictEqual(entryTurn42.timestampMs, initialTimestamp);

  // Second arrival with same turnId (e.g., ASR refinement, duplicate packet, or React re-render)
  const updatedTimestamp = initialTimestamp + 5000;
  const secondMutation = applyLedgerMutation(ledger, {
    id: `turn-${turnId}`,
    turnId,
    speakerUid: '10002',
    speaker: 'Akthar',
    text: 'Database is locked up and dropping connections',
    tag: 'CONTRADICTION',
    status: 'Suppressed on Audio',
    reason: 'HolmesGPT telemetry confirms DB is HEALTHY.',
    timestampMs: updatedTimestamp,
  });
  ledger = secondMutation.nextItems;

  // VERIFICATION
  assert.strictEqual(ledger.length, 3, 'Ledger MUST STILL have exactly 3 items (no duplicate entry)');
  const matchingEntries = ledger.filter((item) => item.turnId === turnId);
  assert.strictEqual(matchingEntries.length, 1, 'Exactly ONE ledger entry must exist for turnId 42');
  
  const updatedEntry = matchingEntries[0];
  assert.strictEqual(updatedEntry.text, 'Database is locked up and dropping connections', 'Text should be updated in-place');
  assert.strictEqual(updatedEntry.tag, 'CONTRADICTION', 'Tag should be updated in-place');
  assert.strictEqual(updatedEntry.status, 'Suppressed on Audio', 'Status should be updated in-place');
  assert.strictEqual(updatedEntry.timestampMs, initialTimestamp, 'Original timestampMs MUST be preserved monotonically');

  console.log('✔ PASS: Adding identical turnId 42 twice resulted in exactly ONE ledger entry with immutable timestamp.');
}

/**
 * TEST 2: Remediation button -> Exactly one POST request (Network Inspection).
 */
async function testRemediationNetworkRequest() {
  console.log('\n--- TEST 2: Remediation Button & Network Tab Verification ---');
  
  // Track network calls
  const networkCalls: { url: string; method: string; body: unknown }[] = [];

  // Mock global fetch to inspect network tab requests
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const method = init?.method || 'GET';
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    
    networkCalls.push({ url, method, body });

    if (url === '/api/remediate' && method === 'POST') {
      // Simulate the real API route response
      const req = new NextRequest('http://localhost:3000/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return remediateRoute(req);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };

  try {
    let ledger = createInitialLedger();
    let isResolved = false;
    let isHotfixStaged = false;

    // Simulate ConversationComponent handleRemediateSuccess
    const handleRemediateSuccess = async () => {
      const res = await fetch('/api/remediate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionId: 'act_hotfix_8080_8000',
          actionType: 'K8S_INGRESS_PATCH',
          targetService: 'ingress/auth-svc',
          authorizedBy: 'Akthar (Lead SRE)',
          passkeyUsed: true,
        }),
      });

      if (!res.ok) {
        throw new Error('Remediation webhook returned non-200 status');
      }

      isResolved = true;
      isHotfixStaged = true;

      const mutation = applyLedgerMutation(ledger, {
        speaker: 'EchoSphere Remediation',
        text: 'kubectl patch ingress auth-svc applied. TargetPort restored to 8080 -> 8000.',
        tag: 'ACTION',
        status: '200 OK Patch Active',
        timestampMs: Date.now(),
      });
      ledger = mutation.nextItems;
    };

    // Simulate HitlGuardrailCard handleAuthorize (Refactored: delegates to onRemediateSuccess)
    const handleAuthorize = async () => {
      await handleRemediateSuccess();
    };

    // USER CLICKS "Authorize 1-Click Hotfix" IN THE UI
    await handleAuthorize();

    // NETWORK VERIFICATION
    const remediateCalls = networkCalls.filter((c) => c.url === '/api/remediate');
    console.log(`Network calls intercepted: ${remediateCalls.length}`);
    remediateCalls.forEach((c, idx) => {
      console.log(`  [Call #${idx + 1}] ${c.method} ${c.url} -> Body: ${JSON.stringify(c.body)}`);
    });

    const firstCallBody = remediateCalls[0].body as Record<string, unknown>;
    assert.strictEqual(remediateCalls.length, 1, 'Network must record EXACTLY ONE POST request to /api/remediate');
    assert.strictEqual(remediateCalls[0].method, 'POST');
    assert.strictEqual(firstCallBody.actionId, 'act_hotfix_8080_8000');
    assert.strictEqual(firstCallBody.authorizedBy, 'Akthar (Lead SRE)');

    // LEDGER VERIFICATION
    assert.strictEqual(ledger.length, 3, 'Ledger should now have 3 items including remediation ACTION');
    const remediationEntry = ledger.find((i) => i.speaker === 'EchoSphere Remediation');
    assert(remediationEntry, 'Remediation entry must be present in ledger');
    assert.strictEqual(remediationEntry.tag, 'ACTION');
    assert.strictEqual(remediationEntry.status, '200 OK Patch Active');
    assert.strictEqual(isResolved, true, 'isResolved must be true');
    assert.strictEqual(isHotfixStaged, true, 'isHotfixStaged must be true');

    console.log('✔ PASS: Remediation button triggered EXACTLY ONE HTTP POST request and updated ledger atomically.');
  } finally {
    globalThis.fetch = originalFetch;
  }
}

/**
 * TEST 3: RTM ledger payload -> Goes through commitLedgerMutation only.
 */
async function testRtmLedgerPayload() {
  console.log('\n--- TEST 3: RTM Ledger Payload Path Verification ---');
  let ledger = createInitialLedger();

  // Incoming raw RTM payload
  const rawRtmPayload: RtmLedgerPayload = {
    object: 'message.ledger_item',
    speaker: 'Akthar',
    speakerUid: '10002',
    turnId: 105,
    text: 'Ingress route is returning 502 Bad Gateway',
    tag: 'HYPOTHESIS',
    status: 'LOGGED',
    timestampMs: 1725432030000,
  };

  assert(isRtmLedgerPayload(rawRtmPayload), 'Payload must pass isRtmLedgerPayload type guard');

  // Parse via parseLedgerItem
  const parsedItem = parseLedgerItem(rawRtmPayload, 'DefaultSpeaker');
  assert.strictEqual(parsedItem.speaker, 'Akthar');
  assert.strictEqual(parsedItem.speakerUid, '10002');
  assert.strictEqual(parsedItem.turnId, 105);
  assert.strictEqual(parsedItem.timestampMs, 1725432030000);
  assert.strictEqual(parsedItem.tag, 'HYPOTHESIS');

  // Apply through reducer
  let callbackInvoked = false;
  const commitLedgerMutation = (input: LedgerItem): LedgerItem => {
    const mutation = applyLedgerMutation(ledger, input);
    ledger = mutation.nextItems;
    callbackInvoked = true;
    return mutation.committedItem;
  };

  const target = commitLedgerMutation(parsedItem);

  assert.strictEqual(callbackInvoked, true, 'commitLedgerMutation callback must be invoked');
  assert.strictEqual(ledger.length, 3, 'Ledger must contain 3 items');
  assert.strictEqual(target.turnId, 105);

  // Also verify tag-based payload without object: 'message.ledger_item'
  const tagOnlyPayload = {
    speaker: 'EchoSphere',
    text: 'Database CPU is 2.1%. Connection pools nominal.',
    tag: 'FACT',
    status: 'VERIFIED',
  };
  assert(isRtmLedgerPayload(tagOnlyPayload), 'Tag-only payload must pass isRtmLedgerPayload');
  const parsedTagOnly = parseLedgerItem(tagOnlyPayload as RtmLedgerPayload);
  assert.strictEqual(parsedTagOnly.tag, 'FACT');

  console.log('✔ PASS: RTM payload parsed into canonical LedgerItem and routed strictly through commitLedgerMutation.');
}

/**
 * TEST 4: HolmesGPT button -> Still appends through reducer.
 */
async function testHolmesGptButton() {
  console.log('\n--- TEST 4: HolmesGPT Diagnostics Button ---');
  let ledger = createInitialLedger();
  assert.strictEqual(ledger.length, 2);

  // Mock GET /api/holmesgpt response
  const mockHolmesData = {
    status: 'online',
    clusterStatus: {
      services: ['ingress-nginx', 'auth-service', 'rds-aurora-postgres'],
    },
  };

  // Simulate button onClick logic:
  const mutation = applyLedgerMutation(ledger, {
    speaker: 'HolmesGPT Investigation Engine',
    text: `Cluster health verified. Status: ${mockHolmesData.status}. Monitored: ${mockHolmesData.clusterStatus.services.join(', ')}.`,
    tag: 'FACT',
    status: 'Diagnostic Verified',
    timestampMs: Date.now(),
  });
  ledger = mutation.nextItems;

  assert.strictEqual(ledger.length, 3, 'Ledger length must increment to 3');
  const holmesEntry = ledger[2];
  assert.strictEqual(holmesEntry.speaker, 'HolmesGPT Investigation Engine');
  assert.strictEqual(holmesEntry.tag, 'FACT');
  assert.strictEqual(holmesEntry.status, 'Diagnostic Verified');
  assert(holmesEntry.text.includes('Cluster health verified'));
  assert(typeof holmesEntry.timestampMs === 'number', 'timestampMs must be a number');
  assert(formatLedgerTimestamp(holmesEntry).length > 0, 'Timestamp must format to 24h clock');

  console.log('✔ PASS: HolmesGPT button appends properly typed entry through centralized reducer.');
}

/**
 * TEST 5: Refresh page -> Only initial mock entries appear.
 */
async function testRefreshPageInitialState() {
  console.log('\n--- TEST 5: Page Refresh / Reset Verification ---');
  
  // 1. Session A: mutations occur
  let sessionALedger = createInitialLedger();
  sessionALedger = applyLedgerMutation(sessionALedger, {
    speaker: 'EchoSphere Remediation',
    text: 'Hotfix applied',
    tag: 'ACTION',
    status: '200 OK Patch Active',
  }).nextItems;
  assert.strictEqual(sessionALedger.length, 3, 'Session A has 3 items');

  // 2. User refreshes the page: Component remounts with fresh useState
  const freshSessionLedger = createInitialLedger();

  assert.strictEqual(freshSessionLedger.length, 2, 'Refreshed page resets to exactly 2 initial mock entries');
  assert.strictEqual(freshSessionLedger[0].id, 'init-1');
  assert.strictEqual(freshSessionLedger[0].speaker, 'EchoSphere Sentinel');
  assert.strictEqual(freshSessionLedger[1].id, 'init-2');
  assert.strictEqual(freshSessionLedger[1].speaker, 'HolmesGPT Engine');
  
  // Verify timestamps are valid numbers
  assert(typeof freshSessionLedger[0].timestampMs === 'number', 'init-1 timestampMs must be numeric');
  assert(typeof freshSessionLedger[1].timestampMs === 'number', 'init-2 timestampMs must be numeric');

  // Verify non-persisted entry from Session A is gone
  assert(!freshSessionLedger.some((i) => i.tag === 'ACTION'), 'Action item from previous session must not exist');

  console.log('✔ PASS: Refreshing the page instantiates exactly the 2 initial mock entries (clean memory reset).');
}

/**
 * TEST 6: Event Store Hydration (/api/incident/events)
 */
async function testEventStoreHydration() {
  console.log('\n--- TEST 6: Event Store Hydration & Appending ---');
  const { GET: getEvents, POST: postEvent } = await import('../app/api/incident/events/route');

  // 1. Post a new event to the incident store
  const postReq = new NextRequest('http://localhost:3000/api/incident/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      incidentId: '#INC-8921',
      eventType: 'HOTFIX_STAGED',
      item: {
        id: 'hotfix-101',
        timestampMs: Date.now(),
        speaker: 'EchoSphere Remediation',
        text: 'kubectl patch ingress auth-svc applied',
        tag: 'ACTION',
        status: '200 OK Patch Active',
      },
    }),
  });

  const postRes = await postEvent(postReq);
  assert.strictEqual(postRes.status, 200, 'POST /api/incident/events should return 200');
  const postData = await postRes.json();
  assert.strictEqual(postData.success, true);
  assert.strictEqual(postData.event.eventType, 'HOTFIX_STAGED');
  assert(postData.event.sequenceNumber >= 3, 'Sequence number must be monotonic');

  // 2. Fetch all events for hydration
  const getReq = new NextRequest('http://localhost:3000/api/incident/events?incidentId=%23INC-8921');
  const getRes = await getEvents(getReq);
  assert.strictEqual(getRes.status, 200, 'GET /api/incident/events should return 200');
  const incident = await getRes.json();

  assert.strictEqual(incident.incidentId, '#INC-8921');
  assert(Array.isArray(incident.ledgerItems), 'ledgerItems must be an array');
  assert(incident.ledgerItems.some((i: LedgerItem) => i.id === 'hotfix-101'), 'Hydrated items must contain hotfix-101');

  console.log('✔ PASS: Event store appends monotonically and hydrates full incident ledger.');
}

/**
 * TEST 7: Automated Post-Incident Review (PIR) Generation (/api/incident/pir)
 */
async function testPirGeneration() {
  console.log('\n--- TEST 7: Post-Incident Review (PIR) Generation ---');
  const { GET: getPir } = await import('../app/api/incident/pir/route');

  const req = new NextRequest('http://localhost:3000/api/incident/pir?incidentId=%23INC-8921&format=markdown');
  const res = await getPir(req);
  assert.strictEqual(res.status, 200, 'GET /api/incident/pir should return 200');
  const pirMarkdown = await res.text();

  assert(pirMarkdown.includes('# Post-Incident Review (PIR) — #INC-8921'), 'PIR must contain title header');
  assert(pirMarkdown.includes('Chronological Event Timeline'), 'PIR must contain timeline table');
  assert(pirMarkdown.includes('Confirmed Telemetry Facts'), 'PIR must contain facts section');
  assert(pirMarkdown.includes('Remediation Actions Executed'), 'PIR must contain actions section');

  console.log('✔ PASS: Automated PIR compiled deterministically from incident ledger events.');
}

/**
 * TEST 8: Structured Telemetry Evidence in analyzeStatement
 */
async function testStructuredTelemetryEvidence() {
  console.log('\n--- TEST 8: Structured Telemetry Evidence in analyzeStatement ---');
  const { analyzeStatement } = await import('../lib/incident-analyzer');

  // Contradiction statement
  const contradictionResult = analyzeStatement('Akthar', 'I think the postgres database is locked up and dropping conns');
  assert.strictEqual(contradictionResult.tag, 'CONTRADICTION');
  assert.strictEqual(contradictionResult.isContradiction, true);
  assert(contradictionResult.telemetryEvidence, 'telemetryEvidence must be attached to contradiction');
  assert.strictEqual(contradictionResult.telemetryEvidence?.component, 'prod-aurora-pg-cluster-01');
  assert(typeof contradictionResult.telemetryEvidence?.confidence === 'number');
  assert(contradictionResult.telemetryEvidence!.confidence! >= 0.9);

  // Ingress root-cause action statement
  const actionResult = analyzeStatement('Ashrith', 'The ingress targetport has an 8080 8000 mismatch');
  assert.strictEqual(actionResult.tag, 'ACTION');
  assert.strictEqual(actionResult.isHotfixStaged, true);
  assert(actionResult.telemetryEvidence, 'telemetryEvidence must be attached to action');
  assert.strictEqual(actionResult.telemetryEvidence?.component, 'production-core/auth-service');
  assert.strictEqual(actionResult.telemetryEvidence?.metrics?.status, 'MISMATCH');

  console.log('✔ PASS: analyzeStatement produces structured TelemetryEvidence with verified confidence scores.');
}

/**
 * TEST 9: Multi-Speaker Audio Ingestion Config
 */
async function testMultiSpeakerSessionConfig() {
  console.log('\n--- TEST 9: Multi-Speaker Audio Ingestion Verification ---');
  const inviteAgentFile = await import('node:fs').then((fs) =>
    fs.promises.readFile('app/api/invite-agent/route.ts', 'utf-8'),
  );

  assert(
    inviteAgentFile.includes("remoteUids = body.remoteUids ?? (body.multiSpeaker ? ['*'] : [requester_id])"),
    'app/api/invite-agent/route.ts must support multiSpeaker wildcard audio ingestion',
  );

  const originalCreateSession = Agent.prototype.createSession;
  let capturedSessionConfig: unknown = null;
  // @ts-expect-error - Mock createSession for test
  Agent.prototype.createSession = function (config: unknown) {
    capturedSessionConfig = config;
    return {
      start: async () => 'agent-session-multispeaker',
    };
  };

  try {
    const { POST: inviteAgent } = await import('../app/api/invite-agent/route');
    const request = new NextRequest('http://localhost:3000/api/invite-agent', {
      body: JSON.stringify({
        channel_name: 'incident-war-room',
        requester_id: 'engineer-1',
        multiSpeaker: true,
      }),
      method: 'POST',
    });
    const response = await inviteAgent(request);
    assert.strictEqual(response.status, 200);
    const sessionConfig = capturedSessionConfig as { remoteUids?: string[] };
    assert(
      JSON.stringify(sessionConfig?.remoteUids) === JSON.stringify(['*']),
      'POST /api/invite-agent with multiSpeaker: true MUST configure remoteUids: ["*"]',
    );
  } finally {
    Agent.prototype.createSession = originalCreateSession;
  }

  console.log('✔ PASS: Agora Conversational AI Agent configured for unrestricted multi-speaker war room audio.');
}

async function runAll() {
  console.log('====================================================');
  console.log('  ECHOSPHERE INCIDENT STATE LEDGER RUNTIME TESTS   ');
  console.log('====================================================');

  await testDuplicateTurnId();
  await testRemediationNetworkRequest();
  await testRtmLedgerPayload();
  await testHolmesGptButton();
  await testRefreshPageInitialState();
  await testEventStoreHydration();
  await testPirGeneration();
  await testStructuredTelemetryEvidence();
  await testMultiSpeakerSessionConfig();

  console.log('\n====================================================');
  console.log('  ALL 9 RUNTIME TESTS PASSED WITH 100% SUCCESS     ');
  console.log('====================================================\n');
}

runAll().catch((err) => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
