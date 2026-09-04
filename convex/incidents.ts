import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getIncident = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
  },
});

export const listLedgerEvents = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("ledger_events")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
  },
});

export const ensureIncident = mutation({
  args: {
    incidentId: v.string(),
    title: v.string(),
    severity: v.string(),
    status: v.string(),
    rootCause: v.optional(v.string()),
    hotfixManifest: v.optional(v.string()),
    verbalTrigger: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("incidents", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const appendLedgerEvent = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("ledger_events", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const resolveIncident = mutation({
  args: {
    incidentId: v.string(),
    resolvedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) {
      throw new Error(`Incident ${args.incidentId} not found`);
    }
    await ctx.db.patch(incident._id, {
      status: "RESOLVED",
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
    });
    return incident._id;
  },
});
