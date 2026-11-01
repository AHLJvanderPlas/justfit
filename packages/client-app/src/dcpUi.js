// coach-dcp release 1 — the DCP's few decisions the screens share, kept pure so
// the three mounts (Settings → Normen, Voortgang's DCP card and "Where you are",
// the Coach view's DCP card) cannot word or decide them differently.
import { DCP_BIRTH_YEARS, dcpAgeFrom, getDcpNorms } from "../../../functions/api/_shared/military.js";

/**
 * The one measurement button's label (an i18n key — the caller wraps it in t()).
 * planned → it is already in today's session (the button is disabled then);
 * never measured → the baseline; otherwise → the retest.
 */
export function dcpMeasureLabel({ never, planned }) {
  if (planned) return "Measurement is in today's session";
  return never ? "Schedule baseline" : "Schedule retest";
}

/**
 * Is the measurement still waiting in today's session? Today's plan keeps
 * assessment_planned after the sets were done, so a measurement already taken
 * today means it is not "planned" any more — the button offers the retest.
 */
export function dcpMeasurePlanned({ assessmentPlanned, lastAtMs, nowMs }) {
  if (!assessmentPlanned) return false;
  if (!lastAtMs) return true;
  return new Date(lastAtMs).toDateString() !== new Date(nowMs).toDateString();
}

/** "1990" → 1990; anything outside DCP_BIRTH_YEARS, or not four digits → null. */
export function parseBirthYear(v) {
  const s = String(v ?? "").trim();
  if (!/^\d{4}$/.test(s)) return null;
  const y = Number(s);
  return y >= DCP_BIRTH_YEARS[0] && y <= DCP_BIRTH_YEARS[1] ? y : null;
}

/** The three minimums for this athlete, or null (no sex set, no table, no year). */
export function dcpNormsFor(sex, birthYear, nowMs) {
  if (sex !== "male" && sex !== "female") return null;
  return getDcpNorms(sex, dcpAgeFrom(birthYear, nowMs));
}

/**
 * A max-effort step's prescription line: "Max · 2 min". It carries no rep
 * target (target_reps is unset on purpose — the window is the protocol), so a
 * screen that fell back to its default of 10 reps told the user to stop at 10.
 * Returns [key, vars] for t(), or null for an ordinary step.
 */
export function maxEffortMeta(step) {
  if (!step?.max_effort) return null;
  const sec = Number(step.measure_window_sec ?? step.target_duration_sec) || 120;
  return ["Max · {m} min", { m: Math.round((sec / 60) * 10) / 10 }];
}
