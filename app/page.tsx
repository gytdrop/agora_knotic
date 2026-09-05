import { Suspense } from 'react';
import { IncidentDashboard } from '@/components/dashboard/IncidentDashboard';

export default function Home() {
  return (
    <Suspense fallback={null}>
      <IncidentDashboard />
    </Suspense>
  );
}
