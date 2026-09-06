import type { Metadata } from 'next';
import { OnCallPageLayout } from '@/components/on-call/OnCallPageLayout';

export const metadata: Metadata = {
  title: 'On-Call Schedules & Escalation Policies | Ecosphere',
  description: 'Manage on-call rotations, escalation policies, and responder shift coverage.',
};

export default function OnCallPage() {
  return <OnCallPageLayout />;
}
