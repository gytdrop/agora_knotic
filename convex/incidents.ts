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

export const updateIncidentStatus = mutation({
  args: {
    incidentId: v.string(),
    status: v.string(),
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
      status: args.status,
      ...(args.status === "RESOLVED" && !incident.resolvedAt
        ? { resolvedAt: Date.now() }
        : {}),
    });
    return incident._id;
  },
});

export const updateIncidentSeverity = mutation({
  args: {
    incidentId: v.string(),
    severity: v.string(),
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
      severity: args.severity,
    });
    return incident._id;
  },
});

export const updateIncidentSummary = mutation({
  args: {
    incidentId: v.string(),
    problem: v.optional(v.string()),
    impact: v.optional(v.string()),
    causes: v.optional(v.string()),
    mitigation: v.optional(v.string()),
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
      ...(args.problem !== undefined ? { problem: args.problem } : {}),
      ...(args.impact !== undefined ? { impact: args.impact } : {}),
      ...(args.causes !== undefined ? { causes: args.causes } : {}),
      ...(args.mitigation !== undefined ? { mitigation: args.mitigation } : {}),
    });
    return incident._id;
  },
});

export const updateIncidentLead = mutation({
  args: {
    incidentId: v.string(),
    lead: v.string(),
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
      lead: args.lead,
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
        title: "Alluring Muse - Production API Gateway Latency Spike",
        severity: "Major",
        status: "INVESTIGATING",
        lead: "Ashley Sawatsky",
        slackChannel: "#incident-7134",
        jiraKey: "INC-7134",
        problem:
          "API gateway p99 latency exceeded 1200ms across us-east-1 endpoints.",
        impact:
          "4.2% of checkout requests timed out between 01:15 UTC and 02:00 UTC.",
        causes:
          "Downstream connection pool starvation triggered by un-indexed query.",
        mitigation:
          "Connection pool capacity tripled from 40 to 120.",
        rootCause: "Downstream connection pool starvation triggered by un-indexed query.",
        createdAt: Date.now() - 3600 * 1000 * 2,
      },
      {
        incidentId: "#7126",
        title: "Code Deployment Error Leads to Service Degradation",
        severity: "Critical",
        status: "FIXING",
        lead: "Alex Mercer",
        slackChannel: "#incident-7126",
        jiraKey: "INC-7126",
        problem: "Faulty migration corrupted auth cache references.",
        impact: "Users attempting OAuth received 500 errors.",
        causes: "Serialization mismatch in client.",
        mitigation: "Rolled back to build 4401 and flushed keys.",
        rootCause: "A recent deployment introduced cache serialization error.",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7125",
        title: "Memory Leak in Main Application Server",
        severity: "Critical",
        status: "INVESTIGATING",
        lead: "Elena Rostova",
        slackChannel: "#incident-7125",
        jiraKey: "INC-7125",
        problem: "Memory leak caused OOM crashes on worker nodes.",
        impact: "Intermittent slowdowns on background jobs.",
        causes: "Unclosed file descriptors in file export worker.",
        mitigation: "Restarted affected worker processes.",
        rootCause: "Users reported unusual slowdowns traced to memory leak.",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7124",
        title: "Security Vulnerability Discovered in Auth Module",
        severity: "Major",
        status: "MONITORING",
        lead: "David Chen",
        slackChannel: "#incident-7124",
        jiraKey: "INC-7124",
        problem: "Flaw identified in token validation layer.",
        impact: "Potential elevated token reuse window.",
        causes: "Clock skew tolerance too wide.",
        mitigation: "Patched token expiry tolerance to 30s.",
        rootCause: "Security flaw identified in authentication module.",
        createdAt: Date.now() - 22 * 3600 * 1000,
      },
      {
        incidentId: "#7123",
        title: "Unexpected Database Downtime After Upgrade",
        severity: "Minor",
        status: "RESOLVED",
        lead: "Sarah Connor",
        slackChannel: "#incident-7123",
        jiraKey: "INC-7123",
        problem: "Database restart delay after engine patch.",
        impact: "Read queries queued for 90 seconds.",
        causes: "Slow log replay on reboot.",
        mitigation: "Completed journal replay and brought replica online.",
        rootCause: "Routine update database went offline momentarily.",
        createdAt: Date.now() - 22 * 3600 * 1000,
        resolvedAt: Date.now() - 20 * 3600 * 1000,
        resolvedBy: "Sarah Connor",
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
