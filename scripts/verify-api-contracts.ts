import { AgoraClient, Agent } from 'agora-agents';
import { RtcTokenBuilder } from 'agora-token';
import { NextRequest } from 'next/server';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function getJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

process.env.NEXT_PUBLIC_AGORA_APP_ID = '0123456789abcdef0123456789abcdef';
process.env.NEXT_AGORA_APP_CERTIFICATE = 'fedcba9876543210fedcba9876543210';
process.env.AGORA_APP_ID = '0123456789abcdef0123456789abcdef';
process.env.AGORA_APP_CERTIFICATE = 'fedcba9876543210fedcba9876543210';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function verifyGenerateAgoraTokenRoute() {
  const { GET: generateAgoraToken } =
    await import('../app/api/generate-agora-token/route');
  const originalBuildTokenWithRtm = RtcTokenBuilder.buildTokenWithRtm;
  let tokenBuilderArgs: unknown[] | null = null;

  RtcTokenBuilder.buildTokenWithRtm = ((...args: unknown[]) => {
    tokenBuilderArgs = args;
    return 'mock-rtc-rtm-token';
  }) as typeof RtcTokenBuilder.buildTokenWithRtm;

  try {
    const request = new NextRequest(
      `${BASE_URL}/api/generate-agora-token?uid=4321&channel=test-channel`,
    );
    const response = await generateAgoraToken(request);
    const body = await getJson(response);

    assert(
      response.status === 200,
      'GET /api/generate-agora-token should return 200',
    );
    assert(
      body.token === 'mock-rtc-rtm-token',
      'GET /api/generate-agora-token should return the built token',
    );
    assert(
      body.uid === '4321',
      'GET /api/generate-agora-token should preserve the requested uid',
    );
    assert(
      body.channel === 'test-channel',
      'GET /api/generate-agora-token should preserve the requested channel',
    );

    assert(
      Array.isArray(tokenBuilderArgs),
      'GET /api/generate-agora-token should call buildTokenWithRtm',
    );
    assert(
      tokenBuilderArgs?.[2] === 'test-channel',
      'buildTokenWithRtm should use the requested channel',
    );
    assert(
      tokenBuilderArgs?.[3] === '4321',
      'buildTokenWithRtm should receive the requested uid as account string',
    );
  } finally {
    RtcTokenBuilder.buildTokenWithRtm = originalBuildTokenWithRtm;
  }
}

async function verifyGenerateAgoraTokenReplacesZeroUid() {
  const { GET: generateAgoraToken } =
    await import('../app/api/generate-agora-token/route');
  const originalBuildTokenWithRtm = RtcTokenBuilder.buildTokenWithRtm;
  let tokenBuilderArgs: unknown[] | null = null;

  RtcTokenBuilder.buildTokenWithRtm = ((...args: unknown[]) => {
    tokenBuilderArgs = args;
    return 'mock-rtc-rtm-token';
  }) as typeof RtcTokenBuilder.buildTokenWithRtm;

  try {
    const request = new NextRequest(
      `${BASE_URL}/api/generate-agora-token?uid=0&channel=test-channel`,
    );
    const response = await generateAgoraToken(request);
    const body = await getJson(response);

    assert(
      response.status === 200,
      'GET /api/generate-agora-token?uid=0 should return 200',
    );
    assert(
      typeof body.uid === 'string' && body.uid !== '0',
      'GET /api/generate-agora-token?uid=0 should generate an RTM-safe uid',
    );
    assert(
      Array.isArray(tokenBuilderArgs) && tokenBuilderArgs[3] === body.uid,
      'buildTokenWithRtm should mint the token for the generated uid',
    );
  } finally {
    RtcTokenBuilder.buildTokenWithRtm = originalBuildTokenWithRtm;
  }
}

async function verifyChatCompletionsMissingEnv() {
  const { createChatCompletionsHandler } =
    await import('../app/api/chat/completions/handler');
  const originalApiKey = process.env.NEXT_LLM_API_KEY;
  const originalUrl = process.env.NEXT_LLM_URL;

  delete process.env.NEXT_LLM_API_KEY;
  delete process.env.NEXT_LLM_URL;

  const handler = createChatCompletionsHandler({
    createOpenAIClient: (() => {
      throw new Error('createOpenAI should not be called when env is missing');
    }) as never,
    streamTextImpl: (() => {
      throw new Error('streamText should not be called when env is missing');
    }) as never,
  });

  try {
    const request = new NextRequest(
      `${BASE_URL}/api/chat/completions`,
      {
        body: JSON.stringify({ messages: [] }),
        method: 'POST',
      },
    );
    const response = await handler(request);
    const body = await getJson(response);

    assert(
      response.status === 500,
      'POST /api/chat/completions should reject missing LLM env',
    );
    assert(
      body.error === 'NEXT_LLM_API_KEY and NEXT_LLM_URL must be set',
      'POST /api/chat/completions should explain missing LLM env',
    );
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.NEXT_LLM_API_KEY;
    } else {
      process.env.NEXT_LLM_API_KEY = originalApiKey;
    }
    if (originalUrl === undefined) {
      delete process.env.NEXT_LLM_URL;
    } else {
      process.env.NEXT_LLM_URL = originalUrl;
    }
  }
}

async function verifyChatCompletionsInvalidJson() {
  const { createChatCompletionsHandler } =
    await import('../app/api/chat/completions/handler');
  const originalApiKey = process.env.NEXT_LLM_API_KEY;
  const originalUrl = process.env.NEXT_LLM_URL;
  process.env.NEXT_LLM_API_KEY = 'test-key';
  process.env.NEXT_LLM_URL = 'https://example.test/v1/chat/completions';

  const handler = createChatCompletionsHandler({
    createOpenAIClient: (() => {
      throw new Error('createOpenAI should not be called for invalid JSON');
    }) as never,
    streamTextImpl: (() => {
      throw new Error('streamText should not be called for invalid JSON');
    }) as never,
  });

  try {
    const request = new NextRequest(
      `${BASE_URL}/api/chat/completions`,
      {
        body: '{not json',
        method: 'POST',
      },
    );
    const response = await handler(request);
    const body = await getJson(response);

    assert(
      response.status === 400,
      'POST /api/chat/completions should reject invalid JSON',
    );
    assert(
      body.error === 'Invalid JSON body',
      'POST /api/chat/completions should explain invalid JSON',
    );
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.NEXT_LLM_API_KEY;
    } else {
      process.env.NEXT_LLM_API_KEY = originalApiKey;
    }
    if (originalUrl === undefined) {
      delete process.env.NEXT_LLM_URL;
    } else {
      process.env.NEXT_LLM_URL = originalUrl;
    }
  }
}

async function verifyChatCompletionsSseDone() {
  const { createChatCompletionsHandler } =
    await import('../app/api/chat/completions/handler');
  const originalApiKey = process.env.NEXT_LLM_API_KEY;
  const originalUrl = process.env.NEXT_LLM_URL;
  process.env.NEXT_LLM_API_KEY = 'test-key';
  process.env.NEXT_LLM_URL = 'https://example.test/v1/chat/completions';

  let capturedBaseUrl: string | undefined;
  let capturedModelId: string | undefined;
  let capturedMessages: unknown;

  const handler = createChatCompletionsHandler({
    createOpenAIClient: ((options: { baseURL?: string }) => {
      capturedBaseUrl = options.baseURL;
      return (modelId: string) => {
        capturedModelId = modelId;
        return { modelId };
      };
    }) as never,
    streamTextImpl: ((options: { messages?: unknown }) => {
      capturedMessages = options.messages;
      return {
        textStream: (async function* () {
          yield 'hello';
          yield ' world';
        })(),
      };
    }) as never,
  });

  try {
    const request = new NextRequest(
      `${BASE_URL}/api/chat/completions`,
      {
        body: JSON.stringify({
          model: 'caller-model-ignored-for-routing',
          messages: [{ role: 'user', content: 'Hi' }],
        }),
        method: 'POST',
      },
    );
    const response = await handler(request);
    const text = await response.text();

    assert(
      response.status === 200,
      'POST /api/chat/completions should return 200 for a valid request',
    );
    assert(
      response.headers.get('content-type') === 'text/event-stream',
      'POST /api/chat/completions should return SSE content type',
    );
    assert(
      capturedBaseUrl === 'https://example.test/v1',
      'POST /api/chat/completions should pass base URL without /chat/completions',
    );
    assert(
      capturedModelId === 'gpt-4o',
      'POST /api/chat/completions should route to the pinned server model',
    );
    assert(
      JSON.stringify(capturedMessages) ===
        JSON.stringify([{ role: 'user', content: 'Hi' }]),
      'POST /api/chat/completions should pass request messages to streamText',
    );
    assert(
      text.includes('data: [DONE]'),
      'POST /api/chat/completions should terminate with [DONE]',
    );
    assert(
      text.includes('"content":"hello"') && text.includes('"content":" world"'),
      'POST /api/chat/completions should stream text chunks as OpenAI-compatible deltas',
    );
  } finally {
    if (originalApiKey === undefined) {
      delete process.env.NEXT_LLM_API_KEY;
    } else {
      process.env.NEXT_LLM_API_KEY = originalApiKey;
    }
    if (originalUrl === undefined) {
      delete process.env.NEXT_LLM_URL;
    } else {
      process.env.NEXT_LLM_URL = originalUrl;
    }
  }
}

async function verifyInviteAgentValidation() {
  const { POST: inviteAgent } = await import('../app/api/invite-agent/route');
  const request = new NextRequest(`${BASE_URL}/api/invite-agent`, {
    body: JSON.stringify({ channel_name: 'missing-requester' }),
    method: 'POST',
  });
  const response = await inviteAgent(request);
  const body = await getJson(response);

  assert(
    response.status === 400,
    'POST /api/invite-agent should reject missing fields',
  );
  assert(
    body.error === 'channel_name and requester_id are required',
    'POST /api/invite-agent should explain validation failure',
  );
}

async function verifyInviteAgentSuccess() {
  const { POST: inviteAgent } = await import('../app/api/invite-agent/route');
  const originalCreateSession = Agent.prototype.createSession;
  let capturedSessionConfig: {
    channel?: string;
    agentUid?: string;
    remoteUids?: string[];
  } | null = null;

  Agent.prototype.createSession = ((sessionConfig: unknown) => {
    capturedSessionConfig = sessionConfig as {
      channel?: string;
      agentUid?: string;
      remoteUids?: string[];
    };
    return {
      start: async () => 'mock-agent-id',
    };
  }) as unknown as typeof Agent.prototype.createSession;

  try {
    const request = new NextRequest(`${BASE_URL}/api/invite-agent`, {
      body: JSON.stringify({
        requester_id: 'user-4321',
        channel_name: 'test-channel',
      }),
      method: 'POST',
    });
    const response = await inviteAgent(request);
    const body = await getJson(response);

    assert(
      response.status === 200,
      'POST /api/invite-agent should return 200 on success',
    );
    assert(
      body.agent_id === 'mock-agent-id',
      'POST /api/invite-agent should return the started agent id',
    );
    assert(
      body.state === 'RUNNING',
      'POST /api/invite-agent should return RUNNING state',
    );
    assert(
      capturedSessionConfig !== null,
      'POST /api/invite-agent should call createSession',
    );
    const sessionConfig = capturedSessionConfig as {
      channel?: string;
      agentUid?: string;
      remoteUids?: string[];
    };

    assert(
      sessionConfig.channel === 'test-channel',
      'POST /api/invite-agent should pass the requested channel to createSession',
    );
    assert(
      sessionConfig.agentUid === '123456',
      'POST /api/invite-agent should use the shared default agent UID',
    );
    assert(
      JSON.stringify(sessionConfig.remoteUids) ===
        JSON.stringify(['user-4321']),
      'POST /api/invite-agent should scope the session to the requesting user',
    );
  } finally {
    Agent.prototype.createSession = originalCreateSession;
  }
}

async function verifyStopConversationValidation() {
  const { POST: stopConversation } =
    await import('../app/api/stop-conversation/route');
  const request = new NextRequest(
    `${BASE_URL}/api/stop-conversation`,
    {
      body: JSON.stringify({}),
      method: 'POST',
    },
  );
  const response = await stopConversation(request);
  const body = await getJson(response);

  assert(
    response.status === 400,
    'POST /api/stop-conversation should reject missing agent_id',
  );
  assert(
    body.error === 'agent_id is required',
    'POST /api/stop-conversation should explain validation failure',
  );
}

async function verifyStopConversationSuccess() {
  const { POST: stopConversation } =
    await import('../app/api/stop-conversation/route');
  const originalStopAgent = AgoraClient.prototype.stopAgent;
  let stoppedAgentId: string | null = null;

  AgoraClient.prototype.stopAgent = async function (
    this: AgoraClient,
    agentId: string,
  ) {
    stoppedAgentId = agentId;
  } as typeof AgoraClient.prototype.stopAgent;

  try {
    const request = new NextRequest(
      `${BASE_URL}/api/stop-conversation`,
      {
        body: JSON.stringify({ agent_id: 'mock-agent-id' }),
        method: 'POST',
      },
    );
    const response = await stopConversation(request);
    const body = await getJson(response);

    assert(
      response.status === 200,
      'POST /api/stop-conversation should return 200 on success',
    );
    assert(
      body.success === true,
      'POST /api/stop-conversation should return success',
    );
    assert(
      stoppedAgentId === 'mock-agent-id',
      'POST /api/stop-conversation should call stopAgent with the requested agent id',
    );
  } finally {
    AgoraClient.prototype.stopAgent = originalStopAgent;
  }
}

async function verifyWorkflowApiContracts() {
  const { GET: getWorkflows, POST: createWorkflow } = await import('../app/api/workflows/route');
  const { GET: getWorkflow, PUT: updateWorkflow } = await import('../app/api/workflows/[id]/route');
  const { POST: runWorkflow } = await import('../app/api/workflows/[id]/run/route');
  const { POST: enableWorkflow } = await import('../app/api/workflows/[id]/enable/route');
  const { POST: disableWorkflow } = await import('../app/api/workflows/[id]/disable/route');
  const { GET: getWorkflowHistory } = await import('../app/api/workflows/[id]/history/route');
  const { GET: getExecution } = await import('../app/api/workflows/executions/[executionId]/route');
  const { POST: triggerEvent } = await import('../app/api/workflows/trigger/route');

  // 1. GET /api/workflows
  const listReq = new NextRequest(`${BASE_URL}/api/workflows`);
  const listRes = await getWorkflows(listReq);
  const listBody = await getJson(listRes);
  assert(listRes.status === 200, 'GET /api/workflows should return 200');
  assert(Array.isArray(listBody.workflows), 'GET /api/workflows should return an array');
  assert(listBody.workflows.length >= 4, 'GET /api/workflows should have at least 4 demo workflows');

  // 2. POST /api/workflows
  const createReq = new NextRequest(`${BASE_URL}/api/workflows`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'API Contract Test Workflow',
      folder: 'Slack',
      type: 'incident',
      trigger: { type: 'manual' },
      actions: [{ id: 'a1', name: 'Log', type: 'log_event', config: { message: 'hello' } }],
    }),
  });
  const createRes = await createWorkflow(createReq);
  const createBody = (await getJson(createRes)) as { workflow: { id: string; name: string } };
  assert(createRes.status === 201, 'POST /api/workflows should return 201');
  assert(createBody.workflow?.name === 'API Contract Test Workflow', 'Created workflow name should match');
  const createdId = createBody.workflow.id;

  // 3. GET & PUT /api/workflows/[id]
  const getReq = new NextRequest(`${BASE_URL}/api/workflows/${createdId}`);
  const getRes = await getWorkflow(getReq, { params: Promise.resolve({ id: createdId }) });
  const getBody = (await getJson(getRes)) as { workflow: { id: string } };
  assert(getRes.status === 200, 'GET /api/workflows/:id should return 200');
  assert(getBody.workflow?.id === createdId, 'Fetched workflow ID should match');

  const putReq = new NextRequest(`${BASE_URL}/api/workflows/${createdId}`, {
    method: 'PUT',
    body: JSON.stringify({ description: 'Updated contract test description' }),
  });
  const putRes = await updateWorkflow(putReq, { params: Promise.resolve({ id: createdId }) });
  const putBody = (await getJson(putRes)) as { workflow: { description: string } };
  assert(putRes.status === 200, 'PUT /api/workflows/:id should return 200');
  assert(putBody.workflow?.description === 'Updated contract test description', 'PUT should update description');

  // 4. POST /api/workflows/[id]/run
  const runReq = new NextRequest(`${BASE_URL}/api/workflows/${createdId}/run`, {
    method: 'POST',
    body: JSON.stringify({ triggerType: 'manual' }),
  });
  const runRes = await runWorkflow(runReq, { params: Promise.resolve({ id: createdId }) });
  const runBody = (await getJson(runRes)) as { success: boolean; execution: { id: string; status: string } };
  assert(runRes.status === 200, 'POST /api/workflows/:id/run should return 200');
  assert(runBody.success === true, 'Execution should succeed');
  const execId = runBody.execution.id;

  // 5. POST /api/workflows/[id]/disable & enable
  const disReq = new NextRequest(`${BASE_URL}/api/workflows/${createdId}/disable`, { method: 'POST' });
  const disRes = await disableWorkflow(disReq, { params: Promise.resolve({ id: createdId }) });
  const disBody = (await getJson(disRes)) as { workflow: { enabled: boolean } };
  assert(disBody.workflow.enabled === false, 'POST /api/workflows/:id/disable should set enabled=false');

  const enReq = new NextRequest(`${BASE_URL}/api/workflows/${createdId}/enable`, { method: 'POST' });
  const enRes = await enableWorkflow(enReq, { params: Promise.resolve({ id: createdId }) });
  const enBody = (await getJson(enRes)) as { workflow: { enabled: boolean } };
  assert(enBody.workflow.enabled === true, 'POST /api/workflows/:id/enable should set enabled=true');

  // 6. GET /api/workflows/[id]/history
  const histReq = new NextRequest(`${BASE_URL}/api/workflows/${createdId}/history`);
  const histRes = await getWorkflowHistory(histReq, { params: Promise.resolve({ id: createdId }) });
  const histBody = (await getJson(histRes)) as { executions: unknown[] };
  assert(histRes.status === 200, 'GET /api/workflows/:id/history should return 200');
  assert(Array.isArray(histBody.executions) && histBody.executions.length >= 1, 'History should return execution');

  // 7. GET /api/workflows/executions/[executionId]
  const execReq = new NextRequest(`${BASE_URL}/api/workflows/executions/${execId}`);
  const execRes = await getExecution(execReq, { params: Promise.resolve({ executionId: execId }) });
  const execBody = (await getJson(execRes)) as { execution: { id: string; logs: unknown[] } };
  assert(execRes.status === 200, 'GET /api/workflows/executions/:id should return 200');
  assert(execBody.execution?.id === execId, 'Execution ID should match');
  assert(Array.isArray(execBody.execution?.logs), 'Execution should have logs');

  // 8. POST /api/workflows/trigger
  const trigReq = new NextRequest(`${BASE_URL}/api/workflows/trigger`, {
    method: 'POST',
    body: JSON.stringify({
      eventType: 'incident_resolved',
      incident: { id: '#INC-TEST', status: 'RESOLVED' },
    }),
  });
  const trigRes = await triggerEvent(trigReq);
  const trigBody = (await getJson(trigRes)) as { success: boolean; triggeredWorkflowsCount: number };
  assert(trigRes.status === 200, 'POST /api/workflows/trigger should return 200');
  assert(trigBody.success === true, 'Trigger dispatch should succeed');
}

async function main() {
  await verifyGenerateAgoraTokenRoute();
  await verifyGenerateAgoraTokenReplacesZeroUid();
  await verifyChatCompletionsMissingEnv();
  await verifyChatCompletionsInvalidJson();
  await verifyChatCompletionsSseDone();
  await verifyInviteAgentValidation();
  await verifyInviteAgentSuccess();
  await verifyStopConversationValidation();
  await verifyStopConversationSuccess();
  await verifyWorkflowApiContracts();

  console.log('API contract checks passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

