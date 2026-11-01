// coach-dcp release 2 — the keuring standards, in ONE place.
//
// Until R2 this table lived inside CoachView.jsx, a second copy of the Cooper
// thresholds sat beside it (twice), the march weights a third time, and the
// Today card hard-coded the same thresholds again in a ternary ladder. The
// server has no keuring table (military.js models the programme, not the test),
// so the one copy is this client module; every screen that shows a keuring
// number reads it from here.
//
// Per cluster (Defensie KB–K6, openbaar beschikbaar):
//   cooper_m   12-minute run distance that counts as this level (the Cooper test the
//              schedule runs is the app's only run measurement)
//   run_sec    max 1500 m time (the keuring itself; kept for reference)
//   pushups / pullups   minimum reps
//   march_kg / march    the loaded march: pack weight and max time over 5 km
import { milClL } from "./planUtils.js";
import { dcpCardVisible } from "../../../functions/api/_shared/military.js";

export const KEURING_NORMS = {
  0: { cooper_m:    0, run_sec: 420, pushups: 20, pullups: 2, march_kg:  0, march: '40:00' },
  1: { cooper_m: 1800, run_sec: 390, pushups: 23, pullups: 3, march_kg:  5, march: '37:00' },
  2: { cooper_m: 2000, run_sec: 375, pushups: 25, pullups: 4, march_kg: 10, march: '35:00' },
  3: { cooper_m: 2200, run_sec: 365, pushups: 27, pullups: 5, march_kg: 15, march: '33:00' },
  4: { cooper_m: 2400, run_sec: 365, pushups: 28, pullups: 4, march_kg: 20, march: '35:00' },
  5: { cooper_m: 2600, run_sec: 350, pushups: 30, pullups: 6, march_kg: 25, march: '32:00' },
  6: { cooper_m: 2800, run_sec: 330, pushups: 35, pullups: 8, march_kg: 30, march: '30:00' },
};

/** Cooper distance per level, index = cluster (the old COOPER_THRESHOLDS array). */
export const COOPER_THRESHOLDS = Object.keys(KEURING_NORMS).map((k) => KEURING_NORMS[k].cooper_m);

/** The level a Cooper distance reaches (0 = below K1), or null without a distance. */
export function cooperLevel(distanceM) {
  const m = Number(distanceM);
  if (!(m > 0)) return null;
  return COOPER_THRESHOLDS.reduce((lvl, min, i) => (i > 0 && m >= min ? i : lvl), 0);
}

/** Calendar days from today to a YYYY-MM-DD date (0 when it is today or past), or null. */
export function daysUntil(dateStr, nowMs) {
  if (!dateStr) return null;
  const at = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`).getTime();
  if (!Number.isFinite(at)) return null;
  const today = new Date(nowMs); today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((at - today.getTime()) / 86_400_000));
}

/** Days to the keuring (target mode with a date), else null. */
export function keuringDaysOut(mil, nowMs) {
  if (!mil?.target_date || (mil.mode ?? 'target') !== 'target') return null;
  return daysUntil(mil.target_date, nowMs);
}

/**
 * The keuring card's rows, against the standards of the TARGET cluster.
 * Only the Cooper run is measured by the app today; the other three rows read
 * "nog niet gemeten" (value null) until a measurement for them exists —
 * the self-declared level is never shown as a result.
 *
 * @param {object} mil    preferences.military_coach
 * @param {object} norms  one KEURING_NORMS row (default: the one for cluster_target)
 * @returns [{ key, label: [i18nKey, vars], value, target, unit, met, pct, at_ms }]
 */
export function keuringRows(mil, norms) {
  const ct = mil?.cluster_target ?? 3;
  const n = norms ?? KEURING_NORMS[ct] ?? KEURING_NORMS[3];
  const num = (v) => (Number(v) > 0 ? Number(v) : null);
  const row = (key, label, value, target, unit, extra = {}) => ({
    key, label, value, target, unit,
    met: value != null && target > 0 ? (unit === 'time' ? value <= target : value >= target) : false,
    pct: value != null && target > 0 && unit !== 'time' ? Math.min(100, Math.round((value / target) * 100)) : 0,
    ...extra,
  });
  return [
    row('run', ['12 min run'], num(mil?.last_cooper_distance_m), n.cooper_m, 'm', { at_ms: mil?.last_cooper_at_ms ?? null }),
    row('pushups', ['Push-ups'], num(mil?.last_keuring?.pushups), n.pushups, 'reps'),
    row('pullups', ['Pull-ups'], num(mil?.last_keuring?.pullups), n.pullups, 'reps'),
    row('march', ['March {kg} kg', { kg: n.march_kg }], mil?.last_keuring?.march ?? null, n.march, 'time'),
  ];
}

/** Has the app measured this soldier's level (a Cooper result or a keuring measurement)? */
export function milLevelMeasured(mil) {
  return Number(mil?.last_cooper_distance_m) > 0 || !!(mil?.last_keuring && Object.keys(mil.last_keuring).length);
}

/**
 * The level as the screens show it (coach-dcp R2, fix 8). The self-declared
 * cluster_current (default 0 or 1) is a guess, so until a Cooper or keuring
 * measurement exists the pill names the track instead of a level, and the
 * self-declared target is shown as "doel" only.
 *
 * Returns i18n keys + vars (the caller wraps them in t()):
 *   pill  "KEURING" | "K3"           — after "Militair · " (K3 = the Cooper result's level)
 *   line  "Level not measured yet · goal {goal}" | "{level} · goal {goal}"
 *   level the measured level label, or null
 *   goal  the target label ("K3")
 */
export function milLevelLabel(mil) {
  const track = mil?.track ?? 'keuring';
  const goal = milClL(track, mil?.cluster_target ?? (track === 'keuring' ? 3 : 1));
  if (!milLevelMeasured(mil)) {
    return {
      measured: false, level: null, goal,
      pill: [track === 'keuring' ? 'KEURING' : 'OPLEIDING'],
      line: ['Level not measured yet · goal {goal}', { goal }],
    };
  }
  // The measured level is what the measurement says: the Cooper distance against the
  // table (2.350 m → K3), not the self-declared or RPE-drifted cluster_current. The
  // opleiding track has no Cooper table, so there the working level stands.
  const cl = track === 'keuring' ? cooperLevel(mil?.last_cooper_distance_m) : null;
  const level = milClL(track, cl ?? mil?.cluster_current ?? mil?.cluster_target ?? 0);
  return { measured: true, level, goal, pill: [level], line: ['{level} · goal {goal}', { level, goal }] };
}

/** The keuring card (Waar sta ik, Coach view) is shown while the military coach runs the keuring track. */
export function keuringCardVisible(mil) {
  return !!mil?.active && (mil.track ?? 'keuring') === 'keuring';
}

/**
 * Is any norm on — the keuring (military coach, keuring track) or the DCP
 * (dcpCardVisible)? Voortgang's general "Where you are" battery stays only when
 * none is: with a norm on, its card's measurement is the baseline.
 */
export function anyNormOn(prefs) {
  const mil = prefs?.preferences?.military_coach ?? {};
  return keuringCardVisible(mil) || dcpCardVisible(mil.dcp, !!mil.active);
}
