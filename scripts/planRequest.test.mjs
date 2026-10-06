// POST /api/plan request parsing and the existing-plan decision — pure, no database.
// Run: node --test scripts/planRequest.test.mjs
//
// scripts/plan-override-requests.mjs proves the wiring over HTTP for a handful of
// paths. This file walks the whole decision table: every combination of
// {isPro} × {no row, engine row, user row, malformed row} × {no exemption,
// custom_steps, custom_extra, pins, force_assessment, adapt_mode, bonus_session} × {replace_user_plan}.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePlanRequest, decideExistingPlan, needsExistingPlan, unknownPinsError, preservesUserPlan,
  CUSTOM_STEP_LIMITS, MAX_CUSTOM_STEPS, MAX_PINS,
} from '../functions/api/_shared/planRequest.js';

const DATE = '2026-10-05';
const STORED = { session_name: 'Stored', steps: [{ exercise_id: 'ex1' }] };
const ROWS = {
  none:      null,
  engine:    { id: 'row-e', generated_by: 'engine',     plan_json: JSON.stringify(STORED) },
  adapt:     { id: 'row-a', generated_by: 'adapt_free', plan_json: JSON.stringify(STORED) },
  user:      { id: 'row-u', generated_by: 'user',       plan_json: JSON.stringify(STORED) },
  userBad:   { id: 'row-x', generated_by: 'user',       plan_json: '{not json' },
  engineBad: { id: 'row-y', generated_by: 'engine',     plan_json: '{not json' },
};
const EXEMPTIONS = {
  none:             {},
  custom_steps:     { custom_steps: [{ exercise_id: 'ex1' }] },
  // "Als extra" (MANUAL_TRAINING_DESIGN §4): an own session NEXT TO today's plan.
  custom_extra:     { custom_steps: [{ exercise_id: 'ex1' }], bonus_session: true },
  pins:             { pinned_exercise_ids: ['ex1'] },
  force_assessment: { force_assessment: true },
  // The client's base_plan is deliberately different from STORED: an adapt must
  // scale the stored session, never whatever the client sent.
  adapt_mode:       { adapt_mode: true, base_plan: { session_name: 'Client', steps: [] } },
  bonus_session:    { bonus_session: true },
};

// The decision table, written as the rules the product decided — in priority
// order, independent of how decideExistingPlan is structured.
function expected({ row, exemption, replace, isPro }) {
  if (row === 'none') return ['regenerate', 'no_existing_plan'];
  if (exemption === 'custom_extra') return ['regenerate', 'custom_extra'];   // alongside: stores nothing, caps nothing, preserves everything
  if (exemption === 'custom_steps') return ['regenerate', 'custom_steps'];   // writing your own replaces anything
  if (exemption === 'bonus_session') return ['regenerate', 'bonus_session']; // ephemeral, never stored
  const malformed = row.endsWith('Bad');
  if (row.startsWith('user') && !replace && !malformed) return ['preserve', 'user_plan']; // W4.1 beats every exemption
  if (exemption === 'adapt_mode' && !malformed) return ['adapt', 'adapt_mode'];          // same session, scaled — not a re-roll
  const capExempt = isPro || exemption === 'force_assessment' || exemption === 'pins';
  if (!capExempt) return malformed ? ['regenerate', 'malformed_existing_plan'] : ['capped', 'free_daily_cap'];
  return ['regenerate', isPro ? 'pro' : exemption === 'force_assessment' ? 'force_assessment' : 'pinned_exercise_ids'];
}

test('decision table: every {isPro × row × exemption × replace_user_plan} combination', () => {
  let n = 0;
  for (const isPro of [false, true]) {
    for (const [row, existingRow] of Object.entries(ROWS)) {
      for (const [exemption, extra] of Object.entries(EXEMPTIONS)) {
        for (const replace of [false, true]) {
          const body = { date: DATE, ...extra, ...(replace ? { replace_user_plan: true } : {}) };
          const got = decideExistingPlan({ existingRow, body, isPro });
          const [decision, reason] = expected({ row, exemption, replace, isPro });
          const label = `isPro=${isPro} row=${row} exemption=${exemption} replace=${replace}`;
          assert.equal(got.decision, decision, `${label}: decision`);
          assert.equal(got.reason, reason, `${label}: reason`);
          if (decision === 'preserve') assert.deepEqual(got.plan, { id: existingRow.id, ...STORED }, `${label}: preserved plan carries the row id`);
          if (decision === 'capped') assert.deepEqual(got.plan, { ...STORED, id: existingRow.id, capped: true }, `${label}: capped plan carries the row id`);
          if (decision === 'adapt') assert.deepEqual(got.plan, STORED, `${label}: adapt scales the stored session`);
          if (decision === 'regenerate') assert.equal(got.plan, undefined, `${label}: regenerate returns no plan`);
          n++;
        }
      }
    }
  }
  assert.equal(n, 2 * 6 * 7 * 2);
});

// Named cases — the ones a reader looks for first.

test('C-G4: a free user with an engine plan is capped', () => {
  const d = decideExistingPlan({ existingRow: ROWS.engine, body: { date: DATE }, isPro: false });
  assert.equal(d.decision, 'capped');
  assert.equal(d.plan.capped, true);
  assert.equal(d.plan.id, 'row-e', 'a capped plan must carry the row id the execution is saved against');
});

test('C-G4: a free user\'s check-in adapts the stored plan instead of being capped (F8)', () => {
  const d = decideExistingPlan({ existingRow: ROWS.engine, body: { date: DATE, ...EXEMPTIONS.adapt_mode }, isPro: false });
  assert.equal(d.decision, 'adapt');
  assert.deepEqual(d.plan, STORED);
  // Response keys an older adapt row stored verbatim are not carried into the next adapt.
  const old = { ...ROWS.adapt, plan_json: JSON.stringify({ id: 'stale', capped: true, ...STORED }) };
  assert.deepEqual(decideExistingPlan({ existingRow: old, body: { date: DATE, adapt_mode: true }, isPro: false }).plan, STORED);
});

test('C-G4: Pro re-rolls', () => {
  assert.equal(decideExistingPlan({ existingRow: ROWS.engine, body: { date: DATE }, isPro: true }).decision, 'regenerate');
});

test('C-G4 exemptions: custom_steps, pins and force_assessment each lift the cap for a free user', () => {
  for (const ex of ['custom_steps', 'pins', 'force_assessment']) {
    const d = decideExistingPlan({ existingRow: ROWS.engine, body: { date: DATE, ...EXEMPTIONS[ex] }, isPro: false });
    assert.equal(d.decision, 'regenerate', ex);
  }
});

test('W4.1: a user-authored plan survives an auto-generate, a check-in, a forced assessment and a pin request', () => {
  for (const extra of [{}, { checkin: { energy: 2 } }, { adapt_mode: true }, EXEMPTIONS.force_assessment, EXEMPTIONS.pins]) {
    for (const isPro of [false, true]) {
      const d = decideExistingPlan({ existingRow: ROWS.user, body: { date: DATE, ...extra }, isPro });
      assert.equal(d.decision, 'preserve', JSON.stringify(extra));
      assert.equal(d.plan.id, 'row-u');
    }
  }
});

test('W4.1: replace_user_plan must be exactly true', () => {
  for (const v of ['true', 1, 'yes', {}]) {
    assert.equal(decideExistingPlan({ existingRow: ROWS.user, body: { date: DATE, replace_user_plan: v }, isPro: true }).decision, 'preserve', String(v));
  }
  assert.equal(preservesUserPlan(ROWS.user, { replace_user_plan: true }), false);
  assert.equal(preservesUserPlan(ROWS.engine, {}), false);
  assert.equal(preservesUserPlan(null, {}), false);
});

test('a stored plan that does not parse is never returned', () => {
  assert.equal(decideExistingPlan({ existingRow: ROWS.userBad, body: { date: DATE }, isPro: false }).decision, 'regenerate');
  assert.equal(decideExistingPlan({ existingRow: ROWS.engineBad, body: { date: DATE }, isPro: false }).decision, 'regenerate');
});

test('needsExistingPlan: only custom_steps and bonus sessions skip the read', () => {
  assert.equal(needsExistingPlan({ date: DATE }), true);
  assert.equal(needsExistingPlan({ date: DATE, force_assessment: true }), true);
  assert.equal(needsExistingPlan({ date: DATE, pinned_exercise_ids: ['a'] }), true);
  assert.equal(needsExistingPlan({ date: DATE, custom_steps: [] }), false);
  assert.equal(needsExistingPlan({ date: DATE, bonus_session: true }), false);
  assert.equal(needsExistingPlan({ date: DATE, custom_steps: null }), true);
});

// ── parsePlanRequest ────────────────────────────────────────────────────────

const err = (body) => { const r = parsePlanRequest(body); assert.ok(r.status, `expected an error for ${JSON.stringify(body)}`); return r; };

test('parse: date is required', () => {
  assert.deepEqual(err({}), { status: 400, body: { error: 'date required' } });
  assert.deepEqual(err({ date: '' }), { status: 400, body: { error: 'date required' } });
});

test('parse: custom_steps shape', () => {
  assert.equal(err({ date: DATE, custom_steps: 'x' }).body.detail, 'custom_steps must be an array');
  assert.equal(err({ date: DATE, custom_steps: [] }).body.detail, 'custom_steps is empty');
  assert.equal(err({ date: DATE, custom_steps: Array.from({ length: MAX_CUSTOM_STEPS + 1 }, () => ({ exercise_id: 'a' })) }).body.error, 'invalid_custom_steps');
  assert.equal(err({ date: DATE, custom_steps: [null] }).body.detail, 'custom_steps[0] is not an object');
  assert.equal(err({ date: DATE, custom_steps: [{ exercise_id: ' ' }] }).body.detail, 'custom_steps[0].exercise_id is missing');
});

test('parse: custom_steps does not combine with adapt or pins', () => {
  for (const extra of [{ adapt_mode: true }, { pinned_exercise_ids: ['a'] }]) {
    const r = err({ date: DATE, custom_steps: [{ exercise_id: 'a' }], ...extra });
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'invalid_custom_steps');
  }
});

test('parse: custom_steps + bonus_session is "als extra", not an engine bonus', () => {
  const { request } = parsePlanRequest({ date: DATE, custom_steps: [{ exercise_id: 'a' }], bonus_session: true });
  assert.equal(request.isCustom, true);
  assert.equal(request.isExtra, true);
  // The extra loads the same history as a replacing session, so the advisory pass
  // sees what W4.1's sees — the engine's bonus flag (which skips history) is off.
  assert.equal(request.bonus_session, false);
  const replacing = parsePlanRequest({ date: DATE, custom_steps: [{ exercise_id: 'a' }] }).request;
  assert.equal(replacing.isExtra, false);
  assert.equal(parsePlanRequest({ date: DATE, bonus_session: true }).request.isExtra, false, 'an engine bonus is not an own extra');
});

test('C-G4: a free user with today\'s plan may run an own session either way — extra or replacing', () => {
  for (const row of [ROWS.engine, ROWS.adapt, ROWS.user]) {
    const extra = decideExistingPlan({ existingRow: row, body: { date: DATE, ...EXEMPTIONS.custom_extra }, isPro: false });
    assert.deepEqual([extra.decision, extra.reason], ['regenerate', 'custom_extra'], `extra over ${row.generated_by}`);
    const repl = decideExistingPlan({ existingRow: row, body: { date: DATE, ...EXEMPTIONS.custom_steps }, isPro: false });
    assert.deepEqual([repl.decision, repl.reason], ['regenerate', 'custom_steps'], `replacing over ${row.generated_by}`);
  }
  assert.equal(needsExistingPlan({ date: DATE, ...EXEMPTIONS.custom_extra }), false, 'an extra never reads (or writes) today\'s row');
});

test('parse: pins shape', () => {
  assert.equal(err({ date: DATE, pinned_exercise_ids: [] }).body.error, 'invalid_pins');
  assert.equal(err({ date: DATE, pinned_exercise_ids: Array(MAX_PINS + 1).fill('a') }).body.error, 'invalid_pins');
  assert.equal(err({ date: DATE, pinned_exercise_ids: ['a', ''] }).body.detail, 'pinned_exercise_ids contains an empty id');
  assert.equal(err({ date: DATE, pinned_exercise_ids: 'a' }).body.detail, 'pinned_exercise_ids must be an array');
});

test('parse: the normalised request', () => {
  const { request } = parsePlanRequest({
    date: DATE, pinned_exercise_ids: [7, 'b'], force_assessment: 1, safety_ack: 'true', include_assessment: true,
    replace_user_plan: true, bonus_session: 'yes',
  });
  assert.equal(request.date, DATE);
  assert.equal(request.hasPins, true);
  assert.deepEqual(request.pinnedIds, ['7', 'b']);
  assert.equal(request.forceAssessment, true);   // truthy, as the planner always read it
  assert.equal(request.safetyAck, false);        // only literal true acknowledges a blocking note
  assert.equal(request.includeAssessment, true);
  assert.equal(request.replaceUserPlan, true);
  assert.equal(request.bonus_session, 'yes');    // raw, as runPlanner receives it
  assert.equal(request.isCustom, false);
  assert.deepEqual(parsePlanRequest({ date: DATE }).request.pinnedIds, []);
});

test('unknownPinsError: pins must exist in the user\'s library', () => {
  const lib = [{ id: 'a' }, { id: 7 }];
  const ok = parsePlanRequest({ date: DATE, pinned_exercise_ids: ['a', 7] }).request;
  assert.equal(unknownPinsError(ok, lib), null);
  const bad = parsePlanRequest({ date: DATE, pinned_exercise_ids: ['a', 'zz', 'zz'] }).request;
  assert.deepEqual(unknownPinsError(bad, lib), { status: 400, body: { ok: false, error: 'unknown_exercise', unknown_exercise_ids: ['zz'] } });
  assert.equal(unknownPinsError(parsePlanRequest({ date: DATE }).request, lib), null);
});

test('limits are the ones the builder mirrors', () => {
  assert.deepEqual(CUSTOM_STEP_LIMITS, { sets: [1, 10], target_reps: [1, 100], target_duration_sec: [5, 7200], rest_sec: [0, 600] });
});
