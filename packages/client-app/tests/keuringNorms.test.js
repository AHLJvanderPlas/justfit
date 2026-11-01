// coach-dcp release 2 — the one keuring table (src/keuringNorms.js): the Waar sta ik
// keuring card rows (fix 6) and the level label that says "not measured" until a
// measurement exists (fix 8).
import { describe, it, expect } from 'vitest';
import { KEURING_NORMS, COOPER_THRESHOLDS, cooperLevel, keuringRows, keuringDaysOut, milLevelLabel, milLevelMeasured, keuringCardVisible, anyNormOn } from '../src/keuringNorms.js';

describe('KEURING_NORMS — one table, every cluster', () => {
  it('has KB–K6 with the fields every reader needs', () => {
    expect(Object.keys(KEURING_NORMS)).toEqual(['0', '1', '2', '3', '4', '5', '6']);
    for (const n of Object.values(KEURING_NORMS)) {
      expect(n).toEqual(expect.objectContaining({ cooper_m: expect.any(Number), pushups: expect.any(Number), pullups: expect.any(Number), march: expect.stringMatching(/^\d\d:\d\d$/), march_kg: expect.any(Number) }));
    }
  });
  it('the Cooper thresholds are the table, in level order (the old CoachView array)', () => {
    expect(COOPER_THRESHOLDS).toEqual([0, 1800, 2000, 2200, 2400, 2600, 2800]);
  });
  it('cooperLevel: the highest level the distance reaches; none without a distance', () => {
    expect(cooperLevel(null)).toBeNull();
    expect(cooperLevel(0)).toBeNull();
    expect(cooperLevel(1700)).toBe(0);
    expect(cooperLevel(2200)).toBe(3);
    expect(cooperLevel(2350)).toBe(3);
    expect(cooperLevel(3100)).toBe(6);
  });
});

describe('keuringRows — the Keuring card against the target cluster', () => {
  const mil = { active: true, track: 'keuring', mode: 'target', cluster_target: 3, last_cooper_distance_m: 2350, last_cooper_at_ms: Date.parse('2026-10-12T10:00:00') };
  const rows = keuringRows(mil, KEURING_NORMS[3]);
  it('four rows: run, push-ups, pull-ups, march', () => {
    expect(rows.map((r) => r.key)).toEqual(['run', 'pushups', 'pullups', 'march']);
  });
  it('the run row is the last Cooper distance vs the cluster threshold, with its date', () => {
    expect(rows[0]).toMatchObject({ value: 2350, target: 2200, unit: 'm', met: true, at_ms: mil.last_cooper_at_ms, pct: 100 });
  });
  it('rows with no measurement carry value null (shown as "nog niet gemeten"), never a guess', () => {
    for (const r of rows.slice(1)) { expect(r.value).toBeNull(); expect(r.met).toBe(false); }
    expect(rows[1].target).toBe(27);
    expect(rows[2].target).toBe(5);
  });
  it('the march row names the pack weight and the time standard', () => {
    expect(rows[3].label).toEqual(['March {kg} kg', { kg: 15 }]);
    expect(rows[3].target).toBe('33:00');
  });
  it('defaults to the cluster_target row when no norms are passed; a short run is not met', () => {
    const r = keuringRows({ cluster_target: 5, last_cooper_distance_m: 2400 });
    expect(r[0]).toMatchObject({ target: 2600, met: false, pct: 92 });
    expect(r[1].target).toBe(30);
  });
  it('no Cooper yet → the run row is unmeasured too', () => {
    expect(keuringRows({ cluster_target: 3 })[0]).toMatchObject({ value: null, met: false, pct: 0 });
  });
});

describe('keuringDaysOut — the countdown', () => {
  const now = Date.parse('2026-11-01T09:00:00');
  it('days to target_date in target mode', () => {
    expect(keuringDaysOut({ mode: 'target', target_date: '2026-12-31' }, now)).toBe(60);
  });
  it('null without a date, or in fit/open mode', () => {
    expect(keuringDaysOut({ mode: 'target' }, now)).toBeNull();
    expect(keuringDaysOut({ mode: 'open', target_date: '2026-12-31' }, now)).toBeNull();
  });
});

describe('milLevelLabel — the level is shown only once it is measured (fix 8)', () => {
  it('no Cooper, no keuring measurement → the pill names the track; the line says "not measured · goal K3"', () => {
    const l = milLevelLabel({ track: 'keuring', cluster_current: 1, cluster_target: 3 });
    expect(l.measured).toBe(false);
    expect(l.level).toBeNull();
    expect(l.pill).toEqual(['KEURING']);
    expect(l.line).toEqual(['Level not measured yet · goal {goal}', { goal: 'K3' }]);
  });
  it('the self-declared cluster_current never appears before a measurement', () => {
    const l = milLevelLabel({ track: 'keuring', cluster_current: 1, cluster_target: 3 });
    expect(JSON.stringify(l)).not.toContain('K1');
  });
  it('after a Cooper test → the level the Cooper distance reaches, and the goal', () => {
    const mil = { track: 'keuring', cluster_current: 1, cluster_target: 3, last_cooper_distance_m: 2050 };
    expect(milLevelMeasured(mil)).toBe(true);
    expect(milLevelLabel(mil)).toMatchObject({ measured: true, level: 'K2', goal: 'K3', pill: ['K2'], line: ['{level} · goal {goal}', { level: 'K2', goal: 'K3' }] });
  });
  it('the measured level never comes from the self-declared cluster_current', () => {
    expect(milLevelLabel({ track: 'keuring', cluster_current: 1, cluster_target: 3, last_cooper_distance_m: 2350 }).level).toBe('K3');
  });
  it('opleiding track → OPLEIDING pill, O-levels', () => {
    expect(milLevelLabel({ track: 'opleiding', cluster_target: 4 })).toMatchObject({ pill: ['OPLEIDING'], goal: 'O4' });
  });
  it('a keuring measurement counts as measured too', () => {
    expect(milLevelMeasured({ last_keuring: { pushups: 20 } })).toBe(true);
    expect(milLevelMeasured({ last_keuring: {} })).toBe(false);
  });
});

describe('which norm cards show — and when the general battery stays', () => {
  const p = (mc) => ({ preferences: { military_coach: mc } });
  it('keuring card: military coach active on the keuring track only', () => {
    expect(keuringCardVisible({ active: true })).toBe(true);
    expect(keuringCardVisible({ active: true, track: 'opleiding' })).toBe(false);
    expect(keuringCardVisible({ active: false, track: 'keuring' })).toBe(false);
  });
  it('anyNormOn: keuring, or the DCP in play (coach or bias); otherwise the battery stays', () => {
    expect(anyNormOn(p({ active: true, track: 'keuring' }))).toBe(true);
    expect(anyNormOn(p({ active: false, dcp: { enabled: true, bias_enabled: true } }))).toBe(true);
    expect(anyNormOn(p({ active: false, dcp: { enabled: true, bias_enabled: false } }))).toBe(false);
    expect(anyNormOn({})).toBe(false);
  });
});
