// UX review 2026-11-16, finding 5 — every number gets a word, and a number that was not
// recorded is not printed as 0. One module for the sets, durations and the Today strip,
// shared by Today, Deze week and Voortgang (it used to be three hand-rolled strings that
// disagreed: Voortgang printed a 30 s hold as "1 × 1min", Deze week "1 set × 0s").
import { t } from "./i18n.js";

/** "30s" under a minute, "2 min" / "1:30" above; null for nothing. Never "0s". */
export function formatSeconds(sec) {
  const n = Math.round(Number(sec));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 60) return `${n}s`;
  const m = Math.floor(n / 60), s = n % 60;
  return s ? `${m}:${String(s).padStart(2, "0")} min` : `${m} min`;
}

/** One set's value: "10 herhalingen" or "30s"; null for 0 / unknown. */
export function formatSetValue(value, timed) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return timed ? formatSeconds(n) : t("{n} reps", { n });
}

/** "3 sets × 10 herhalingen", "1 set × 30s", or just "1 set" when the value is unknown. */
export function formatSets(sets, value, timed) {
  const k = Math.round(Number(sets));
  if (!Number.isFinite(k) || k <= 0) return null;
  const head = `${k} ${k === 1 ? t("set") : t("sets")}`;
  const v = formatSetValue(value, timed);
  return v ? `${head} × ${v}` : head;
}

const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

/**
 * What one exercise of a finished in-app session shows, from execution_steps:
 * actual_json first (sets done; the mean of the values recorded above 0 — a 0 is "not
 * recorded", the timed-set bug before release A), the prescription only when nothing was
 * recorded. Skipped → "overgeslagen"; started but no set done → "niet afgerond".
 */
export function stepResult(step) {
  const actual = parse(step?.actual_json);
  const pres = parse(step?.prescribed_json) ?? {};
  const timed = !!pres.duration_sec && !pres.reps;
  if (actual?.skipped) return t("skipped");
  const done = actual?.sets_completed ?? 0;
  if (actual && done === 0) return t("not completed");
  const vals = (actual?.reps_per_set ?? []).map(Number).filter((v) => v > 0);
  if (done > 0) return formatSets(done, vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, timed);
  return formatSets(pres.sets ?? 1, timed ? pres.duration_sec : pres.reps, timed);
}

/** A session's length: "12 min", or null when it was not recorded or under half a minute. */
export function sessionMinutes(totalSec) {
  const n = Number(totalSec);
  if (!Number.isFinite(n) || n < 30) return null;
  return `${Math.max(1, Math.round(n / 60))} min`;
}

/**
 * The Today strip's right-hand side: "Reeks 1 dag · Score 10". Nothing at all on day one
 * (no streak and no score), instead of a bare "0".
 */
export function todayStripLabel(streak, score) {
  const parts = [];
  if (streak > 0) parts.push(streak === 1 ? t("Streak 1 day") : t("Streak {n} days", { n: streak }));
  if (score > 0 || (score === 0 && streak > 0)) parts.push(t("Score {n}", { n: score }));
  return parts.length ? parts.join(" · ") : null;
}
