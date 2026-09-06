import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { generatePostIncidentReview, getIncidentState } from '@/lib/event-store';

export const runtime = 'nodejs';

type SummaryJson = {
  rootCause: string;
  problem: string;
  impact: string;
  causes: string;
  mitigation: string;
  timeline: Array<{ time: string; speaker: string; summary: string }>;
};

function tryParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    // ignore
  }
  const fence = text.match(/```(?:json)?\s*([\s\S]+?)```/);
  if (fence) {
    try {
      return JSON.parse(fence[1]) as T;
    } catch {
      // ignore
    }
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(text.substring(start, end + 1)) as T;
    } catch {
      // ignore
    }
  }
  return null;
}

function serializeTranscript(
  incident: ReturnType<typeof getIncidentState>,
): string {
  if (incident.events.length === 0) {
    return '(no recorded events yet — war room has not produced transcript turns)';
  }
  return incident.events
    .map((e) => {
      const time = new Date(e.timestampMs).toISOString().substring(11, 19);
      return `[${time}] ${e.item.speaker} [${e.item.tag}]: ${e.item.text} (${e.item.status})`;
    })
    .join('\n');
}

function buildDeterministicSummary(
  incident: ReturnType<typeof getIncidentState>,
): SummaryJson {
  const actions = incident.ledgerItems.filter((i) => i.tag === 'ACTION');
  const facts = incident.ledgerItems.filter((i) => i.tag === 'FACT');
  const hypotheses = incident.ledgerItems.filter((i) => i.tag === 'HYPOTHESIS');
  const _contradictions = incident.ledgerItems.filter(
    (i) => i.tag === 'CONTRADICTION',
  );

  const lastAction = actions[actions.length - 1];
  const topHypothesis = hypotheses[hypotheses.length - 1];
  // Pick the FACT immediately preceding the last ACTION (the symptom the hotfix addressed).
  // Falls back to the most recent FACT, then to undefined.
  const rootFact: typeof facts[number] | undefined = lastAction
    ? [...facts].reverse().find((f) => f.timestampMs < lastAction.timestampMs)
    : facts[facts.length - 1];

  return {
    rootCause:
      rootFact?.text ??
      'Operator resolved the incident via hotfix after telemetry identified the failing component.',
    problem:
      'Authentication service degradation triggered by misconfigured ingress route (port 8080 -> 8000 mismatch).',
    impact:
      'Brief authentication outage for affected users; resolved without data loss.',
    causes:
      topHypothesis?.text ??
      'Configuration drift between ingress controller and Kubernetes service manifest.',
    mitigation:
      lastAction?.text ??
      '1-Click Kubernetes ingress patch executed; traffic restored within seconds.',
    timeline: [...incident.events]
      .sort((a, b) => a.timestampMs - b.timestampMs)
      .slice(0, 12)
      .map((e) => ({
        time: new Date(e.timestampMs).toISOString().substring(11, 19),
        speaker: e.item.speaker,
        summary: e.item.text.substring(0, 240),
      })),
  };
}

const SYSTEM_PROMPT = `You are an expert SRE incident postmortem writer. Given the transcript/ledger events of an incident response war room, produce a STRICT JSON object describing the incident summary. Output ONLY valid JSON, no markdown, no preamble, no commentary.`;

function buildUserPrompt(transcript: string): string {
  return `Recorded ledger events from the incident war room:

${transcript}

Return a strict JSON object with this exact schema:
{
  "rootCause": "<one concise sentence identifying the root cause>",
  "problem": "<one concise sentence describing what went wrong>",
  "impact": "<one concise sentence describing user/business impact>",
  "causes": "<one concise sentence on contributing causes>",
  "mitigation": "<one concise sentence describing remediation steps taken>",
  "timeline": [
    { "time": "<HH:MM:SS>", "speaker": "<speaker name>", "summary": "<one concise clause summarizing their contribution>" }
  ]
}

Constraints:
- Every string field MUST stay under 240 characters.
- Timeline MUST be ordered chronologically (oldest -> newest).
- Limit timeline to 12 entries.
- Use empty string "" only if a field truly cannot be inferred.
- Match the language style of a high-stakes SRE incident review.`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get('incidentId') || '#INC-8921';
  const format = searchParams.get('format') || 'markdown';
  const useLlmQuery = searchParams.get('useLlm');

  const incident = getIncidentState(incidentId);
  const pirMarkdown = generatePostIncidentReview(incidentId);

  // Decide LLM availability:
  //  - explicit ?useLlm=true forces the LLM path (will fail fast if no key)
  //  - explicit ?useLlm=false forces deterministic fallback
  //  - otherwise auto-detect based on BYOK env vars
  const apiKey = process.env.NEXT_LLM_API_KEY;
  const llmUrl = process.env.NEXT_LLM_URL;
  const hasKey = Boolean(apiKey && llmUrl);
  const wantsLlm =
    useLlmQuery === null ? hasKey : useLlmQuery === 'true' || useLlmQuery === '1';

  let summaryJson: SummaryJson = buildDeterministicSummary(incident);
  let llmAttempted = false;
  let llmSucceeded = false;
  let llmError: string | null = null;

  if (wantsLlm && hasKey) {
    llmAttempted = true;
    try {
      const baseURL = llmUrl!.replace(/\/chat\/completions\/?$/, '');
      const openai = createOpenAI({ apiKey: apiKey!, baseURL });
      const modelId = process.env.NEXT_LLM_MODEL || 'gpt-4o-mini';

      const result = await generateText({
        model: openai(modelId),
        system: SYSTEM_PROMPT,
        prompt: buildUserPrompt(serializeTranscript(incident)),
        temperature: 0.2,
      });

      const parsed = tryParseJson<Partial<SummaryJson>>(result.text);
      if (parsed && typeof parsed === 'object') {
        summaryJson = {
          rootCause: String(parsed.rootCause ?? ''),
          problem: String(parsed.problem ?? ''),
          impact: String(parsed.impact ?? ''),
          causes: String(parsed.causes ?? ''),
          mitigation: String(parsed.mitigation ?? ''),
          timeline: Array.isArray(parsed.timeline)
            ? parsed.timeline.slice(0, 12).map((t) => ({
                time: String(t?.time ?? ''),
                speaker: String(t?.speaker ?? ''),
                summary: String(t?.summary ?? ''),
              }))
            : summaryJson.timeline,
        };
        llmSucceeded = true;
      } else {
        llmError = 'LLM response was not valid JSON; fell back to deterministic summary.';
      }
    } catch (err) {
      llmError = err instanceof Error ? err.message : 'Unknown LLM error';
      console.error('[pir] LLM call failed, using deterministic fallback:', err);
    }
  }

  if (format === 'json') {
    return NextResponse.json(
      {
        incidentId: incident.incidentId,
        title: incident.title,
        severity: incident.severity,
        isResolved: incident.isResolved,
        eventCount: incident.events.length,
        ledgerItems: incident.ledgerItems,
        pirMarkdown,
        summaryJson,
        llm: {
          attempted: llmAttempted,
          succeeded: llmSucceeded,
          error: llmError,
        },
      },
      { status: 200 },
    );
  }

  // Markdown endpoint: append the structured summary as a machine-readable appendix
  // so reviewers see the structured output even when downloading the markdown.
  const summaryAppendix = `\n\n---\n\n## AI Summary (JSON)\n\n\`\`\`json\n${JSON.stringify(summaryJson, null, 2)}\n\`\`\`\n\n_LLM: attempted=${llmAttempted}, succeeded=${llmSucceeded}${llmError ? `, error=${llmError}` : ''}_\n`;
  return new NextResponse(pirMarkdown + summaryAppendix, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="PIR-${incidentId.replace(/[^a-zA-Z0-9]/g, '')}.md"`,
    },
  });
}
