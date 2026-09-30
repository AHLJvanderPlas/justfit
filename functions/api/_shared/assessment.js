/**
 * Fitness assessment — battery definition, scoring, and progression mapping.
 *
 * user_progression is inferred from completed sessions and decays toward a
 * per-axis `baseline` that has always been hardcoded to 0 and written by nothing.
 * This module measures four axes and writes that baseline, so the existing radar
 * and planner calibrate instead of guessing. It adds no second score.
 *
 * Named "assessment" throughout: daily_checkins already owns "check-in".
 */

// ── Axes ──────────────────────────────────────────────────────────────────────
// Matches AXES in progression.js. `pull` and `mobility` are deliberately absent:
// there is no honest bodyweight pull test without a bar or table, and self-reported
// range of motion is self-report rather than measurement. They stay inferred and
// are rendered as "not measured" rather than given an invented number.

export const MEASURED_AXES = ['push', 'legs', 'core', 'conditioning'];
export const UNMEASURED_AXES = ['pull', 'mobility'];

/** Fraction of measured capability retained through a layoff — the decay floor. */
export const BASELINE_RETENTION = 0.75;

/** Default weeks between assessments. Matches ftp_test_interval_weeks. */
export const DEFAULT_INTERVAL_WEEKS = 6;

// ── Push-up variants ──────────────────────────────────────────────────────────
// Raw reps are normalised to full-push-up equivalents before scoring, so a user
// who progresses from knee to full push-ups sees a genuine jump rather than an
// artefact of changing exercise.

export const PUSH_VARIANTS = {
  'wall-push-up': { label: 'Wall push-up',  factor: 0.35 },
  'knee-push-up': { label: 'Knee push-up',  factor: 0.60 },
  'push-up':      { label: 'Full push-up',  factor: 1.00 },
};

export function defaultPushVariant(experienceLevel) {
  if (experienceLevel === 'advanced')     return 'push-up';
  if (experienceLevel === 'intermediate') return 'knee-push-up';
  return 'wall-push-up';
}

// ── The battery ───────────────────────────────────────────────────────────────
// Every exercise here already exists in the library with metrics_json.supports
// declared, and needs no equipment.

export const TESTS = {
  push_max: {
    id: 'push_max',
    axis: 'push',
    name: 'Max push-ups',
    slug: 'push-up',            // overridden by the chosen variant
    metric: 'reps',
    mode: 'count',              // count up, stop when you stop
    timeCapSec: 120,
    repCap: 60,
    hasVariant: true,
    instruction: 'As many as you can with good form. Stop when form breaks — not when it hurts.',
    weights: { power: 1.0, endurance: 0.6 },
  },
  legs_60s: {
    id: 'legs_60s',
    axis: 'legs',
    name: 'Squats in 60 seconds',
    slug: 'squat',
    metric: 'reps',
    mode: 'count',
    timeCapSec: 60,
    repCap: 80,
    fixedDuration: true,        // the clock runs the full 60s
    instruction: 'As many controlled squats as you can in one minute. Thighs to parallel.',
    weights: { power: 1.0, endurance: 0.8 },
  },
  core_hold: {
    id: 'core_hold',
    axis: 'core',
    name: 'Plank hold',
    slug: 'plank',
    metric: 'seconds',
    mode: 'hold',               // clock counts up, user stops it
    timeCapSec: 240,
    instruction: 'Hold until your hips drop. Straight line from heels to head.',
    weights: { power: 0.7, endurance: 1.0 },
  },
  situp_max: {
    id: 'situp_max',
    axis: 'core',
    name: 'Sit-ups in 2 minutes',
    slug: 'sit-up',
    metric: 'reps',
    mode: 'count',
    timeCapSec: 120,
    repCap: 120,
    // The clock runs the full two minutes. Stopping early is a valid DCP result
    // (you simply score what you did), so this is fixedDuration like the squat
    // test rather than an open-ended hold.
    fixedDuration: true,
    instruction: 'As many as you can in two minutes. Torso to vertical, shoulder blades down each rep. Pace it — most people fail this by sprinting the first thirty seconds.',
    weights: { power: 0.6, endurance: 1.0 },
  },
  cond_3min: {
    id: 'cond_3min',
    axis: 'conditioning',
    name: 'March in place — 3 minutes',
    slug: 'march-in-place',
    metric: 'reps',
    mode: 'count',
    timeCapSec: 180,
    repCap: 400,
    fixedDuration: true,
    instruction: 'Knees to hip height. Count every time your right knee comes up.',
    weights: { power: 0.5, endurance: 1.0 },
  },
};

// ── Presets ───────────────────────────────────────────────────────────────────
// The original five options mixed two taxonomies: all-round/upper/lower select
// *axes*, stamina/power select *mode*. Rather than ship a radio group with silent
// gaps (no "upper-body power"), each preset is an explicit tests × emphasis pair.
// A two-dimensional picker is deferred to v2.

export const PRESETS = {
  all_round: { id: 'all_round', label: 'All-round',  tests: ['push_max', 'legs_60s', 'core_hold', 'cond_3min'], emphasis: 'both',      minutes: 12 },
  upper:     { id: 'upper',     label: 'Upper body', tests: ['push_max', 'core_hold'],                          emphasis: 'both',      minutes: 7  },
  lower:     { id: 'lower',     label: 'Lower body', tests: ['legs_60s', 'core_hold'],                          emphasis: 'both',      minutes: 6  },
  stamina:   { id: 'stamina',   label: 'Stamina',    tests: ['cond_3min', 'legs_60s', 'core_hold'],             emphasis: 'endurance', minutes: 9  },
  power:     { id: 'power',     label: 'Power',      tests: ['push_max', 'legs_60s', 'core_hold'],              emphasis: 'power',     minutes: 7  },
  // C-F13 — the two DCP movements in test format. The 12-minute run is not here:
  // it needs a measured route and is logged separately, and every keuring cluster
  // already clears the DCP run distance anyway.
  dcp:       { id: 'dcp',       label: 'DCP baseline', tests: ['push_max', 'situp_max'],                        emphasis: 'both',      minutes: 8  },
};

export function presetList() {
  return Object.values(PRESETS).map((p) => ({
    id: p.id,
    label: p.label,
    minutes: p.minutes,
    emphasis: p.emphasis,
    tests: p.tests.map((t) => ({ id: t, name: TESTS[t].name, axis: TESTS[t].axis })),
    // Surfaced so the UI can be honest about what this preset does not cover.
    unmeasured: p.id === 'upper' ? ['pull'] : [],
  }));
}

// ── Reference curves ──────────────────────────────────────────────────────────
// Piecewise-linear raw → 0-100. Coarse and conservative by design: NOT a clinical
// norm, not age- or sex-adjusted. They exist so a first assessment yields a usable
// shape. The honest signal is the delta between a user's own assessments, which
// needs no norm at all. Every threshold is visible here and tunable in one place.

export const REFERENCE_CURVES = {
  // Normalised to full-push-up equivalents.
  push_max:  [[0, 0], [5, 20], [10, 35], [20, 55], [30, 70], [45, 85], [60, 100]],
  legs_60s:  [[0, 0], [10, 20], [20, 35], [30, 55], [40, 70], [50, 85], [60, 100]],
  core_hold: [[0, 0], [20, 20], [45, 35], [75, 55], [120, 70], [180, 85], [240, 100]],
  cond_3min: [[0, 0], [60, 20], [100, 35], [140, 55], [180, 70], [220, 85], [260, 100]],
};

/** Linear interpolation across a curve, clamped at both ends. */
export function scoreFromCurve(testId, raw) {
  const curve = REFERENCE_CURVES[testId];
  if (!curve || !Number.isFinite(raw) || raw < 0) return 0;
  if (raw <= curve[0][0]) return curve[0][1];
  const last = curve[curve.length - 1];
  if (raw >= last[0]) return last[1];
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1];
    const [x1, y1] = curve[i];
    if (raw <= x1) {
      const t = (raw - x0) / (x1 - x0);
      return Math.round(y0 + t * (y1 - y0));
    }
  }
  return last[1];
}

/** Normalise a raw value for scoring (push-up variants only). */
export function normaliseRaw(testId, raw, variant) {
  if (testId !== 'push_max') return raw;
  const v = PUSH_VARIANTS[variant] ?? PUSH_VARIANTS['push-up'];
  return raw * v.factor;
}

/**
 * Score one submitted result.
 * Returns { test_id, axis, raw, variant, normalised, score }.
 */
export function scoreResult(testId, raw, variant) {
  const test = TESTS[testId];
  if (!test) return null;
  const clamped = Math.max(0, Math.min(Number(raw) || 0,
    test.metric === 'seconds' ? test.timeCapSec : (test.repCap ?? 9999)));
  const normalised = normaliseRaw(testId, clamped, variant);
  return {
    test_id: testId,
    axis: test.axis,
    raw: clamped,
    variant: test.hasVariant ? (variant ?? 'push-up') : null,
    normalised: Math.round(normalised * 10) / 10,
    score: scoreFromCurve(testId, normalised),
  };
}

/** Validate and score a whole submission. Returns { results, scores, errors }. */
export function scoreSubmission(focus, rawResults) {
  const preset = PRESETS[focus];
  const errors = [];
  if (!preset) return { results: [], scores: {}, errors: ['Unknown focus'] };
  if (!Array.isArray(rawResults) || rawResults.length === 0) {
    return { results: [], scores: {}, errors: ['No results submitted'] };
  }

  const allowed = new Set(preset.tests);
  const results = [];
  for (const r of rawResults) {
    if (!allowed.has(r?.test_id)) { errors.push(`Test ${r?.test_id} is not part of ${focus}`); continue; }
    if (r.raw == null || !Number.isFinite(Number(r.raw))) { errors.push(`Missing value for ${r.test_id}`); continue; }
    const scored = scoreResult(r.test_id, r.raw, r.variant);
    if (scored) results.push(scored);
  }

  const scores = {};
  for (const r of results) scores[r.axis] = r.score;
  return { results, scores, errors };
}

// ── Writing into progression ──────────────────────────────────────────────────

/**
 * Fold measured scores into an existing user_progression scores object.
 *
 * - power/endurance rise to max(current, score × weight): a measurement supersedes
 *   inference only when it is higher, so one bad day never deletes earned progress.
 * - baseline is set to score × BASELINE_RETENTION — what you retain through a
 *   layoff. This is the value that stops decay draining to zero.
 * - Unmeasured axes are left untouched.
 *
 * Mutates nothing; returns a new object.
 */
export function applyToProgression(scores, results, nowMs) {
  const next = JSON.parse(JSON.stringify(scores ?? {}));

  for (const r of results) {
    const test = TESTS[r.test_id];
    const axis = next[r.axis];
    if (!test || !axis) continue;

    if (axis.mobility !== undefined) continue; // mobility axis is never measured

    const power = Math.round(r.score * (test.weights.power ?? 0));
    const endurance = Math.round(r.score * (test.weights.endurance ?? 0));

    if (power > (axis.power ?? 0)) {
      axis.power = power;
      axis.last_power_stimulus_at_ms = nowMs;
    }
    if (endurance > (axis.endurance ?? 0)) {
      axis.endurance = endurance;
      axis.last_endurance_stimulus_at_ms = nowMs;
    }

    // The baseline always reflects the most recent measurement, up or down: it is
    // a statement about what you can currently do, not a high-water mark.
    axis.baseline = Math.round(r.score * BASELINE_RETENTION);

    // Decay clamps at baseline, so a raised baseline must lift current scores too.
    if ((axis.power ?? 0) < axis.baseline) axis.power = axis.baseline;
    if ((axis.endurance ?? 0) < axis.baseline) axis.endurance = axis.baseline;
  }

  return next;
}

/**
 * Default progression scores for a user who has completed no sessions.
 *
 * Mirrors progBuildDefaultScores() in execution.js and buildDefaultScores() in
 * progression.js. A third copy is duplication, but the other two are private to
 * their modules; `assessment.test.js` asserts this shape stays in step with them.
 *
 * Needed because cold start is the headline case for an assessment: a new user
 * measures precisely to get a starting shape, and without a row to fold into,
 * the baselines would be computed and then discarded.
 */
export function buildDefaultScores() {
  const axis = () => ({
    power: 0, endurance: 0, baseline: 0,
    last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null,
  });
  return {
    push: axis(), pull: axis(), legs: axis(), core: axis(), conditioning: axis(),
    mobility: { mobility: 0, baseline: 0, last_mobility_stimulus_at_ms: null },
  };
}

// ── Safety gate ───────────────────────────────────────────────────────────────
// Max-effort testing is a safety event. Principle 3 outranks measurement, so these
// are refusals, not warnings.

export const BLOCK_REASONS = {
  pregnant:   'Max-effort testing is not appropriate during pregnancy. Your plan keeps adapting without it.',
  postnatal:  'Max-effort testing is not appropriate while you are rebuilding postnatally.',
  pain:       'You reported pain today. Test another day — this is not urgent.',
  recovery:   'You set today as a recovery day. Testing would undo the point of it.',
  low_sleep:  'On under 5 hours of sleep a test measures your night, not your fitness.',
};

/**
 * @param {object|null} cycle  row from cycle_profile
 * @param {object|null} checkin row from daily_checkins for today
 * @returns {{reason: string, message: string}|null}
 */
export function assessmentBlock(cycle, checkin) {
  const mode = cycle?.mode;
  if (mode === 'pregnant')  return { reason: 'pregnant',  message: BLOCK_REASONS.pregnant };
  if (mode === 'postnatal') return { reason: 'postnatal', message: BLOCK_REASONS.postnatal };

  if (checkin) {
    let c = {};
    try { c = JSON.parse(checkin.checkin_json ?? '{}'); } catch { /* treat as empty */ }
    if ((c.pain_level ?? 0) >= 2)  return { reason: 'pain',      message: BLOCK_REASONS.pain };
    if (c.recovery_mode)           return { reason: 'recovery',  message: BLOCK_REASONS.recovery };
    if ((checkin.sleep_hours ?? 99) <= 5) return { reason: 'low_sleep', message: BLOCK_REASONS.low_sleep };
  }
  return null;
}

// ── Insights ──────────────────────────────────────────────────────────────────

export const AXIS_LABELS = {
  push: 'Push', pull: 'Pull', legs: 'Legs',
  core: 'Core', conditioning: 'Conditioning', mobility: 'Mobility',
};

/** Per-axis change against the previous assessment, plus a one-line read. */
export function buildInsights(results, previousScores) {
  const deltas = {};
  for (const r of results) {
    const prev = previousScores?.[r.axis];
    deltas[r.axis] = prev == null ? null : r.score - prev;
  }

  const sorted = [...results].sort((a, b) => b.score - a.score);
  const strongest = sorted[0] ?? null;
  const weakest   = sorted[sorted.length - 1] ?? null;

  let sentence;
  const changed = Object.entries(deltas).filter(([, d]) => d != null);
  if (changed.length === 0) {
    sentence = 'First measurement recorded — this is your reference point.';
  } else {
    const up = changed.filter(([, d]) => d > 0).length;
    const down = changed.filter(([, d]) => d < 0).length;
    if (up && !down)      sentence = 'Up across the board since your last assessment.';
    else if (down && !up) sentence = 'Down since last time — worth a lighter week before pushing again.';
    else if (up >= down)  sentence = 'Mixed, trending up. Your weakest axis is where the plan will bias.';
    else                  sentence = 'Mixed, trending down. Consistency matters more than intensity here.';
  }

  return {
    deltas,
    strongest: strongest ? { axis: strongest.axis, label: AXIS_LABELS[strongest.axis], score: strongest.score } : null,
    weakest:   weakest   ? { axis: weakest.axis,   label: AXIS_LABELS[weakest.axis],   score: weakest.score   } : null,
    sentence,
    unmeasured: UNMEASURED_AXES.map((a) => ({ axis: a, label: AXIS_LABELS[a] })),
  };
}
