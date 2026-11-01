// coach-dcp release 1 — the DCP's few decisions the screens share, kept pure so
// the three mounts (Settings → Normen, Voortgang's DCP card and "Where you are",
// the Coach view's DCP card) cannot word or decide them differently.
import { daysUntil } from "./keuringNorms.js";
import { DCP_BIRTH_YEARS, dcpAgeFrom, getDcpNorms, dcpProgress } from "../../../functions/api/_shared/military.js";

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

// ─── coach-dcp release 2 — the DCP card's rows and header, decided once ───────

/**
 * The DCP card's two measured rows, each labelled with BOTH tiers: "0 / 16
 * (veilig 19)". The planner's trace says 19 and the card used to say 16; showing
 * the minimum and the safe tier side by side makes them visibly one norm.
 * `norms` is getDcpNorms(sex, age). Returns [] without norms.
 *   score  [i18nKey, vars] for "{v} / {min} (safe {safe})"
 *   p      the dcpProgress result (tier, pct, gap, step …) for the bar and the hint
 */
export function dcpRows(dcp, norms) {
  if (!norms) return [];
  const last = dcp?.last ?? {};
  return [
    { key: "pushups", label: "Push-ups · 2 min", value: last.pushups ?? 0, minimum: norms.pushups },
    { key: "situps", label: "Sit-ups · 2 min", value: last.situps ?? 0, minimum: norms.situps },
  ].map((r) => {
    const p = dcpProgress(r.value, r.minimum);
    return { ...r, p, safe: p.safe, score: ["{v} / {min} (safe {safe})", { v: p.value, min: p.minimum, safe: p.safe }] };
  });
}

/**
 * The DCP card's date line — the shared date rule. The DCP's own test_date wins;
 * without one, a keuring date (military coach, target mode) is the date the
 * soldier is working to, so the card says so instead of "no date set".
 *   { kind: "test", days, date } | { kind: "keuring", days } | { kind: "none" }
 */
export function dcpHeaderDate(dcp, mil, nowMs) {
  const days = (d) => daysUntil(d, nowMs);
  if (dcp?.test_date) return { kind: "test", days: days(dcp.test_date), date: dcp.test_date };
  if (mil?.active && mil?.target_date && (mil.mode ?? "target") === "target") return { kind: "keuring", days: days(mil.target_date) };
  return { kind: "none" };
}
