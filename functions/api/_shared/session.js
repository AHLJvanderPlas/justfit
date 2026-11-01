// Session arithmetic shared by the planner (plan.js), saved trainings
// (my-sessions.js) and the client (planUtils.js, SessionBuilder.jsx).
//
// One definition each. The client used to mirror getDefaultRest and the server
// ported estimateMins; two copies of a formula drift silently (smoke guards that
// each is defined exactly once). Plain ESM, no imports: Pages Functions have no
// bundler and the client reaches this file through a relative path, like
// _shared/military.js.

// Rest duration for one step of a plan.
export function getDefaultRest(exercise, slotType) {
  const tags = JSON.parse(exercise?.tags_json || '[]');
  if (slotType === 'micro') return 20;
  if (tags.includes('pelvic_floor')) return 30;
  if (tags.includes('mobility')) return 20;
  if (tags.includes('run_warmup')) return 10;
  // Run intervals encode their walk-recovery duration in metrics_json
  const metrics = exercise?.metrics_json ? JSON.parse(exercise.metrics_json) : {};
  if (metrics.custom_rest_sec != null) return metrics.custom_rest_sec;
  if (tags.includes('cardio')) return 30;
  if (tags.includes('bodyweight')) return 45;
  return 60;
}

// Timed targets move in 5 s steps (UAT D6): volume scaling turned a 40 s hold into
// "2 × 32s", which reads as noise. 32 → 30, 23 → 25, 48 → 50; never below 5 s.
// Applied where the planner SCALES a duration — fixed protocol windows (the 2-min
// DCP set, the Cooper 12 min, name-declared minutes) are never passed through it.
export function roundTo5Sec(sec) {
  const n = Number(sec);
  if (!Number.isFinite(n) || n <= 0) return sec;
  return Math.max(5, Math.round(n / 5) * 5);
}

// Session time in seconds: work + rest per set, no rest after the very last set.
export function estimateSessionSec(steps) {
  return steps.reduce((s, step, i) => {
    const sets = step.sets ?? 3;
    const isLast = i === steps.length - 1;
    const active = step.target_duration_sec
      ? step.target_duration_sec * sets
      : (step.target_reps ?? 10) * sets * 4;
    const restPeriods = isLast ? Math.max(0, sets - 1) : sets;
    const rest = (step.rest_sec ?? 45) * restPeriods;
    return s + active + rest;
  }, 0);
}

// Estimate session length in minutes from a plan object — what the user reads.
// Rounded up to the next 5 minutes above 20.
export function estimateMins(p) {
  if (!p || p.slot_type === "rest") return null;
  const steps = p.steps ?? [];
  if (!steps.length) return p.slot_type === "micro" ? 12 : 20;
  const totalSec = estimateSessionSec(steps);
  const rawMin = Math.max(1, Math.ceil(totalSec / 60));
  return rawMin > 20 ? Math.ceil(rawMin / 5) * 5 : rawMin;
}
