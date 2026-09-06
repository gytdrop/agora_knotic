import { redirect } from 'next/navigation';

/**
 * Retrospectives route redirects to the new canonical Events directory.
 */
export default function RetrospectivesPage() {
  redirect('/events');
}
