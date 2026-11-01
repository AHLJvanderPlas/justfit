// UAT release 3 — Voortgang waits for data. Until a user has shown up three
// times, the screen carries the trajectory, the streak, "Waar sta ik" and the
// next award; the insight blocks (key insights, axis breakdown, goal fit, planner
// lines, recovery, radar) appear from the third session. A pure predicate so the
// threshold is one number with one test.
export const INSIGHT_MIN_SESSIONS = 3;

/** Whether the insight blocks are earned: `sessions` = history rows that showedUp. */
export function insightsUnlocked(sessions) {
  return (Number(sessions) || 0) >= INSIGHT_MIN_SESSIONS;
}

/**
 * The Strongest / Weakest pair of Key Insights, or [] when it would say nothing:
 * every axis score is 0 (day one), the two are the same axis, or they carry the same
 * score — "STERKSTE Duwen · 0" next to "ZWAKSTE Duwen · 0" was a number that
 * disagreed with the page it sat on (UAT D6).
 *   insights: { strongest: { axis, score }, weakest: { axis, score } }
 *   scores:   { push, pull, … } as the radar shows them
 * Returns [{ key: 'strongest' | 'weakest', axis, score }].
 */
export function strongestWeakest(insights, scores = {}) {
  const s = insights?.strongest, w = insights?.weakest;
  if (!s || !w) return [];
  const axisScores = Object.values(scores ?? {}).map(Number);
  if (axisScores.length > 0 && axisScores.every((v) => !(v > 0))) return [];   // the radar says 0 everywhere
  if (!(Number(s.score) > 0) && !(Number(w.score) > 0)) return [];
  if (s.axis === w.axis || Math.round(Number(s.score)) === Math.round(Number(w.score))) return [];
  return [{ key: 'strongest', axis: s.axis, score: s.score }, { key: 'weakest', axis: w.axis, score: w.score }];
}
