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

export const listActiveIncidents = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("incidents").order("desc").collect();
    return all.filter((inc) => inc.status !== "RESOLVED");
  },
});

export const listAllIncidents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("incidents").order("desc").collect();
  },
});

export const seedDefaultIncidents = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("incidents").first();
    if (existing) return;

    const defaults = [
      {
        incidentId: "#7134",
        title: "Alluring Muse",
        severity: "SEV2",
        status: "ACTIVE",
        rootCause: "No summary for this incident",
        createdAt: Date.now() - 3600 * 1000, // 1h ago
      },
      {
        incidentId: "#7126",
        title: "Code Deployment Error Leads to Service Degradation",
        severity: "SEV0",
        status: "ACTIVE",
        rootCause: "A recent deployment of new code to the production environment inadvertently introduced an error...",
        createdAt: Date.now() - 22 * 3600 * 1000, // 22h ago
      },
      {
        incidentId: "#7125",
        title: "Memory Leak in Main Application Server",
        severity: "SEV1",
        status: "ACTIVE",
        rootCause: "Users reported unusual slowdowns and service interruptions traced back to a memory leak...",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7124",
        title: "Security Vulnerability Discovered in Auth Module",
        severity: "SEV2",
        status: "ACTIVE",
        rootCause: "A significant security flaw was identified within the authentication module of our core platform...",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7123",
        title: "Unexpected Database Downtime After Upgrade",
        severity: "SEV3",
        status: "ACTIVE",
        rootCause: "During a routine update, a critical database unexpectedly went offline, leading to widespread...",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
    ];

    for (const item of defaults) {
      await ctx.db.insert("incidents", item);
    }
  },
});

export const createIncident = mutation({
  args: {
    title: v.string(),
    severity: v.string(),
    summary: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("incidents").collect();
    let maxId = 7134;
    for (const inc of all) {
      if (inc.incidentId?.startsWith("#")) {
        const parsed = parseInt(inc.incidentId.slice(1), 10);
        if (!isNaN(parsed) && parsed > maxId) {
          maxId = parsed;
        }
      }
    }
    const incidentId = `#${maxId + 1}`;
    const docId = await ctx.db.insert("incidents", {
      incidentId,
      title: args.title,
      severity: args.severity,
      status: "ACTIVE",
      rootCause: args.summary || "No summary for this incident",
      createdAt: Date.now(),
    });
    return { docId, incidentId };
  },
});
