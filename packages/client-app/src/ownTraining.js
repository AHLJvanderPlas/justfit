// ─── "Eigen training" — the decisions, without React (MANUAL_TRAINING_DESIGN.md) ──
//
// EigenTraining.jsx renders the chooser and the run-mode sheet; App.jsx starts
// and saves the session. Everything those two must agree on — which links the
// Today card shows, whether the run-mode sheet is skipped, which request body a
// mode produces, what the done card may offer — lives here so it is one rule,
// tested on its own (tests/ownTraining.test.js).

// §2 — "Lukt dit niet?" (regenerate / rest) only next to a coach plan that is
// still open. On a rest day, a finished day and a session the user wrote there
// is nothing to regenerate, so the line reads "Eigen training" alone. "Eigen
// training" itself is on every Today state.
export function ownLine({ plan, todayCompleted }) {
  const whyNot = !!plan && !todayCompleted && plan.slot_type !== "rest" && !plan.authored_by_user;
  return { own: true, whyNot };
}

// §4 — the run-mode choice. `skip` means the sheet is not shown and the session
// runs as an extra: there is nothing open to replace. Never `replace` by default.
export function runModeChoice({ plan, todayCompleted }) {
  const restDay = plan?.slot_type === "rest";
  if (todayCompleted || !plan) return { skip: true, defaultMode: "extra", restDay, replaceNeedsConfirm: false, planName: null };
  return {
    skip: false,
    defaultMode: "extra",
    restDay,
    // W4a: replacing a session the user wrote is confirmed, and says so.
    replaceNeedsConfirm: !!plan.authored_by_user,
    planName: restDay ? null : (plan.session_name ?? null),
  };
}

// The POST /api/plan body for an own session. Anything but an explicit
// `mode: "replace"` is an extra: acceptance 3 — a replacing session never runs
// without the explicit choice. Replacing the user's own session additionally
// needs `replaceConfirmed` (W4a's replace_user_plan confirmation).
export function ownSessionBody({ date, steps, name, mode, safetyAck = false, includeAssessment = false, checkin = null, userAuthored = false, replaceConfirmed = false }) {
  const replace = mode === "replace";
  if (replace && userAuthored && !replaceConfirmed) throw new Error("replace_needs_confirmation");
  return {
    date,
    session_name: name ?? undefined,
    custom_steps: (steps ?? []).map((s) => ({
      exercise_id: s.exercise_id, sets: s.sets, rest_sec: s.rest_sec,
      target_reps: s.target_reps ?? undefined, target_duration_sec: s.target_duration_sec ?? undefined,
    })),
    bonus_session: replace ? undefined : true,
    replace_user_plan: replace && userAuthored ? true : undefined,
    safety_ack: safetyAck || undefined,
    include_assessment: includeAssessment || undefined,
    // §5 — the advisory pass reads pain and recovery from the check-in. Today's
    // stored check-in goes along, so an extra on a pain day carries its note.
    checkin: checkin ?? undefined,
  };
}

// Today's stored check-in in the shape the planner reads (its toggles live in
// checkin_json; the guards read them top-level). null when it is not today's.
export function checkinForAdvice(row, today) {
  if (!row || row.date !== today) return null;
  let cj = row.checkin_json ?? {};
  if (typeof cj === "string") { try { cj = JSON.parse(cj); } catch { cj = {}; } }
  return { ...cj, energy: row.energy ?? undefined, stress: row.stress ?? undefined, sleep_hours: row.sleep_hours ?? undefined };
}

// §7 — what the execution records as its origin (migration 0122).
export const sourceRefFor = (template) => (template?.id ? `template:${template.id}` : null);

// A saved training as the builder rows it shares with custom_steps.
export const templateSteps = (template) => (template?.steps ?? []).map((s) => ({
  exercise_id: s.exercise_id, sets: s.sets, rest_sec: s.rest_sec,
  target_reps: s.target_reps ?? null, target_duration_sec: s.target_duration_sec ?? null,
}));

// What the done card shows after a session. `own_steps` (§6 "Bewaar als
// sjabloon") only for a session the user wrote that did not come from a saved
// training — and never the measurement sets the server may have appended.
export function completedInfo(plan, durationSec) {
  const info = { name: plan?.session_name, duration_sec: durationSec };
  if (plan?.authored_by_user && !plan?.source_ref) {
    info.own_steps = templateSteps({ steps: (plan.steps ?? []).filter((s) => !s.max_effort) });
  }
  return info;
}

// §6 — the extra of today, for the done card and the "Extra: {naam} ✓" line.
const extraKey = (today) => `jf_extra_${today}`;
export function readExtra(today) {
  try { return JSON.parse(localStorage.getItem(extraKey(today)) || "null"); } catch { return null; }
}
export function writeExtra(today, extra) {
  try {
    if (extra) localStorage.setItem(extraKey(today), JSON.stringify(extra));
    else localStorage.removeItem(extraKey(today));
  } catch { /* private mode */ }
  return extra;
}

// Saving an execution: which failures are worth retrying from the offline
// queue. A 4xx other than auth/timeout/rate-limit will be rejected again on
// every replay — queueing it would block the queue behind it forever.
export function isRetryable(e) {
  const s = e?.status;
  return s == null || s >= 500 || s === 401 || s === 408 || s === 429;
}

// One positional list for api.saveExecution, its queued form, and back.
const EXEC_KEYS = ["userId", "planId", "date", "steps", "durationSec", "perceivedExertion", "sessionType", "sessionProgram", "notes", "sourceRef"];
export const execPayload = (args) => Object.fromEntries(EXEC_KEYS.map((k, i) => [k, args[i] ?? null]));
export const execArgs = (p) => EXEC_KEYS.map((k) => p?.[k] ?? null);

// Save an "als extra" session: session_type 'bonus', no day_plan_id (it has no
// day_plans row), the template it came from as source_ref.
export function saveOwnExtra(api, { userId, today, plan, stepsActual, durationSec, perceivedExertion, notes }) {
  return api.saveExecution(userId, null, today, stepsActual ?? plan?.steps ?? [], durationSec, perceivedExertion,
    "bonus", null, notes ?? null, plan?.source_ref ?? null);
}
