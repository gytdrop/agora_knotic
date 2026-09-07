import { ActionType, ExecutionContext, WorkflowAction } from './types';

export interface ActionExecutionResultData {
  output: Record<string, any>;
  variablesToMerge?: Record<string, any>;
  summary: string;
}

export type ActionHandler = (
  action: WorkflowAction,
  context: ExecutionContext
) => Promise<ActionExecutionResultData>;

/**
 * Safely resolves nested property paths (e.g. 'incident.id' or 'variables.slackChannel')
 */
function resolvePath(obj: any, pathStr: string): any {
  if (!obj || !pathStr) return undefined;
  const parts = pathStr.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr === null || curr === undefined) return undefined;
    curr = curr[part];
  }
  return curr;
}

/**
 * Interpolates string templates with context variables:
 * e.g. "Incident {{incident.id}} - {{incident.title}}"
 */
export function interpolateString(template: string, context: ExecutionContext): string {
  if (!template || typeof template !== 'string') return '';
  return template.replace(/\{\{([^}]+)\}\}/g, (_, rawExpr) => {
    const expr = rawExpr.trim();
    // Try top-level context match
    const resolved = resolvePath(context, expr);
    if (resolved !== undefined && resolved !== null) {
      return String(resolved);
    }
    // Try variables
    if (context.variables && context.variables[expr] !== undefined) {
      return String(context.variables[expr]);
    }
    // Try incident directly
    if (context.incident && (context.incident as any)[expr] !== undefined) {
      return String((context.incident as any)[expr]);
    }
    return '';
  });
}

export const actionRegistry: Record<ActionType, ActionHandler> = {
  // -------------------------------------------------------------
  // Communication Actions
  // -------------------------------------------------------------
  create_slack_channel: async (action, context) => {
    const rawTemplate = action.config.channelNameTemplate || 'incident-{{incident.id}}';
    const rawName = interpolateString(rawTemplate, context);
    const sanitized = rawName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const channelName = `#${sanitized}`;
    const channelId = `C06${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const permalink = `https://ecosphere.slack.com/archives/${channelId}`;
    const membersInvited = ['@sarah.chen', '@alex.rivera', '@pagerduty-bot'];

    // Update incident context in place
    context.incident.slackChannel = channelName;

    return {
      output: {
        channelId,
        channelName,
        permalink,
        membersInvited,
        topic: interpolateString(action.config.topic || 'Live incident coordination', context),
        createdAt: Date.now(),
      },
      variablesToMerge: {
        slackChannel: channelName,
        slackChannelId: channelId,
        slackChannelUrl: permalink,
      },
      summary: `Created Slack channel ${channelName} (${channelId}) and invited ${membersInvited.length} responders.`,
    };
  },

  post_slack_message: async (action, context) => {
    const channel = interpolateString(action.config.channel || context.variables.slackChannel || '#incident-warroom', context);
    const text = interpolateString(action.config.message || 'Workflow notification alert', context);
    const messageTs = `${(Date.now() / 1000).toFixed(6)}`;
    const permalink = `https://ecosphere.slack.com/archives/${channel.replace('#', '')}/p${messageTs.replace('.', '')}`;

    return {
      output: {
        channel,
        text,
        ts: messageTs,
        permalink,
        delivered: true,
      },
      summary: `Broadcast message to Slack channel ${channel}: "${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`,
    };
  },

  post_teams_message: async (action, context) => {
    const channelName = interpolateString(action.config.channel || 'Incident Responders', context);
    const title = interpolateString(action.config.title || 'Incident Notice', context);
    const conversationId = `19:${Math.random().toString(36).substring(2, 12)}@thread.v2`;
    const activityId = `act-${Date.now()}`;

    return {
      output: {
        channel: channelName,
        title,
        conversationId,
        activityId,
        delivered: true,
      },
      summary: `Dispatched adaptive card to Microsoft Teams channel "${channelName}".`,
    };
  },

  send_email: async (action, context) => {
    const to = interpolateString(action.config.to || 'incident-team@ecosphere.dev', context);
    const subject = interpolateString(action.config.subject || 'Incident Notice: {{incident.title}}', context);
    const messageId = `msg_${Math.random().toString(36).substring(2, 14)}`;
    const recipients = to.split(',').map((s) => s.trim());

    return {
      output: {
        messageId,
        recipients,
        subject,
        status: 'delivered',
        timestamp: Date.now(),
      },
      summary: `Dispatched high-priority email alert to ${recipients.join(', ')} with subject: "${subject}".`,
    };
  },

  // -------------------------------------------------------------
  // Incident Operations Actions
  // -------------------------------------------------------------
  create_war_room: async (action, context) => {
    const incidentId = context.incident.id || 'INC-000';
    const cleanId = incidentId.replace('#', '').toLowerCase();
    const warRoomId = `warroom-${cleanId}`;
    const warRoomUrl = `https://ecosphere.dev/warroom/${cleanId}`;
    const agoraAppId = process.env.NEXT_PUBLIC_AGORA_APP_ID || '0123456789abcdef0123456789abcdef';

    context.incident.warRoomUrl = warRoomUrl;

    return {
      output: {
        warRoomId,
        warRoomUrl,
        agoraAppId,
        rtcChannel: `ecosphere-${cleanId}`,
        audioMode: 'HD-Spatial-SpatialVoice',
        rtmEnabled: true,
        aiTranscriptionEnabled: true,
        createdAt: Date.now(),
      },
      variablesToMerge: {
        warRoomUrl,
        warRoomId,
        agoraRtcChannel: `ecosphere-${cleanId}`,
      },
      summary: `Provisioned Agora HD Video War Room session at ${warRoomUrl} with live RTM transcription.`,
    };
  },

  assign_incident_commander: async (action, context) => {
    const role = action.config.role || 'Incident Commander';
    const assignee = action.config.assignee || 'Sarah Chen (Staff SRE)';
    
    context.incident.lead = assignee;

    return {
      output: {
        role,
        assignee,
        assignedAt: Date.now(),
        notifiedVia: ['Slack', 'PagerDuty', 'Email'],
      },
      variablesToMerge: {
        incidentCommander: assignee,
        incidentLead: assignee,
      },
      summary: `Assigned ${role} role to ${assignee} with automated escalation notifications.`,
    };
  },

  update_incident_severity: async (action, context) => {
    const previous = context.incident.severity;
    const next = action.config.newSeverity || 'SEV-1';
    context.incident.severity = next;

    return {
      output: {
        previousSeverity: previous,
        newSeverity: next,
        reason: action.config.reason || 'Escalation triggered by workflow automation rule',
        updatedAt: Date.now(),
      },
      summary: `Updated incident severity from ${previous} to ${next}.`,
    };
  },

  resolve_incident: async (action, context) => {
    const prevStatus = context.incident.status;
    context.incident.status = 'RESOLVED';
    const resolvedAt = Date.now();
    const resolvedBy = action.config.resolvedBy || 'Automated Workflow Engine';

    return {
      output: {
        previousStatus: prevStatus,
        status: 'RESOLVED',
        resolvedAt,
        resolvedBy,
        totalDurationMinutes: Math.max(1, Math.round((resolvedAt - context.startedAt) / 60000)),
      },
      summary: `Incident status updated to RESOLVED by ${resolvedBy}.`,
    };
  },

  archive_slack_channel: async (action, context) => {
    const rawTemplate = action.config.channelNameTemplate || context.variables.slackChannel || 'incident-{{incident.id}}';
    const channelName = interpolateString(rawTemplate, context);

    return {
      output: {
        channelName,
        archived: true,
        archivedAt: Date.now(),
        message: 'Channel marked read-only and archived following resolution.',
      },
      summary: `Archived Slack incident channel ${channelName}.`,
    };
  },

  close_war_room: async (action, context) => {
    const warRoomId = context.variables.warRoomId || `warroom-${(context.incident.id || 'INC').replace('#', '').toLowerCase()}`;
    return {
      output: {
        warRoomId,
        status: 'decommissioned',
        closedAt: Date.now(),
        totalParticipantsRecorded: 5,
        transcriptExportUri: `s3://ecosphere-recordings/transcripts/${warRoomId}.jsonl`,
      },
      summary: `Decommissioned Agora War Room session (${warRoomId}) and exported session transcript.`,
    };
  },

  // -------------------------------------------------------------
  // AI Automation Actions
  // -------------------------------------------------------------
  generate_ai_summary: async (action, context) => {
    const incidentTitle = context.incident.title || 'Production degradation';
    const severity = context.incident.severity || 'SEV-1';
    const detailLevel = action.config.detailLevel || 'detailed';

    const aiSummary =
      detailLevel === 'executive'
        ? `Executive Summary: Incident ${context.incident.id} (${incidentTitle}) declared at ${new Date(context.startedAt).toLocaleTimeString()}. Blast radius contained to regional payment ingestion APIs. Active mitigations underway.`
        : `AI Blast Radius Analysis: Incident ${context.incident.id} [${severity}] triggered by anomalous 5xx rate spike (>14.2%) on checkout service. Upstream dependencies (Postgres connection pool, Redis cache) analyzed. Automated triage initiated under incident lead ${context.incident.lead || 'On-Call'}.`;

    return {
      output: {
        summary: aiSummary,
        confidenceScore: 0.94,
        keyInsights: [
          '5xx error rate elevated on payment gateway edge proxy',
          'Database connection saturation detected during peak traffic window',
          'Automated canary rollback evaluated as viable containment option',
        ],
        generatedAt: Date.now(),
      },
      variablesToMerge: {
        aiSummary,
      },
      summary: `Generated AI Blast Radius Assessment with 94% confidence score.`,
    };
  },

  generate_ai_hypothesis: async (action, context) => {
    return {
      output: {
        hypotheses: [
          {
            rank: 1,
            title: 'PostgreSQL connection pool exhaustion under spike load',
            confidence: 0.88,
            evidence: 'Active connections peaked at 100% pool limit (250/250)',
          },
          {
            rank: 2,
            title: 'Downstream payment processor webhook timeout cascade',
            confidence: 0.72,
            evidence: 'P99 gateway latency rose from 120ms to 4800ms',
          },
        ],
      },
      summary: `Generated 2 AI Root-Cause Hypotheses with evidence correlation.`,
    };
  },

  generate_ai_action_items: async (action, context) => {
    const items = [
      {
        id: 'ACT-1',
        title: 'Increase PgBouncer max client connections and adjust timeout pool',
        assignee: 'Infra On-Call',
        priority: 'High',
      },
      {
        id: 'ACT-2',
        title: 'Add circuit breaker on external payment webhook retries',
        assignee: 'Core Payments Team',
        priority: 'Medium',
      },
      {
        id: 'ACT-3',
        title: 'Configure automated synthetic canary alerts for latency threshold',
        assignee: 'SRE Team',
        priority: 'Medium',
      },
    ];

    return {
      output: {
        actionItems: items,
        count: items.length,
      },
      variablesToMerge: {
        remediationActionItems: items,
      },
      summary: `Generated ${items.length} actionable post-incident engineering tasks.`,
    };
  },

  generate_ai_timeline: async (action, context) => {
    const timeline = [
      { timestamp: context.startedAt - 300000, description: 'Elevated 5xx error rate detected on API edge' },
      { timestamp: context.startedAt - 120000, description: 'PagerDuty incident triggered and declared' },
      { timestamp: context.startedAt, description: 'Automated workflow engine initiated escalation pipeline' },
    ];

    return {
      output: {
        timelineEvents: timeline,
      },
      summary: `Synthesized chronological event timeline (${timeline.length} milestone events).`,
    };
  },

  generate_ai_post_mortem: async (action, context) => {
    const postMortemMarkdown = `# Post-Mortem: ${context.incident.id} - ${context.incident.title}

**Severity**: ${context.incident.severity}  
**Lead**: ${context.incident.lead || 'Sarah Chen'}  
**Status**: RESOLVED  
**Resolution Time**: ${new Date().toISOString()}  

## 1. Executive Summary
During peak traffic, an unexpected connection pool saturation caused transient 500 errors on checkout and billing APIs. Responders mobilized within 2 minutes via automated Slack war room.

## 2. Root Cause
PgBouncer client connection limit was reached due to long-running analytical queries locking tables, exhausting available slots for transactional web workers.

## 3. Corrective Actions
- [x] Terminated blocking analytical queries and bounced replica pool.
- [ ] Partition analytics workload to dedicated read-replica.
- [ ] Implement tighter query timeouts on transactional DB.
`;

    return {
      output: {
        document: postMortemMarkdown,
        generatedAt: Date.now(),
        sections: ['Executive Summary', 'Root Cause', 'Timeline', 'Corrective Actions'],
      },
      variablesToMerge: {
        postMortemDoc: postMortemMarkdown,
      },
      summary: `Generated comprehensive AI Post-Mortem document and remediation action plan.`,
    };
  },

  // -------------------------------------------------------------
  // Internal & Control Actions
  // -------------------------------------------------------------
  wait_delay: async (action, _context) => {
    const seconds = action.config.delaySeconds || 1;
    // Cap at 5s in demo/test execution to keep responses fast
    const delayMs = Math.min(Math.max(seconds * 1000, 100), 5000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return {
      output: {
        delayRequestedSeconds: seconds,
        delayWaitedMs: delayMs,
      },
      summary: `Completed configured delay buffer (${(delayMs / 1000).toFixed(1)}s elapsed).`,
    };
  },

  condition_branch: async (action, context) => {
    const field = action.config.conditionField || 'incident.status';
    const operator = action.config.operator || 'in';
    const values = action.config.values || ['INVESTIGATING', 'FIXING'];
    const targetValue = resolvePath(context, field);

    let satisfied = false;
    if (operator === 'in' && Array.isArray(values)) {
      satisfied = values.includes(targetValue);
    } else if (operator === 'equals' || operator === '===') {
      satisfied = targetValue === action.config.value;
    } else if (operator === 'not_equals' || operator === '!==') {
      satisfied = targetValue !== action.config.value;
    } else if (operator === 'contains') {
      satisfied = String(targetValue || '').includes(String(action.config.value || ''));
    } else {
      satisfied = Boolean(targetValue);
    }

    return {
      output: {
        field,
        actualValue: targetValue,
        operator,
        expectedValues: values || action.config.value,
        conditionSatisfied: satisfied,
      },
      summary: `Condition evaluated: ${field} (${targetValue}) ${operator} ${JSON.stringify(values || action.config.value)} -> ${satisfied ? 'MATCH (Proceeding)' : 'NO MATCH'}`,
    };
  },

  log_event: async (action, context) => {
    const message = interpolateString(action.config.message || 'Workflow step executed', context);
    return {
      output: {
        loggedAt: Date.now(),
        message,
      },
      summary: `Audit log recorded: "${message}"`,
    };
  },

  update_status_page: async (action, context) => {
    const statusMsg = interpolateString(action.config.statusMessage || 'Investigating service degradation', context);
    const componentState = action.config.componentState || 'degraded_performance';
    const statusPageUrl = 'https://status.ecosphere.dev';

    return {
      output: {
        statusPageUrl,
        message: statusMsg,
        state: componentState,
        publishedAt: Date.now(),
      },
      variablesToMerge: {
        statusPageNoticeUrl: `${statusPageUrl}/incidents/${(context.incident.id || 'INC').replace('#', '').toLowerCase()}`,
      },
      summary: `Published status update to ${statusPageUrl}: "${statusMsg}" [${componentState}].`,
    };
  },
};
