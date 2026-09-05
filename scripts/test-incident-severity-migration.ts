import assert from 'node:assert';
import { normalizeSeverity, getSeverityConfig } from '../lib/incident-severity';

console.log('Testing Severity Migration & Normalization...');

// Normalization mappings
assert.strictEqual(normalizeSeverity('SEV0'), 'Critical');
assert.strictEqual(normalizeSeverity('SEV1'), 'Critical');
assert.strictEqual(normalizeSeverity('SEV2'), 'Major');
assert.strictEqual(normalizeSeverity('SEV3'), 'Minor');
assert.strictEqual(normalizeSeverity('Critical'), 'Critical');
assert.strictEqual(normalizeSeverity('Major'), 'Major');
assert.strictEqual(normalizeSeverity('Minor'), 'Minor');
assert.strictEqual(normalizeSeverity('unknown'), 'Minor');

// Config validation
const majorConfig = getSeverityConfig('Major');
assert.strictEqual(majorConfig.label, 'Major');
assert.strictEqual(majorConfig.barCount, 2);
assert.ok(majorConfig.badgeClasses.includes('amber'));

const critConfig = getSeverityConfig('Critical');
assert.strictEqual(critConfig.label, 'Critical');
assert.strictEqual(critConfig.barCount, 3);
assert.ok(critConfig.badgeClasses.includes('red'));

const minorConfig = getSeverityConfig('Minor');
assert.strictEqual(minorConfig.label, 'Minor');
assert.strictEqual(minorConfig.barCount, 1);
assert.ok(minorConfig.badgeClasses.includes('blue'));

console.log('PASS: Severity migration contracts verified.');
