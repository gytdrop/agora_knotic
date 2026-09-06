import type { Metadata } from 'next';
import { WorkflowsPageLayout } from '@/components/workflows/WorkflowsPageLayout';

export const metadata: Metadata = {
  title: 'Workflows & Automation | Ecosphere',
  description: 'Automate incident paging, Slack channels, Statuspage updates, and AI post-mortems.',
};

export default function WorkflowsPage() {
  return <WorkflowsPageLayout />;
}
