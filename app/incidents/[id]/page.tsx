import type { Metadata } from 'next';
import { Suspense } from 'react';
import { IncidentsPageLayout } from '@/components/incidents/IncidentsPageLayout';
import { IncidentDetailPage } from '@/components/incidents/detail/IncidentDetailPage';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const cleanId = decodeURIComponent(id);
  return {
    title: `Incident ${cleanId} | Ecosphere`,
    description: `Incident details, real-time lifecycle, and response coordination for ${cleanId}.`,
  };
}

export default async function IncidentPage({ params }: PageProps) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id);

  return (
    <Suspense fallback={null}>
      <IncidentsPageLayout>
        <IncidentDetailPage incidentId={cleanId} />
      </IncidentsPageLayout>
    </Suspense>
  );
}
