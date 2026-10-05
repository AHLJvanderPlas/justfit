// Need C — "log something done elsewhere" (PLANNER_AUDIT_2026-10 §5.2).
//
// LogSessionSheet records what was DONE, not a target. This module turns the
// sheet's set-group rows into the exact `steps` payload WorkoutView's
// stepsActualRef sends, so execution.js, progression and history treat a logged
// session the same as one trained in the app. Pure: scripts/execution-requests.mjs
// and scripts/logSession.test.mjs drive it too.

export const LOG_WINDOW_DAYS = 6;        // mirrors functions/api/execution.js
export const LOG_MAX_SETS = 20;
export const LOG_MAX_REST = 600;
const LIMITS = { reps: [1, 500], sec: [1, 7200] };

// "3, 3, 3, 4, 4" → [3,3,3,4,4]. Also accepts "3x3, 2x4" (sets × value), the way
// people write a workout down. Returns { values } or { error }.
export function parseSetList(text, unit = "reps") {
  const [lo, hi] = LIMITS[unit] ?? LIMITS.reps;
  const tokens = String(text ?? "").replace(/(\d)\s*([x×*])\s*(\d)/gi, "$1$2$3")
    .split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
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

// ── Set groups ──────────────────────────────────────────────────────────────
// The sheet records an exercise as SET-GROUP rows: `3 × 3 @ 60 s` is three sets of
// 3 with 60 s rest after each. A group is { sets, reps | sec | value, rest }.
// Expansion rules — one place, so the sheet and the record agree:
//   • values — each group contributes `sets` copies of its value, in row order.
//   • rests  — the rest AFTER set i is the rest of the group set i belongs to; the
//              last set has none, so n sets give n − 1 rests. All zero → [] (no rest
//              recorded, as before).
//   • typed shorthand — a value that is not one plain number ("3x3, 2x4",
//              "10, 10, 8") is read by parseSetList and the row's own `sets` is
//              ignored: the shorthand already says how many. The row's rest applies.
// [{sets:3,reps:3,rest:60},{sets:2,reps:4,rest:60}] → [3,3,3,4,4] / [60,60,60,60].
const isInt = (v) => /^\d{1,4}$/.test(String(v ?? "").trim());

// Consecutive equal values → groups: [3,3,3,4,4] → [{sets:3,value:3},{sets:2,value:4}].
export function compressValues(values) {
  const out = [];
  for (const v of values ?? []) {
    const last = out[out.length - 1];
    if (last && last.value === v) last.sets += 1; else out.push({ sets: 1, value: v });
  }
  return out;
}

// One row as typed → { groups: [{ sets, value, rest }] } or { error }.
export function rowGroups(row, unit = "reps") {
  const [lo, hi] = LIMITS[unit] ?? LIMITS.reps;
  const restText = String(row?.rest ?? "").trim();
  if (restText !== "" && (!isInt(restText) || Number(restText) > LOG_MAX_REST)) return { error: "rest" };
  const rest = restText === "" ? 0 : Number(restText);
  const valueText = String(row?.reps ?? row?.sec ?? row?.value ?? "").trim();
  if (valueText === "") return { error: "empty" };
  if (isInt(valueText)) {
    const value = Number(valueText);
    if (value < lo || value > hi) return { error: "invalid" };
    if (!isInt(row?.sets) || Number(row.sets) < 1 || Number(row.sets) > LOG_MAX_SETS) return { error: "sets" };
    return { groups: [{ sets: Number(row.sets), value, rest }] };
  }
  const parsed = parseSetList(valueText, unit);
  if (!parsed.values) return { error: parsed.error };
  return { groups: compressValues(parsed.values).map((g) => ({ ...g, rest })) };
}

// Rows → { values, rests } in stepsActualRef terms, or { error }.
export function expandGroups(groups, unit = "reps") {
  const values = [];
  const restAfter = [];
  for (const g of groups ?? []) {
    const r = rowGroups(g, unit);
    if (r.error) return { error: r.error };
    for (const { sets, value, rest } of r.groups) {
      for (let i = 0; i < sets; i++) { values.push(value); restAfter.push(rest); }
    }
  }
  if (!values.length) return { error: "empty" };
  if (values.length > LOG_MAX_SETS) return { error: "too_many" };
  const rests = restAfter.slice(0, -1);
  return { values, rests: rests.some((r) => r > 0) ? rests : [] };
}

// One logged step, in stepsActualRef's shape. `prescribed` is {} — nothing was
// prescribed; the record is what happened. `groups` is the sheet's input;
// `setsText` + `restSec` (one rest for every set) is the original typed form and
// goes through the same expansion.
export function loggedStep({ exerciseId, groups, setsText, unit = "reps", restSec = 0, skipped = false }) {
  const src = groups ?? [{ value: setsText, rest: Math.max(0, Math.round(Number(restSec) || 0)) }];
  const x = skipped ? { values: [], rests: [] } : expandGroups(src, unit);
  const values = x.values ?? [];
  return {
    exercise_id: exerciseId,
    prescribed: {},
    actual: {
      sets_completed: values.length,
      reps_per_set: values,
      rest_taken_seconds: x.rests ?? [],
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

// The sheet's cards, in session order, → the steps payload. The order is the
// order performed; nothing re-sorts it.
export function buildLogSteps(cards) {
  return (cards ?? []).map((c) => loggedStep({ exerciseId: c.exerciseId, groups: c.groups, unit: c.unit, skipped: c.skipped }));
}

// A logged exercise as ONE record line: { sets: 5, values: "3/3/3/4/4", rest: "60" }.
// Equal consecutive rests collapse to one value ([60,60,60,90] → "60/90"); no rest
// recorded → rest null.
export function summarizeLogged(actual) {
  const reps = actual?.reps_per_set ?? [];
  const runs = compressValues(actual?.rest_taken_seconds ?? []).map((g) => g.value);
  return {
    sets: actual?.sets_completed ?? reps.length,
    values: reps.join("/"),
    rest: runs.some((r) => r > 0) ? runs.join("/") : null,
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
