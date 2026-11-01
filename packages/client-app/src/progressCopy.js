// coach-dcp R2 (fix 7) — Voortgang's insight and planner sentences, built on the
// client from the structured fields /api/progression already returns, so they
// can be Dutch. The server's insight_text / planner_explanation are English
// strings with the numbers baked in; the same decisions are made here (same
// thresholds as functions/api/progression.js) and returned as [i18nKey, vars].
// `label` turns an axis id into its display name (messagePolicy.axisLabel).

const AXES = ['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'];

/** SLEUTELINZICHTEN bodies: the fading axis (≥ 4 days, server-side) and the biggest gap. */
export function insightLines(insights, label = (a) => a) {
  const out = [];
  const d = insights?.most_decayed;
  if (d?.axis && d.days >= 4) out.push(["Your {axis} score hasn't been trained in {n} days — it's starting to fade. Add some {axis} work this week.", { axis: label(d.axis), n: d.days }]);
  const g = insights?.biggest_gap;
  if (g?.axis) out.push(["Your biggest gap vs. your goal is {axis} ({n} points away). The planner will prioritise this.", { axis: label(g.axis), n: Math.round(g.gap ?? 0) }]);
  return out;
}

const CHART_NOTE = {
  power: 'Sessions lean toward heavier, lower-rep strength work.',
  endurance: 'Sessions lean toward higher-rep, shorter-rest metabolic work.',
  balanced: 'Sessions mix strength and conditioning roughly equally.',
  mobility: 'Sessions include extra flexibility and recovery work.',
};

/**
 * HOW THE PLANNER ADAPTS: the two largest gaps (≥ 5 points) against the goal
 * profile, then one line on what the chart mode does to the sessions.
 */
export function plannerLines({ scores = {}, targets = {}, chartMode, goal }, label = (a) => a) {
  const gaps = AXES.map((axis) => {
    const current = Math.round(scores[axis] ?? 0);
    const target = Math.round(targets[axis] ?? 50);
    return { axis, current, target, gap: Math.max(0, target - current) };
  }).filter((g) => g.gap >= 5).sort((a, b) => b.gap - a.gap);
  const out = [];
  if (gaps[0]) out.push(["Your planner is prioritising {axis} because it's your largest gap vs. your {goal} goal (current: {current}, target: {target}).",
    { axis: label(gaps[0].axis), goal, current: gaps[0].current, target: gaps[0].target }]);
  if (gaps[1]) out.push(["{axis} is also being boosted — {gap} points behind target.", { axis: label(gaps[1].axis), gap: gaps[1].gap }]);
  if (CHART_NOTE[chartMode]) out.push([CHART_NOTE[chartMode]]);
  return out;
}
