// coach-dcp R2 — Voortgang's insight and planner sentences come from structured
// fields, so they can be translated (they were English server strings).
import { describe, it, expect } from 'vitest';
import { insightLines, plannerLines } from '../src/progressCopy.js';

describe('insightLines', () => {
  it('a fading axis (≥ 4 days) and the biggest gap, in that order', () => {
    const lines = insightLines({ most_decayed: { axis: 'core', days: 9 }, biggest_gap: { axis: 'pull', gap: 21.6 } }, (a) => a.toUpperCase());
    expect(lines).toEqual([
      ["Your {axis} score hasn't been trained in {n} days — it's starting to fade. Add some {axis} work this week.", { axis: 'CORE', n: 9 }],
      ['Your biggest gap vs. your goal is {axis} ({n} points away). The planner will prioritise this.', { axis: 'PULL', n: 22 }],
    ]);
  });
  it('nothing to say → no lines', () => {
    expect(insightLines(null)).toEqual([]);
    expect(insightLines({ most_decayed: { axis: 'core', days: 2 } })).toEqual([]);
  });
});

describe('plannerLines', () => {
  const targets = { push: 60, pull: 60, legs: 60, core: 60, conditioning: 60, mobility: 60 };
  it('the two largest gaps ≥ 5 points, then the chart-mode note', () => {
    const lines = plannerLines({ scores: { push: 58, pull: 20, legs: 40, core: 57, conditioning: 59, mobility: 60 }, targets, chartMode: 'balanced', goal: 'Build Strength' });
    expect(lines[0]).toEqual(["Your planner is prioritising {axis} because it's your largest gap vs. your {goal} goal (current: {current}, target: {target}).", { axis: 'pull', goal: 'Build Strength', current: 20, target: 60 }]);
    expect(lines[1]).toEqual(['{axis} is also being boosted — {gap} points behind target.', { axis: 'legs', gap: 20 }]);
    expect(lines[2]).toEqual(['Sessions mix strength and conditioning roughly equally.']);
  });
  it('no gap ≥ 5 → only the note; an unknown mode → nothing', () => {
    expect(plannerLines({ scores: targets, targets, chartMode: 'power' })).toEqual([['Sessions lean toward heavier, lower-rep strength work.']]);
    expect(plannerLines({ scores: targets, targets, chartMode: 'x' })).toEqual([]);
  });
});
