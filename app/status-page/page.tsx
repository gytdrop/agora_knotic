import type { Metadata } from 'next';
import { StatusPageLayout } from '@/components/status-page/StatusPageLayout';

export const metadata: Metadata = {
  title: 'Status Pages | Ecosphere',
  description: 'Public and internal status pages, component health, and incident announcements.',
};

export default function StatusPageRoute() {
  return <StatusPageLayout />;
}
