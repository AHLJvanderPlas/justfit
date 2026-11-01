// UAT release 3 — Deze week, one row at a time. The page used to stack a
// "niets vastgelegd · Training loggen" row for every day of the strip and every
// upcoming day. Now the strip selects a day and ONE row follows it; "Aankomend"
// shows two days and "Hele week →" the rest.
import { inLogWindow } from "./logSession.js";

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
