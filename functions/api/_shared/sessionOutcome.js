// UAT release 2 — a safe stop. How a session ended, decided once for the server
// (execution.js saves it, score.js counts it) and the client (WorkoutView offers
// it, the done card and the history readers show it). Plain ESM, no imports: the
// client reaches this file through a relative path, like _shared/session.js.
//
// "Stoppen en bewaren" saves the sets already done as an execution with
// status 'abandoned' — the executions CHECK has allowed it since the baseline, so
// no migration — and execution_json.stopped_after = { exercises_done,
// exercises_total }. Principle 1: an abandoned execution with at least one
// completed set counts as showing up that day; one with none is never stored.

export const STOPPED_STATUS = 'abandoned';

// A step's actuals: an object on a request (WorkoutView's stepsActualRef), a JSON
// string on a row read back from execution_steps.
export function stepActual(step) {
  if (step?.actual && typeof step.actual === 'object') return step.actual;
  const raw = typeof step?.actual === 'string' ? step.actual : step?.actual_json;
  if (!raw) return {};
  try { return JSON.parse(raw) ?? {}; } catch { return {}; }
}

/** A step the user did at least one set of (a skipped step earns nothing anyway). */
export function stepWasDone(step) {
  const a = stepActual(step);
  return !a.skipped && (Number(a.sets_completed) || 0) > 0;
}

/** { exercises_done, exercises_total } for a list of steps with actuals. */
export function stopSummary(steps) {
  const list = Array.isArray(steps) ? steps : [];
  return { exercises_done: list.filter(stepWasDone).length, exercises_total: list.length };
}

/**
 * The status of a POSTed execution. The client may send status 'abandoned' and
 * nothing else; the summary is recomputed from the steps, never trusted.
 *   { status: 'completed', execution_json: null }
 *   { status: 'abandoned', stopped_after, execution_json }
 *   { error: 'invalid_status' | 'nothing_to_save' }
 */
export function readExecutionStatus(body) {
  const status = body?.status ?? 'completed';
  if (status === 'completed') return { status: 'completed', execution_json: null };
  if (status !== STOPPED_STATUS) return { error: 'invalid_status' };
  const stopped_after = stopSummary(body?.steps);
  if (!stopped_after.exercises_done) return { error: 'nothing_to_save' };
  return { status: STOPPED_STATUS, stopped_after, execution_json: JSON.stringify({ stopped_after }) };
}

/** The steps progression is credited for: on a stopped session, the ones done. */
export function creditedSteps(steps, status) {
  return status === STOPPED_STATUS ? (steps ?? []).filter(stepWasDone) : (steps ?? []);
}

/** Does this history row count as showing up that day (score, streak, trajectory)? */
export function showedUp(execution) {
  if (!execution) return false;
  if ((execution.status ?? 'completed') === 'completed') return true;
  return execution.status === STOPPED_STATUS && (Number(execution.stopped_after?.exercises_done) || 0) > 0;
}

// The same predicate in SQL, for queries over `executions` (alias-free).
export const SHOWED_UP_SQL = `(status = 'completed' OR (status = '${STOPPED_STATUS}' AND COALESCE(json_extract(execution_json, '$.stopped_after.exercises_done'), 0) >= 1))`;
