import type { Metadata } from 'next';
import { MetricsPageLayout } from '@/components/metrics/MetricsPageLayout';

export const metadata: Metadata = {
  title: 'Incident Metrics & Analytics | Ecosphere',
  description: 'Track Mean Time to Resolve (MTTR), detection times, service SLAs, and incident volume analytics.',
};

export default function MetricsPage() {
  return <MetricsPageLayout />;
}
