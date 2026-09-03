import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  incidents: defineTable({
    incidentId: v.string(), // e.g. "#INC-8921"
    title: v.string(),
    severity: v.string(), // e.g. "SEV-1"
    status: v.string(), // "INVESTIGATING", "STAGED", "RESOLVED"
    rootCause: v.optional(v.string()),
    hotfixManifest: v.optional(v.string()),
    verbalTrigger: v.optional(v.string()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    resolvedBy: v.optional(v.string()),
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
});
