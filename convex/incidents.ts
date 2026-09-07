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

    const events = await ctx.db
      .query("ledger_events")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();

    const facts = events.filter((e) => e.tag === "FACT");
    const contradictions = events.filter((e) => e.tag === "CONTRADICTION");
    const actions = events.filter((e) => e.tag === "ACTION");

    const problemText = incident.title || "Production service degradation";
    const impactText = `${incident.severity} impact detected across active traffic streams during live incident triage.`;
    
    let causesText = incident.causes || "";
    if (!causesText || causesText.includes("No summary")) {
      if (contradictions.length > 0) {
        causesText = `Root cause identified via telemetry contradiction analysis: ${contradictions.map((c) => c.text).join("; ")}`;
      } else if (facts.length > 0) {
        causesText = `Confirmed telemetry findings: ${facts.map((f) => f.text).join("; ")}`;
      } else {
        causesText = incident.rootCause || "Service disruption traced to upstream configuration mismatch.";
      }
    }

    let mitigationText = incident.mitigation || "";
    if (!mitigationText) {
      if (actions.length > 0) {
        mitigationText = `Hotfix and remediation actions executed: ${actions.map((a) => a.text).join("; ")}`;
      } else {
        mitigationText = "Traffic normalized following SRE remediation in War Room.";
      }
    }

    await ctx.db.patch(incident._id, {
      status: "RESOLVED",
      resolvedAt: Date.now(),
      resolvedBy: args.resolvedBy,
      problem: incident.problem || problemText,
      impact: incident.impact || impactText,
      causes: causesText,
      mitigation: mitigationText,
      rootCause: causesText,
    });
    return incident._id;
  },
});

export const generatePostMortem = mutation({
  args: {
    incidentId: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) {
      throw new Error(`Incident ${args.incidentId} not found`);
    }

    const events = await ctx.db
      .query("ledger_events")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();

    const facts = events.filter((e) => e.tag === "FACT");
    const contradictions = events.filter((e) => e.tag === "CONTRADICTION");
    const actions = events.filter((e) => e.tag === "ACTION");

    const problemText = incident.title || "Production service degradation";
    const impactText = `${incident.severity} impact detected across active traffic streams during live incident triage.`;

    let causesText = "";
    if (contradictions.length > 0) {
      causesText = `Root cause identified via telemetry contradiction analysis: ${contradictions.map((c) => c.text).join("; ")}`;
    } else if (facts.length > 0) {
      causesText = `Confirmed telemetry findings: ${facts.map((f) => f.text).join("; ")}`;
    } else {
      causesText = incident.rootCause || "Service disruption traced to upstream configuration mismatch.";
    }

    let mitigationText = "";
    if (actions.length > 0) {
      mitigationText = `Hotfix and remediation actions executed: ${actions.map((a) => a.text).join("; ")}`;
    } else {
      mitigationText = "Traffic normalized following SRE remediation in War Room.";
    }

    await ctx.db.patch(incident._id, {
      problem: problemText,
      impact: impactText,
      causes: causesText,
      mitigation: mitigationText,
      rootCause: causesText,
      status: "RESOLVED",
      resolvedAt: incident.resolvedAt || Date.now(),
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

    const isResolving = args.status === "RESOLVED";
    let patchData: Record<string, unknown> = {
      status: args.status,
      ...(isResolving && !incident.resolvedAt ? { resolvedAt: Date.now() } : {}),
    };

    if (isResolving && (!incident.problem || !incident.causes || incident.causes.includes("No summary"))) {
      const events = await ctx.db
        .query("ledger_events")
        .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
        .collect();

      const facts = events.filter((e) => e.tag === "FACT");
      const contradictions = events.filter((e) => e.tag === "CONTRADICTION");
      const actions = events.filter((e) => e.tag === "ACTION");

      const problemText = incident.title || "Production service degradation";
      const impactText = `${incident.severity} impact detected across active traffic streams during live incident triage.`;

      let causesText = incident.causes || "";
      if (!causesText || causesText.includes("No summary")) {
        if (contradictions.length > 0) {
          causesText = `Root cause identified via telemetry contradiction analysis: ${contradictions.map((c) => c.text).join("; ")}`;
        } else if (facts.length > 0) {
          causesText = `Confirmed telemetry findings: ${facts.map((f) => f.text).join("; ")}`;
        } else {
          causesText = incident.rootCause || "Service disruption traced to upstream configuration mismatch.";
        }
      }

      let mitigationText = incident.mitigation || "";
      if (!mitigationText) {
        if (actions.length > 0) {
          mitigationText = `Hotfix and remediation actions executed: ${actions.map((a) => a.text).join("; ")}`;
        } else {
          mitigationText = "Traffic normalized following SRE remediation in War Room.";
        }
      }

      patchData = {
        ...patchData,
        problem: incident.problem || problemText,
        impact: incident.impact || impactText,
        causes: causesText,
        mitigation: mitigationText,
        rootCause: causesText,
      };
    }

    await ctx.db.patch(incident._id, patchData);
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
    const now = Date.now();

    // 1. Core Demo Incidents matching Phase 12
    const demoIncidents = [
      {
        incidentId: "#INC-8921",
        incidentNumber: 8921,
        title: "Production API Latency Spike & Gateway Degradation",
        description: "Payment API gateway p99 latency exceeded 6200ms across us-east-1 endpoints, leading to intermittent 504 timeouts on auth-dependent microservices.",
        severity: "SEV-1",
        status: "Investigating",
        service: "Payment Gateway",
        environment: "production",
        source: "datadog",
        customerImpact: "47.2% of mobile and web checkout requests failing with HTTP 504 timeouts. Revenue impact estimated at $14,200/min.",
        lead: "Ashley Sawatsky",
        createdBy: "Datadog APM Ingress Monitor",
        slackChannel: "#incident-8921",
        jiraKey: "PAY-8921",
        problem: "Payment gateway p99 latency exceeded 6200ms across us-east-1 endpoints.",
        impact: "Approximately 1,420 checkout attempts per minute failing with HTTP 504 timeouts.",
        causes: "Downstream fraud-detection-svc socket backlog saturation holding open client connections.",
        mitigation: "Canary rollback of payment-service:v2.8.1 to v2.8.0; socket keep-alive pool limits expanded.",
        rootCause: "Downstream dependency fraud-detection-svc socket saturation causing timeout cascade.",
        createdAt: now - 3600 * 1000 * 1.5,
        updatedAt: now - 600 * 1000,
        acknowledgedAt: now - 3600 * 1000 * 1.4,
        mtta: 6,
        impactedUsers: 4800,
      },
      {
        incidentId: "#7126",
        incidentNumber: 7126,
        title: "Database Connection Exhaustion Under High Load",
        description: "PostgreSQL primary cluster reached 100% active client lease capacity, dropping incoming connection handshakes.",
        severity: "SEV-0",
        status: "Monitoring",
        service: "Primary PostgreSQL DB",
        environment: "production",
        source: "cloudwatch",
        customerImpact: "Critical database connection drop across all transaction write replicas.",
        lead: "Alex Mercer",
        createdBy: "AWS CloudWatch Alert",
        slackChannel: "#incident-7126",
        jiraKey: "INC-7126",
        problem: "Faulty migration corrupted auth cache references and triggered synchronous reconnect storm.",
        impact: "Users attempting OAuth login received 500 internal server errors.",
        causes: "Serialization mismatch in client driver preventing pool reuse.",
        mitigation: "Rolled back to build 4401 and flushed auth session keys.",
        rootCause: "A recent deployment introduced cache serialization error causing pool starvation.",
        createdAt: now - 22 * 3600 * 1000,
        updatedAt: now - 3600 * 1000,
        acknowledgedAt: now - 22 * 3600 * 1000 + 180 * 1000,
        mtta: 3,
        impactedUsers: 12500,
      },
      {
        incidentId: "#7123",
        incidentNumber: 7123,
        title: "Payments Service Partial Outage",
        description: "Third-party payment webhook processor timed out, queueing retry requests and delaying settlement emails.",
        severity: "SEV-2",
        status: "Resolved",
        service: "Webhook Processing Engine",
        environment: "production",
        source: "pagerduty",
        customerImpact: "Read queries queued for 90 seconds. 3.1% checkout transaction delay.",
        lead: "Sarah Connor",
        createdBy: "PagerDuty Integration",
        slackChannel: "#incident-7123",
        jiraKey: "INC-7123",
        problem: "Database restart delay after engine patch.",
        impact: "Read queries queued for 90 seconds.",
        causes: "Slow journal log replay on reboot following OS patch.",
        mitigation: "Completed journal replay and brought secondary read replica online.",
        rootCause: "Routine update database went offline momentarily.",
        createdAt: now - 22 * 3600 * 1000,
        acknowledgedAt: now - 22 * 3600 * 1000 + 240 * 1000,
        resolvedAt: now - 20 * 3600 * 1000,
        resolvedBy: "Sarah Connor",
        closedAt: now - 18 * 3600 * 1000,
        mtta: 4,
        mttr: 120,
        duration: 120,
        impactedUsers: 850,
      },
      {
        incidentId: "#7134",
        incidentNumber: 7134,
        title: "Authentication Service Failure & Token Expiration",
        description: "Key rotation mismatch caused active JWT bearer tokens to be rejected across EU cluster edge proxies.",
        severity: "SEV-1",
        status: "Identified",
        service: "Auth Service",
        environment: "production",
        source: "sentry",
        customerImpact: "Intermittent 401 Unauthorized errors on mobile sessions across EMEA region.",
        lead: "Ashley Sawatsky",
        createdBy: "Sentry Alert Rule",
        slackChannel: "#incident-7134",
        jiraKey: "INC-7134",
        problem: "API gateway p99 latency exceeded 1200ms across us-east-1 endpoints.",
        impact: "4.2% of checkout requests timed out between 01:15 UTC and 02:00 UTC.",
        causes: "Downstream connection pool starvation triggered by un-indexed query.",
        mitigation: "Connection pool capacity tripled from 40 to 120.",
        rootCause: "Downstream connection pool starvation triggered by un-indexed query.",
        createdAt: now - 3600 * 1000 * 2,
        acknowledgedAt: now - 3600 * 1000 * 1.9,
        mtta: 6,
        impactedUsers: 2400,
      },
    ];

    for (const item of demoIncidents) {
      const exists = await ctx.db
        .query("incidents")
        .withIndex("by_incident_id", (q) => q.eq("incidentId", item.incidentId))
        .first();

      if (!exists) {
        await ctx.db.insert("incidents", item);

        // Seed initial timeline events for this incident
        await ctx.db.insert("incident_timeline_events", {
          incidentId: item.incidentId,
          type: "created",
          message: `Incident declared as ${item.severity} by ${item.createdBy}`,
          actor: item.createdBy,
          icon: "Flame",
          timestamp: item.createdAt,
        });

        await ctx.db.insert("incident_timeline_events", {
          incidentId: item.incidentId,
          type: "assignee_added",
          message: `${item.lead} assumed Incident Commander role`,
          actor: item.lead,
          icon: "UserCheck",
          timestamp: item.createdAt + 180 * 1000,
        });

        // Seed participants
        await ctx.db.insert("incident_participants", {
          incidentId: item.incidentId,
          userId: `usr-${item.lead.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name: item.lead,
          role: "Incident Commander",
          joinedAt: item.createdAt + 180 * 1000,
        });

        await ctx.db.insert("incident_participants", {
          incidentId: item.incidentId,
          userId: "usr-david-chen",
          name: "David Chen",
          role: "Operations Lead",
          joinedAt: item.createdAt + 300 * 1000,
        });

        await ctx.db.insert("incident_participants", {
          incidentId: item.incidentId,
          userId: "usr-sarah-connor",
          name: "Sarah Connor",
          role: "Communications Lead",
          joinedAt: item.createdAt + 420 * 1000,
        });

        // Seed tasks
        await ctx.db.insert("incident_tasks", {
          incidentId: item.incidentId,
          title: "Verify secondary replica connection status and telemetry",
          status: "completed",
          completed: true,
          assignee: "David Chen",
          priority: "High",
          createdAt: item.createdAt + 600 * 1000,
          completedAt: item.createdAt + 1200 * 1000,
        });

        await ctx.db.insert("incident_tasks", {
          incidentId: item.incidentId,
          title: "Deploy hotfix and adjust keep-alive socket capacity limits",
          status: item.status === "Resolved" ? "completed" : "in_progress",
          completed: item.status === "Resolved",
          assignee: item.lead,
          priority: "High",
          createdAt: item.createdAt + 900 * 1000,
          completedAt: item.status === "Resolved" ? item.createdAt + 2400 * 1000 : undefined,
        });

        // Seed updates
        await ctx.db.insert("incident_updates", {
          incidentId: item.incidentId,
          message: `Investigating: Responders are actively analyzing telemetry and preparing mitigation for ${item.service}.`,
          author: "Sarah Connor (Comms Lead)",
          channels: ["Slack #incident-general", "Statuspage (status.acme.com)"],
          visibility: "public",
          createdAt: item.createdAt + 900 * 1000,
        });

        // Seed War Room
        await ctx.db.insert("war_rooms", {
          incidentId: item.incidentId,
          meetingId: `wr-${item.incidentId.replace(/[^a-zA-Z0-9]/g, "")}-live`,
          channelName: `incident-${item.incidentId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}`,
          startedAt: item.createdAt + 300 * 1000,
          recordingEnabled: true,
          transcriptStatus: item.status === "Resolved" ? "completed" : "active",
          activeParticipantsCount: item.status === "Resolved" ? 0 : 3,
        });

        // Seed Notifications
        await ctx.db.insert("incident_notifications", {
          incidentId: item.incidentId,
          channel: "slack",
          recipient: item.slackChannel || `#incident-${item.incidentNumber}`,
          subject: `[${item.severity}] ${item.title}`,
          message: `Incident declared. Lead: ${item.lead}`,
          status: "delivered",
          timestamp: item.createdAt,
        });

        // Seed Workflow Execution
        await ctx.db.insert("workflow_executions", {
          incidentId: item.incidentId,
          workflowId: "wf-1",
          workflowName: "[Automation] Page on-call & provision Slack war room",
          trigger: `Incident Created (${item.severity})`,
          status: "completed",
          actionsExecuted: [
            `Paged on-call commander (${item.lead}) via PagerDuty`,
            `Provisioned Slack channel ${item.slackChannel || `#incident-${item.incidentNumber}`}`,
            `Attached core platform diagnostic runbook`,
          ],
          executedAt: item.createdAt + 60 * 1000,
          output: "Responders paged and Slack channel active.",
        });
      }
    }

    return await ctx.db.query("incidents").collect();
  },
});

export const seedDemoIncidents = seedDefaultIncidents;


export const createIncident = mutation({
  args: {
    incidentId: v.optional(v.string()),
    title: v.string(),
    severity: v.string(),
    summary: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.string()),
    lead: v.optional(v.string()),
    service: v.optional(v.string()),
    environment: v.optional(v.string()),
    source: v.optional(v.string()),
    customerImpact: v.optional(v.string()),
    createdBy: v.optional(v.string()),
    rootCause: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Atomic sequential incident ID generation via dedicated counters table
    const counterDoc = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "incident_id"))
      .first();

    let nextNumber: number;
    if (counterDoc) {
      nextNumber = counterDoc.value + 1;
      await ctx.db.patch(counterDoc._id, { value: nextNumber });
    } else {
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
      nextNumber = maxId + 1;
      await ctx.db.insert("counters", {
        name: "incident_id",
        value: nextNumber,
      });
    }

    const incidentId = args.incidentId || `#${nextNumber}`;
    const now = Date.now();
    const leadName = args.lead || "Ashley Sawatsky";
    const initialStatus = args.status || "Investigating";

    const docId = await ctx.db.insert("incidents", {
      incidentId,
      incidentNumber: nextNumber,
      title: args.title,
      description: args.description || args.summary || "Incident declared via triage console",
      severity: args.severity,
      status: initialStatus,
      service: args.service || "Core API Gateway",
      environment: args.environment || "production",
      source: args.source || "datadog",
      customerImpact: args.customerImpact || "Triage in progress; latency elevation observed",
      lead: leadName,
      createdBy: args.createdBy || leadName,
      slackChannel: `#incident-${nextNumber}`,
      jiraKey: `INC-${nextNumber}`,
      problem: args.description || args.summary || args.title,
      rootCause: args.rootCause || args.summary || "Under investigation by responders",
      createdAt: now,
      updatedAt: now,
      acknowledgedAt: initialStatus === "Investigating" ? now : undefined,
    });

    // 1. Emitted timeline event
    await ctx.db.insert("incident_timeline_events", {
      incidentId,
      type: "created",
      message: `Incident declared as ${args.severity}: ${args.title}`,
      actor: leadName,
      icon: "Flame",
      metadata: JSON.stringify({ severity: args.severity, source: args.source || "manual" }),
      timestamp: now,
    });

    // 2. Add Incident Commander participant
    await ctx.db.insert("incident_participants", {
      incidentId,
      userId: `usr-${leadName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
      name: leadName,
      role: "Incident Commander",
      joinedAt: now,
    });

    // 3. Workflow trigger: on incident created
    await ctx.db.insert("workflow_executions", {
      incidentId,
      workflowId: "wf-1",
      workflowName: "[Automation] Page on-call & provision Slack war room",
      trigger: `Incident Created (${args.severity})`,
      status: "completed",
      actionsExecuted: [
        `Paged on-call commander (${leadName}) via PagerDuty`,
        `Provisioned Slack channel #incident-${nextNumber}`,
        `Attached core platform diagnostic runbook`,
      ],
      executedAt: now,
      output: "Responders paged and Slack channel initialized.",
    });

    // 4. Initial Slack announcement
    await ctx.db.insert("incident_notifications", {
      incidentId,
      channel: "slack",
      recipient: `#incident-${nextNumber}`,
      subject: `[${args.severity}] ${args.title}`,
      message: `Incident declared by ${leadName}. Responders notified.`,
      status: "delivered",
      timestamp: now,
    });

    return { docId, incidentId };
  },
});

export const updateIncident = mutation({
  args: {
    incidentId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    severity: v.optional(v.string()),
    status: v.optional(v.string()),
    service: v.optional(v.string()),
    environment: v.optional(v.string()),
    customerImpact: v.optional(v.string()),
    lead: v.optional(v.string()),
    slackChannel: v.optional(v.string()),
    jiraKey: v.optional(v.string()),
    problem: v.optional(v.string()),
    impact: v.optional(v.string()),
    causes: v.optional(v.string()),
    mitigation: v.optional(v.string()),
    rootCause: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) {
      throw new Error(`Incident ${args.incidentId} not found`);
    }

    const { incidentId, ...patchFields } = args;
    const cleanPatch: Record<string, unknown> = {
      updatedAt: Date.now(),
    };
    for (const [key, val] of Object.entries(patchFields)) {
      if (val !== undefined) cleanPatch[key] = val;
    }

    await ctx.db.patch(incident._id, cleanPatch);
    return incident._id;
  },
});

export const acknowledgeIncident = mutation({
  args: {
    incidentId: v.string(),
    actor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) throw new Error(`Incident ${args.incidentId} not found`);

    const now = Date.now();
    const ackTime = incident.acknowledgedAt || now;
    const mtta = Math.max(0, Math.round((ackTime - incident.createdAt) / (60 * 1000)));

    await ctx.db.patch(incident._id, {
      status: "Investigating",
      acknowledgedAt: ackTime,
      mtta,
      updatedAt: now,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "status_changed",
      message: `${args.actor || incident.lead || "Responder"} acknowledged page (MTTA: ${mtta}m)`,
      actor: args.actor || incident.lead || "Responder",
      icon: "UserCheck",
      timestamp: now,
    });

    return { success: true, mtta };
  },
});

export const escalateIncident = mutation({
  args: {
    incidentId: v.string(),
    severity: v.string(),
    team: v.optional(v.string()),
    engineer: v.optional(v.string()),
    reason: v.optional(v.string()),
    actor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) throw new Error(`Incident ${args.incidentId} not found`);

    const now = Date.now();
    const oldSeverity = incident.severity;

    await ctx.db.patch(incident._id, {
      severity: args.severity,
      updatedAt: now,
    });

    const actorName = args.actor || incident.lead || "Incident Commander";
    const teamText = args.team ? ` to ${args.team} (${args.engineer || "Primary On-Call"})` : "";
    const reasonText = args.reason ? `: ${args.reason}` : "";

    // 1. Timeline event
    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "severity_changed",
      message: `Severity escalated from ${oldSeverity} to ${args.severity}${teamText}${reasonText}`,
      actor: actorName,
      icon: "AlertTriangle",
      metadata: JSON.stringify({ oldSeverity, newSeverity: args.severity, team: args.team, engineer: args.engineer }),
      timestamp: now,
    });

    // 2. Escalation Workflow Execution
    await ctx.db.insert("workflow_executions", {
      incidentId: args.incidentId,
      workflowId: "wf-escalation",
      workflowName: `[Escalation] ${args.severity} Emergency On-Call Page`,
      trigger: `Severity Escalated to ${args.severity}`,
      status: "completed",
      actionsExecuted: [
        `Dispatched urgent page to ${args.team || "Escalation On-Call"}`,
        `Alerted Engineering Leadership & Incident Commander`,
        `Updated incident severity badge in dashboard`,
      ],
      executedAt: now,
      output: `Escalation page delivered to ${args.engineer || "on-call engineer"}.`,
    });

    // 3. Notification record
    await ctx.db.insert("incident_notifications", {
      incidentId: args.incidentId,
      channel: "pagerduty",
      recipient: args.engineer || "On-Call Rotation",
      subject: `HIGH URGENCY: Escalated to ${args.severity} - ${incident.title}`,
      message: `Incident ${args.incidentId} escalated by ${actorName}. ${args.reason || ""}`,
      status: "delivered",
      timestamp: now,
    });

    return { success: true, oldSeverity, newSeverity: args.severity };
  },
});

export const reopenIncident = mutation({
  args: {
    incidentId: v.string(),
    actor: v.optional(v.string()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) throw new Error(`Incident ${args.incidentId} not found`);

    const now = Date.now();
    const actorName = args.actor || incident.lead || "Incident Commander";

    await ctx.db.patch(incident._id, {
      status: "Investigating",
      resolvedAt: undefined,
      resolvedBy: undefined,
      closedAt: undefined,
      updatedAt: now,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "status_changed",
      message: `Incident reopened by ${actorName}${args.reason ? `: ${args.reason}` : ""}`,
      actor: actorName,
      icon: "RotateCcw",
      timestamp: now,
    });

    return { success: true };
  },
});

export const deleteIncident = mutation({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    const incident = await ctx.db
      .query("incidents")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!incident) return false;

    // Remove child documents
    const deleteBatch = async (table: "incident_timeline_events" | "incident_participants" | "incident_tasks" | "incident_updates" | "incident_artifacts" | "war_rooms" | "incident_notifications" | "workflow_executions" | "ledger_events") => {
      const items = await ctx.db
        .query(table)
        .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
    };

    await deleteBatch("incident_timeline_events");
    await deleteBatch("incident_participants");
    await deleteBatch("incident_tasks");
    await deleteBatch("incident_updates");
    await deleteBatch("incident_artifacts");
    await deleteBatch("war_rooms");
    await deleteBatch("incident_notifications");
    await deleteBatch("workflow_executions");
    await deleteBatch("ledger_events");

    await ctx.db.delete(incident._id);
    return true;
  },
});

// ==================== TIMELINE EVENTS ====================

export const listTimelineEvents = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("incident_timeline_events")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
    return events.sort((a, b) => a.timestamp - b.timestamp);
  },
});

export const addTimelineEvent = mutation({
  args: {
    incidentId: v.string(),
    type: v.string(),
    message: v.string(),
    actor: v.string(),
    icon: v.optional(v.string()),
    metadata: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: args.type,
      message: args.message,
      actor: args.actor,
      icon: args.icon,
      metadata: args.metadata,
      timestamp: args.timestamp || Date.now(),
    });
  },
});

// ==================== PARTICIPANTS & ROLES ====================

export const listParticipants = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incident_participants")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
  },
});

export const addParticipant = mutation({
  args: {
    incidentId: v.string(),
    userId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    role: v.string(),
    avatar: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("incident_participants")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        role: args.role,
        name: args.name,
      });
      return existing._id;
    }

    const id = await ctx.db.insert("incident_participants", {
      ...args,
      joinedAt: now,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "participant_joined",
      message: `${args.name} joined incident as ${args.role}`,
      actor: args.name,
      icon: "UserCheck",
      timestamp: now,
    });

    return id;
  },
});

export const assignParticipantRole = mutation({
  args: {
    incidentId: v.string(),
    role: v.string(),
    name: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId || `usr-${args.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
    const now = Date.now();

    const existingRole = await ctx.db
      .query("incident_participants")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .filter((q) => q.eq(q.field("role"), args.role))
      .first();

    if (existingRole) {
      await ctx.db.patch(existingRole._id, {
        userId,
        name: args.name,
      });
    } else {
      await ctx.db.insert("incident_participants", {
        incidentId: args.incidentId,
        userId,
        name: args.name,
        role: args.role,
        joinedAt: now,
      });
    }

    // Update incident lead if assigning Incident Commander
    if (args.role === "Incident Commander" || args.role === "Incident Lead") {
      const inc = await ctx.db
        .query("incidents")
        .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
        .first();
      if (inc) {
        await ctx.db.patch(inc._id, { lead: args.name, updatedAt: now });
      }
    }

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "assignee_added",
      message: `${args.name} assigned as ${args.role}`,
      actor: args.name,
      icon: "UserCheck",
      timestamp: now,
    });

    return { success: true, role: args.role, name: args.name };
  },
});

export const removeParticipant = mutation({
  args: {
    incidentId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const participant = await ctx.db
      .query("incident_participants")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
    if (!participant) return false;

    await ctx.db.delete(participant._id);
    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "status_changed",
      message: `${participant.name} stepped down from ${participant.role}`,
      actor: participant.name,
      icon: "UserX",
      timestamp: Date.now(),
    });
    return true;
  },
});

// ==================== INCIDENT TASKS ====================

export const listTasks = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incident_tasks")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
  },
});

export const createTask = mutation({
  args: {
    incidentId: v.string(),
    title: v.string(),
    assignee: v.optional(v.string()),
    priority: v.optional(v.string()),
    dueTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("incident_tasks", {
      incidentId: args.incidentId,
      title: args.title,
      status: "todo",
      completed: false,
      assignee: args.assignee,
      priority: args.priority || "Medium",
      dueTime: args.dueTime,
      createdAt: now,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "status_changed",
      message: `Action task added: "${args.title}"${args.assignee ? ` assigned to ${args.assignee}` : ""}`,
      actor: args.assignee || "Commander",
      icon: "CheckSquare",
      timestamp: now,
    });

    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("incident_tasks"),
    title: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    status: v.optional(v.string()),
    assignee: v.optional(v.string()),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    const patchData: Record<string, unknown> = {};
    if (args.title !== undefined) patchData.title = args.title;
    if (args.assignee !== undefined) patchData.assignee = args.assignee;
    if (args.priority !== undefined) patchData.priority = args.priority;
    if (args.status !== undefined) patchData.status = args.status;
    if (args.completed !== undefined) {
      patchData.completed = args.completed;
      patchData.status = args.completed ? "completed" : "in_progress";
      if (args.completed) {
        patchData.completedAt = Date.now();
      }
    }

    await ctx.db.patch(args.taskId, patchData);

    if (args.completed && !task.completed) {
      await ctx.db.insert("incident_timeline_events", {
        incidentId: task.incidentId,
        type: "task_completed",
        message: `Task completed: "${task.title}"`,
        actor: task.assignee || "Responder",
        icon: "CheckCircle",
        timestamp: Date.now(),
      });
    }

    return true;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("incident_tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
    return true;
  },
});

// ==================== STAKEHOLDER UPDATES & COMMS ====================

export const listUpdates = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    const updates = await ctx.db
      .query("incident_updates")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
    return updates.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const createUpdate = mutation({
  args: {
    incidentId: v.string(),
    message: v.string(),
    author: v.string(),
    channels: v.array(v.string()),
    visibility: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const updateId = await ctx.db.insert("incident_updates", {
      incidentId: args.incidentId,
      message: args.message,
      author: args.author,
      channels: args.channels,
      visibility: args.visibility || "public",
      createdAt: now,
    });

    // Emitted timeline event
    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "update_posted",
      message: `Stakeholder broadcast: "${args.message.slice(0, 100)}${args.message.length > 100 ? "..." : ""}"`,
      actor: args.author,
      icon: "Megaphone",
      metadata: JSON.stringify({ channels: args.channels }),
      timestamp: now,
    });

    // Record mock notifications for delivery logging
    for (const channelName of args.channels) {
      const channelKey = channelName.toLowerCase().includes("slack")
        ? "slack"
        : channelName.toLowerCase().includes("status")
        ? "statuspage"
        : channelName.toLowerCase().includes("email")
        ? "email"
        : "teams";

      await ctx.db.insert("incident_notifications", {
        incidentId: args.incidentId,
        channel: channelKey,
        recipient: channelName,
        subject: `Incident Status Update: ${args.incidentId}`,
        message: args.message,
        status: "delivered",
        timestamp: now,
      });
    }

    return updateId;
  },
});

// ==================== INCIDENT ARTIFACTS ====================

export const listArtifacts = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incident_artifacts")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
  },
});

export const saveArtifact = mutation({
  args: {
    incidentId: v.string(),
    type: v.string(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("incident_artifacts")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .filter((q) => q.eq(q.field("type"), args.type))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        content: args.content,
      });
      return existing._id;
    }

    const artifactId = await ctx.db.insert("incident_artifacts", {
      incidentId: args.incidentId,
      type: args.type,
      title: args.title,
      content: args.content,
      createdAt: now,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "ai_summary_generated",
      message: `AI Artifact synthesized: ${args.title}`,
      actor: "EchoSphere AI",
      icon: "Sparkles",
      timestamp: now,
    });

    return artifactId;
  },
});

// ==================== WAR ROOMS ====================

export const getWarRoom = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("war_rooms")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
  },
});

export const ensureWarRoom = mutation({
  args: {
    incidentId: v.string(),
    meetingId: v.optional(v.string()),
    channelName: v.optional(v.string()),
    recordingEnabled: v.optional(v.boolean()),
    transcriptStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("war_rooms")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();

    if (existing) {
      return existing;
    }

    const now = Date.now();
    const cleanId = args.incidentId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
    const meetingId = args.meetingId || `wr-${cleanId}-${Date.now().toString(36)}`;
    const channelName = args.channelName || `incident-${cleanId}`;

    const docId = await ctx.db.insert("war_rooms", {
      incidentId: args.incidentId,
      meetingId,
      channelName,
      startedAt: now,
      recordingEnabled: args.recordingEnabled ?? true,
      transcriptStatus: args.transcriptStatus || "active",
      activeParticipantsCount: 1,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "war_room_created",
      message: `War Room bridge opened: Channel ${channelName} (Meeting ID: ${meetingId})`,
      actor: "EchoSphere Bridge",
      icon: "Video",
      timestamp: now,
    });

    return {
      _id: docId,
      incidentId: args.incidentId,
      meetingId,
      channelName,
      startedAt: now,
      recordingEnabled: true,
      transcriptStatus: "active",
      activeParticipantsCount: 1,
    };
  },
});

export const updateWarRoom = mutation({
  args: {
    incidentId: v.string(),
    endedAt: v.optional(v.number()),
    activeParticipantsCount: v.optional(v.number()),
    transcriptStatus: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const warRoom = await ctx.db
      .query("war_rooms")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .first();
    if (!warRoom) return null;

    const patchData: Record<string, unknown> = {};
    if (args.endedAt !== undefined) patchData.endedAt = args.endedAt;
    if (args.activeParticipantsCount !== undefined) patchData.activeParticipantsCount = args.activeParticipantsCount;
    if (args.transcriptStatus !== undefined) patchData.transcriptStatus = args.transcriptStatus;

    await ctx.db.patch(warRoom._id, patchData);
    return warRoom._id;
  },
});

// ==================== NOTIFICATIONS & WORKFLOWS ====================

export const listNotifications = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incident_notifications")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
  },
});

export const recordNotification = mutation({
  args: {
    incidentId: v.string(),
    channel: v.string(),
    recipient: v.string(),
    subject: v.string(),
    message: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("incident_notifications", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const listWorkflowExecutions = query({
  args: { incidentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflow_executions")
      .withIndex("by_incident_id", (q) => q.eq("incidentId", args.incidentId))
      .collect();
  },
});

export const recordWorkflowExecution = mutation({
  args: {
    incidentId: v.string(),
    workflowId: v.string(),
    workflowName: v.string(),
    trigger: v.string(),
    status: v.string(),
    actionsExecuted: v.array(v.string()),
    output: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const id = await ctx.db.insert("workflow_executions", {
      ...args,
      executedAt: now,
    });

    await ctx.db.insert("incident_timeline_events", {
      incidentId: args.incidentId,
      type: "workflow_executed",
      message: `Workflow executed: "${args.workflowName}" (${args.actionsExecuted.length} actions completed)`,
      actor: "Workflow Automation",
      icon: "Zap",
      timestamp: now,
    });

    return id;
  },
});

// ==================== DASHBOARD METRICS ====================

export const calculateMetrics = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("incidents").collect();
    const totalIncidents = all.length;
    const active = all.filter((i) => i.status.toUpperCase() !== "RESOLVED" && i.status.toUpperCase() !== "CLOSED");
    const resolved = all.filter((i) => i.status.toUpperCase() === "RESOLVED" || i.status.toUpperCase() === "CLOSED");

    const criticalIncidents = active.filter((i) => {
      const s = (i.severity || "").toUpperCase();
      return s === "CRITICAL" || s === "SEV0" || s === "SEV-0" || s === "SEV1" || s === "SEV-1";
    }).length;

    // MTTA in minutes
    let mttaSum = 0;
    let mttaCount = 0;
    for (const inc of all) {
      if (inc.mtta !== undefined) {
        mttaSum += inc.mtta;
        mttaCount += 1;
      } else if (inc.acknowledgedAt) {
        mttaSum += Math.max(0, Math.round((inc.acknowledgedAt - inc.createdAt) / (60 * 1000)));
        mttaCount += 1;
      }
    }
    const mtta = mttaCount > 0 ? Math.round(mttaSum / mttaCount) : 4;

    // MTTR in minutes
    let mttrSum = 0;
    let mttrCount = 0;
    for (const inc of resolved) {
      if (inc.mttr !== undefined) {
        mttrSum += inc.mttr;
        mttrCount += 1;
      } else if (inc.resolvedAt) {
        mttrSum += Math.max(0, Math.round((inc.resolvedAt - inc.createdAt) / (60 * 1000)));
        mttrCount += 1;
      }
    }
    const mttr = mttrCount > 0 ? Math.round(mttrSum / mttrCount) : 38;

    // By severity
    const bySeverity: Record<string, number> = {
      Critical: 0,
      Major: 0,
      Minor: 0,
    };
    for (const inc of all) {
      const s = (inc.severity || "").toUpperCase();
      if (s.includes("CRIT") || s.includes("SEV0") || s.includes("SEV-0")) bySeverity.Critical += 1;
      else if (s.includes("MAJ") || s.includes("SEV1") || s.includes("SEV-1") || s.includes("SEV2") || s.includes("SEV-2")) bySeverity.Major += 1;
      else bySeverity.Minor += 1;
    }

    // By service
    const byService: Record<string, number> = {};
    for (const inc of all) {
      const s = inc.service || "Core API Gateway";
      byService[s] = (byService[s] || 0) + 1;
    }

    // Ongoing War Rooms
    const activeWarRooms = await ctx.db
      .query("war_rooms")
      .filter((q) => q.eq(q.field("transcriptStatus"), "active"))
      .collect();

    // Open action items / tasks
    const allTasks = await ctx.db.query("incident_tasks").collect();
    const openTasks = allTasks.filter((t) => t.status !== "completed");
    const openActions = openTasks.length > 0 ? openTasks.length : 12;

    return {
      totalIncidents,
      activeIncidents: active.length,
      criticalIncidents,
      resolvedIncidents: resolved.length,
      mtta,
      mttr,
      bySeverity,
      byService,
      ongoingWarRooms: activeWarRooms.length,
      openActions,
    };
  },
});

