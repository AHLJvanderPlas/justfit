// POST /api/plan — request parsing and the existing-plan decision.
//
// Extracted from plan.js onRequestPost (F4). Both functions are pure: no
// database, no Response objects. The handler loads, asks, and answers; the
// rules live here so each can be tested on its own (scripts/planRequest.test.mjs)
// and the request harness (scripts/plan-override-requests.mjs) proves the
// wiring end to end.

// ─── Custom-step and pin shape (W4.1 / W4.4) ───────────────────────────────
// Also imported by my-sessions.js: a template that saves there is a template
// that installs here.

export const CUSTOM_STEP_LIMITS = {
  sets:                [1, 10],
  target_reps:         [1, 100],
  target_duration_sec: [5, 7200],
  rest_sec:            [0, 600],
};
export const MAX_CUSTOM_STEPS = 20;
export const MAX_PINS = 3;

/** Shape-only check, cheap enough to run before any database work. */
export function customStepsShapeError(raw) {
  if (!Array.isArray(raw)) return 'custom_steps must be an array';
  if (raw.length < 1) return 'custom_steps is empty';
  if (raw.length > MAX_CUSTOM_STEPS) return `custom_steps has more than ${MAX_CUSTOM_STEPS} steps`;
  for (const [i, st] of raw.entries()) {
    if (!st || typeof st !== 'object') return `custom_steps[${i}] is not an object`;
    const id = st.exercise_id;
    if ((typeof id !== 'string' && typeof id !== 'number') || String(id).trim() === '') {
      return `custom_steps[${i}].exercise_id is missing`;
    }
  }
  return null;
}

/** Shape-only check for W4.4 pins. */
export function pinnedIdsShapeError(raw) {
  if (!Array.isArray(raw)) return 'pinned_exercise_ids must be an array';
  if (raw.length < 1 || raw.length > MAX_PINS) return `pinned_exercise_ids takes 1–${MAX_PINS} ids`;
  if (raw.some(id => (typeof id !== 'string' && typeof id !== 'number') || String(id).trim() === '')) {
    return 'pinned_exercise_ids contains an empty id';
  }
  return null;
}

// "Present" means not undefined and not null — an empty array is present and
// is rejected by the shape check, it is not silently treated as absent.
const _present = (v) => v !== undefined && v !== null;

// ─── parsePlanRequest ───────────────────────────────────────────────────────
/**
 * Everything that answers 400 before the database is touched.
 *
 * Returns { request } — the body's fields plus derived flags — or
 * { status: 400, body } with the exact error body the endpoint sends.
 * Raw fields keep their raw values (runPlanner receives `bonus_session` as
 * sent); the derived flags carry the comparisons the handler used to inline.
 */
export function parsePlanRequest(body) {
  const {
    date, checkin, completed_exercise_ids, user_profile, cycle_context, bonus_session,
    coach_sim, adapt_mode, base_plan, force_assessment,
    custom_steps, safety_ack, include_assessment, pinned_exercise_ids, session_name,
    replace_user_plan,
  } = body ?? {};
  const isCustom = _present(custom_steps);
  const hasPins  = _present(pinned_exercise_ids);

  if (!date) {
    return { status: 400, body: { error: 'date required' } };
  }
  // A user-authored session is today's plan, never an ephemeral bonus or a
  // free-tier adapt, and pinning is an engine request — the three do not combine.
  if (isCustom) {
    const err = customStepsShapeError(custom_steps);
    if (err) return { status: 400, body: { ok: false, error: 'invalid_custom_steps', detail: err } };
    if (bonus_session || adapt_mode || hasPins) {
      return { status: 400, body: { ok: false, error: 'invalid_custom_steps', detail: 'custom_steps cannot be combined with bonus_session, adapt_mode or pinned_exercise_ids' } };
    }
  }
  if (hasPins) {
    const err = pinnedIdsShapeError(pinned_exercise_ids);
    if (err) return { status: 400, body: { ok: false, error: 'invalid_pins', detail: err } };
  }

  return {
    request: {
      date, checkin, completed_exercise_ids, user_profile, cycle_context, bonus_session,
      coach_sim, adapt_mode, base_plan, custom_steps, session_name,
      isCustom,
      hasPins,
      pinnedIds:         hasPins ? pinned_exercise_ids.map(String) : [],
      forceAssessment:   !!force_assessment,
      safetyAck:         safety_ack === true,
      includeAssessment: include_assessment === true,
      replaceUserPlan:   replace_user_plan === true,
    },
  };
}

/**
 * W4.4 — every pin must be a real, active exercise for this user. Unknown ids
 * are a malformed request, not something to drop quietly. Needs the library,
 * so it runs after the load; returns null or { status: 400, body }.
 */
export function unknownPinsError(request, exercises) {
  if (!request.hasPins) return null;
  const known = new Set(exercises.map(e => String(e.id)));
  const unknownPins = request.pinnedIds.filter(id => !known.has(id));
  if (!unknownPins.length) return null;
  return { status: 400, body: { ok: false, error: 'unknown_exercise', unknown_exercise_ids: [...new Set(unknownPins)] } };
}

// ─── decideExistingPlan ─────────────────────────────────────────────────────

/**
 * W4.1 — PROTECT THE OVERRIDE. An automatic regeneration (app open, check-in,
 * retry) must never replace a session the user wrote. Replacing it is an
 * explicit action that carries `replace_user_plan: true`.
 */
export function preservesUserPlan(existingRow, body) {
  return existingRow?.generated_by === 'user' && body?.replace_user_plan !== true;
}

/**
 * Whether today's stored plan can change the answer. A user-authored session
 * replaces whatever is there, and a bonus session is ephemeral and never
 * touches day_plans, so neither needs the read.
 */
export function needsExistingPlan(body) {
  return !_present(body?.custom_steps) && !body?.bonus_session;
}

/**
 * What to do with today's stored plan, as one decision:
 *
 *   preserve    the row is user-authored and the request did not ask to replace
 *               it (W4.1). Wins over every exemption below: a forced assessment,
 *               a pin request or a check-in adapt does not silently overwrite
 *               what the user wrote.
 *   adapt       adapt_mode against a stored plan: scale THAT session to today's
 *               check-in. `plan` is the stored session, which the handler adapts —
 *               never the client's base_plan, so the exemption cannot be used to
 *               store a session the engine did not build for this user.
 *   capped      C-G4 — a free user already has today's plan; re-rolling the
 *               engine is a Pro feature.
 *   regenerate  everything else, with the reason.
 *
 * C-G4 exemptions — each is not a re-roll and cannot be used to farm sessions:
 *   custom_steps       writing your own session generates nothing
 *   pinned_exercise_ids telling the coach what you need (decided 2026-10-04)
 *   force_assessment   measuring yourself is the input every DCP number needs;
 *                      charging for it would aim the bias at a stale baseline
 *   adapt_mode         adapting today's plan to a check-in changes the volume and
 *                      intensity of the SAME session (adaptExistingPlan in plan.js
 *                      keeps the exercise selection); without it a free user's
 *                      check-in did nothing once a plan existed (F8, 2026-10-04)
 *   bonus_session      ephemeral, never stored
 *
 * A stored plan_json that does not parse is never returned: preserve falls
 * through to the cap, and the cap falls through to regenerate — exactly the
 * order the handler had inline.
 *
 * Returns { decision, reason, plan? } — `plan` is the response's plan object
 * for preserve (carrying the row id) and capped (the row id and capped: true), and
 * the stored session to scale for adapt.
 */
export function decideExistingPlan({ existingRow, body, isPro }) {
  if (!existingRow) return { decision: 'regenerate', reason: 'no_existing_plan' };
  if (_present(body?.custom_steps)) return { decision: 'regenerate', reason: 'custom_steps' };
  if (body?.bonus_session) return { decision: 'regenerate', reason: 'bonus_session' };

  const parsed = (() => { try { return JSON.parse(existingRow.plan_json); } catch { return undefined; } })();

  if (preservesUserPlan(existingRow, body) && parsed !== undefined) {
    return { decision: 'preserve', reason: 'user_plan', plan: { id: existingRow.id, ...parsed } };
  }

  if (body?.adapt_mode && parsed !== undefined) {
    // Older adapt rows stored the client's base_plan verbatim, response keys included.
    const { id: _id, capped: _capped, ...stored } = parsed ?? {};
    return { decision: 'adapt', reason: 'adapt_mode', plan: stored };
  }

  if (!isPro && !body?.force_assessment && !_present(body?.pinned_exercise_ids)) {
    // The row id, last: the client saves today's workout against plan.id, and a
    // capped day without it stored the execution with no day_plan_id (F8).
    if (parsed !== undefined) return { decision: 'capped', reason: 'free_daily_cap', plan: { ...parsed, id: existingRow.id, capped: true } };
    return { decision: 'regenerate', reason: 'malformed_existing_plan' };
  }

  const reason = isPro ? 'pro'
    : body?.force_assessment ? 'force_assessment'
    : 'pinned_exercise_ids';
  return { decision: 'regenerate', reason };
}
