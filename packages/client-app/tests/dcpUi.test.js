// coach-dcp release 1 — the DCP's shared decisions (src/dcpUi.js) and the one
// stored shape of military_coach.dcp (normalizeDcp, functions/api/_shared/military.js).
import { describe, it, expect, vi, afterEach } from 'vitest';
import { dcpMeasureLabel, dcpMeasurePlanned, parseBirthYear, dcpNormsFor } from '../src/dcpUi.js';
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
