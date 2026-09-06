import assert from 'node:assert';
import {
  ROOTLY_EVENTS_DATASET,
} from '../components/events/eventsData';
import * as eventsModule from '../components/events';

console.log('================================================================');
console.log('       ROOTLY EVENTS PAGE CONTRACTS VERIFICATION               ');
console.log('================================================================\n');

// 1. Dataset count and schema verification
console.log('1. Verifying extracted dataset count and fields...');
assert.strictEqual(ROOTLY_EVENTS_DATASET.length, 16, 'Expected exactly 16 Rootly events in dataset');

for (const item of ROOTLY_EVENTS_DATASET) {
  assert(item.id, `Item must have an id`);
  assert(item.alertName, `Item ${item.id} must have an alertName`);
  assert(item.source === 'Monitoring' || item.source === 'Paging', `Item ${item.id} source invalid: ${item.source}`);
  assert(item.urgency === 'High' || item.urgency === 'Medium' || item.urgency === 'Low', `Item ${item.id} urgency invalid`);
  assert(item.createdAt, `Item ${item.id} must have createdAt`);
  assert(
    item.status === 'Triggered' ||
    item.status === 'Acknowledged' ||
    item.status === 'Resolved' ||
    item.status === 'Deferred',
    `Item ${item.id} has invalid status ${item.status}`
  );
  assert(item.activeTime, `Item ${item.id} must have activeTime`);
  assert(item.services, `Item ${item.id} must have services`);
}
console.log('   ✓ All 16 events have valid fields and strict types.\n');

// 2. Specific key records verification
console.log('2. Verifying key demo records from live session...');
const elevated5xx = ROOTLY_EVENTS_DATASET.find(e => e.id === 'H4cavG');
assert(elevated5xx, 'Expected #H4cavG record');
assert.strictEqual(elevated5xx.status, 'Triggered');
assert.strictEqual(elevated5xx.source, 'Monitoring');
assert.strictEqual(elevated5xx.activeTime, '18h');

const checkout5xx = ROOTLY_EVENTS_DATASET.find(e => e.id === 'yHIkYQ');
assert(checkout5xx, 'Expected #yHIkYQ record');
assert.strictEqual(checkout5xx.status, 'Resolved');

const errorBudget = ROOTLY_EVENTS_DATASET.find(e => e.id === 'Xo0VUt');
assert(errorBudget, 'Expected #Xo0VUt record');
assert.strictEqual(errorBudget.status, 'Acknowledged');
assert.strictEqual(errorBudget.source, 'Paging');
assert.strictEqual(errorBudget.isChild, true);
assert.strictEqual(errorBudget.parentId, 'yHIkYQ');

const diskUsage = ROOTLY_EVENTS_DATASET.find(e => e.id === 'uuM1s4');
assert(diskUsage, 'Expected #uuM1s4 record');
assert.strictEqual(diskUsage.status, 'Acknowledged');
assert.strictEqual(diskUsage.activeTime, '1d 10h');
console.log('   ✓ Key live session records and tree hierarchy connections verified.\n');

// 3. Module component exports
console.log('3. Verifying module component exports...');
assert(eventsModule.EventsHeader, 'EventsHeader export missing');
assert(eventsModule.EventsToolbar, 'EventsToolbar export missing');
assert(eventsModule.EventsTable, 'EventsTable export missing');
assert(eventsModule.EventsPageLayout, 'EventsPageLayout export missing');
console.log('   ✓ All components correctly exported from components/events.\n');

console.log('================================================================');
console.log('          ALL EVENTS CONTRACTS PASSED SUCCESSFULLY              ');
console.log('================================================================\n');
