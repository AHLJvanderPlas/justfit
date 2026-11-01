// UAT release 5 — the "Specialistische coaching" card on Today: once per account, never after a
// specialist path is chosen, and "Niet voor mij" sticks. One localStorage key per account holds
// the whole state: absent = never shown, "seen" = shown once already, "dismissed" = said no.
import { activeCoachOf } from "./coachPath.js";

export const COACHING_CARD_KEY = "jf_coach_discovery_dismissed";   // the key the dismissal always used
export const COACHING_CARD_MIN_SESSIONS = 3;

export const coachingCardKey = (userId) => (userId ? `${COACHING_CARD_KEY}_${userId}` : COACHING_CARD_KEY);

/** "seen" | "dismissed" | null. Any other stored value (the old "1") counts as dismissed. */
export function readCoachingCard(storage, userId) {
  try {
    const v = storage.getItem(coachingCardKey(userId)) ?? storage.getItem(COACHING_CARD_KEY);
    return v == null ? null : v === "seen" ? "seen" : "dismissed";
  } catch { return null; }
}

export function writeCoachingCard(storage, userId, value) {
  try { storage.setItem(coachingCardKey(userId), value); } catch { /* private mode: the card may come back */ }
}

/**
 * Show the card? `stored` is readCoachingCard's value from BEFORE this visit (null on the visit
 * that first shows it, so the card does not vanish under the user's thumb).
 */
export function coachingCardVisible({ prefs, sessions, stored }) {
  if (activeCoachOf(prefs) !== "general") return false;
  if ((sessions ?? 0) < COACHING_CARD_MIN_SESSIONS) return false;
  if (stored === "dismissed") return false;
  if (stored === "seen") return false;
  return true;
}
