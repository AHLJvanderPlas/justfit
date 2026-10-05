// Need C — "log something done elsewhere" (PLANNER_AUDIT_2026-10 §5.2).
//
// SessionBuilder's log mode records what was DONE, not a target. This module turns
// the builder's rows into the exact `steps` payload WorkoutView's stepsActualRef
// sends, so execution.js, progression and history treat a logged session the same
// as one trained in the app. Pure: scripts/execution-requests.mjs drives it too.

export const LOG_WINDOW_DAYS = 6;        // mirrors functions/api/execution.js
export const LOG_MAX_SETS = 20;
const LIMITS = { reps: [1, 500], sec: [1, 7200] };

// "3, 3, 3, 4, 4" → [3,3,3,4,4]. Also accepts "3x3, 2x4" (sets × value), the way
// people write a workout down. Returns { values } or { error }.
export function parseSetList(text, unit = "reps") {
  const [lo, hi] = LIMITS[unit] ?? LIMITS.reps;
  const tokens = String(text ?? "").split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
  if (!tokens.length) return { error: "empty" };
  const values = [];
  for (const tok of tokens) {
    const m = /^(\d{1,2})[x×*](\d{1,4})$/i.exec(tok);
    const vals = m ? Array(Number(m[1])).fill(Number(m[2])) : /^\d{1,4}$/.test(tok) ? [Number(tok)] : null;
    if (!vals || !vals.length || vals.some((v) => v < lo || v > hi)) return { error: "invalid" };
    values.push(...vals);
  }
  if (values.length > LOG_MAX_SETS) return { error: "too_many" };
  return { values };
}

// One logged step, in stepsActualRef's shape. `prescribed` is {} — nothing was
// prescribed; the record is what happened.
export function loggedStep({ exerciseId, setsText, unit = "reps", restSec = 0, skipped = false }) {
  const values = skipped ? [] : (parseSetList(setsText, unit).values ?? []);
  const rest = Math.max(0, Math.round(Number(restSec) || 0));
  return {
    exercise_id: exerciseId,
    prescribed: {},
    actual: {
      sets_completed: values.length,
      reps_per_set: values,
      rest_taken_seconds: values.length > 1 && rest > 0 ? Array(values.length - 1).fill(rest) : [],
      target_adjusted: false,
      target_original: null,
      target_final: null,
      adjustment_direction: null,
      exercise_substituted: false,
      original_exercise_id: null,
      substitute_exercise_id: null,
      skipped: !!skipped,
      completed_at_ms: null,
    },
  };
}

// "ma 4 okt" / "Mon 4 Oct" — the day a session is logged for, read as a UTC date.
export function logDayLabel(date, lang = "nl") {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString(lang === "en" ? "en-GB" : "nl-NL",
    { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

// The days a session may be logged for: today … today−6 (UTC — the same clock as
// App's `today` and the server's window).
export function inLogWindow(date, today) {
  const from = new Date(Date.parse(`${today}T12:00:00Z`) - LOG_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  return date >= from && date <= today;
}
