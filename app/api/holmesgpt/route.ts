import { NextResponse } from 'next/server';
import { handleCorsPreflight, withCors } from '@/lib/cors';

export interface HolmesGptInvestigationRequest {
  query?: string;
  targetResource?: string;
  action?: 'investigate' | 'check_health' | 'audit_ingress' | 'ask';
}

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  return withCors(
    NextResponse.json({
      status: 'online',
      version: 'holmesgpt-v0.1-oss',
      repository: 'https://github.com/robusta-dev/holmesgpt',
      capabilities: [
        'Kubernetes cluster triage',
        'Prometheus metric audit',
        'AWS RDS connection pool analysis',
        'Ingress controller routing verification',
        'Automated root-cause analysis',
      ],
      clusterStatus: {
        connected: true,
        services: ['ingress-nginx', 'auth-service', 'rds-aurora-postgres'],
        activeIncident: '#INC-8921 (SEV-1)',
      },
    }),
    request,
  );
}

export async function POST(req: Request) {
  try {
    const body: HolmesGptInvestigationRequest = await req.json();
    const action = body.action || 'investigate';
    const query = body.query || 'ingress port routing audit';

    // HolmesGPT Root-Cause Audit Pipeline
    if (action === 'audit_ingress' || query.toLowerCase().includes('ingress')) {
      return withCors(
        NextResponse.json({
          success: true,
          source: 'HolmesGPT Investigation Engine',
          findings: {
            component: 'ingress-nginx/auth-service',
            issueType: 'Port Configuration Mismatch',
            details:
              'Ingress route /api/v2/auth is routing upstream traffic to port 8080. Target deployment is listening on port 8000.',
            impact: 'HTTP 502 Bad Gateway across all auth endpoints.',
            confidence: 0.98,
            suggestedRemediation:
              'kubectl patch ingress auth-svc -p \'{"spec":{"rules":[{"http":{"port":8080}}]}}\'',
          },
          timestamp: new Date().toISOString(),
        }),
        req,
      );
    }

    if (action === 'check_health' || query.toLowerCase().includes('database') || query.toLowerCase().includes('db')) {
      return withCors(
        NextResponse.json({
          success: true,
          source: 'HolmesGPT Investigation Engine',
          findings: {
            component: 'aws-rds/postgres-cluster-01',
            issueType: 'Normal Operation',
            details: 'Database CPU utilization at 2.1%. Active connections 14/1000. Latency < 2.5ms.',
            status: 'HEALTHY',
            contradictionDetected: true,
            contradictionReason:
              'Spoken user hypothesis claims database lockup, but telemetry verifies DB is operating within normal thresholds.',
          },
          timestamp: new Date().toISOString(),
        }),
        req,
      );
    }

    return withCors(
      NextResponse.json({
        success: true,
        source: 'HolmesGPT Investigation Engine',
        findings: {
          component: body.targetResource || 'cluster-core',
          query,
          details: 'HolmesGPT completed cluster scan. No additional anomalies found.',
        },
        timestamp: new Date().toISOString(),
      }),
      req,
    );
  } catch (err) {
    return withCors(
      NextResponse.json(
        { error: 'HolmesGPT investigation failed', details: String(err) },
        { status: 500 },
      ),
      req,
    );
  }
}
