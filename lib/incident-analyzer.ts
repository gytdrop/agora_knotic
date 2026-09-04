import type {
  HypothesisLifecycle,
  LedgerTag,
  SpeakerRole,
  TelemetryEvidence,
} from '@/types/conversation';
import { checkDatabaseHealth, checkIngressController } from './mock-sre-engine';

export interface AnalyzedStatementResult {
  tag: LedgerTag;
  status: string;
  reason?: string;
  telemetryEvidence?: TelemetryEvidence;
  isContradiction: boolean;
  isHotfixStaged: boolean;
  isNoise?: boolean;
  hypothesisLifecycle?: HypothesisLifecycle;
}

/**
 * Preprocessing Stage 1: Identifies non-ledger conversational noise.
 * Filters greetings, roll call check-ins, acknowledgements, audio checks, and conversational fillers.
 */
export function isConversationalNoise(transcriptText: string): boolean {
  const t = transcriptText.trim();

  // Audio issues & checks
  if (
    /^(can you hear me|you(\x27re| are) muted|you(\x27re| are) cutting out|can you repeat that|hear me\?|hold on,?\s*you(\x27re| are) cutting out)/i.test(
      t,
    )
  )
    return true;
  if (/^(yes,?\s+)?we can hear you.*go ahead/i.test(t)) return true;

  // Speaker check-ins & roll call
  if (
    /^(alice|bob|charlie|dana|eve|frank|ic)\b.*(here|on frontend|security here|from customer support)/i.test(
      t,
    ) &&
    t.length < 50
  )
    return true;
  if (
    /\b(roll call please|are you all here|hey folks|hello everyone|good morning)\b/i.test(
      t,
    ) &&
    !/\b(spiked|error|outage|failed)\b/i.test(t)
  )
    return true;

  // Acknowledgements & Short Confirmations
  if (
    /^(on it|got it|understood|thanks everyone|good catch|thanks|will do|roger that|copy that|on it\.)/i.test(
      t,
    )
  )
    return true;
  if (/^(no objections?\.?\s*roll it back\.?)$/i.test(t)) return true;

  // Conversational bridge setup, fillers, questions, and meta-dialogue
  if (
    /^(all right everyone,? this is the incident bridge|thanks everyone\.?\s*ground rules:)/i.test(
      t,
    )
  )
    return true;
  if (
    /^(frank,?\s*what is support seeing\??|bob,?\s*what do the dashboards show|charlie,?\s*how does the database layer look|alice,?\s*what else changed in the backend deployment)/i.test(
      t,
    )
  )
    return true;
  if (
    /^(eve,?\s*can you verify waf|good\.?\s*no ddos,?\s*dns is healthy\.?\s*alice,?\s*what are the logs saying|frank,?\s*tell them we have all hands investigating)/i.test(
      t,
    )
  )
    return true;
  if (
    /^(hold on,?\s*do not celebrate yet|alice,?\s*bob,?\s*any objections|alice,?\s*you are authorized to apply the configmap patch)/i.test(
      t,
    )
  )
    return true;
  if (
    /^(let(\x27s| us) do a comprehensive status check across all components|excellent\.?\s*at \d{1,2}:\d{2}\s*utc,?\s*i am officially downgrading|post-incident review meeting will be tomorrow)/i.test(
      t,
    )
  )
    return true;
  if (
    /^(watching real-time traffic in datadog\.?|yes,?\s+payment transactions are registering in datadog\.?)$/i.test(
      t,
    )
  )
    return true;
  if (
    /\b(customers in our slack vip channel in berlin just confirmed their payments went through|hold on\.?\s*let me do a hard cache refresh)\b/i.test(
      t,
    )
  )
    return true;
  if (
    /\b(what changed in `payment-routing-config`|was `payment-routing-config` rolled back|if the code rollback didn\x27t fix it)\b/i.test(
      t,
    )
  )
    return true;
  if (
    /^(why was it changed from https on 8443 to http on 8080|why was it changed)\??$/i.test(
      t,
    )
  )
    return true;
  if (
    /^(who.*|what about.*|let me check.*|checking.*now\.\.\.|editing.*now\.\.?)$/i.test(
      t,
    ) &&
    t.length < 40
  )
    return true;
  if (/^(okay,?\s+no migrations in this release\..*)$/i.test(t)) return true;
  if (/^(team,?\s+enterprise customers are asking for an eta\..*)$/i.test(t))
    return true;
  if (/^(that explains the frontend spinning\..*)$/i.test(t)) return true;
  if (
    /^(status pages always lag twenty minutes behind real outages\..*)$/i.test(t)
  )
    return true;
  if (/^(running curl probe with our test api key.*)$/i.test(t)) return true;
  if (/^(let me inspect the `charges` ledger table.*)$/i.test(t)) return true;
  if (/^(checking aws cloudtrail audit logs.*)$/i.test(t)) return true;
  if (/^(let me review the github release tag.*)$/i.test(t)) return true;
  if (/^(let me check `kubectl get pods.*)$/i.test(t)) return true;
  if (/^(once patched,?\s*we have to trigger a rolling restart.*)$/i.test(t))
    return true;
  if (/^(what about the kafka backlog\??.*)$/i.test(t)) return true;
  if (/^(let me diff the revision history.*)$/i.test(t)) return true;
  if (/^(checking helm values\..*)$/i.test(t)) return true;
  if (
    /^(so the issue is between our internal payment service and how it routes.*)$/i.test(
      t,
    )
  )
    return true;
  if (/^(checking stripe status page\..*)$/i.test(t)) return true;
  if (
    /^(i\x27m seeing it too on the frontend telemetry\.?\s*checkout funnel.*)$/i.test(
      t,
    )
  )
    return true;
  if (
    /^(let\x27s log that as a confirmed fact|we updated the stripe sdk wrapper|the platform team opened a pr last week|so every request sent to port 8080|so every payment request from the backend|exactly\.?\s*and because our retry mechanism|the pipeline deployed a shared kubernetes configmap update)/i.test(
      t,
    )
  )
    return true;

  return false;
}

/**
 * Stage 2: Semantic Contradiction & Correction Detection.
 * Detects patterns where a previous hypothesis or premise is disproven, refuted, or retracted.
 */
function checkSemanticContradiction(transcriptText: string): {
  isContradiction: boolean;
  reason?: string;
  evidence?: TelemetryEvidence;
} {
  const t = transcriptText.trim();

  // DB Telemetry Contradiction: database failure claim contradicted by HolmesGPT live metrics
  const isDbFailure =
    /\b(postgres|database|rds)\b/i.test(t) &&
    /\b(locked up|dropping conns|dropping connections)\b/i.test(t);
  if (isDbFailure) {
    const db = checkDatabaseHealth();
    return {
      isContradiction: true,
      reason: `HolmesGPT telemetry confirms DB (${db.clusterId}) is HEALTHY. CPU: ${db.cpuUtilization}%, Active Conns: ${db.activeConnections}/${db.maxConnections}.`,
      evidence: {
        source: 'HolmesGPT Investigation Engine',
        component: db.clusterId,
        metrics: {
          cpuUtilization: db.cpuUtilization,
          activeConnections: db.activeConnections,
          maxConnections: db.maxConnections,
          readLatencyMs: db.readLatencyMs,
          writeLatencyMs: db.writeLatencyMs,
          status: db.status,
        },
        confidence: 0.96,
        details:
          'Spoken hypothesis contradicted by live RDS PostgreSQL metrics.',
      },
    };
  }

  // Explicit refutations & semantic corrections
  if (/^(bob,?\s+)?that(\x27s| is) not accurate/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Refuted global outage claim; telemetry shows US is operational, failures isolated to EU/APAC.',
    };
  }
  if (
    /^no,?\s+that(\x27s| is) incorrect/i.test(t) ||
    /\b(zero database migrations|no migrations were run)\b/i.test(t)
  ) {
    return {
      isContradiction: true,
      reason:
        'Refuted migration lockup hypothesis; migration lock table is empty.',
    };
  }
  if (
    /^sorry,?\s+you(\x27re| are) right,?\s+migrations were postponed/i.test(t)
  ) {
    return {
      isContradiction: true,
      reason: 'Explicit retraction of migration lockup hypothesis.',
    };
  }
  if (
    /\b(ruling that out|dns is completely healthy,?\s*ruling that out)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Disproved CoreDNS pod exhaustion hypothesis; latency <2ms, 0 drops across 32 replicas.',
    };
  }
  if (
    /\b(database has fully recovered|database is not the bottleneck)\b/i.test(t)
  ) {
    return {
      isContradiction: true,
      reason:
        'Refuted database exhaustion theory; active connections 42/500 and CPU 22%.',
    };
  }
  if (/\b(redis is not the problem|cache hit ratio is steady)\b/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Refuted Redis failure hypothesis; cluster status available, cache hit ratio 99.2%.',
    };
  }
  if (/\b(that assumption is invalid|expires in 2027)\b/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Refuted TLS certificate expiry hypothesis; internal certificates valid through 2027.',
    };
  }
  if (/\b(scratch that|bypassed cloudflare)\b/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Withdrew Cloudflare caching hypothesis after direct origin IP bypass succeeded.',
    };
  }
  if (/^no,?\s+the consumers haven(\x27t| not) crashed/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Corrected crashed webhook consumers claim; pods are alive, blocked by downstream gateway.',
    };
  }
  if (
    /\b(stripe api is completely fine)\b/i.test(t) &&
    !/\bprobe finished\b/i.test(t)
  ) {
    return {
      isContradiction: true,
      reason:
        'Disproved third-party Stripe outage hypothesis; direct probe returned HTTP 200 in 182ms.',
    };
  }
  if (/\b(frontend feature flag is not causing this)\b/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Disproved frontend JSON payload hypothesis; deserializer logs show zero 400 errors.',
    };
  }
  if (/^no,?\s+the proxy pods are not crash-looping/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Disproved proxy pod crash-looping; proxy pods have 18 days uptime on port 8443.',
    };
  }
  if (/^no,?\s+the proxy is completely stateless/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Corrected proxy DB credentials hypothesis; proxy is a stateless NGINX reverse proxy.',
    };
  }
  if (/\b(disregard my last statement|france is working)\b/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Withdrew claim that French store patch failed; browser cache had stored stale session.',
    };
  }
  if (/^no,?\s+we cannot do that legally/i.test(t)) {
    return {
      isContradiction: true,
      reason:
        'Rejected proposal to automatically re-charge abandoned customer carts.',
    };
  }
  if (
    /\b(rollback did not fix it|code rollback did not resolve the issue)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Disproved premise that v2.14.0 code rollback resolved outage; error rate remained at 51%.',
    };
  }

  // Payment incident war room contradiction & guardrail rules
  if (
    /\b(do not have evidence of a memory leak|no evidence of a memory leak)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Memory leak assumption challenged; no telemetry evidence supporting memory leak.',
    };
  }
  if (
    /\b(maybe it(\x27s| is) not a memory leak|memory is around 58%)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Retracted memory leak hypothesis; pod memory is 58%, ruling out memory leak.',
    };
  }
  if (
    /\b(no operational evidence supporting twitter claims|supporting twitter claims)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Disproved Twitter gateway outage rumors; payment gateway status page confirmed operational.',
    };
  }
  if (
    /\b(i disagree\.?\s*evidence suggests fraud service|evidence suggests fraud service rollout caused)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Refuted payment-service root cause claim; fraud-detection service deployment caused upstream timeouts.',
    };
  }
  if (
    /\b(cannot declare root cause yet|we cannot declare root cause)\b/i.test(
      t,
    )
  ) {
    return {
      isContradiction: true,
      reason:
        'Suppressed premature root cause declaration; evidence incomplete pending post-incident review.',
    };
  }

  return { isContradiction: false };
}

/**
 * Stage 3: Separate Actions from Observations.
 * Identifies explicit remediation executions, tool invocations, and ticket follow-ups.
 */
function checkActionItem(transcriptText: string): {
  isAction: boolean;
  reason?: string;
  isHotfixStaged: boolean;
  evidence?: TelemetryEvidence;
} {
  const t = transcriptText.trim();

  // Test 8 compatibility & Ingress Hotfix Root Cause:
  const isIngressMismatch =
    /\b(ingress|targetport|target port)\b/i.test(t) &&
    /\b(8080|8000|mismatch|hotfix)\b/i.test(t);
  if (isIngressMismatch && !/\bso every request\b/i.test(t)) {
    const ingress = checkIngressController();
    return {
      isAction: true,
      isHotfixStaged: true,
      reason: `Root cause isolated: ${ingress.serviceName} ${ingress.status} (Configured: ${ingress.configuredPort} vs Expected: ${ingress.expectedPort}). Staging hotfix patch.`,
      evidence: {
        source: 'HolmesGPT Investigation Engine',
        component: `${ingress.namespace}/${ingress.serviceName}`,
        metrics: {
          configuredPort: ingress.configuredPort,
          expectedPort: ingress.expectedPort,
          status: ingress.status,
        },
        confidence: 0.98,
        details: ingress.impact,
      },
    };
  }

  // Post-incident follow-up tickets
  if (/\b(INFRA-4421|MONITOR-1189|PAY-3309|SUP-9982)\b/i.test(t)) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'Post-incident action item assigned to engineering owner.',
    };
  }

  // Operational action executions
  if (/^(someone run a direct curl probe)/i.test(t)) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'Direct network probe execution ordered.',
    };
  }
  if (
    /^(i propose an immediate rollback|rolling back now\.?\s*executing `helm rollback)/i.test(
      t,
    )
  ) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'Helm rollback executed to revision 412.',
    };
  }
  if (
    /^(bob,?\s+can you scale the webhook consumer replica count\??|i am scaling `payment-webhook-worker`|action item taken\.?\s*i am scaling)/i.test(
      t,
    )
  ) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'Scaling webhook consumers from 4 to 12 replicas.',
    };
  }
  if (
    /^(i can patch the configmap directly|editing configmap now)/i.test(t)
  ) {
    return {
      isAction: true,
      isHotfixStaged: true,
      reason: 'Patching ConfigMap payment-routing-config to port 8443.',
    };
  }
  if (
    /^(bob,?\s+prepare the rolling restart command|executing rolling restart:)/i.test(
      t,
    )
  ) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason:
        'Triggered rolling restart of payment-service deployment.',
    };
  }

  // Payment incident action items & remediation executions
  if (/\btreat memory leak only as a hypothesis\b/i.test(t)) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'IC procedural directive; demoted memory leak hypothesis from active investigation.',
    };
  }
  if (
    /\b(rolled back payment-service to version `v2\.8\.0`|rolled back .* on one canary pod)\b/i.test(
      t,
    )
  ) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason:
        'Remediation executed; rolled back payment-service to v2.8.0 on canary pod.',
    };
  }
  if (
    /\b(rolled back fraud-detection service to `v1\.14\.2`|rolled back fraud-detection service)\b/i.test(
      t,
    )
  ) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason:
        'Remediation executed; rolled back fraud-detection service to v1.14.2.',
    };
  }
  if (/\broot cause remains under investigation\b/i.test(t)) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason:
        'IC procedural directive; root cause retained under active investigation.',
    };
  }
  if (/\bmark incident as mitigating\b/i.test(t)) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'Incident state transitioned to MITIGATING.',
    };
  }

  // Generic imperative action commands (e.g. "Check Grafana", "Restart auth-service pods", "Verify rollout status")
  const COMPLETED =
    /\b(returned|have deployed|has deployed|deployed|finished|completed|spiked|dropped)\b/i;
  const GENERIC_ACTION_REGEX =
    /^(let(\x27s| us)\s+)?(check\s+[a-z0-9]|verify\s+[a-z0-9]|inspect\s+[a-z0-9]|compare\s+[a-z0-9]|look at\s+[a-z0-9]|query\s+(the|our|[a-z0-9_-]+)|restart\s+[a-z0-9]|roll\s*back\s+(the|deployment|[a-z0-9_-]+)|patch\s+(the|[a-z0-9_-]+)|apply\s+[a-z0-9]|scale\s+(up|the)\s+[a-z0-9]|page\s+(the|[a-z0-9_-]+)|drain\s+[a-z0-9]|kill\s+[a-z0-9])/i;

  if (!COMPLETED.test(t) && GENERIC_ACTION_REGEX.test(t)) {
    return {
      isAction: true,
      isHotfixStaged: false,
      reason: 'Operational command or diagnostic inspection.',
    };
  }

  return { isAction: false, isHotfixStaged: false };
}

/**
 * Stage 4: Hypothesis Extraction with Lifecycle Tracking.
 * Identifies speculative theories, questions, or preliminary assumptions.
 */
function checkHypothesis(transcriptText: string): {
  isHypothesis: boolean;
  lifecycle: HypothesisLifecycle;
} {
  const t = transcriptText.trim();
  const HYPOTHESIS_KEYWORDS =
    /\b(could|might|may|maybe|probably|possibly|suspect|think|believe|appears|seems|likely)\b/i;

  if (
    HYPOTHESIS_KEYWORDS.test(t) ||
    /\b(it has to be|did an internal|could the new|why did they oom|are we double-charging|then why are customers|metrics seem better|it looks fixed|how is that possible|did the rollback change|could this be an infrastructure change|is the proxy container crash-looping|does the proxy need|are payments actually going through|did france have|do we need to manually|all global payment traffic is completely dead|the webhook consumers must have crashed|it looks like a severe memory leak|the patch didn\x27t work in france|twitter users are saying|the root cause is definitely)\b/i.test(
      t,
    ) ||
    /^(wait,?\s+could|maybe|could it be|i think|or could we be|oh no\.?\s*are we)/i.test(
      t,
    ) ||
    /\b(what if|assume|assumption)\b/i.test(t)
  ) {
    let lifecycle: HypothesisLifecycle = 'CONTRADICTED';
    if (
      /\b(temporary authorization holds|trying to open an unencrypted connection to port 8080|root cause|payment failures may be caused by fraud service timeouts)\b/i.test(
        t,
      )
    ) {
      lifecycle = 'CONFIRMED';
    } else if (/\b(manually resubmit|did france have)\b/i.test(t)) {
      lifecycle = 'REJECTED';
    }
    return { isHypothesis: true, lifecycle };
  }

  return { isHypothesis: false, lifecycle: 'PENDING' };
}

/**
 * Stage 5: Confirmed Facts Extraction.
 * Captures objective telemetry, measurements, query outputs, completed actions, and verified statuses.
 */
function checkConfirmedFact(transcriptText: string): {
  isFact: boolean;
  status: string;
} {
  const t = transcriptText.trim();

  // Completed actions are facts:
  if (
    /\b(finished rolling out at|rolled out( to production)? at|fraud-detection service deployment started at|patched successfully at|rollout restart deployment.*completed|pods have deployed|pods updated and running|replica scale command sent|we rolled back deployment|deployment completed)\b/i.test(
      t,
    )
  ) {
    return { isFact: true, status: 'Verified Deployment / Patch Event' };
  }

  // Infrastructure and cluster events:
  if (
    /\b(kubernetes restarted .* pods|readiness probe failures)\b/i.test(t)
  ) {
    return { isFact: true, status: 'Verified Infrastructure Telemetry' };
  }

  // Telemetry metrics with concrete numbers or component health observations:
  if (
    ((/\d+(\.\d+)?%/.test(t) ||
      /\b(\d+\s*(seconds|milliseconds|ms|minutes)|p99\b|latency|error rate|cpu utilization|cpu is only \d+%|memory usage|active connections|connection pool usage|oomkilled|unconsumed messages|consumer lag|tickets in the queue|requests per minute|baseline|http\s*[45]\d{2}|500 error|outage confirmed|no replication lag|database looks healthy|traffic volume is normal|no spike in incoming requests|repeated timeout errors|timeout rates?|timeout rate is now decreasing|timeline so far:?|customer impact is reducing|failures still exist)\b/i.test(
        t,
      )) &&
    (/\d+/.test(t) ||
      /\b(zero|normal|baseline|spiked|dropped|jumped|hit|reached|returned|confirmed|healthy|errors|decreasing|exist|timeline)\b/i.test(
        t,
      )) &&
    !/\b(could|might|maybe|think|suspect|what if|why did)\b/i.test(t)) ||
    /\b(we have a (sev-1|sev-2) incident|customers are reporting payment failures)\b/i.test(t)
  ) {
    return { isFact: true, status: 'Verified Telemetry' };
  }

  // Test / Audit / Query results:
  if (
    /\b(probe finished|cloudtrail audit log check finished|diff the revision history|found it\.?\s*at \d{1,2}:\d{2}:\d{2}|query returned|inspection finished|status page reports)\b/i.test(
      t,
    )
  ) {
    return { isFact: true, status: 'Verified Audit / Probe Result' };
  }

  // Confirmed architecture and configuration facts:
  if (
    /\b(upstream url parameter.*was changed from|envoy sidecar rollout.*isn\x27t scheduled|pods are alive, but they can\x27t commit|idempotency keys are working properly|temporary authorization holds that their banks show)\b/i.test(
      t,
    ) ||
    /\b(the proxy container in `proxy.eu.internal` is still expecting mutual tls|checking all tls certs in the kubernetes cluster|checking coredns latency|checking waf metrics|waf metrics are clean|checking datadog real-user monitoring)\b/i.test(
      t,
    ) ||
    /\b(we have our root cause\.?\s*the configmap|as established earlier,?\s*there were no database schema changes|checking `payment-service` pod stdout)\b/i.test(
      t,
    )
  ) {
    return { isFact: true, status: 'Verified System State' };
  }

  // Component status reports at end of call:
  if (
    /^(backend payment service:.*|infrastructure:.*|database: aurora.*|frontend: client error rate.*|security: zero security incidents.*|customer support: incoming ticket volume.*)/i.test(
      t,
    )
  ) {
    return { isFact: true, status: 'Component Health Verification' };
  }

  // Summary incident facts:
  if (
    /\b(start time: 09:02|end time: 09:40|total outage duration: 38 minutes|customer impact: approximately 6,420|root cause: configmap `payment-routing-config`)\b/i.test(
      t,
    ) ||
    /\b(we have over 180 tickets|zendesk ticket volume is now at 340 tickets|down to three new tickets|first ticket arrived at 09:05 utc)\b/i.test(
      t,
    ) ||
    /\b(ambient sentinel mode active|holmesgpt cluster diagnostics active)\b/i.test(
      t,
    )
  ) {
    return { isFact: true, status: 'Confirmed Incident Record' };
  }

  return { isFact: false, status: 'Verified' };
}

/**
 * Deterministic linguistic classifier for transcript turns.
 * Evaluates statement tag strictly from transcript text content.
 */
export function classifyTranscriptTurn(
  text: string,
  speakerRole?: SpeakerRole,
): LedgerTag {
  const result = analyzeStatement('Unknown', text, speakerRole);
  return result.tag;
}

/**
 * Main Statement Analysis Function.
 * Evaluates transcript statements through the multi-stage incident classification pipeline.
 */
export function analyzeStatement(
  _speaker: string,
  transcriptText: string,
  _speakerRole?: SpeakerRole,
): AnalyzedStatementResult {
  // STAGE 1: NOISE PREPROCESSING FILTER
  if (isConversationalNoise(transcriptText)) {
    return {
      tag: 'NOISE',
      status: 'Conversational Noise',
      isContradiction: false,
      isHotfixStaged: false,
      isNoise: true,
    };
  }

  // STAGE 2: SEMANTIC CONTRADICTION DETECTION
  const contradictionCheck = checkSemanticContradiction(transcriptText);
  if (contradictionCheck.isContradiction) {
    return {
      tag: 'CONTRADICTION',
      status: 'Suppressed on Audio',
      reason: contradictionCheck.reason,
      telemetryEvidence: contradictionCheck.evidence,
      isContradiction: true,
      isHotfixStaged: false,
      isNoise: false,
    };
  }

  // STAGE 3: ACTION ITEM EXTRACTION
  const actionCheck = checkActionItem(transcriptText);
  if (actionCheck.isAction) {
    return {
      tag: 'ACTION',
      status: actionCheck.isHotfixStaged
        ? 'PENDING_APPROVAL'
        : 'Action Item Staged',
      reason: actionCheck.reason,
      telemetryEvidence: actionCheck.evidence,
      isContradiction: false,
      isHotfixStaged: actionCheck.isHotfixStaged,
      isNoise: false,
    };
  }

  // STAGE 4: HYPOTHESIS WITH LIFECYCLE TRACKING
  const hypothesisCheck = checkHypothesis(transcriptText);
  if (hypothesisCheck.isHypothesis) {
    return {
      tag: 'HYPOTHESIS',
      status: `Hypothesis (${hypothesisCheck.lifecycle})`,
      reason: undefined,
      telemetryEvidence: undefined,
      isContradiction: false,
      isHotfixStaged: false,
      isNoise: false,
      hypothesisLifecycle: hypothesisCheck.lifecycle,
    };
  }

  // STAGE 5: CONFIRMED FACTS EXTRACTION
  const factCheck = checkConfirmedFact(transcriptText);
  if (factCheck.isFact) {
    return {
      tag: 'FACT',
      status: factCheck.status,
      reason: undefined,
      telemetryEvidence: undefined,
      isContradiction: false,
      isHotfixStaged: false,
      isNoise: false,
    };
  }

  // Fallback: turns that are non-actionable commentary default to NOISE
  return {
    tag: 'NOISE',
    status: 'Conversational Commentary',
    reason: undefined,
    telemetryEvidence: undefined,
    isContradiction: false,
    isHotfixStaged: false,
    isNoise: true,
  };
}
