// UAT release 3 — Deze week, one row at a time. The page used to stack a
// "niets vastgelegd · Training loggen" row for every day of the strip and every
// upcoming day. Now the strip selects a day and ONE row follows it; "Aankomend"
// shows two days and "Hele week →" the rest.
import { inLogWindow } from "./logSession.js";
import { isoWeekStart, addDays } from "../../../functions/api/_shared/weekTarget.js";

/**
 * UX review finding 12 — "Deze week" is the ISO week, Monday → Sunday, everywhere: the week
 * pill, the C-B32 target and Voortgang already counted it; the tab's strip was a rolling
 * "last 7 days". `offset` moves by whole weeks (‹ ›). One helper, built on the server's own
 * isoWeekStart so the two cannot disagree. Dates are YYYY-MM-DD.
 */
export function weekBounds(today, offset = 0) {
  const start = addDays(isoWeekStart(today), offset * 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return { start, end: days[6], days };
}

/** "ma 16 – zo 22 nov" / "ma 30 nov – zo 6 dec" (en: "Mon 16 – Sun 22 Nov"). */
export function weekRangeLabel(start, end, lang = "nl") {
  const loc = lang === "en" ? "en-GB" : "nl-NL";
  const d = (iso) => new Date(`${iso}T12:00:00Z`);
  const part = (iso, opts) => d(iso).toLocaleDateString(loc, { timeZone: "UTC", ...opts }).replace(/\./g, "");
  const sameMonth = start.slice(0, 7) === end.slice(0, 7);
  const from = sameMonth ? part(start, { weekday: "short", day: "numeric" }) : part(start, { weekday: "short", day: "numeric", month: "short" });
  return `${from} \u2013 ${part(end, { weekday: "short", day: "numeric", month: "short" })}`;
}

export const UPCOMING_PREVIEW = 2;

/** The day the strip selects: the tapped one if it is in view, else today, else the last day in view. */
export function selectedDay(days, today, picked = null) {
  if (picked && days.includes(picked)) return picked;
  if (days.includes(today)) return today;
  return days[days.length - 1] ?? today;
}

/**
 * What the single row under the strip offers for `date`:
 *   'log'       — a past day inside the log window (today … today−6) with nothing recorded
 *   'done'      — something is recorded that day
 *   'upcoming'  — a future day (it appears under Aankomend)
 *   'none'      — a past day outside the window
 */
export function dayRowKind(date, today, hasRecord, canLog = true) {
  if (date > today) return 'upcoming';
  if (hasRecord) return 'done';
  return canLog && inLogWindow(date, today) ? 'log' : 'none';
}

/** The upcoming list as shown: two days, or all of them once expanded. */
export function upcomingShown(list, expanded) {
  const rows = Array.isArray(list) ? list : [];
  return expanded ? rows : rows.slice(0, UPCOMING_PREVIEW);
}

/**
 * C-B32 — the training days the Deze week preview assumes before the day it asks
 * about: today when today's plan is a session not yet done, plus every earlier
 * preview day that came back as a session. `result` is [{ date, plan }] so far.
 */
export function previewWeekSim({ today, todayPlanned, result }) {
  const days = (result ?? []).filter(r => r?.plan && r.plan.slot_type !== 'rest').map(r => r.date);
  return todayPlanned ? [today, ...days] : days;
}
