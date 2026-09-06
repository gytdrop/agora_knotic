import type { Metadata } from 'next';
import { IntegrationsPageLayout } from '@/components/integrations/IntegrationsPageLayout';

export const metadata: Metadata = {
  title: 'Integrations & Connected Tools | Ecosphere',
  description: 'Connect Agora WebRTC, Slack, Datadog, AWS CloudWatch, PagerDuty, and Jira.',
};

export default function IntegrationsPage() {
  return <IntegrationsPageLayout />;
}
