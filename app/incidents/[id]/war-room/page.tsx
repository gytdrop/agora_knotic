import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function IncidentWarRoomPage({ params }: PageProps) {
  const { id } = await params;
  const cleanId = decodeURIComponent(id).replace(/^#/, '');
  redirect(`/war-room?incident=${encodeURIComponent(cleanId)}`);
}
