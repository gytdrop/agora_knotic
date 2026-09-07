import { actionRegistry, ActionHandler } from './actions';
import { workflowStore } from './store';
import {
  ActionExecutionResult,
  Execution,
  ExecutionContext,
  ExecutionIncidentContext,
  ExecutionLogEntry,
  StepExecutionStatus,
  TriggerEventType,
  Workflow,
  WorkflowAction,
} from './types';

export interface ExecuteWorkflowOptions {
  triggerType?: TriggerEventType;
  triggerPayload?: Record<string, any>;
  incident?: Partial<ExecutionIncidentContext>;
  initialVariables?: Record<string, any>;
}

export function getDefaultDemoIncident(): ExecutionIncidentContext {
  return {
    id: '#7134',
    title: 'PostgreSQL connection pool exhausted on payment-service',
    severity: 'SEV-1',
    status: 'INVESTIGATING',
    lead: 'Sarah Chen (Staff SRE)',
    reporter: 'Alex Rivera (Infrastructure Lead)',
    customerImpact: true,
    slackChannel: '#incident-7134',
    warRoomUrl: 'https://ecosphere.dev/warroom/7134',
    summary: 'Elevated 500 error rates on payment checkout endpoints caused by DB connection exhaustion.',
    rootCause: 'Analytical queries holding long locks during peak transactional hours.',
  };
}

export async function executeWorkflow(
  workflow: Workflow,
  options: ExecuteWorkflowOptions = {}
): Promise<Execution> {
  const startedAt = Date.now();
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const triggerType = options.triggerType || workflow.trigger.type || 'manual';
  const triggerPayload = options.triggerPayload || {};

  // Build Incident context with fallback defaults
  const baseIncident = getDefaultDemoIncident();
  const providedIncident = options.incident || triggerPayload.incident || {};
  const incident: ExecutionIncidentContext = {
    ...baseIncident,
    ...providedIncident,
    id: providedIncident.id || baseIncident.id,
    title: providedIncident.title || baseIncident.title,
    severity: providedIncident.severity || baseIncident.severity,
    status: providedIncident.status || baseIncident.status,
  };

  const logs: ExecutionLogEntry[] = [];
  const stepResults: ActionExecutionResult[] = [];

  const addLog = (
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    step?: { id: string; name: string },
    data?: any
  ) => {
    logs.push({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      level,
      stepId: step?.id,
      stepName: step?.name,
      message,
      data,
    });
  };

  addLog(
    'info',
    `Workflow "${workflow.name}" started by trigger "${triggerType}". Target incident: ${incident.id} [${incident.severity}]`
  );

  const context: ExecutionContext = {
    executionId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    trigger: {
      type: triggerType,
      payload: triggerPayload,
    },
    incident,
    variables: {
      workflowName: workflow.name,
      triggerType,
      startedAtISO: new Date(startedAt).toISOString(),
      ...(options.initialVariables || {}),
    },
    stepOutputs: {},
    startedAt,
  };

  const initialExecution: Execution = {
    id: executionId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: 'running',
    triggerType,
    triggerPayload,
    startedAt,
    logs,
    stepResults,
  };

  // Record initial running state
  workflowStore.recordExecution(initialExecution);

  let workflowFailed = false;
  let failureError = '';

  // Sequential Action Execution
  for (let i = 0; i < workflow.actions.length; i++) {
    const action: WorkflowAction = workflow.actions[i];
    const stepStart = Date.now();
    const handler: ActionHandler | undefined = actionRegistry[action.type];

    addLog('info', `Executing action [${i + 1}/${workflow.actions.length}]: "${action.name}" (${action.type})`, {
      id: action.id,
      name: action.name,
    });

    if (!handler) {
      const err = `No handler registered for action type: ${action.type}`;
      addLog('error', err, { id: action.id, name: action.name });
      stepResults.push({
        actionId: action.id,
        actionName: action.name,
        actionType: action.type,
        status: 'failed',
        startedAt: stepStart,
        finishedAt: Date.now(),
        durationMs: Date.now() - stepStart,
        input: action.config,
        output: null,
        error: err,
        retryCount: 0,
      });
      workflowFailed = true;
      failureError = err;
      break;
    }

    // Retries logic
    const maxRetries = action.retryPolicy?.maxRetries ?? 0;
    const backoffMs = action.retryPolicy?.backoffMs ?? 200;
    let attempt = 0;
    let stepSuccess = false;
    let stepResultData: any = null;
    let stepError = '';

    while (attempt <= maxRetries && !stepSuccess) {
      try {
        if (attempt > 0) {
          addLog(
            'warn',
            `Retry attempt ${attempt}/${maxRetries} for action "${action.name}" after ${backoffMs * attempt}ms backoff`,
            { id: action.id, name: action.name }
          );
          await new Promise((res) => setTimeout(res, backoffMs * attempt));
        }

        stepResultData = await handler(action, context);
        stepSuccess = true;
      } catch (err: any) {
        stepError = err?.message || String(err);
        attempt++;
        if (attempt <= maxRetries) {
          addLog('warn', `Action "${action.name}" failed: ${stepError}. Retrying...`, {
            id: action.id,
            name: action.name,
          });
        }
      }
    }

    const stepDuration = Date.now() - stepStart;

    if (stepSuccess && stepResultData) {
      // Merge outputs into context
      context.stepOutputs[action.id] = stepResultData.output;
      if (stepResultData.variablesToMerge) {
        Object.assign(context.variables, stepResultData.variablesToMerge);
      }

      addLog('info', stepResultData.summary || `Action "${action.name}" completed successfully.`, {
        id: action.id,
        name: action.name,
      }, stepResultData.output);

      stepResults.push({
        actionId: action.id,
        actionName: action.name,
        actionType: action.type,
        status: 'success',
        startedAt: stepStart,
        finishedAt: Date.now(),
        durationMs: stepDuration,
        input: action.config,
        output: stepResultData.output,
        retryCount: attempt,
      });
    } else {
      addLog('error', `Action "${action.name}" failed permanently: ${stepError}`, {
        id: action.id,
        name: action.name,
      });

      stepResults.push({
        actionId: action.id,
        actionName: action.name,
        actionType: action.type,
        status: 'failed',
        startedAt: stepStart,
        finishedAt: Date.now(),
        durationMs: stepDuration,
        input: action.config,
        output: null,
        error: stepError,
        retryCount: attempt - 1,
      });

      workflowFailed = true;
      failureError = stepError;
      break;
    }
  }

  const finishedAt = Date.now();
  const totalDurationMs = finishedAt - startedAt;
  const finalStatus = workflowFailed ? 'failed' : 'success';

  addLog(
    finalStatus === 'success' ? 'info' : 'error',
    finalStatus === 'success'
      ? `Workflow "${workflow.name}" completed successfully in ${totalDurationMs}ms (${stepResults.length} actions executed).`
      : `Workflow "${workflow.name}" failed after ${totalDurationMs}ms: ${failureError}`
  );

  const completedExecution: Execution = {
    id: executionId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: finalStatus,
    triggerType,
    triggerPayload,
    startedAt,
    finishedAt,
    durationMs: totalDurationMs,
    error: workflowFailed ? failureError : undefined,
    logs,
    stepResults,
    contextSnapshot: {
      variables: context.variables,
      incident: context.incident,
    },
  };

  workflowStore.updateExecution(executionId, completedExecution);
  return completedExecution;
}
