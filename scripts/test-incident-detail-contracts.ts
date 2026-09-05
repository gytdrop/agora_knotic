import assert from 'node:assert';
import { normalizeSeverity, getSeverityConfig } from '../lib/incident-severity';
import { normalizeIncidentId, getFallbackIncident } from '../lib/incident-detail-data';
import * as IncidentsModule from '../components/incidents';

console.log('================================================================');
console.log('   INCIDENT DETAIL PAGE & SEVERITY CONTRACTS VERIFICATION       ');
console.log('================================================================\n');

// 1. Severity Normalization Contracts
console.log('1. Testing Severity Normalization & Tiers...');
const severityTestCases: Array<[string, 'Critical' | 'Major' | 'Minor']> = [
  ['Critical', 'Critical'],
  ['critical', 'Critical'],
  ['Major', 'Major'],
  ['major', 'Major'],
  ['Minor', 'Minor'],
  ['minor', 'Minor'],
  ['SEV0', 'Critical'],
  ['sev-0', 'Critical'],
  ['SEV1', 'Critical'],
  ['SEV2', 'Major'],
  ['SEV3', 'Minor'],
  ['unknown', 'Minor'],
  ['', 'Minor'],
];

for (const [input, expected] of severityTestCases) {
  const actual = normalizeSeverity(input);
  assert.strictEqual(
    actual,
    expected,
    `normalizeSeverity("${input}") should be "${expected}", got "${actual}"`
  );
}
console.log('   ✓ All 13 severity input variations normalized accurately.\n');

// 2. Severity Visual Configurations
console.log('2. Testing Severity Visual Configurations & Signal Bars...');
const critConfig = getSeverityConfig('Critical');
assert.strictEqual(critConfig.label, 'Critical');
assert.strictEqual(critConfig.barCount, 3);
assert.ok(critConfig.badgeClasses.includes('red'));

const majorConfig = getSeverityConfig('Major');
assert.strictEqual(majorConfig.label, 'Major');
assert.strictEqual(majorConfig.barCount, 2);
assert.ok(majorConfig.badgeClasses.includes('amber'));

const minorConfig = getSeverityConfig('Minor');
assert.strictEqual(minorConfig.label, 'Minor');
assert.strictEqual(minorConfig.barCount, 1);
assert.ok(minorConfig.badgeClasses.includes('blue'));
console.log('   ✓ Critical (3 bars, red), Major (2 bars, amber), Minor (1 bar, blue) verified.\n');

// 3. Incident ID Normalization Contracts
console.log('3. Testing Incident ID Normalization...');
const idTestCases = [
  ['#7134', '#7134'],
  ['7134', '#7134'],
  ['INC-7134', '#7134'],
  ['#INC-7134', '#7134'],
  ['inc-7134', '#7134'],
  ['#7126', '#7126'],
  ['7126', '#7126'],
];

for (const [input, expected] of idTestCases) {
  const actual = normalizeIncidentId(input);
  assert.strictEqual(
    actual,
    expected,
    `normalizeIncidentId("${input}") should be "${expected}", got "${actual}"`
  );
}
console.log('   ✓ Incident ID variations (#7134, 7134, INC-7134) normalized cleanly.\n');

// 4. Offline Fallback Dataset Resilience
console.log('4. Testing Offline Fallback Dataset...');
const inc7134 = getFallbackIncident('#7134');
assert.ok(inc7134, 'Incident #7134 must exist in offline fallback dataset');
assert.strictEqual(inc7134.incidentId, '#7134');
assert.strictEqual(inc7134.severity, 'Major');
assert.strictEqual(inc7134.status, 'INVESTIGATING');
assert.ok(inc7134.problem && inc7134.impact && inc7134.causes && inc7134.mitigation);
assert.strictEqual(inc7134.slackChannel, '#incident-7134');
assert.strictEqual(inc7134.jiraKey, 'INC-7134');
assert.ok(inc7134.timelineEvents.length >= 4, 'Timeline must contain milestone events');
assert.ok(inc7134.actions.length >= 2, 'Actions checklist must contain in-incident tasks');
assert.ok(inc7134.followUps.length >= 2, 'Follow-ups must contain post-incident tasks');

// Test dynamic fallback generation for arbitrary IDs
const dynamicInc = getFallbackIncident('9999');
assert.ok(dynamicInc, 'Dynamic fallback must generate a record for unknown ID');
assert.strictEqual(dynamicInc.incidentId, '#9999');
assert.strictEqual(dynamicInc.severity, 'Minor');
assert.strictEqual(dynamicInc.status, 'INVESTIGATING');
console.log('   ✓ Seeded incidents and dynamic arbitrary ID fallbacks verified.\n');

// 5. Component Exports
console.log('5. Testing Incident Component Module Exports...');
assert.ok(typeof IncidentsModule.IncidentDetailPage === 'function', 'IncidentDetailPage must be exported');
assert.ok(typeof IncidentsModule.IncidentsPageLayout === 'function', 'IncidentsPageLayout must be exported');
assert.ok(typeof IncidentsModule.IncidentsTable === 'function', 'IncidentsTable must be exported');
assert.ok(typeof IncidentsModule.IncidentsFilterBar === 'function', 'IncidentsFilterBar must be exported');
console.log('   ✓ All key incident components correctly exported from components/incidents.\n');

console.log('================================================================');
console.log('    ALL INCIDENT CONTRACTS & LOGIC VERIFIED SUCCESSFULLY        ');
console.log('================================================================');
