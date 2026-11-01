// UAT release 5 — Settings that grow with the user: the Geavanceerd rows and their current values,
// the birth-year hint, chips that save on tap (and revert), the once-per-account coaching card.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { advancedRows, ADVANCED_ROW_IDS, minutesLabel } from '../src/settingsAdvanced.js';
import { birthYearState } from '../src/dcpUi.js';
import { runChipSave, saveOk, chipStatusText, CHIP_SAVED_MS } from '../src/chipSave.js';
import { coachingCardVisible, readCoachingCard, writeCoachingCard, coachingCardKey } from '../src/coachingCard.js';

const base = {
  checkinMode: 'once_a_day', planDuration: 45, advancedSchedule: false,
  timeOverhead: { enabled: false, short: { presets: {}, custom: [] }, long: { presets: {}, custom: [] } },
  equipment: ['none'], sportPrefs: { sports: [], primary: 'none' }, dailyReplan: false, isPro: true, blockedWeekdays: [],
};
const row = (rows, id) => rows.find((r) => r.id === id);

describe('advancedRows — nine rows, each with its current value', () => {
  it('lists the rows in the agreed order', () => {
    expect(advancedRows(base).map((r) => r.id)).toEqual(ADVANCED_ROW_IDS);
    expect(ADVANCED_ROW_IDS).toEqual(['checkin', 'schedule', 'overhead', 'equipment', 'sports', 'bias', 'polarised', 'replan', 'rest']);
  });
  it('every row has a title, one sentence and a value', () => {
    for (const r of advancedRows(base)) { expect(r.title).toBeTruthy(); expect(r.sentence).toBeTruthy(); expect(r.value).toBeTruthy(); }
  });
  it('shows the check-in mode ("Dagelijkse check-in · Eén keer per dag")', () => {
    expect(row(advancedRows(base), 'checkin').value).toBe('Once a day');
    expect(row(advancedRows({ ...base, checkinMode: 'manual' }), 'checkin').value).toBe('Manual');
    expect(row(advancedRows({ ...base, checkinMode: 'every_time' }), 'checkin').value).toBe('Every time');
  });
  it('shows the session length, or "per day" when the weekly schedule is on', () => {
    expect(row(advancedRows(base), 'schedule').value).toBe('45 min');
    expect(row(advancedRows({ ...base, planDuration: 60 }), 'schedule').value).toBe('1h');
    expect(row(advancedRows({ ...base, advancedSchedule: true }), 'schedule').value).toBe('Per day of the week');
    expect(minutesLabel(90)).toBe('1.5h');
  });
  it('shows overhead only when it is on AND something is set', () => {
    expect(row(advancedRows(base), 'overhead').value).toBe('Not set');
    const oh = { enabled: true, short: { presets: { shower: 5 }, custom: [] }, long: { presets: { shower: 10, change_clothes: 5 }, custom: [{ label: 'x', minutes: 5 }] } };
    const tr = (k, v) => (v ? k.replace('{a}', v.a).replace('{b}', v.b) : k);
    expect(row(advancedRows({ ...base, timeOverhead: oh }, tr), 'overhead').value).toBe('Quick 5 min · Full 20 min');
    expect(row(advancedRows({ ...base, timeOverhead: { ...oh, enabled: false } }), 'overhead').value).toBe('Not set');
  });
  it('lists the equipment and the sports, shortening past three', () => {
    const names = { equipment: (v) => ({ dumbbells: 'Dumbbells', barbell: 'Barbell', kettlebell: 'Kettlebell', bench: 'Bench' })[v] ?? v, sport: (v) => v };
    expect(row(advancedRows(base, undefined, names), 'equipment').value).toBe('No equipment — bodyweight only');
    expect(row(advancedRows({ ...base, equipment: ['dumbbells', 'barbell'] }, undefined, names), 'equipment').value).toBe('Dumbbells, Barbell');
    expect(row(advancedRows({ ...base, equipment: ['dumbbells', 'barbell', 'kettlebell', 'bench'] }, undefined, names), 'equipment').value).toBe('Dumbbells, Barbell +2');
    expect(row(advancedRows(base), 'sports').value).toBe('No sports selected');
    expect(row(advancedRows({ ...base, sportPrefs: { sports: ['padel'] } }), 'sports').value).toBe('padel');
  });
  it('bias defaults to On; polarised and replan say Pro only without Pro', () => {
    expect(row(advancedRows(base), 'bias').value).toBe('On');
    expect(row(advancedRows({ ...base, sportPrefs: { bias_enabled: false } }), 'bias').value).toBe('Off');
    expect(row(advancedRows(base), 'polarised').value).toBe('Off');
    expect(row(advancedRows({ ...base, sportPrefs: { polarised_training: true } }), 'polarised').value).toBe('On');
    expect(row(advancedRows({ ...base, dailyReplan: true }), 'replan').value).toBe('On');
    const free = advancedRows({ ...base, isPro: false, dailyReplan: true });
    expect(row(free, 'polarised').value).toBe('Pro only');
    expect(row(free, 'replan').value).toBe('Pro only');
  });
  it('rest days read Monday-first, and "Not set" when none', () => {
    expect(row(advancedRows(base), 'rest').value).toBe('Not set');
    expect(row(advancedRows({ ...base, blockedWeekdays: [0, 3, 1] }), 'rest').value).toBe('Mon, Wed, Sun');
  });
});

describe('birthYearState — neutral until the user types; amber only for an invalid year', () => {
  it('empty → neutral', () => { expect(birthYearState('')).toBe('empty'); expect(birthYearState(undefined)).toBe('empty'); });
  it('a half-typed year is not an error until the field is left', () => {
    expect(birthYearState('19')).toBe('typing');
    expect(birthYearState('19', true)).toBe('invalid');
  });
  it('1930–2015 is valid, outside is invalid, non-numeric is invalid', () => {
    expect(birthYearState('1930')).toBe('valid');
    expect(birthYearState('2015')).toBe('valid');
    expect(birthYearState('1929')).toBe('invalid');
    expect(birthYearState('2016')).toBe('invalid');
    expect(birthYearState('19a0')).toBe('invalid');
  });
});

describe('chip save — shows "Saved", and a failed tap reverts', () => {
  const run = async (persist) => {
    const states = []; const revert = vi.fn(); const timers = [];
    const ok = await runChipSave({ persist, revert, setStatus: (s) => states.push(s), schedule: (fn, ms) => timers.push([fn, ms]) });
    return { ok, states, revert, timers };
  };
  it('a landed write: saving → saved, cleared after ~1.5 s, nothing reverted', async () => {
    const r = await run(async () => ({ ok: true }));
    expect(r.ok).toBe(true);
    expect(r.states).toEqual(['saving', 'saved']);
    expect(r.revert).not.toHaveBeenCalled();
    expect(r.timers[0][1]).toBe(CHIP_SAVED_MS);
    expect(CHIP_SAVED_MS).toBeGreaterThanOrEqual(1200); expect(CHIP_SAVED_MS).toBeLessThanOrEqual(2000);
  });
  it('a server error answer reverts and says error', async () => {
    const r = await run(async () => ({ error: 'nope' }));
    expect(r.ok).toBe(false); expect(r.states).toEqual(['saving', 'error']); expect(r.revert).toHaveBeenCalledTimes(1);
  });
  it('a network failure reverts too', async () => {
    const r = await run(async () => { throw new Error('offline'); });
    expect(r.ok).toBe(false); expect(r.revert).toHaveBeenCalledTimes(1);
  });
  it('saveOk is strict about what counts as saved', () => {
    expect(saveOk({ ok: true })).toBe(true);
    expect(saveOk({})).toBe(true);
    expect(saveOk(null)).toBe(false);
    expect(saveOk({ ok: false })).toBe(false);
    expect(saveOk({ error: 'x' })).toBe(false);
  });
  it('the status line text', () => {
    expect(chipStatusText('saved')).toBe('Saved');
    expect(chipStatusText('error')).toBe('Not saved — try again');
    expect(chipStatusText('')).toBe('');
  });
});

describe('the Specialistische coaching card — once per account, general path only', () => {
  const general = { preferences: {} };
  const mil = { preferences: { military_coach: { active: true }, primary_intent: 'military' } };
  const run = { preferences: { run_coach: { enrolled: true, completed: false } } };
  const cyc = { preferences: { cycling_coach: { active: true } } };
  const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v) }; };
  it('shows from the third session on the general path', () => {
    expect(coachingCardVisible({ prefs: general, sessions: 2, stored: null })).toBe(false);
    expect(coachingCardVisible({ prefs: general, sessions: 3, stored: null })).toBe(true);
  });
  it('never when a non-general path is active', () => {
    for (const prefs of [mil, run, cyc]) expect(coachingCardVisible({ prefs, sessions: 40, stored: null })).toBe(false);
  });
  it('a completed run coach is not an active path', () => {
    expect(coachingCardVisible({ prefs: { preferences: { run_coach: { enrolled: true, completed: true } } }, sessions: 5, stored: null })).toBe(true);
  });
  it('once: seen on an earlier visit hides it; dismissed hides it', () => {
    expect(coachingCardVisible({ prefs: general, sessions: 9, stored: 'seen' })).toBe(false);
    expect(coachingCardVisible({ prefs: general, sessions: 9, stored: 'dismissed' })).toBe(false);
  });
  it('one key per account; the old global "1" counts as dismissed', () => {
    expect(coachingCardKey('u1')).toBe('jf_coach_discovery_dismissed_u1');
    const s = mem();
    expect(readCoachingCard(s, 'u1')).toBe(null);
    writeCoachingCard(s, 'u1', 'seen');
    expect(readCoachingCard(s, 'u1')).toBe('seen');
    expect(readCoachingCard(s, 'u2')).toBe(null);
    s.setItem('jf_coach_discovery_dismissed', '1');
    expect(readCoachingCard(s, 'u2')).toBe('dismissed');
  });
});

describe('Dutch — the new keys, and one "Weergave"', () => {
  const KEYS = JSON.parse(readFileSync(new URL('./uatRelease5.keys.json', import.meta.url), 'utf8'));
  const load = async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: () => 'nl', setItem() {}, removeItem() {} });
    vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
    return import('../src/i18n.js');
  };
  it('every release-5 key has its own Dutch value with the same {placeholders}', async () => {
    const { t } = await load();
    const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    expect(KEYS.filter((k) => !t(k) || t(k) === k || vars(t(k)) !== vars(k))).toEqual([]);
  });
  it('"Theme" and "Appearance" no longer both read "Weergave"', async () => {
    const { t } = await load();
    expect(t('Appearance')).toBe('Weergave');
    expect(t('Theme')).not.toBe(t('Appearance'));
  });
  it('the three texts the plan names', async () => {
    const { t } = await load();
    expect(t('Not saved — try again')).toBe('Niet opgeslagen — probeer opnieuw');
    expect(t('Birth year needed for the norm')).toBe('Geboortejaar nodig voor de norm');
    expect(t('Add email')).toBe('E-mail toevoegen');
    expect(t('Advanced settings')).toBe('Geavanceerd');
  });
});
