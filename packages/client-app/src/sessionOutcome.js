// UAT release 2 — how today's session ended, as the client shows it. The rules
// that decide (what counts as done, what counts as showing up) are the server's
// own module, imported here so the two cannot drift.
export { stopSummary, stepWasDone, showedUp } from "../../../functions/api/_shared/sessionOutcome.js";

/**
 * Which done card Today shows for the stored completedSession
 * ({ name, duration_sec, stopped_after? }):
 *   'stopped' — "Stop and save": "Stopped after n of m exercises"
 *   'rest'    — "Gewoon rusten" (handleRestDay writes name "Rest Day"; a row
 *               reconstructed from history carries its execution_type "recovery")
 *   'done'    — every other session
 */
export function doneKind(info) {
  if (!info) return "done";
  if (info.stopped_after) return "stopped";
  if (info.rest || /^(rest day|recovery)$/i.test(String(info.name ?? "").trim())) return "rest";
  return "done";
}
