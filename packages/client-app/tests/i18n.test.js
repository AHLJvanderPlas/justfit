// Builder v1.5 — exerciseName(): the one way an exercise name is shown. Dutch
// when the language is Dutch AND the row has a Dutch name; otherwise `name`.
// English readers see nothing change. Each language loads its own module
// instance, because i18n.js caches the language on first read.
import { describe, it, expect, afterEach, vi } from 'vitest';

async function load(lang) {
  vi.resetModules();
  const store = new Map(lang ? [['jf_lang', lang]] : []);
  vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
  return {
    i18n: await import('../src/i18n.js'),
    own: await import('../src/ownTraining.js'),
    meta: await import('../src/templateMeta.js'),
  };
}
afterEach(() => vi.unstubAllGlobals());

const pushUp = { name: 'Push-up', name_nl: 'Opdrukken' };

describe('exerciseName — Dutch reader', () => {
  it('shows name_nl when it is set', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName(pushUp)).toBe('Opdrukken');
  });
  it('falls back to name when name_nl is empty, null or absent', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName({ name: 'Push-up', name_nl: '' })).toBe('Push-up');
    expect(i18n.exerciseName({ name: 'Push-up', name_nl: null })).toBe('Push-up');
    expect(i18n.exerciseName({ name: 'Push-up' })).toBe('Push-up');
  });
  it('Dutch is the default when no language is stored', async () => {
    const { i18n } = await load(null);
    expect(i18n.exerciseName(pushUp)).toBe('Opdrukken');
  });
  it('a missing row is an empty string, never a crash', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName(null)).toBe('');
    expect(i18n.exerciseName(undefined)).toBe('');
  });
  it('setLang("en") switches the label without a reload', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName(pushUp)).toBe('Opdrukken');
    i18n.setLang('en');
    expect(i18n.exerciseName(pushUp)).toBe('Push-up');
  });
});

describe('exerciseName — English reader sees nothing change', () => {
  it('always name, even when name_nl is set', async () => {
    const { i18n } = await load('en');
    expect(i18n.exerciseName(pushUp)).toBe('Push-up');
    expect(i18n.exerciseName({ name: 'Plank', name_nl: 'Plank' })).toBe('Plank');
  });
});

describe('its callers', () => {
  const rows = [{ ex: pushUp }, { ex: { name: 'Plank', name_nl: 'Plank' } }, { ex: { name: 'Air Squat', name_nl: 'Squat zonder gewicht' } }];
  it('sessionName: an unsaved session is "Opdrukken + Plank" in Dutch, "Push-up + Plank" in English', async () => {
    expect((await load('nl')).own.sessionName(rows)).toBe('Opdrukken + Plank');
    expect((await load('en')).own.sessionName(rows)).toBe('Push-up + Plank');
  });
  it('sessionName: plain plan steps carry the names directly', async () => {
    expect((await load('nl')).own.sessionName([pushUp, { name: 'Plank' }])).toBe('Opdrukken + Plank');
  });
  it('templateNames reads step_names_nl row for row, English names where it is null', async () => {
    const tpl = { step_names: ['Push-up', 'Gym press', 'Air Squat'], step_names_nl: ['Opdrukken', null, 'Squat zonder gewicht'] };
    expect((await load('nl')).meta.templateNames(tpl)).toBe('Opdrukken · Gym press · Squat zonder gewicht');
    expect((await load('en')).meta.templateNames(tpl)).toBe('Push-up · Gym press · Air Squat');
  });
  it('templateNames from a server that sent no Dutch names', async () => {
    expect((await load('nl')).meta.templateNames({ step_names: ['Push-up'] })).toBe('Push-up');
  });
});
