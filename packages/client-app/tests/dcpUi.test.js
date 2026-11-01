// coach-dcp release 1 — the DCP's shared decisions (src/dcpUi.js) and the one
// stored shape of military_coach.dcp (normalizeDcp, functions/api/_shared/military.js).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { dcpMeasureLabel, dcpMeasurePlanned, parseBirthYear, dcpNormsFor, maxEffortMeta } from '../src/dcpUi.js';
import { normalizeDcp } from '../../../functions/api/_shared/military.js';

describe('dcpMeasureLabel — one button, three states', () => {
  it('never measured → the baseline', () => {
    expect(dcpMeasureLabel({ never: true, planned: false })).toBe('Schedule baseline');
  });
  it('measured before → the retest', () => {
    expect(dcpMeasureLabel({ never: false, planned: false })).toBe('Schedule retest');
  });
  it('already in today\'s session wins over both', () => {
    expect(dcpMeasureLabel({ never: true, planned: true })).toBe("Measurement is in today's session");
    expect(dcpMeasureLabel({ never: false, planned: true })).toBe("Measurement is in today's session");
  });
  it('reads in Dutch as the plan says', async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: () => 'nl', setItem() {}, removeItem() {} });
    vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
    const { t } = await import('../src/i18n.js');
    expect(t(dcpMeasureLabel({ never: true, planned: false }))).toBe('Nulmeting inplannen');
    expect(t(dcpMeasureLabel({ never: false, planned: false }))).toBe('Hermeting inplannen');
    expect(t(dcpMeasureLabel({ never: true, planned: true }))).toBe('Meting staat in je sessie van vandaag');
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('dcpMeasurePlanned — a measurement done today is no longer waiting', () => {
  const now = Date.parse('2026-11-01T15:00:00');
  it('not in the plan → not planned', () => {
    expect(dcpMeasurePlanned({ assessmentPlanned: false, lastAtMs: null, nowMs: now })).toBe(false);
  });
  it('in the plan, never measured or measured on an earlier day → planned', () => {
    expect(dcpMeasurePlanned({ assessmentPlanned: true, lastAtMs: null, nowMs: now })).toBe(true);
    expect(dcpMeasurePlanned({ assessmentPlanned: true, lastAtMs: now - 50 * 86400000, nowMs: now })).toBe(true);
  });
  it('in the plan but measured today → done, not planned', () => {
    expect(dcpMeasurePlanned({ assessmentPlanned: true, lastAtMs: now - 3600000, nowMs: now })).toBe(false);
  });
});

describe('parseBirthYear and dcpNormsFor', () => {
  it('four digits, 1930–2015, or null', () => {
    expect(parseBirthYear('1990')).toBe(1990);
    expect(parseBirthYear(' 1930 ')).toBe(1930);
    expect(parseBirthYear('2015')).toBe(2015);
    for (const bad of ['1929', '2016', '199', '19900', 'abcd', '', null, undefined, '1990.5']) expect(parseBirthYear(bad)).toBe(null);
  });
  it('a norm only with a sex set and a table for it', () => {
    const now = Date.parse('2026-11-01T12:00:00Z');
    expect(dcpNormsFor('male', 1990, now)).toEqual({ maxAge: 40, pushups: 16, situps: 24, run_m: 2200 });
    expect(dcpNormsFor(null, 1990, now)).toBe(null);
    expect(dcpNormsFor('female', 1990, now)).toBe(null);   // not transcribed — never the male table
    expect(dcpNormsFor('male', null, now)).toBe(null);
  });
});

describe('normalizeDcp — the one stored shape', () => {
  it('coerces the two switches to booleans', () => {
    expect(normalizeDcp({ enabled: 'true', bias_enabled: 1, birth_year: 1990 })).toEqual({ enabled: true, bias_enabled: true, birth_year: 1990 });
    expect(normalizeDcp({ enabled: 'yes', bias_enabled: 0, birth_year: 1990 })).toEqual({ enabled: false, bias_enabled: false, birth_year: 1990 });
  });
  it('drops a birth year that is not an integer in 1930–2015 — and the DCP cannot be on without one', () => {
    expect(normalizeDcp({ enabled: true, birth_year: '1990' }).birth_year).toBe(1990);
    for (const bad of [1929, 2016, 1990.5, 'abc', null, '']) {
      const d = normalizeDcp({ enabled: true, bias_enabled: true, birth_year: bad });
      expect(d).not.toHaveProperty('birth_year');
      expect(d.enabled).toBe(false);
      expect(d.bias_enabled).toBe(true);
    }
  });
  it('keeps the stored measurement over the one the client sent', () => {
    const stored = { last: { pushups: 22, situps: 30, at_ms: 2000 } };
    expect(normalizeDcp({ enabled: true, birth_year: 1990, last: { pushups: 5, situps: 5, at_ms: 1000 } }, stored).last)
      .toEqual({ pushups: 22, situps: 30, at_ms: 2000 });
    expect(normalizeDcp({ enabled: true, birth_year: 1990, last: { pushups: 18, situps: 20, at_ms: 1000 } }).last)
      .toEqual({ pushups: 18, situps: 20, at_ms: 1000 });
    expect(normalizeDcp({ enabled: false, birth_year: 1990 }, stored).last).toEqual(stored.last);   // switching off keeps it
  });
  it('drops unknown keys, keeps a valid test_date, and refuses a non-object', () => {
    expect(normalizeDcp({ enabled: true, birth_year: 1990, isPro: true, test_date: '2027-03-01', junk: 1 }))
      .toEqual({ enabled: true, bias_enabled: false, birth_year: 1990, test_date: '2027-03-01' });
    expect(normalizeDcp({ birth_year: 1990, test_date: 'soon' })).not.toHaveProperty('test_date');
    for (const bad of [null, undefined, 'on', [], 3]) expect(normalizeDcp(bad)).toBe(null);
  });
});

describe('maxEffortMeta — a measurement set never shows a rep count', () => {
  it('"Max · 2 min" from the protocol window, whatever target_reps defaults to', () => {
    expect(maxEffortMeta({ max_effort: true, measure_window_sec: 120, target_duration_sec: 120 })).toEqual(['Max · {m} min', { m: 2 }]);
    expect(maxEffortMeta({ max_effort: true, target_duration_sec: 90 })).toEqual(['Max · {m} min', { m: 1.5 }]);
    expect(maxEffortMeta({ max_effort: true })).toEqual(['Max · {m} min', { m: 2 }]);
  });
  it('null for an ordinary step', () => {
    expect(maxEffortMeta({ sets: 3, target_reps: 10 })).toBe(null);
    expect(maxEffortMeta(null)).toBe(null);
  });
});

// ─── coach-dcp release 2 — rows with both tiers, one date rule ────────────────
import { dcpRows, dcpHeaderDate } from '../src/dcpUi.js';

describe('dcpRows — every row names the minimum AND the safe tier', () => {
  const norms = { pushups: 16, situps: 24, run_m: 2200 };
  it('never measured: "0 / 16 (safe 19)" and "0 / 24 (safe 29)"', () => {
    const rows = dcpRows({ enabled: true }, norms);
    expect(rows.map((r) => r.key)).toEqual(['pushups', 'situps']);
    expect(rows[0].score).toEqual(['{v} / {min} (safe {safe})', { v: 0, min: 16, safe: 19 }]);
    expect(rows[1].score).toEqual(['{v} / {min} (safe {safe})', { v: 0, min: 24, safe: 29 }]);
    expect(rows[0].p.tier).toBe('below');
  });
  it('measured: the value fills in; the minimum stays the minimum after it is cleared', () => {
    const rows = dcpRows({ last: { pushups: 17, situps: 15, at_ms: 1 } }, norms);
    expect(rows[0].score[1]).toEqual({ v: 17, min: 16, safe: 19 });
    expect(rows[0].p.tier).toBe('minimum');
    expect(rows[1].score[1]).toEqual({ v: 15, min: 24, safe: 29 });
  });
  it('the safe figure is the bias floor (+20 %) — the trace\'s 19 is the card\'s 19', () => {
    expect(dcpRows({}, norms)[0].safe).toBe(Math.round(16 * 1.2));
  });
  it('no norms (no sex / no table) → no rows', () => {
    expect(dcpRows({}, null)).toEqual([]);
  });
  it('reads in Dutch as the design says: "0 / 16 (veilig 19)"', async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: () => 'nl', setItem() {}, removeItem() {} });
    vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
    const { t } = await import('../src/i18n.js');
    const [key, vars] = dcpRows({}, norms)[0].score;
    expect(t(key, vars)).toBe('0 / 16 (veilig 19)');
  });
});

describe('dcpHeaderDate — the shared date rule', () => {
  const now = Date.parse('2026-11-01T09:00:00');
  const keuring = { active: true, mode: 'target', target_date: '2026-12-31' };
  it('the DCP\'s own test date wins', () => {
    expect(dcpHeaderDate({ test_date: '2026-11-11' }, keuring, now)).toEqual({ kind: 'test', days: 10, date: '2026-11-11' });
  });
  it('no test date but a keuring date → the keuring date, never "no date"', () => {
    expect(dcpHeaderDate({}, keuring, now)).toEqual({ kind: 'keuring', days: 60 });
  });
  it('no keuring date while the coach is off, or in open mode → none', () => {
    expect(dcpHeaderDate({}, { ...keuring, active: false }, now)).toEqual({ kind: 'none' });
    expect(dcpHeaderDate({}, { ...keuring, mode: 'open' }, now)).toEqual({ kind: 'none' });
    expect(dcpHeaderDate({}, null, now)).toEqual({ kind: 'none' });
  });
});
