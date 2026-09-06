import type { Metadata } from 'next';
import { EventsPageLayout } from '@/components/events/EventsPageLayout';

export const metadata: Metadata = {
  title: 'Events | Ecosphere',
  description: 'AI-native event stream, alerts monitoring, and on-call routing directory.',
};

export default function EventsPage() {
  return <EventsPageLayout />;
}
