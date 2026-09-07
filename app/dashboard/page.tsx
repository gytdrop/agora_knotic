import { Suspense } from 'react';
import { IncidentDashboard } from '@/components/dashboard/IncidentDashboard';

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <IncidentDashboard />
    </Suspense>
  );
}
