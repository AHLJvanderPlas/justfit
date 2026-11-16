// The session rating (UX review A, finding 4). Three buttons replace the RPE 1–10 slider:
// the server only ever acted on three levels — perceived_exertion 3 (too easy), 5 (just right),
// 8 (too hard) — read by score.js (resilience bonus, <= 4), execution.js (cycling TSS modifier
// {3,5,8}; R576 military drift === 3 / === 8), Strava push and the awards (=== 3 / === 8).
// Any other number silently fell through all of them, so the slider's 1–10 was noise.
export const RATINGS = [
  { key: "easy", exertion: 3, label: "Too easy" },
  { key: "right", exertion: 5, label: "Just right" },
  { key: "hard", exertion: 8, label: "Too hard" },
];

/** The perceived_exertion a rating key is stored as; null for "no rating" or an unknown key. */
export function ratingToExertion(key) {
  return RATINGS.find((r) => r.key === key)?.exertion ?? null;
}

/** Which button a stored value belongs to (old 1–10 slider values land in the nearest bucket). */
export function exertionToRating(pe) {
  if (pe == null || !Number.isFinite(Number(pe))) return null;
  const n = Number(pe);
  return n <= 4 ? "easy" : n <= 6 ? "right" : "hard";
}

/** "Sessie opslaan" is enabled once one of the three is chosen. */
export function canSaveRating(key) {
  return ratingToExertion(key) !== null;
}
