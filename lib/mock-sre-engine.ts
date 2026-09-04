/**
 * EchoSphere HolmesGPT Diagnostic Mock Engine
 * Simulates real-time Kubernetes cluster telemetry, AWS RDS monitoring,
 * and automated root-cause diagnostic loops for Sev-1 incident response.
 */

export interface DatabaseTelemetry {
  clusterId: string;
  dbEngine: string;
  cpuUtilization: number;
  activeConnections: number;
  maxConnections: number;
  readLatencyMs: number;
  writeLatencyMs: number;
  status: "HEALTHY" | "DEGRADED" | "CRITICAL";
}

export interface IngressTelemetry {
  namespace: string;
  controller: string;
  serviceName: string;
  configuredPort: number;
  expectedPort: number;
  status: "MISMATCH" | "OK";
  impact: string;
}

export interface StagedHotfixPayload {
  actionId: string;
  targetResource: string;
  patchType: string;
  manifestPatch: string;
  description: string;
  status: "STAGED" | "EXECUTED";
}

export interface ParsedLedgerEntry {
  timestamp: string;
  speaker: string;
  speakerRole?: "agent" | "user" | "peer";
  text: string;
  tag: "FACT" | "HYPOTHESIS" | "CONTRADICTION" | "ACTION";
  status: "VERIFIED" | "UNVERIFIED" | "SUPPRESSED" | "PENDING_APPROVAL" | "EXECUTED";
  reason: string;
}

/**
 * HolmesGPT RDS Database Health Query
 * Returns realistic AWS RDS PostgreSQL telemetry to cross-reference against human statements.
 */
export function checkDatabaseHealth(): DatabaseTelemetry {
  return {
    clusterId: "prod-aurora-pg-cluster-01",
    dbEngine: "PostgreSQL 15.4-R2",
    cpuUtilization: 2.1,
    activeConnections: 14,
    maxConnections: 1000,
    readLatencyMs: 1.2,
    writeLatencyMs: 2.4,
    status: "HEALTHY",
  };
}

/**
 * HolmesGPT Kubernetes Ingress & Service Routing Audit
 * Inspects cluster ingress manifests for auth-service routing anomalies.
 */
export function checkIngressController(): IngressTelemetry {
  return {
    namespace: "production-core",
    controller: "ingress-nginx-controller-v1.9.4",
    serviceName: "auth-service",
    configuredPort: 8080,
    expectedPort: 8000,
    status: "MISMATCH",
    impact: "HTTP 502 Bad Gateway / Ingress route refusing connections on port 8080",
  };
}

/**
 * Stage Hotfix Manifest for Human-in-the-Loop (HITL) Guardrail Card
 */
export function stageHotfixPatch(): StagedHotfixPayload {
  return {
    actionId: `act_patch_${Date.now()}`,
    targetResource: "k8s/ingress/auth-service-ingress",
    patchType: "StrategicMergePatch",
    manifestPatch: `spec:\n  rules:\n  - host: auth.production.internal\n    http:\n      paths:\n      - path: /\n        backend:\n          service:\n            name: auth-service\n            port:\n              number: 8000 # Restored from 8080`,
    description: "Restore targetPort from mismatched 8080 to container port 8000",
    status: "STAGED",
  };
}

/**
 * Evaluates spoken statements against live HolmesGPT telemetry
 */
export function evaluateStatementAgainstTelemetry(
  speaker: string,
  transcriptText: string,
  speakerRole?: "agent" | "user" | "peer",
): ParsedLedgerEntry {
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });

  // Word-boundary checks to prevent false positives (e.g. 'support' or 'report' matching 'port')
  const isDatabaseClaim =
    /\b(database|postgres|rds|dropping connections)\b/i.test(transcriptText) ||
    (/\bdb\b/i.test(transcriptText) && !/\b(dashboard|debug)\b/i.test(transcriptText));

  const isDatabaseFailureClaim =
    /\b(dropping connections|locked up|lockup|down|fail|failing|slow|broken|hung|error|saturation)\b/i.test(transcriptText) ||
    /\b(lock|locks|connection drop|connections drop|conns)\b/i.test(transcriptText);

  const isDatabaseHealthy = /\b(healthy|nominal|normal|ok)\b/i.test(transcriptText);

  if (isDatabaseClaim && isDatabaseFailureClaim && !isDatabaseHealthy) {
    const db = checkDatabaseHealth();
    return {
      timestamp,
      speaker,
      speakerRole,
      text: transcriptText,
      tag: "CONTRADICTION",
      status: "SUPPRESSED",
      reason: `HolmesGPT telemetry confirms DB (${db.clusterId}) is HEALTHY. CPU: ${db.cpuUtilization}%, Active Conns: ${db.activeConnections}/${db.maxConnections}.`,
    };
  }

  const isIngressIssue =
    /\b(ingress|oom|ooming|502|bad gateway|targetport|target port)\b/i.test(transcriptText) ||
    (/\bport\b/i.test(transcriptText) && /\b(8080|8000|mismatch|wrong|incorrect)\b/i.test(transcriptText));

  if (isIngressIssue) {
    const ingress = checkIngressController();
    return {
      timestamp,
      speaker,
      speakerRole,
      text: transcriptText,
      tag: "ACTION",
      status: "PENDING_APPROVAL",
      reason: `Root cause isolated: ${ingress.serviceName} ${ingress.status} (Configured: ${ingress.configuredPort} vs Expected: ${ingress.expectedPort}). Staging hotfix patch.`,
    };
  }

  if (/\b(could|might|may|maybe|probably|possibly|suspect|think|believe|appears|seems|likely)\b/i.test(transcriptText)) {
    return {
      timestamp,
      speaker,
      speakerRole,
      text: transcriptText,
      tag: "HYPOTHESIS",
      status: "UNVERIFIED",
      reason: "",
    };
  }

  if (
    /\b(rolled back|we rolled back|completed|finished|returned|dropped from|dropped|reached|resolved|restored|deployed|scaled|applied)\b/i.test(transcriptText) ||
    /\b(\d+(\.\d+)?%|(http\s*)?[45]\d{2}|(at\s+)?\d{1,2}:\d{2}(:\d{2})?|cpu utilization|memory usage|error rate|latency|response time|\d+ms|active connections|p99|p95|load average|nominal|healthy|outage)\b/i.test(transcriptText)
  ) {
    return {
      timestamp,
      speaker,
      speakerRole,
      text: transcriptText,
      tag: "FACT",
      status: "VERIFIED",
      reason: "",
    };
  }

  if (/\b(check|verify|inspect|compare|look at|query|restart|rollback|roll back|patch|apply|scale|page|drain|kill)\b/i.test(transcriptText)) {
    return {
      timestamp,
      speaker,
      speakerRole,
      text: transcriptText,
      tag: "ACTION",
      status: "PENDING_APPROVAL",
      reason: "",
    };
  }

  return {
    timestamp,
    speaker,
    speakerRole,
    text: transcriptText,
    tag: "FACT",
    status: "VERIFIED",
    reason: "",
  };
}
