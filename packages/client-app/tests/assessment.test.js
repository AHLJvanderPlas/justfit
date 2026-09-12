import { describe, it, expect } from 'vitest';
import {
  PRESETS, TESTS, presetList, scoreFromCurve, normaliseRaw, scoreResult,
  scoreSubmission, applyToProgression, assessmentBlock, buildInsights,
  defaultPushVariant, REFERENCE_CURVES, BASELINE_RETENTION, buildDefaultScores,
  MEASURED_AXES, UNMEASURED_AXES, PUSH_VARIANTS,
} from '../../../functions/api/_shared/assessment.js';

// Mirrors progBuildDefaultScores() in execution.js.
const freshScores = () => ({
  push:         { power: 0, endurance: 0, baseline: 0, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
  pull:         { power: 0, endurance: 0, baseline: 0, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
  legs:         { power: 0, endurance: 0, baseline: 0, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
  core:         { power: 0, endurance: 0, baseline: 0, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
  conditioning: { power: 0, endurance: 0, baseline: 0, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
  mobility:     { mobility: 0, baseline: 0, last_mobility_stimulus_at_ms: null },
});

describe('battery definition', () => {
  it('every preset references only real tests', () => {
    for (const p of Object.values(PRESETS)) {
      for (const t of p.tests) expect(TESTS[t], `${p.id} → ${t}`).toBeDefined();
    }
  });

  it('every test maps to a measured axis and has a curve', () => {
    for (const t of Object.values(TESTS)) {
      expect(MEASURED_AXES).toContain(t.axis);
      expect(REFERENCE_CURVES[t.id], t.id).toBeDefined();
    }
  });

  it('never claims to measure pull or mobility', () => {
    const axes = Object.values(TESTS).map((t) => t.axis);
    for (const a of UNMEASURED_AXES) expect(axes).not.toContain(a);
  });

  it('surfaces the pull gap on the upper-body preset', () => {
    const upper = presetList().find((p) => p.id === 'upper');
    expect(upper.unmeasured).toContain('pull');
  });
});

describe('reference curves', () => {
  it('are monotonic non-decreasing in both axes', () => {
    for (const [id, curve] of Object.entries(REFERENCE_CURVES)) {
      for (let i = 1; i < curve.length; i++) {
        expect(curve[i][0], `${id} x`).toBeGreaterThan(curve[i - 1][0]);
        expect(curve[i][1], `${id} y`).toBeGreaterThanOrEqual(curve[i - 1][1]);
      }
    }
  });

  it('clamps below zero and above the top of the curve', () => {
    expect(scoreFromCurve('push_max', -5)).toBe(0);
    expect(scoreFromCurve('push_max', 10_000)).toBe(100);
  });

  it('interpolates between anchor points', () => {
    // push_max: 10→35, 20→55. Midpoint should land halfway.
    expect(scoreFromCurve('push_max', 15)).toBe(45);
  });

  it('hits the anchor points exactly', () => {
    expect(scoreFromCurve('core_hold', 120)).toBe(70);
    expect(scoreFromCurve('legs_60s', 30)).toBe(55);
  });

  it('returns 0 for an unknown test or a non-number', () => {
    expect(scoreFromCurve('nope', 20)).toBe(0);
    expect(scoreFromCurve('push_max', NaN)).toBe(0);
  });
});

describe('push-up variants', () => {
  it('normalises easier variants downward', () => {
    expect(normaliseRaw('push_max', 20, 'wall-push-up')).toBeCloseTo(7);
    expect(normaliseRaw('push_max', 20, 'knee-push-up')).toBeCloseTo(12);
    expect(normaliseRaw('push_max', 20, 'push-up')).toBe(20);
  });

  it('leaves non-variant tests untouched', () => {
    expect(normaliseRaw('legs_60s', 30, 'anything')).toBe(30);
  });

  it('so the same rep count scores lower on an easier variant', () => {
    const wall = scoreResult('push_max', 20, 'wall-push-up').score;
    const full = scoreResult('push_max', 20, 'push-up').score;
    expect(wall).toBeLessThan(full);
  });

  it('picks a variant from experience level', () => {
    expect(defaultPushVariant('advanced')).toBe('push-up');
    expect(defaultPushVariant('intermediate')).toBe('knee-push-up');
    expect(defaultPushVariant('beginner')).toBe('wall-push-up');
    expect(PUSH_VARIANTS[defaultPushVariant(undefined)]).toBeDefined();
  });
});

describe('scoreResult caps', () => {
  it('caps reps at the test rep cap', () => {
    expect(scoreResult('push_max', 9999, 'push-up').raw).toBe(TESTS.push_max.repCap);
  });

  it('caps holds at the time cap', () => {
    expect(scoreResult('core_hold', 9999).raw).toBe(TESTS.core_hold.timeCapSec);
  });

  it('floors negatives at zero', () => {
    expect(scoreResult('legs_60s', -10).raw).toBe(0);
  });
});

describe('scoreSubmission', () => {
  it('accepts a valid submission', () => {
    const { results, scores, errors } = scoreSubmission('lower', [
      { test_id: 'legs_60s', raw: 30 }, { test_id: 'core_hold', raw: 120 },
    ]);
    expect(errors).toEqual([]);
    expect(scores.legs).toBe(55);
    expect(scores.core).toBe(70);
    expect(results).toHaveLength(2);
  });

  it('rejects a test that is not part of the chosen focus', () => {
    const { errors } = scoreSubmission('lower', [{ test_id: 'push_max', raw: 20 }]);
    expect(errors[0]).toMatch(/not part of/);
  });

  it('rejects an unknown focus', () => {
    expect(scoreSubmission('nonsense', [{ test_id: 'legs_60s', raw: 10 }]).errors).toHaveLength(1);
  });

  it('rejects an empty or non-numeric submission', () => {
    expect(scoreSubmission('lower', []).errors).toHaveLength(1);
    expect(scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 'abc' }]).errors[0]).toMatch(/Missing value/);
  });
});

describe('applyToProgression', () => {
  it('sets the baseline to the retained fraction of the measured score', () => {
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 40 }]); // → 70
    const next = applyToProgression(freshScores(), results, 1_000);
    expect(next.legs.baseline).toBe(Math.round(70 * BASELINE_RETENTION));
  });

  it('raises power and endurance by the test weights', () => {
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 40 }]); // → 70
    const next = applyToProgression(freshScores(), results, 1_000);
    expect(next.legs.power).toBe(70);           // weight 1.0
    expect(next.legs.endurance).toBe(56);       // weight 0.8
    expect(next.legs.last_power_stimulus_at_ms).toBe(1_000);
  });

  it('never lowers an earned score — one bad day does not delete progress', () => {
    const scores = freshScores();
    scores.legs.power = 90;
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 10 }]); // → 20
    const next = applyToProgression(scores, results, 1_000);
    expect(next.legs.power).toBe(90);
  });

  it('lifts current scores when a new baseline exceeds them', () => {
    const scores = freshScores();
    scores.core.endurance = 5;
    const { results } = scoreSubmission('lower', [{ test_id: 'core_hold', raw: 240 }]); // → 100
    const next = applyToProgression(scores, results, 1_000);
    expect(next.core.endurance).toBeGreaterThanOrEqual(next.core.baseline);
  });

  it('moves the baseline down when capability genuinely drops', () => {
    const scores = freshScores();
    scores.legs.baseline = 60;
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 10 }]); // → 20
    const next = applyToProgression(scores, results, 1_000);
    expect(next.legs.baseline).toBe(15);
  });

  it('leaves unmeasured axes untouched', () => {
    const before = freshScores();
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 40 }]);
    const next = applyToProgression(before, results, 1_000);
    expect(next.pull).toEqual(before.pull);
    expect(next.mobility).toEqual(before.mobility);
  });

  it('does not mutate its input', () => {
    const before = freshScores();
    const snapshot = JSON.stringify(before);
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 40 }]);
    applyToProgression(before, results, 1_000);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('safety gate', () => {
  it('blocks during pregnancy and postnatal', () => {
    expect(assessmentBlock({ mode: 'pregnant' }, null).reason).toBe('pregnant');
    expect(assessmentBlock({ mode: 'postnatal' }, null).reason).toBe('postnatal');
  });

  it('blocks on reported pain, recovery mode, or poor sleep', () => {
    expect(assessmentBlock(null, { checkin_json: '{"pain_level":3}' }).reason).toBe('pain');
    expect(assessmentBlock(null, { checkin_json: '{"recovery_mode":true}' }).reason).toBe('recovery');
    expect(assessmentBlock(null, { checkin_json: '{}', sleep_hours: 4 }).reason).toBe('low_sleep');
  });

  it('allows a clean day', () => {
    expect(assessmentBlock({ mode: 'standard' }, { checkin_json: '{"pain_level":0}', sleep_hours: 8 })).toBeNull();
    expect(assessmentBlock(null, null)).toBeNull();
  });

  it('does not throw on malformed check-in json', () => {
    expect(() => assessmentBlock(null, { checkin_json: 'not json' })).not.toThrow();
  });
});

describe('insights', () => {
  it('reports a first measurement as a reference point', () => {
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 30 }]);
    const ins = buildInsights(results, null);
    expect(ins.deltas.legs).toBeNull();
    expect(ins.sentence).toMatch(/reference point/i);
  });

  it('computes deltas against the previous assessment', () => {
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 40 }]); // 70
    const ins = buildInsights(results, { legs: 55 });
    expect(ins.deltas.legs).toBe(15);
    expect(ins.sentence).toMatch(/up/i);
  });

  it('names the strongest and weakest measured axis', () => {
    const { results } = scoreSubmission('all_round', [
      { test_id: 'push_max', raw: 5, variant: 'push-up' },
      { test_id: 'legs_60s', raw: 50 },
      { test_id: 'core_hold', raw: 20 },
      { test_id: 'cond_3min', raw: 100 },
    ]);
    const ins = buildInsights(results, null);
    expect(ins.strongest.axis).toBe('legs');
    expect(ins.weakest.score).toBeLessThanOrEqual(ins.strongest.score);
  });

  it('always reports what was not measured', () => {
    const { results } = scoreSubmission('lower', [{ test_id: 'legs_60s', raw: 30 }]);
    expect(buildInsights(results, null).unmeasured.map((u) => u.axis)).toEqual(UNMEASURED_AXES);
  });
});

describe('cold start', () => {
  it('buildDefaultScores matches the shape execution.js creates', () => {
    expect(Object.keys(buildDefaultScores()).sort()).toEqual(freshScores() && Object.keys(freshScores()).sort());
    expect(buildDefaultScores()).toEqual(freshScores());
  });

  it('a first assessment on a fresh user produces real baselines', () => {
    const { results } = scoreSubmission('all_round', [
      { test_id: 'push_max', raw: 20, variant: 'knee-push-up' },
      { test_id: 'legs_60s', raw: 30 },
      { test_id: 'core_hold', raw: 120 },
      { test_id: 'cond_3min', raw: 140 },
    ]);
    const next = applyToProgression(buildDefaultScores(), results, 1_000);
    for (const axis of MEASURED_AXES) {
      expect(next[axis].baseline, axis).toBeGreaterThan(0);
    }
    // Unmeasured axes still start empty rather than being invented.
    expect(next.pull.baseline).toBe(0);
    expect(next.mobility.baseline).toBe(0);
  });
});
