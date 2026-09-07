import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  incidents: defineTable({
    incidentId: v.string(), // e.g. "#INC-8921"
    incidentNumber: v.optional(v.number()),
    title: v.string(),
    description: v.optional(v.string()),
    severity: v.string(), // "SEV-0", "SEV-1", "SEV-2", "SEV-3", "SEV-4", "Critical", "Major", "Minor"
    status: v.string(), // "Detected", "Investigating", "Identified", "Monitoring", "Resolved", "Closed"
    service: v.optional(v.string()),
    environment: v.optional(v.string()), // "production", "staging", "sandbox"
    source: v.optional(v.string()), // "datadog", "pagerduty", "manual", "sentry"
    customerImpact: v.optional(v.string()),
    rootCause: v.optional(v.string()),
    hotfixManifest: v.optional(v.string()),
    verbalTrigger: v.optional(v.string()),
    lead: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    slackChannel: v.optional(v.string()),
    jiraKey: v.optional(v.string()),
    problem: v.optional(v.string()),
    impact: v.optional(v.string()),
    causes: v.optional(v.string()),
    mitigation: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    acknowledgedAt: v.optional(v.number()),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
    closedAt: v.optional(v.number()),
    mtta: v.optional(v.number()),
    mttr: v.optional(v.number()),
    duration: v.optional(v.number()),
    impactedUsers: v.optional(v.number()),
  }).index("by_incident_id", ["incidentId"]),

  incident_participants: defineTable({
    incidentId: v.string(),
    userId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.string(), // "Incident Commander", "Communications Lead", "Operations Lead", "Engineering Lead", "Scribe", "Observer"
    avatar: v.optional(v.string()),
    joinedAt: v.number(),
  }).index("by_incident_id", ["incidentId"]),

  incident_timeline_events: defineTable({
    incidentId: v.string(),
    type: v.string(), // "created", "severity_changed", "status_changed", "assignee_added", "participant_joined", "ai_summary_generated", "war_room_created", "workflow_executed", "update_posted", "task_completed", "resolved"
    message: v.string(),
    actor: v.string(),
    icon: v.optional(v.string()),
    metadata: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_incident_id", ["incidentId"]),

  incident_updates: defineTable({
    incidentId: v.string(),
    message: v.string(),
    visibility: v.string(), // "internal", "public", "executive"
    author: v.string(),
    channels: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_incident_id", ["incidentId"]),

  incident_tasks: defineTable({
    incidentId: v.string(),
    title: v.string(),
    status: v.string(), // "todo", "in_progress", "completed"
    completed: v.boolean(),
    assignee: v.optional(v.string()),
    priority: v.optional(v.string()), // "High", "Medium", "Low"
    dueTime: v.optional(v.string()),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_incident_id", ["incidentId"]),

  incident_artifacts: defineTable({
    incidentId: v.string(),
    type: v.string(), // "ai_summary", "ai_hypothesis", "ai_action_items", "post_mortem_report"
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_incident_id", ["incidentId"]),

  war_rooms: defineTable({
    incidentId: v.string(),
    meetingId: v.string(),
    channelName: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    recordingEnabled: v.boolean(),
    transcriptStatus: v.string(), // "active", "completed", "error"
    activeParticipantsCount: v.optional(v.number()),
  }).index("by_incident_id", ["incidentId"]),

  incident_notifications: defineTable({
    incidentId: v.string(),
    channel: v.string(), // "slack", "teams", "email", "statuspage", "internal"
    recipient: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.string(), // "delivered", "pending", "failed"
    timestamp: v.number(),
  }).index("by_incident_id", ["incidentId"]),

  workflow_executions: defineTable({
    incidentId: v.string(),
    workflowId: v.string(),
    workflowName: v.string(),
    trigger: v.string(),
    status: v.string(), // "completed", "running", "failed"
    actionsExecuted: v.array(v.string()),
    executedAt: v.number(),
    output: v.optional(v.string()),
  }).index("by_incident_id", ["incidentId"]),

  ledger_events: defineTable({
    incidentId: v.string(),
    timestamp: v.string(),
    speaker: v.string(),
    tag: v.union(
      v.literal("FACT"),
      v.literal("HYPOTHESIS"),
      v.literal("CONTRADICTION"),
      v.literal("ACTION")
    ),
    text: v.string(),
    createdAt: v.number(),
  }).index("by_incident_id", ["incidentId"]),

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
});
