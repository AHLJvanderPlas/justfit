import { describe, it, expect } from 'vitest';
import {
  buildCyclingWorkoutsFromProtocols,
  CYCLING_PROFILES,
  getCyclingBlockPhase,
  calcCyclingTSS,
  scaleCyclingIntervals,
  computeCyclingTsb,
  buildCyclingCoachNote,
} from '../functions/api/_shared/cycling.js';

// ── CYCLING_PROFILES ──────────────────────────────────────────────────────────

describe('CYCLING_PROFILES', () => {
  const knownGoals = ['build_fitness', 'climbing', 'sprint', 'aerobic_base', 'race_fitness'];

  it('all known sub-goals present', () => {
    for (const g of knownGoals) {
      expect(CYCLING_PROFILES[g]).toBeDefined();
    }
  });

  it('each sub-goal has exactly 3 session types (weekly rotation)', () => {
    for (const [goal, sessions] of Object.entries(CYCLING_PROFILES)) {
      expect(sessions).toHaveLength(3, `${goal} should have 3 session types`);
    }
  });

  it('aerobic_base is all endurance', () => {
    expect(CYCLING_PROFILES.aerobic_base.every(s => s === 'endurance')).toBe(true);
  });
});

// ── getCyclingBlockPhase ──────────────────────────────────────────────────────

describe('getCyclingBlockPhase', () => {
  it('returns "base" for first 2 weeks of 7-week cycle (sessions 0–5)', () => {
    expect(getCyclingBlockPhase(0)).toBe('base');
    expect(getCyclingBlockPhase(5)).toBe('base');
  });

  it('returns "build" for weeks 3–6 (sessions 6–17)', () => {
    expect(getCyclingBlockPhase(6)).toBe('build');
    expect(getCyclingBlockPhase(17)).toBe('build');
  });

  it('returns "recovery" for week 7 (sessions 18–20)', () => {
    expect(getCyclingBlockPhase(18)).toBe('recovery');
    expect(getCyclingBlockPhase(20)).toBe('recovery');
  });

  it('wraps at 21 sessions (7-week × 3 sessions)', () => {
    // session 21 = start of new cycle → same as session 0
    expect(getCyclingBlockPhase(21)).toBe(getCyclingBlockPhase(0));
  });
});

// ── calcCyclingTSS ────────────────────────────────────────────────────────────

describe('calcCyclingTSS', () => {
  it('returns 0 for empty intervals', () => {
    expect(calcCyclingTSS([])).toBe(0);
  });

  it('computes TSS correctly for a single steady-state interval', () => {
    // 1 hour at 75% FTP (mid of 70–80): IF = 0.75, TSS = 1 * 0.75² * 100 * 1 = 56.25
    const intervals = [{ power_pct_low: 70, power_pct_high: 80, duration_sec: 3600, sets: 1 }];
    const tss = calcCyclingTSS(intervals);
    expect(tss).toBeCloseTo(56.25, 1);
  });

  it('doubles TSS with sets: 2', () => {
    const one = [{ power_pct_low: 70, power_pct_high: 80, duration_sec: 3600, sets: 1 }];
    const two = [{ power_pct_low: 70, power_pct_high: 80, duration_sec: 3600, sets: 2 }];
    expect(calcCyclingTSS(two)).toBeCloseTo(calcCyclingTSS(one) * 2, 0);
  });

  it('sums multiple intervals', () => {
    const intervals = [
      { power_pct_low: 60, power_pct_high: 70, duration_sec: 1800, sets: 1 },
      { power_pct_low: 90, power_pct_high: 100, duration_sec: 600, sets: 4 },
    ];
    const tss = calcCyclingTSS(intervals);
    expect(tss).toBeGreaterThan(0);
  });

  it('returns a number rounded to 1 decimal place', () => {
    const intervals = [{ power_pct_low: 65, power_pct_high: 75, duration_sec: 2700, sets: 1 }];
    const tss = calcCyclingTSS(intervals);
    expect(tss).toBe(Math.round(tss * 10) / 10);
  });
});

// ── scaleCyclingIntervals ─────────────────────────────────────────────────────

describe('scaleCyclingIntervals', () => {
  const baseIntervals = [
    { label: 'Warm-up',  duration_sec: 600,  power_pct_low: 55, power_pct_high: 65, sets: 1 },
    { label: 'Intervals', duration_sec: 300, power_pct_low: 100, power_pct_high: 110, min_sets: 3, max_sets: 6, sets: 4 },
    { label: 'Cool-down', duration_sec: 600, power_pct_low: 50, power_pct_high: 60, sets: 1 },
  ];

  it('returns intervals unchanged when no timeBudget given', () => {
    expect(scaleCyclingIntervals(baseIntervals, null)).toEqual(baseIntervals);
    expect(scaleCyclingIntervals(baseIntervals, 0)).toEqual(baseIntervals);
  });

  it('returns intervals unchanged when no scalable intervals', () => {
    const fixed = [{ label: 'Steady', duration_sec: 1800, power_pct_low: 65, power_pct_high: 75, sets: 1 }];
    expect(scaleCyclingIntervals(fixed, 30)).toEqual(fixed);
  });

  it('clamps sets to max_sets when budget is generous', () => {
    const result = scaleCyclingIntervals(baseIntervals, 120);
    const scalable = result.find(iv => iv.label === 'Intervals');
    expect(scalable.sets).toBeLessThanOrEqual(6);
  });

  it('clamps sets to min_sets when budget is tight', () => {
    const result = scaleCyclingIntervals(baseIntervals, 25);
    const scalable = result.find(iv => iv.label === 'Intervals');
    expect(scalable.sets).toBeGreaterThanOrEqual(3);
  });

  it('does not mutate original array', () => {
    const originalSets = baseIntervals[1].sets;
    scaleCyclingIntervals(baseIntervals, 30);
    expect(baseIntervals[1].sets).toBe(originalSets);
  });
});

// ── computeCyclingTsb ─────────────────────────────────────────────────────────

describe('computeCyclingTsb', () => {
  it('returns null for empty rows', () => {
    expect(computeCyclingTsb([], '2026-05-04')).toBeNull();
    expect(computeCyclingTsb(null, '2026-05-04')).toBeNull();
  });

  it('returns a number for valid TSS rows', () => {
    const rows = [
      { date: '2026-04-28', tss_actual: 60 },
      { date: '2026-04-30', tss_actual: 80 },
      { date: '2026-05-02', tss_actual: 50 },
    ];
    const tsb = computeCyclingTsb(rows, '2026-05-04');
    expect(typeof tsb).toBe('number');
  });

  it('TSB is negative after consecutive high-load days (accumulated fatigue)', () => {
    // High load for 7 consecutive days → ATL > CTL → TSB < 0
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-04-28');
      d.setUTCDate(d.getUTCDate() + i);
      rows.push({ date: d.toISOString().slice(0, 10), tss_actual: 120 });
    }
    const tsb = computeCyclingTsb(rows, '2026-05-04');
    expect(tsb).toBeLessThan(0);
  });

  it('returns a value rounded to 1 decimal', () => {
    const rows = [{ date: '2026-05-01', tss_actual: 75 }];
    const tsb = computeCyclingTsb(rows, '2026-05-04');
    expect(tsb).toBe(Math.round(tsb * 10) / 10);
  });

  it('uses tss_planned when tss_actual is absent', () => {
    const actual = [{ date: '2026-05-01', tss_actual: 60 }];
    const planned = [{ date: '2026-05-01', tss_planned: 60 }];
    expect(computeCyclingTsb(actual, '2026-05-04')).toBeCloseTo(
      computeCyclingTsb(planned, '2026-05-04'), 1
    );
  });
});

// ── buildCyclingCoachNote ─────────────────────────────────────────────────────

describe('buildCyclingCoachNote', () => {
  const workout = { name: 'Sweet Spot Intervals' };
  const intervals = [
    { label: 'Warm-up',    duration_sec: 600, power_pct_low: 55, power_pct_high: 65, sets: 1 },
    { label: 'Sweet Spot', duration_sec: 600, power_pct_low: 88, power_pct_high: 94, sets: 3 },
    { label: 'Cool-down',  duration_sec: 600, power_pct_low: 50, power_pct_high: 60, sets: 1 },
  ];

  it('includes workout name in output', () => {
    const note = buildCyclingCoachNote(workout, intervals, { ftp_watts: 250, unit: 'watts' });
    expect(note).toContain('Sweet Spot Intervals');
  });

  it('includes watt targets when unit is watts', () => {
    const note = buildCyclingCoachNote(workout, intervals, { ftp_watts: 250, unit: 'watts' });
    expect(note).toMatch(/\d+–\d+W/);
  });

  it('includes bpm targets when unit is hr', () => {
    const note = buildCyclingCoachNote(workout, intervals, { unit: 'hr', max_hr: 180 });
    expect(note).toMatch(/\d+–\d+ bpm/);
  });

  it('computes watt targets as percentage of FTP', () => {
    const note = buildCyclingCoachNote(workout, intervals, { ftp_watts: 200, unit: 'watts' });
    // 88% of 200 = 176W, 94% of 200 = 188W
    expect(note).toContain('176–188W');
  });

  it('includes set count prefix for multi-set main interval', () => {
    const note = buildCyclingCoachNote(workout, intervals, { ftp_watts: 200, unit: 'watts' });
    expect(note).toMatch(/3×/);
  });

  it('falls back to workout name when no main interval found', () => {
    const warmupOnly = [{ label: 'Warm-up', duration_sec: 600, power_pct_low: 55, power_pct_high: 65, sets: 1 }];
    const note = buildCyclingCoachNote(workout, warmupOnly, { ftp_watts: 200, unit: 'watts' });
    expect(note).toBe('Sweet Spot Intervals');
  });
});

// ── buildCyclingWorkoutsFromProtocols ─────────────────────────────────────────

describe('buildCyclingWorkoutsFromProtocols', () => {
  const mockRows = [
    {
      wp_id: 'wp-1',
      slug: 'zone2-steady',
      name: 'Zone 2 Steady',
      tags_json: JSON.stringify(['sub_goal:build_fitness', 'workout_type:endurance']),
      step_order: 1,
      step_type: 'steady',
      duration_sec: 2700,
      intensity_json: JSON.stringify({ power_pct_low: 60, power_pct_high: 70 }),
      notes_json: JSON.stringify({ label: 'Zone 2' }),
      sets: 1,
    },
    {
      wp_id: 'wp-1',
      slug: 'zone2-steady',
      name: 'Zone 2 Steady',
      tags_json: JSON.stringify(['sub_goal:build_fitness', 'workout_type:endurance']),
      step_order: 2,
      step_type: 'cooldown',
      duration_sec: 300,
      intensity_json: JSON.stringify({ power_pct_low: 50, power_pct_high: 55 }),
      notes_json: JSON.stringify({ label: 'Cool-down' }),
      sets: 1,
    },
  ];

  it('groups multiple steps into one workout', () => {
    const workouts = buildCyclingWorkoutsFromProtocols(mockRows);
    expect(workouts).toHaveLength(1);
  });

  it('extracts sub_goal from tags', () => {
    const [w] = buildCyclingWorkoutsFromProtocols(mockRows);
    expect(w.sub_goal).toBe('build_fitness');
  });

  it('extracts workout_type from tags', () => {
    const [w] = buildCyclingWorkoutsFromProtocols(mockRows);
    expect(w.workout_type).toBe('endurance');
  });

  it('computes duration_min from steps', () => {
    const [w] = buildCyclingWorkoutsFromProtocols(mockRows);
    expect(w.duration_min).toBe(Math.round((2700 + 300) / 60));
  });

  it('serializes intervals as JSON string', () => {
    const [w] = buildCyclingWorkoutsFromProtocols(mockRows);
    expect(() => JSON.parse(w.intervals_json)).not.toThrow();
    const intervals = JSON.parse(w.intervals_json);
    expect(intervals).toHaveLength(2);
    expect(intervals[0].label).toBe('Zone 2');
  });

  it('returns empty array for empty rows', () => {
    expect(buildCyclingWorkoutsFromProtocols([])).toHaveLength(0);
  });
});
