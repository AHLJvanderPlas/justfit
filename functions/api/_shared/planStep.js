// ── Plan step shape ───────────────────────────────────────────────────────────
//
// ONE builder for the step a client renders and an execution records, so an
// engine step, an appended step (R574 march, R525 mobility, R534/R541 pelvic
// floor, the cycling coach) and a user-authored step (W4.1) cannot drift apart:
// WorkoutView, the load contract (C-F6), the muscle map and progression all read
// these fields, and progression routes on `exercise_id` alone.
//
// v1.5 — every step carries both names. `name` stays the English library name
// (records, traces and the rule engine read it); `name_nl` is the Dutch label the
// client shows through exerciseName(). Null when the row has none (gym-private
// rows, the synthetic cycling step) — the client then falls back to `name`.
//
// scripts/smoke.sh fails if plan.js spells a step object literal itself again.

const _gifUrl = (ex) => (ex.media_json ? JSON.parse(ex.media_json) : {}).gif_url ?? null;

/**
 * The fields every step carries, from the library row; `overrides` sets the
 * prescription and anything a call site adds (coaching_note, intervals_json,
 * tss_planned, military_march_kg, …) and may replace any base field.
 */
export function makePlanStep(ex, overrides = {}) {
  return {
    exercise_id:   ex.id,
    exercise_slug: ex.slug,
    name:          ex.name,
    name_nl:       ex.name_nl ?? null,
    category:      ex.category,
    tags_json:     ex.tags_json ?? '[]',
    equipment_required_json: ex.equipment_required_json ?? '["none"]',
    target_reps:         undefined,
    target_duration_sec: undefined,
    sets:                1,
    rest_sec:            0,
    instructions_json:   ex.instructions_json ?? null,
    alternatives_json:   ex.alternatives_json ?? null,
    gif_url:             _gifUrl(ex),
    ...overrides,
  };
}

function _loadContract(ex) {
  // C-F6 — load contract. supports_weight drives whether the client shows a
  // weight field at all; load_type drives how the number is displayed and
  // rounded. Absent on bodyweight and timed work, which is the common case.
  let m = {};
  try { m = ex.metrics_json ? JSON.parse(ex.metrics_json) : {}; } catch { /* ignore */ }
  if (!(m.supports ?? []).includes('weight')) return {};
  return {
    supports_weight: true,
    load_type: m.load_type ?? null,
    target_weight_kg: ex.last_weight_kg ?? null,
    last_performance: ex.last_performance ?? null,
  };
}

/**
 * A prescribed library step — the engine's main selection, a custom step, an
 * assessment set: the base step plus muscles, coaching note, load contract and
 * the gym's branding.
 */
export function prescribedStep(ex, prescription) {
  return makePlanStep(ex, {
    target_reps:          prescription.target_reps,
    target_duration_sec:  prescription.target_duration_sec,
    sets:                 prescription.sets,
    rest_sec:             prescription.rest_sec,
    ...(prescription.max_effort ? { max_effort: true, measures: prescription.measures, measure_window_sec: prescription.measure_window_sec } : {}),
    // Carried so R592 can avoid pairing two exercises that share a primary muscle,
    // and so the in-session muscle map uses real data instead of musclesFor()'s
    // slug-pattern fallback.
    primary_muscles_json:   ex.primary_muscles_json ?? null,
    secondary_muscles_json: ex.secondary_muscles_json ?? null,
    coaching_note:        prescription.coaching_note ?? null,
    ..._loadContract(ex),
    ...(ex.trainer_logo_url ? { trainer_logo_url: ex.trainer_logo_url, trainer_logo_bg: ex.trainer_logo_bg ?? '#0a0a0a' } : {}),
  });
}
