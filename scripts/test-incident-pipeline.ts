import { NextRequest } from 'next/server';
import { convexClient } from '../lib/convex-client';
import { api } from '../convex/_generated/api';
import { normalizeSeverity } from '../lib/incident-severity';
import { IncidentService } from '../lib/services/incident-service';
import { canTransition } from '../lib/services/lifecycle-engine';
import { recordTimelineEvent, getUnifiedIncidentTimeline } from '../lib/services/timeline-service';
import { createOrGetWarRoom } from '../lib/services/war-room-service';
import { dispatchNotifications, getIncidentNotificationLogs } from '../lib/services/notification-service';
import {
  generateIncidentAiSummary,
  generateTimelineAiSummary,
  extractAiActionItems,
  generateAiIncidentReport,
} from '../lib/services/ai-incident-service';
import { getLiveIncidentMetrics } from '../lib/services/metrics-service';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

function getJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('====================================================');
console.log('  STARTING ECOSPHERE INCIDENT PIPELINE E2E TESTS    ');
console.log('====================================================\n');

// ==========================================
// 1. DEMO SEEDING & BASELINE VERIFICATION
// ==========================================
async function testDemoSeeding() {
  console.log('▶ [1/10] Testing Demo Incident Seeding & Retrieval...');
  const seeded = await convexClient.mutation(api.incidents.seedDefaultIncidents, {});
  assert(Array.isArray(seeded) && seeded.length >= 4, 'seedDefaultIncidents must return at least 4 demo scenarios');

  const activeIncidents = await IncidentService.listIncidents({ status: 'ACTIVE' });
  assert(Array.isArray(activeIncidents), 'listIncidents must return an array');
  assert(activeIncidents.length >= 3, 'Must have at least 3 active incidents after seeding');

  // Verify diverse severities exist among seeded incidents
  const severities = seeded.map((i) => normalizeSeverity(i.severity));
  assert(severities.includes('Critical'), 'Seeded incidents must include a Critical / SEV0 incident');
  assert(severities.includes('Major'), 'Seeded incidents must include a Major / SEV1 incident');
  assert(severities.includes('Minor'), 'Seeded incidents must include a Minor / SEV2 incident');

  console.log(`  ✔ Seeded ${seeded.length} realistic incident scenarios successfully.`);
}

// ==========================================
// 2. INCIDENT LIFECYCLE STATE MACHINE
// ==========================================
async function testIncidentLifecycle() {
  console.log('\n▶ [2/10] Testing Strict State Machine Lifecycle & Transitions...');

  // 1. Create Incident
  const createResult = await IncidentService.createIncident({
    title: 'E2E Automated Pipeline Validation Incident',
    severity: 'Major',
    status: 'Detected',
    service: 'Payment Gateway',
    environment: 'production',
    summary: 'Synthetic test event created for end-to-end verification',
    lead: 'Lead Responder',
  });

  assert(createResult && createResult.incidentId, 'Incident must be created with an incidentId');
  const testIncidentId = createResult.incidentId;

  const incidentDoc = await IncidentService.getIncident(testIncidentId);
  assert(incidentDoc !== null, 'Created incident must be retrievable');
  assert(incidentDoc.status === 'Detected', 'Incident must start in Detected status');

  // 2. Acknowledge -> Investigating
  await IncidentService.acknowledgeIncident(testIncidentId, 'Test Responder');
  const ackedDoc = await IncidentService.getIncident(testIncidentId);
  assert(ackedDoc?.status === 'Investigating', 'Incident must transition to Investigating');
  assert(ackedDoc?.acknowledgedAt !== undefined, 'acknowledgedAt must be set on acknowledgement');

  // 3. Investigating -> Identified
  await IncidentService.transitionStatus(
    testIncidentId,
    'Identified',
    'Test Bot',
    'Root cause identified as database lock contention'
  );
  const identifiedDoc = await IncidentService.getIncident(testIncidentId);
  assert(identifiedDoc?.status === 'Identified', 'Incident must transition to Identified');

  // 4. Escalate: Major -> Critical
  await IncidentService.escalateIncident(testIncidentId, {
    severity: 'Critical',
    reason: 'Lock contention cascade affecting 45% of customer transactions',
    actor: 'Incident Commander',
  });
  const escalatedDoc = await IncidentService.getIncident(testIncidentId);
  assert(escalatedDoc?.severity === 'Critical', 'Incident severity must be escalated to Critical');

  // 5. Identified -> Monitoring
  await IncidentService.transitionStatus(
    testIncidentId,
    'Monitoring',
    'Database SME',
    'Applied database pool configuration tuning'
  );
  const monitoredDoc = await IncidentService.getIncident(testIncidentId);
  assert(monitoredDoc?.status === 'Monitoring', 'Incident must transition to Monitoring');

  // 6. Monitoring -> Resolved
  await IncidentService.transitionStatus(
    testIncidentId,
    'Resolved',
    'Incident Commander',
    'Scaled connection pool parameters and terminated orphaned lock transactions'
  );
  const resolvedDoc = await IncidentService.getIncident(testIncidentId);
  assert(
    resolvedDoc?.status.toUpperCase() === 'RESOLVED',
    'Incident must transition to Resolved'
  );
  assert(resolvedDoc?.resolvedAt !== undefined, 'resolvedAt timestamp must be recorded');

  // 7. Resolved -> Investigating (Reopen)
  await IncidentService.transitionStatus(
    testIncidentId,
    'Investigating',
    'On-Call Engineer',
    'Intermittent query spike observed after traffic shift'
  );
  const reopenedDoc = await IncidentService.getIncident(testIncidentId);
  assert(
    reopenedDoc?.status === 'Investigating',
    'Reopened incident must return to Investigating'
  );

  // 8. Negative Test: Strict State Machine Rejection
  const invalidTransition = canTransition('Investigating', 'Closed');
  assert(
    !invalidTransition.allowed,
    'State machine must disallow direct Investigating -> Closed transition'
  );

  let rejected = false;
  try {
    await IncidentService.transitionStatus(
      testIncidentId,
      'Closed',
      'Malicious Caller',
      'Illegal direct transition to Closed'
    );
  } catch {
    rejected = true;
  }
  assert(rejected, 'transitionStatus must throw error on invalid transition');

  console.log(`  ✔ State machine successfully executed and validated lifecycle for ${testIncidentId}`);
  return testIncidentId;
}

// ==========================================
// 3. UNIFIED TIMELINE ENGINE
// ==========================================
async function testTimelineEngine(incidentId: string) {
  console.log('\n▶ [3/10] Testing Unified Timeline Engine & Audit Trails...');

  // Add custom timeline events
  await recordTimelineEvent({
    incidentId,
    type: 'note',
    message: 'Observability dashboards indicate 99th percentile response time normalized to 110ms',
    actor: 'Observability Engineer',
    metadata: { metric: 'p99_latency_ms', value: 110 },
  });

  await recordTimelineEvent({
    incidentId,
    type: 'note',
    message: 'Broadcast status update posted to external customer portal',
    actor: 'Communications Lead',
    metadata: { channel: 'Statuspage', audience: 'Public' },
  });

  const timeline = await getUnifiedIncidentTimeline(incidentId);
  assert(timeline.totalCount >= 4, 'Timeline must contain lifecycle, escalation, and note events');

  // Verify ordering and structure
  const events = timeline.timelineEvents;
  for (let i = 1; i < events.length; i++) {
    assert(events[i].timestamp >= events[i - 1].timestamp, 'Timeline events must be chronologically ordered');
  }

  const messages = events.map((e) => e.message);
  assert(
    messages.some((m) => m.includes('acknowledged')),
    'Timeline must include acknowledgement event'
  );
  assert(
    messages.some((m) => m.includes('escalated')),
    'Timeline must include escalation event'
  );

  console.log(`  ✔ Timeline contains ${timeline.totalCount} chronological audit events.`);
}

// ==========================================
// 4. PARTICIPANT ROLES & ASSIGNEES
// ==========================================
async function testParticipantRoles(incidentId: string) {
  console.log('\n▶ [4/10] Testing Participant Roles & Incident Commander Assignment...');

  // Add participant
  await convexClient.mutation(api.incidents.addParticipant, {
    incidentId,
    userId: 'usr-alex-morgan',
    name: 'Alex Morgan',
    email: 'alex.morgan@acme.inc',
    role: 'Lead Investigator',
  });

  // Assign commander
  await convexClient.mutation(api.incidents.assignParticipantRole, {
    incidentId,
    name: 'Alex Morgan',
    role: 'Incident Commander',
  });

  // Assign communications lead
  await convexClient.mutation(api.incidents.assignParticipantRole, {
    incidentId,
    name: 'Taylor Swift',
    role: 'Communications Lead',
  });

  const participants = await convexClient.query(api.incidents.listParticipants, { incidentId });
  assert(Array.isArray(participants), 'Participants must be an array');
  const roles = participants.map((p) => p.role);
  assert(roles.includes('Incident Commander'), 'Must have assigned Incident Commander');
  assert(roles.includes('Communications Lead'), 'Must have assigned Communications Lead');

  // Verify incident record lead is synced
  const incident = await IncidentService.getIncident(incidentId);
  assert(incident?.lead === 'Alex Morgan', 'Incident lead must sync with Incident Commander');

  console.log(`  ✔ Assigned Incident Commander & Communications Lead successfully.`);
}

// ==========================================
// 5. TASKS & ACTION ITEMS CHECKLIST
// ==========================================
async function testTaskChecklist(incidentId: string) {
  console.log('\n▶ [5/10] Testing Action Items & Task Checklist...');

  const taskId1 = await convexClient.mutation(api.incidents.createTask, {
    incidentId,
    title: 'Audit connection pool exhaustion alarms in Datadog',
    assignee: 'Alex Morgan',
    priority: 'High',
  });
  assert(taskId1, 'Task 1 ID must be returned');

  const taskId2 = await convexClient.mutation(api.incidents.createTask, {
    incidentId,
    title: 'Update downstream client circuit-breaker timeouts',
    priority: 'Medium',
  });
  assert(taskId2, 'Task 2 ID must be returned');

  // Complete task 1
  await convexClient.mutation(api.incidents.updateTask, {
    taskId: taskId1,
    completed: true,
  });

  const tasks = await convexClient.query(api.incidents.listTasks, { incidentId });
  assert(tasks.length >= 2, 'Must list all created tasks');
  const completedTasks = tasks.filter((t) => t.completed);
  assert(completedTasks.length >= 1, 'Must have at least 1 completed task');

  console.log(`  ✔ Created and transitioned tasks: ${tasks.length} total, ${completedTasks.length} completed.`);
}

// ==========================================
// 6. WAR ROOM INTEGRATION
// ==========================================
async function testWarRoomIntegration(incidentId: string) {
  console.log('\n▶ [6/10] Testing Agora War Room Session Creation...');

  const warRoom = await createOrGetWarRoom(incidentId);

  assert(warRoom && warRoom.meetingId, 'War room must have meetingId');
  assert(warRoom.channelName.includes(incidentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()), 'War room channel must contain incident identifier');

  const fetched = await convexClient.query(api.incidents.getWarRoom, { incidentId });
  assert(fetched !== null, 'getWarRoom must retrieve active session');
  assert(fetched?.meetingId === warRoom.meetingId, 'Retrieved war room meetingId must match');

  console.log(`  ✔ War Room provisioned: Channel ${warRoom.channelName} (Meeting ID: ${warRoom.meetingId})`);
}

// ==========================================
// 7. MULTI-CHANNEL NOTIFICATIONS & COMMS
// ==========================================
async function testMultiChannelNotifications(incidentId: string) {
  console.log('\n▶ [7/10] Testing Multi-Channel Notification Dispatch...');

  const logs = await dispatchNotifications({
    incidentId,
    channels: ['slack', 'email', 'statuspage'],
    subject: `[CRITICAL] ${incidentId} Latency Degradation`,
    message: 'War room open. All primary responders join bridge.',
  });

  assert(logs.length === 3, 'Must have dispatched 3 channel notifications');
  assert(logs.every((l) => l.status === 'delivered'), 'All notifications must be delivered');

  const notifs = await getIncidentNotificationLogs(incidentId);
  assert(notifs.length >= 3, 'Must list sent notifications');

  console.log(`  ✔ Multi-channel dispatch recorded ${notifs.length} outbound communications.`);
}

// ==========================================
// 8. AI INCIDENT PIPELINE
// ==========================================
async function testAIIncidentPipeline(incidentId: string) {
  console.log('\n▶ [8/10] Testing AI Incident Pipeline (Summaries, Actions, Post-Mortem)...');

  // 1. Executive Summary
  const summary = await generateIncidentAiSummary(incidentId);
  assert(typeof summary.summary === 'string' && summary.summary.length > 0, 'AI summary must have summary text');
  assert(typeof summary.rootCauseHypothesis === 'string', 'AI summary must have root cause hypothesis');
  assert(Array.isArray(summary.suggestedNextActions), 'AI summary must have suggested next actions');

  // 2. Timeline Summary
  const tlSummary = await generateTimelineAiSummary(incidentId);
  assert(Array.isArray(tlSummary.timelineHighlights), 'AI timeline summary must return highlights array');
  assert(Array.isArray(tlSummary.keyTurningPoints), 'AI timeline summary must return key turning points');

  // 3. Action Items Extraction
  const actionItemsResult = await extractAiActionItems(incidentId);
  assert(Array.isArray(actionItemsResult.actionItems), 'AI action items must return an array');
  assert(actionItemsResult.actionItems.length > 0, 'AI must extract at least 1 action item');

  // 4. Full PIR Post-Mortem Report Generation
  const pirReport = await generateAiIncidentReport(incidentId);
  assert(typeof pirReport === 'string' && pirReport.includes('Comprehensive Post-Incident Review'), 'PIR report must be generated in markdown');

  // Verify artifact was saved
  const artifacts = await convexClient.query(api.incidents.listArtifacts, { incidentId });
  const pirArtifact = artifacts.find((a) => a.type === 'post_mortem_report');
  assert(pirArtifact !== undefined, 'Post-mortem report must be stored as an artifact in Convex');

  console.log('  ✔ AI generated: Executive Summary, Timeline Summary, Action Items, and Full PIR Document.');
}

// ==========================================
// 9. LIVE DASHBOARD METRICS ENGINE
// ==========================================
async function testDashboardMetrics() {
  console.log('\n▶ [9/10] Testing Live Dashboard Metrics Calculation...');
  const metrics = await getLiveIncidentMetrics();

  assert(typeof metrics.totalIncidents === 'number' && metrics.totalIncidents > 0, 'totalIncidents must be > 0');
  assert(typeof metrics.mtta === 'number', 'mtta must be calculated');
  assert(typeof metrics.mttr === 'number', 'mttr must be calculated');
  assert(typeof metrics.activeIncidents === 'number', 'activeIncidents count must be calculated');
  assert(typeof metrics.bySeverity === 'object', 'bySeverity breakdown must exist');
  assert(typeof metrics.bySeverity.Critical === 'number', 'bySeverity.Critical count must exist');
  assert(typeof metrics.ongoingWarRooms === 'number', 'ongoingWarRooms count must exist');

  console.log(`  ✔ Dashboard Metrics verified: ${metrics.totalIncidents} total, MTTA: ${metrics.mtta}m, MTTR: ${metrics.mttr}m, Active: ${metrics.activeIncidents}`);
}

// ==========================================
// 10. NEXT.JS REST API ROUTE CONTRACTS
// ==========================================
async function testNextJsRestApiRoutes(incidentId: string) {
  console.log('\n▶ [10/10] Testing Next.js App Router REST API Endpoints...');

  const { GET: listIncidents } = await import('../app/api/incidents/route');
  const { GET: getIncident, PUT: updateIncident } = await import('../app/api/incidents/[id]/route');
  const { POST: ackRoute } = await import('../app/api/incidents/[id]/acknowledge/route');
  const { POST: escalateRoute } = await import('../app/api/incidents/[id]/escalate/route');
  const { GET: timelineRoute } = await import('../app/api/incidents/[id]/timeline/route');
  const { POST: eventsRoute } = await import('../app/api/incidents/[id]/events/route');
  const { GET: tasksRoute, POST: createTaskRoute } = await import('../app/api/incidents/[id]/tasks/route');
  const { GET: warRoomRoute, POST: createWarRoomRoute } = await import('../app/api/incidents/[id]/war-room/route');
  const { POST: aiSummaryRoute } = await import('../app/api/incidents/[id]/ai/summary/route');
  const { POST: aiReportRoute } = await import('../app/api/incidents/[id]/ai/report/route');
  const { GET: metricsRoute } = await import('../app/api/incidents/metrics/route');

  const rawId = incidentId.replace(/^#/, '');
  const params = Promise.resolve({ id: rawId });

  // 1. GET /api/incidents
  const listRes = await listIncidents(new NextRequest(`${BASE_URL}/api/incidents`));
  const listBody = (await getJson(listRes)) as { incidents: unknown[] };
  assert(listRes.status === 200, 'GET /api/incidents should return 200');
  assert(Array.isArray(listBody.incidents), 'GET /api/incidents should return incidents array');

  // 2. GET /api/incidents/:id
  const getRes = await getIncident(new NextRequest(`${BASE_URL}/api/incidents/${rawId}`), { params });
  const getBody = (await getJson(getRes)) as { incident: { incidentId: string } };
  assert(getRes.status === 200, 'GET /api/incidents/:id should return 200');
  assert(getBody.incident?.incidentId === incidentId, 'Incident ID must match in response');

  // 3. PUT /api/incidents/:id
  const putRes = await updateIncident(
    new NextRequest(`${BASE_URL}/api/incidents/${rawId}`, {
      method: 'PUT',
      body: JSON.stringify({ rootCause: 'Updated via REST API route contract test' }),
    }),
    { params }
  );
  assert(putRes.status === 200, 'PUT /api/incidents/:id should return 200');

  // 4. POST /api/incidents/:id/acknowledge
  const ackRes = await ackRoute(
    new NextRequest(`${BASE_URL}/api/incidents/${rawId}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledgedBy: 'REST Responder' }),
    }),
    { params }
  );
  assert(ackRes.status === 200, 'POST /api/incidents/:id/acknowledge should return 200');

  // 5. POST /api/incidents/:id/escalate
  const escRes = await escalateRoute(
    new NextRequest(`${BASE_URL}/api/incidents/${rawId}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ newSeverity: 'Critical', reason: 'REST escalation verification' }),
    }),
    { params }
  );
  assert(escRes.status === 200, 'POST /api/incidents/:id/escalate should return 200');

  // 6. POST /api/incidents/:id/events
  const evRes = await eventsRoute(
    new NextRequest(`${BASE_URL}/api/incidents/${rawId}/events`, {
      method: 'POST',
      body: JSON.stringify({ type: 'note', content: 'REST API timeline event created' }),
    }),
    { params }
  );
  assert(evRes.status === 201, 'POST /api/incidents/:id/events should return 201');

  // 7. GET /api/incidents/:id/timeline
  const tlRes = await timelineRoute(new NextRequest(`${BASE_URL}/api/incidents/${rawId}/timeline`), { params });
  const tlBody = (await getJson(tlRes)) as { timeline: unknown[] };
  assert(tlRes.status === 200, 'GET /api/incidents/:id/timeline should return 200');
  assert(Array.isArray(tlBody.timeline), 'Timeline should be an array');

  // 8. GET & POST /api/incidents/:id/tasks
  const taskRes = await createTaskRoute(
    new NextRequest(`${BASE_URL}/api/incidents/${rawId}/tasks`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Task created via REST API', priority: 'medium' }),
    }),
    { params }
  );
  assert(taskRes.status === 201, 'POST /api/incidents/:id/tasks should return 201');

  const getTasksRes = await tasksRoute(new NextRequest(`${BASE_URL}/api/incidents/${rawId}/tasks`), { params });
  const getTasksBody = (await getJson(getTasksRes)) as { tasks: unknown[] };
  assert(getTasksRes.status === 200, 'GET /api/incidents/:id/tasks should return 200');
  assert(Array.isArray(getTasksBody.tasks), 'Tasks should be an array');

  // 9. GET & POST /api/incidents/:id/war-room
  const wrPostRes = await createWarRoomRoute(
    new NextRequest(`${BASE_URL}/api/incidents/${rawId}/war-room`, {
      method: 'POST',
      body: JSON.stringify({ severity: 'Critical' }),
    }),
    { params }
  );
  assert(wrPostRes.status === 200, 'POST /api/incidents/:id/war-room should return 200');

  const wrGetRes = await warRoomRoute(new NextRequest(`${BASE_URL}/api/incidents/${rawId}/war-room`), { params });
  assert(wrGetRes.status === 200, 'GET /api/incidents/:id/war-room should return 200');

  // 10. POST /api/incidents/:id/ai/summary
  const aiSumRes = await aiSummaryRoute(new NextRequest(`${BASE_URL}/api/incidents/${rawId}/ai/summary`, { method: 'POST' }), { params });
  assert(aiSumRes.status === 200, 'POST /api/incidents/:id/ai/summary should return 200');

  // 11. POST /api/incidents/:id/ai/report
  const aiRepRes = await aiReportRoute(new NextRequest(`${BASE_URL}/api/incidents/${rawId}/ai/report`, { method: 'POST' }), { params });
  assert(aiRepRes.status === 200, 'POST /api/incidents/:id/ai/report should return 200');

  // 12. GET /api/incidents/metrics
  const metRes = await metricsRoute(new NextRequest(`${BASE_URL}/api/incidents/metrics`));
  const metBody = (await getJson(metRes)) as { metrics: { totalIncidents: number } };
  assert(metRes.status === 200, 'GET /api/incidents/metrics should return 200');
  assert(typeof metBody.metrics?.totalIncidents === 'number', 'Metrics totalIncidents must be a number');

  console.log('  ✔ All Next.js App Router REST API endpoints passed verification cleanly.');
}

async function main() {
  try {
    await testDemoSeeding();
    const testIncidentId = await testIncidentLifecycle();
    await testTimelineEngine(testIncidentId);
    await testParticipantRoles(testIncidentId);
    await testTaskChecklist(testIncidentId);
    await testWarRoomIntegration(testIncidentId);
    await testMultiChannelNotifications(testIncidentId);
    await testAIIncidentPipeline(testIncidentId);
    await testDashboardMetrics();
    await testNextJsRestApiRoutes(testIncidentId);

    console.log('\n====================================================');
    console.log('  ALL 10 TEST PHASES PASSED WITH ZERO ERRORS!       ');
    console.log('  ECOSPHERE INCIDENT PIPELINE IS 100% OPERATIONAL.  ');
    console.log('====================================================\n');
  } catch (err) {
    console.error('\n❌ Test execution failed:');
    console.error(err);
    process.exit(1);
  }
}

main();
