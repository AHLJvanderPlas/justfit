// The set-group model of "Training loggen" (packages/client-app/src/logSession.js).
// The sheet's rows expand into the stepsActualRef payload here and nowhere else, so
// the record the server stores is decided by these functions.
//
//   node --test scripts/logSession.test.mjs      (also run by scripts/smoke.sh)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expandGroups, rowGroups, compressValues, loggedStep, buildLogSteps, summarizeLogged, parseSetList,
} from '../packages/client-app/src/logSession.js';

test('set groups expand: 3×3 @60 + 2×4 @60 → [3,3,3,4,4] with four rests of 60', () => {
  const x = expandGroups([{ sets: 3, reps: 3, rest: 60 }, { sets: 2, reps: 4, rest: 60 }]);
  assert.deepEqual(x.values, [3, 3, 3, 4, 4]);
  assert.deepEqual(x.rests, [60, 60, 60, 60]);
});

test('the rest after a set is its own group\'s rest; the last set has none', () => {
  const x = expandGroups([{ sets: 3, reps: 3, rest: 60 }, { sets: 2, reps: 4, rest: 90 }]);
  assert.deepEqual(x.rests, [60, 60, 60, 90]);
  assert.deepEqual(expandGroups([{ sets: 1, reps: 10, rest: 60 }]).rests, []);
  assert.deepEqual(expandGroups([{ sets: 3, reps: 10, rest: 0 }]).rests, [], 'no rest recorded → []');
});

test('timed groups: 2 × 45 s @ 30 s → [45,45] / [30], seconds limits apply', () => {
  const x = expandGroups([{ sets: 2, sec: 45, rest: 30 }], 'sec');
  assert.deepEqual(x.values, [45, 45]);
  assert.deepEqual(x.rests, [30]);
  assert.equal(expandGroups([{ sets: 1, sec: 900, rest: 0 }], 'sec').values[0], 900, '900 s is a valid plank/run');
  assert.ok(expandGroups([{ sets: 1, reps: 900, rest: 0 }], 'reps').error, '900 reps is not');
  const step = loggedStep({ exerciseId: 'plank', unit: 'sec', groups: [{ sets: 2, sec: 45, rest: 30 }, { sets: 1, sec: 30, rest: 30 }] });
  assert.deepEqual(step.actual.reps_per_set, [45, 45, 30]);
  assert.deepEqual(step.actual.rest_taken_seconds, [30, 30]);
});

test('typed shorthand in the value field is still read, and the row\'s sets yield to it', () => {
  assert.deepEqual(expandGroups([{ sets: 1, reps: '3x3, 2x4', rest: 60 }]).values, [3, 3, 3, 4, 4]);
  assert.deepEqual(expandGroups([{ sets: 9, reps: '10, 10, 8', rest: 45 }]).values, [10, 10, 8]);
  assert.deepEqual(expandGroups([{ sets: 1, reps: '3 x 3', rest: 60 }]).values, [3, 3, 3], 'spaces around x');
  assert.deepEqual(rowGroups({ sets: 1, value: '3x3, 2x4', rest: 60 }).groups,
    [{ sets: 3, value: 3, rest: 60 }, { sets: 2, value: 4, rest: 60 }], 'shorthand becomes rows');
  assert.ok(expandGroups([{ sets: 1, reps: '3y3', rest: 60 }]).error);
  assert.deepEqual(parseSetList('3x3, 2x4').values, [3, 3, 3, 4, 4], 'the original parser is unchanged');
});

test('a row the sheet would reject expands to nothing', () => {
  assert.equal(expandGroups([{ sets: 3, reps: '', rest: 60 }]).error, 'empty');
  assert.equal(expandGroups([{ sets: 0, reps: 10, rest: 60 }]).error, 'sets');
  assert.equal(expandGroups([{ sets: 3, reps: 10, rest: 601 }]).error, 'rest');
  assert.equal(expandGroups([{ sets: 15, reps: 10, rest: 60 }, { sets: 6, reps: 10, rest: 60 }]).error, 'too_many');
  assert.deepEqual(loggedStep({ exerciseId: 'x', groups: [{ sets: 3, reps: '', rest: 60 }] }).actual.reps_per_set, []);
});

test('a skipped card yields skipped:true with 0 sets, whatever its rows say', () => {
  const s = loggedStep({ exerciseId: 'sit-up', skipped: true, groups: [{ sets: 3, reps: 10, rest: 60 }] });
  assert.equal(s.actual.skipped, true);
  assert.equal(s.actual.sets_completed, 0);
  assert.deepEqual(s.actual.reps_per_set, []);
  assert.deepEqual(s.actual.rest_taken_seconds, []);
  assert.deepEqual(s.prescribed, {});
});

test('reordered cards keep their order in the steps payload', () => {
  const cards = [
    { exerciseId: 'sit-up', unit: 'reps', skipped: true, groups: [] },
    { exerciseId: 'push-up', unit: 'reps', groups: [{ sets: 3, reps: 3, rest: 60 }, { sets: 2, reps: 4, rest: 60 }] },
    { exerciseId: 'plank', unit: 'sec', groups: [{ sets: 2, sec: 45, rest: 30 }] },
  ];
  const steps = buildLogSteps(cards);
  assert.deepEqual(steps.map((s) => s.exercise_id), ['sit-up', 'push-up', 'plank']);
  assert.deepEqual(steps[1].actual.reps_per_set, [3, 3, 3, 4, 4]);
  const swapped = buildLogSteps([cards[1], cards[0], cards[2]]);
  assert.deepEqual(swapped.map((s) => s.exercise_id), ['push-up', 'sit-up', 'plank']);
});

test('the original setsText form expands as before (the harness and the old payload)', () => {
  const s = loggedStep({ exerciseId: 'push-up', setsText: '3, 3, 3, 4, 4', restSec: 60 });
  assert.deepEqual(s.actual.reps_per_set, [3, 3, 3, 4, 4]);
  assert.deepEqual(s.actual.rest_taken_seconds, [60, 60, 60, 60]);
  assert.deepEqual(loggedStep({ exerciseId: 'push-up', setsText: '5,5' }).actual.rest_taken_seconds, []);
});

test('the record line: one exercise, sets, values, rests collapsed', () => {
  const one = (groups) => summarizeLogged(loggedStep({ exerciseId: 'p', groups }).actual);
  assert.deepEqual(one([{ sets: 3, reps: 3, rest: 60 }, { sets: 2, reps: 4, rest: 60 }]), { sets: 5, values: '3/3/3/4/4', rest: '60' });
  assert.equal(one([{ sets: 3, reps: 3, rest: 60 }, { sets: 2, reps: 4, rest: 90 }]).rest, '60/90');
  assert.equal(one([{ sets: 1, reps: 12, rest: 60 }]).rest, null, 'one set has no rest');
  assert.deepEqual(compressValues([60, 60, 90, 60]).map((g) => g.value), [60, 90, 60]);
});
