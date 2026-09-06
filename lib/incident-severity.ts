export type IncidentSeverity =
  | 'Critical'
  | 'Major'
  | 'Minor'
  | 'SEV0'
  | 'SEV1'
  | 'SEV2'
  | 'SEV3'
  | string;

export interface SeverityConfig {
  label: 'Critical' | 'Major' | 'Minor';
  dotColor: string;
  badgeClasses: string;
  barCount: number;
}

/**
 * Normalizes legacy SEV0-SEV3 and arbitrary strings to incident.io tiers (Critical, Major, Minor).
 */
export function normalizeSeverity(raw?: string): 'Critical' | 'Major' | 'Minor' {
  if (!raw) return 'Minor';
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean === 'SEV0' || clean === 'SEV1' || clean === 'CRITICAL') return 'Critical';
  if (clean === 'SEV2' || clean === 'MAJOR') return 'Major';
  if (clean === 'SEV3' || clean === 'MINOR' || clean === 'LOW') return 'Minor';
  return 'Minor';
}

/**
 * Retrieves color styling, dot indicators, and vertical signal bar counts for a given severity.
 */
export function getSeverityConfig(severity: string): SeverityConfig {
  const norm = normalizeSeverity(severity);
  switch (norm) {
    case 'Critical':
      return {
        label: 'Critical',
        dotColor: 'bg-red-500',
        badgeClasses:
          'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300',
        barCount: 3,
      };
    case 'Major':
      return {
        label: 'Major',
        dotColor: 'bg-amber-500',
        badgeClasses:
          'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300',
        barCount: 2,
      };
    case 'Minor':
    default:
      return {
        label: 'Minor',
        dotColor: 'bg-blue-500',
        badgeClasses:
          'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300',
        barCount: 1,
      };
  }
}
