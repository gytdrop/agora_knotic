import { NextRequest, NextResponse } from 'next/server';
import { generatePostIncidentReview, getIncidentState } from '@/lib/event-store';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const incidentId = searchParams.get('incidentId') || '#INC-8921';
  const format = searchParams.get('format') || 'markdown';

  const incident = getIncidentState(incidentId);
  const pirMarkdown = generatePostIncidentReview(incidentId);

  if (format === 'json') {
    return NextResponse.json(
      {
        incidentId: incident.incidentId,
        title: incident.title,
        severity: incident.severity,
        isResolved: incident.isResolved,
        eventCount: incident.events.length,
        ledgerItems: incident.ledgerItems,
        pirMarkdown,
      },
      { status: 200 },
    );
  }

  return new NextResponse(pirMarkdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="PIR-${incidentId.replace(/[^a-zA-Z0-9]/g, '')}.md"`,
    },
  });
}
