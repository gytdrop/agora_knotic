import type { Metadata } from 'next';
import { StatusPageLayout } from '@/components/status-page/StatusPageLayout';

export const metadata: Metadata = {
  title: 'Status Pages | Ecosphere',
  description:
    'Let your team and customers know when your services are down with private and public status pages. Show service uptime, post your incidents directly to the page and connect third party services your company is dependent on.',
};

export default function StatusPageRoute() {
  return <StatusPageLayout />;
}
