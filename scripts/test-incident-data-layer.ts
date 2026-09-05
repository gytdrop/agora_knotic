import assert from 'node:assert';
import { getFallbackIncident, normalizeIncidentId } from '../lib/incident-detail-data';

console.log('Testing Incident Data Layer Fallback & Normalization...');

assert.strictEqual(normalizeIncidentId('#7134'), '#7134');
assert.strictEqual(normalizeIncidentId('7134'), '#7134');
assert.strictEqual(normalizeIncidentId('INC-7134'), '#7134');
assert.strictEqual(normalizeIncidentId('#INC-7134'), '#7134');

const inc = getFallbackIncident('#7134');
assert.ok(inc, 'Incident #7134 should exist in fallback dataset');
assert.strictEqual(inc.incidentId, '#7134');
assert.strictEqual(inc.severity, 'Major');
assert.strictEqual(inc.status, 'INVESTIGATING');
assert.ok(inc.problem && inc.impact && inc.causes && inc.mitigation);
assert.ok(Array.isArray(inc.timelineEvents) && inc.timelineEvents.length > 0);
assert.ok(Array.isArray(inc.actions) && inc.actions.length > 0);
assert.ok(Array.isArray(inc.followUps) && inc.followUps.length > 0);

console.log('PASS: Data layer fallback contracts verified.');
