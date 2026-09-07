import { convexClient } from '@/lib/convex-client';
import { api } from '@/convex/_generated/api';

export interface IncidentLiveMetrics {
  totalIncidents: number;
  activeIncidents: number;
  criticalIncidents: number;
  resolvedIncidents: number;
  mtta: number; // minutes
  mttr: number; // minutes
  ongoingWarRooms: number;
  bySeverity: Record<string, number>;
  byService: Record<string, number>;
}

export async function getLiveIncidentMetrics(): Promise<IncidentLiveMetrics> {
  const result = await convexClient.query(api.incidents.calculateMetrics, {});
  return result;
}
