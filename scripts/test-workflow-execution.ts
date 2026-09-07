import assert from 'node:assert';
import {
  actionRegistry,
  dispatchTrigger,
  executeWorkflow,
  getDefaultDemoIncident,
  interpolateString,
  matchesTrigger,
  workflowStore,
  Workflow,
} from '../lib/workflow-engine';

console.log('===============================================================');
console.log('🧪 Starting Rootly-style Workflow Execution Engine Audit Suite');
console.log('===============================================================\n');

async function runTests() {
  // Reset store to known baseline
  workflowStore.resetStoreToDefaults();

  // -------------------------------------------------------------------------
  // Test 1: Store & Preloaded Demo Workflows
  // -------------------------------------------------------------------------
  console.log('▶ Test 1: Verifying Preloaded Workflows in Store...');
  const workflows = workflowStore.listWorkflows();
  assert.ok(workflows.length >= 4, `Expected at least 4 preloaded workflows, found ${workflows.length}`);

  const p1Workflow = workflowStore.getWorkflow('wf-p1-production');
  const dbWorkflow = workflowStore.getWorkflow('wf-db-outage');
  const customerWorkflow = workflowStore.getWorkflow('wf-customer-impact');
  const resolutionWorkflow = workflowStore.getWorkflow('wf-incident-resolution');

  assert.ok(p1Workflow, 'wf-p1-production must exist');
  assert.ok(dbWorkflow, 'wf-db-outage must exist');
  assert.ok(customerWorkflow, 'wf-customer-impact must exist');
  assert.ok(resolutionWorkflow, 'wf-incident-resolution must exist');

  assert.strictEqual(p1Workflow.actions.length, 5, 'P1 workflow must have 5 actions');
  assert.strictEqual(dbWorkflow.actions.length, 4, 'DB outage workflow must have 4 actions');
  assert.strictEqual(customerWorkflow.actions.length, 3, 'Customer impact workflow must have 3 actions');
  assert.strictEqual(resolutionWorkflow.actions.length, 4, 'Incident resolution workflow must have 4 actions');
  console.log('  ✔ Preloaded demo workflows verified successfully.\n');

  // -------------------------------------------------------------------------
  // Test 2: Workflow CRUD Operations
  // -------------------------------------------------------------------------
  console.log('▶ Test 2: Verifying Workflow CRUD Operations...');
  const testWf = workflowStore.createWorkflow({
    name: 'Temporary Test Workflow',
    description: 'A test workflow for CRUD validation',
    enabled: true,
    type: 'alert',
    folder: 'Slack',
    integration: 'slack',
    trigger: { type: 'manual' },
    actions: [
      {
        id: 'test-act-1',
        name: 'Test Log Action',
        type: 'log_event',
        config: { message: 'CRUD test log' },
      },
    ],
  });

  assert.ok(testWf.id, 'Created workflow must have an ID');
  const retrieved = workflowStore.getWorkflow(testWf.id);
  assert.strictEqual(retrieved?.name, 'Temporary Test Workflow');

  const updated = workflowStore.updateWorkflow(testWf.id, { name: 'Updated Test Workflow', enabled: false });
  assert.strictEqual(updated?.name, 'Updated Test Workflow');
  assert.strictEqual(updated?.enabled, false);

  const toggled = workflowStore.toggleWorkflowEnabled(testWf.id, true);
  assert.strictEqual(toggled?.enabled, true);

  const deleted = workflowStore.deleteWorkflow(testWf.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(workflowStore.getWorkflow(testWf.id), null);
  console.log('  ✔ Workflow CRUD operations verified successfully.\n');

  // -------------------------------------------------------------------------
  // Test 3: Template Interpolation
  // -------------------------------------------------------------------------
  console.log('▶ Test 3: Verifying Template Interpolation...');
  const mockContext: any = {
    incident: { id: '#8921', title: 'Redis Cache Eviction Storm', severity: 'SEV-1' },
    variables: { slackChannel: '#incident-8921', warRoomUrl: 'https://ecosphere.dev/warroom/8921' },
  };
  const interpolated = interpolateString(
    'Alert: {{incident.id}} [{{incident.severity}}] in {{variables.slackChannel}} ({{incident.title}})',
    mockContext
  );
  assert.strictEqual(
    interpolated,
    'Alert: #8921 [SEV-1] in #incident-8921 (Redis Cache Eviction Storm)',
    'Template string should correctly interpolate nested context properties'
  );
  console.log('  ✔ Template interpolation verified successfully.\n');

  // -------------------------------------------------------------------------
  // Test 4: Manual Execution of Workflow 1 (P1 Production Incident)
  // -------------------------------------------------------------------------
  console.log('▶ Test 4: Executing Workflow 1 (P1 Production Incident) End-to-End...');
  const demoIncident = getDefaultDemoIncident();
  const exec1 = await executeWorkflow(p1Workflow, {
    triggerType: 'manual',
    incident: demoIncident,
  });

  assert.strictEqual(exec1.status, 'success', `Workflow 1 should succeed, error: ${exec1.error}`);
  assert.strictEqual(exec1.stepResults.length, 5, 'All 5 actions should have executed');
  assert.ok(exec1.durationMs !== undefined && exec1.durationMs >= 0, 'Duration should be recorded');
  assert.ok(exec1.logs.length > 5, 'Comprehensive execution logs should be captured');

  // Verify step 1: create_slack_channel
  const stepSlack = exec1.stepResults[0];
  assert.strictEqual(stepSlack.actionType, 'create_slack_channel');
  assert.strictEqual(stepSlack.status, 'success');
  assert.ok(stepSlack.output.channelName.startsWith('#incident-'), 'Slack channel should be named');
  assert.ok(stepSlack.output.permalink.includes('archives'), 'Slack permalink should be generated');

  // Verify step 2: assign_incident_commander
  const stepCmd = exec1.stepResults[1];
  assert.strictEqual(stepCmd.actionType, 'assign_incident_commander');
  assert.strictEqual(stepCmd.status, 'success');
  assert.strictEqual(stepCmd.output.assignee, 'Sarah Chen (Staff SRE)');

  // Verify step 3: generate_ai_summary
  const stepAi = exec1.stepResults[2];
  assert.strictEqual(stepAi.actionType, 'generate_ai_summary');
  assert.strictEqual(stepAi.status, 'success');
  assert.ok(stepAi.output.summary.includes(demoIncident.id), 'AI summary should reference incident');

  // Verify step 4: create_war_room
  const stepWar = exec1.stepResults[3];
  assert.strictEqual(stepWar.actionType, 'create_war_room');
  assert.strictEqual(stepWar.status, 'success');
  assert.ok(stepWar.output.warRoomUrl.includes('warroom'), 'War room URL should be generated');

  // Verify step 5: send_email
  const stepEmail = exec1.stepResults[4];
  assert.strictEqual(stepEmail.actionType, 'send_email');
  assert.strictEqual(stepEmail.status, 'success');
  assert.strictEqual(stepEmail.output.status, 'delivered');

  // Verify Context Variables Snapshot
  assert.ok(exec1.contextSnapshot, 'Context snapshot should be preserved');
  assert.ok(exec1.contextSnapshot?.variables.slackChannel, 'slackChannel variable should be propagated');
  assert.ok(exec1.contextSnapshot?.variables.warRoomUrl, 'warRoomUrl variable should be propagated');
  assert.ok(exec1.contextSnapshot?.variables.aiSummary, 'aiSummary variable should be propagated');
  console.log(`  ✔ Workflow 1 executed successfully in ${exec1.durationMs}ms with 5 actions.\n`);

  // -------------------------------------------------------------------------
  // Test 5: Execution of Workflow 2 (DB Outage with Delay & Condition)
  // -------------------------------------------------------------------------
  console.log('▶ Test 5: Executing Workflow 2 (DB Outage with Delay and Condition)...');
  const t0 = Date.now();
  const exec2 = await executeWorkflow(dbWorkflow, {
    triggerType: 'incident_severity_changed',
    incident: {
      id: '#DB-502',
      title: 'Aurora PostgreSQL Primary Storage Auto-Growth Throttled',
      severity: 'SEV-1',
      status: 'INVESTIGATING',
    },
  });
  const elapsed = Date.now() - t0;

  assert.strictEqual(exec2.status, 'success', `Workflow 2 should succeed, error: ${exec2.error}`);
  assert.strictEqual(exec2.stepResults.length, 4, 'All 4 actions should have executed');
  assert.ok(elapsed >= 1400, `Delay action should have waited at least 1.4s, waited ${elapsed}ms`);

  const conditionStep = exec2.stepResults[2];
  assert.strictEqual(conditionStep.actionType, 'condition_branch');
  assert.strictEqual(conditionStep.output.conditionSatisfied, true);

  const dbLeadStep = exec2.stepResults[3];
  assert.strictEqual(dbLeadStep.output.assignee, 'Marcus Vance (Principal DB Engineer)');
  console.log(`  ✔ Workflow 2 executed successfully in ${exec2.durationMs}ms with delay & condition verified.\n`);

  // -------------------------------------------------------------------------
  // Test 6: Workflow 3 (Customer Impact Notice)
  // -------------------------------------------------------------------------
  console.log('▶ Test 6: Executing Workflow 3 (Customer Impact)...');
  const exec3 = await executeWorkflow(customerWorkflow, {
    triggerType: 'incident_updated',
    incident: {
      id: '#PAY-99',
      title: 'Card Payment Gateway Degraded Response Times',
      severity: 'SEV-2',
      status: 'INVESTIGATING',
      customerImpact: true,
    },
  });
  assert.strictEqual(exec3.status, 'success');
  assert.strictEqual(exec3.stepResults[0].actionType, 'update_status_page');
  assert.strictEqual(exec3.stepResults[0].output.state, 'degraded_performance');
  console.log('  ✔ Workflow 3 (Customer Impact) verified successfully.\n');

  // -------------------------------------------------------------------------
  // Test 7: Trigger Matching & Dispatching (Incident Resolved -> Workflow 4)
  // -------------------------------------------------------------------------
  console.log('▶ Test 7: Testing Trigger Dispatching (incident_resolved)...');
  const resolvedPayload = {
    incident: {
      id: '#7134',
      title: 'PostgreSQL connection pool exhausted on payment-service',
      severity: 'SEV-1',
      status: 'RESOLVED',
    },
  };

  // Check matching predicate
  assert.strictEqual(matchesTrigger(resolutionWorkflow.trigger, 'incident_resolved', resolvedPayload), true);
  assert.strictEqual(matchesTrigger(p1Workflow.trigger, 'incident_resolved', resolvedPayload), false);

  const triggeredExecutions = await dispatchTrigger('incident_resolved', resolvedPayload);
  assert.ok(triggeredExecutions.length >= 1, 'Should trigger at least Workflow 4');

  const resExec = triggeredExecutions.find((e) => e.workflowId === 'wf-incident-resolution');
  assert.ok(resExec, 'Workflow 4 execution should be returned from trigger dispatch');
  assert.strictEqual(resExec.status, 'success');
  assert.strictEqual(resExec.stepResults.length, 4);

  // Check post-mortem output
  const postMortemStep = resExec.stepResults.find((s) => s.actionType === 'generate_ai_post_mortem');
  assert.ok(postMortemStep, 'Post-mortem step should be present');
  assert.ok(postMortemStep.output.document.includes('Post-Mortem: #7134'), 'Post-mortem doc should be generated');
  console.log('  ✔ Trigger dispatch and automated Workflow 4 execution verified.\n');

  // -------------------------------------------------------------------------
  // Test 8: Execution History & Log Persistence
  // -------------------------------------------------------------------------
  console.log('▶ Test 8: Verifying Execution History & Persistence in Store...');
  const historyP1 = workflowStore.listExecutionsForWorkflow('wf-p1-production');
  assert.ok(historyP1.length >= 1, 'P1 workflow should have history');
  assert.strictEqual(historyP1[0].id, exec1.id);

  const retrievedExec = workflowStore.getExecution(exec1.id);
  assert.ok(retrievedExec, 'Should retrieve execution by ID');
  assert.strictEqual(retrievedExec.status, 'success');
  assert.strictEqual(retrievedExec.stepResults.length, 5);
  assert.ok(retrievedExec.logs.length > 5);

  const allExecs = workflowStore.listAllExecutions();
  assert.ok(allExecs.length >= 3, `Should have multiple recorded executions, found ${allExecs.length}`);
  console.log(`  ✔ Execution history persisted correctly (${allExecs.length} executions recorded).\n`);

  // -------------------------------------------------------------------------
  // Test 9: Retry Mechanism on Simulated Transient Action Failure
  // -------------------------------------------------------------------------
  console.log('▶ Test 9: Verifying Automatic Action Retry Logic...');
  let attemptsMade = 0;
  const originalHandler = actionRegistry.log_event;

  // Mock handler that fails twice and succeeds on the 3rd attempt
  actionRegistry.log_event = async (action, context) => {
    attemptsMade++;
    if (attemptsMade < 3) {
      throw new Error(`Transient network glitch (attempt ${attemptsMade})`);
    }
    return originalHandler(action, context);
  };

  try {
    const retryTestWf: Workflow = {
      id: 'wf-retry-test',
      name: 'Retry Test Workflow',
      description: 'Tests exponential backoff and retry',
      enabled: true,
      type: 'incident',
      folder: 'Internal',
      integration: 'internal',
      trigger: { type: 'manual' },
      actions: [
        {
          id: 'retry-step-1',
          name: 'Flaky Step With Retries',
          type: 'log_event',
          config: { message: 'Recovered after retries' },
          retryPolicy: { maxRetries: 3, backoffMs: 50 },
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const retryExec = await executeWorkflow(retryTestWf);
    assert.strictEqual(retryExec.status, 'success', 'Flaky step should succeed after retries');
    assert.strictEqual(attemptsMade, 3, 'Should have taken exactly 3 attempts');
    assert.strictEqual(retryExec.stepResults[0].retryCount, 2, 'Retry count should be 2');
    console.log('  ✔ Retry mechanism succeeded with backoff and retry tracking.\n');
  } finally {
    actionRegistry.log_event = originalHandler;
  }

  console.log('===============================================================');
  console.log('🎉 ALL WORKFLOW EXECUTION ENGINE TESTS PASSED (9/9)!');
  console.log('===============================================================');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
