import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IncidentsPageLayout } from '@/components/incidents/IncidentsPageLayout';

export const metadata: Metadata = {
  title: 'Incidents Directory | Ecosphere',
  description:
    'Production incident directory, real-time status tracking, and war room coordination.',
};

export default function IncidentsPage() {
  return (
    <Suspense fallback={null}>
      <IncidentsPageLayout />
    </Suspense>
  );
}
