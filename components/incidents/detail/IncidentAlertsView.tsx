'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Flame,
  Radio,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface IncidentAlertsViewProps {
  incidentId: string;
  className?: string;
}

export interface AlertDetailItem {
  id: string;
  title: string;
  source: 'Datadog' | 'AWS CloudWatch' | 'Prometheus';
  severity: 'Critical' | 'Major' | 'Resolved';
  time: string;
  status: 'Triggered' | 'Correlated' | 'Resolved';
  metricValue: string;
  threshold: string;
  service: string;
  rawPayload: Record<string, any>;
}

export function IncidentAlertsView({
  incidentId,
  className,
}: IncidentAlertsViewProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({
    'alt-1': true,
  });

  const alerts: AlertDetailItem[] = [
    {
      id: 'alt-1',
      title: 'p99 Checkout Latency > 6200ms on /v1/checkout/charge',
      source: 'Datadog',
      severity: 'Critical',
      time: '15:15 UTC',
      status: 'Triggered',
      metricValue: '6,218ms',
      threshold: '> 500ms for 2m',
      service: 'payment-service',
      rawPayload: {
        monitor_id: 'dd-mon-94812',
        metric: 'trace.payment.checkout.duration.p99',
        env: 'production',
        region: 'us-east-1',
        span_name: 'charge_orchestrator',
        http_status: 504,
      },
    },
    {
      id: 'alt-2',
      title: 'ALB HTTP 504 Gateway Timeout Rate > 47.2%',
      source: 'AWS CloudWatch',
      severity: 'Critical',
      time: '15:18 UTC',
      status: 'Correlated',
      metricValue: '47.2%',
      threshold: '> 2.0% error rate',
      service: 'payment-gateway-alb',
      rawPayload: {
        alarm_arn: 'arn:aws:cloudwatch:us-east-1:948122940192:alarm:ALB-Payment-5xx',
        dimension: 'app/payment-gateway-alb/3b91a',
        datapoints: [46.8, 47.2, 47.5],
        unit: 'Percent',
      },
    },
    {
      id: 'alt-3',
      title: 'Downstream HTTP 504 Client Socket Backlog Saturation',
      source: 'Datadog',
      severity: 'Critical',
      time: '15:22 UTC',
      status: 'Triggered',
      metricValue: '45.1% Timeout Rate',
      threshold: '> 1.0% dependency failures',
      service: 'fraud-detection-svc',
      rawPayload: {
        target_service: 'fraud-detection-svc.internal',
        downstream_latency: '5,002ms',
        connection_pool: 'SYN_SENT Backlog Saturation',
        impact: 'Client handshake socket drop',
      },
    },
    {
      id: 'alt-4',
      title: 'Container Memory & DB Replica Leases Within Limits',
      source: 'Prometheus',
      severity: 'Resolved',
      time: '15:45 UTC',
      status: 'Resolved',
      metricValue: '58% Mem (22% DB Pool)',
      threshold: 'Nominal baseline (< 85%)',
      service: 'payment-worker-pod',
      rawPayload: {
        query: 'container_memory_usage_bytes{pod=~"payment-.*"} / limit',
        db_active_leases: 22,
        db_pool_capacity: 100,
        holmesgpt_verdict: 'Disproven: No memory leak detected',
      },
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedAlerts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={cn('py-4 space-y-4 text-xs', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Correlated Monitoring Telemetry ({alerts.length})
          </h3>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Real-time APM monitors, CloudWatch alarms, and Prometheus queries correlated with #{incidentId.replace('#', '')}.
          </p>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
          Syncing via Webhook
        </span>
      </div>

      <div className="space-y-3">
        {alerts.map((alt) => {
          const isCritical = alt.severity === 'Critical';
          const isResolved = alt.severity === 'Resolved';
          const isExpanded = !!expandedAlerts[alt.id];

          return (
            <div
              key={alt.id}
              className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs overflow-hidden transition-all"
            >
              {/* Alert Header Row */}
              <div
                onClick={() => toggleExpand(alt.id)}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5',
                      isCritical
                        ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    )}
                  >
                    {isCritical ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-zinc-100">
                        {alt.title}
                      </span>
                      <span className="text-[10px] font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 rounded">
                        {alt.source}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400">
                        service: {alt.service}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-2">
                      <span>Triggered at {alt.time}</span>
                      <span>•</span>
                      <span>Value: <strong className="text-zinc-700 dark:text-zinc-300 font-mono">{alt.metricValue}</strong> (Threshold: {alt.threshold})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={cn(
                      'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                      isCritical
                        ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                    )}
                  >
                    {alt.severity}
                  </span>

                  <ChevronDown
                    className={cn(
                      'h-4 w-4 text-zinc-400 transition-transform',
                      isExpanded ? 'rotate-180' : ''
                    )}
                  />
                </div>
              </div>

              {/* Expandable JSON / Telemetry Inspector */}
              {isExpanded && (
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider">Alert Payload & Trace Metadata</span>
                    <a
                      href={`https://app.datadoghq.com/monitors/${alt.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <span>Open in {alt.source}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <pre className="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                    {JSON.stringify(alt.rawPayload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IncidentAlertsView;
