// UX review finding 3 — exerciseInstructions(): steps, cues and body-mode notes in the
// user's language, from the *_nl keys migration 0126 puts inside instructions_json.
// English readers see the stored English, unchanged. Each language loads its own
// module instance, because i18n.js caches the language on first read.
import { describe, it, expect, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

async function load(lang) {
  vi.resetModules();
  const store = new Map(lang ? [['jf_lang', lang]] : []);
  vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
  return import('../src/i18n.js');
}
afterEach(() => vi.unstubAllGlobals());

const instr = {
  steps: ['Start in a high plank.', 'Lower your chest.'],
  cues: ['💡 Ribs down.'],
  steps_nl: ['Start in een hoge plank.', 'Laat je borst zakken.'],
  cues_nl: ['💡 Ribben omlaag.'],
  pregnancy_note: 'Stop if it pulls.', pregnancy_note_nl: 'Stop als het trekt.',
  postnatal_note: 'Rebuild slowly.', postnatal_note_nl: 'Bouw rustig op.',
  why: 'Builds pushing strength.', muscle_target: 'Chest & Triceps',
};
const row = { instructions_json: JSON.stringify(instr) };

describe('exerciseInstructions — Dutch reader', () => {
  it('returns the Dutch steps, cues and notes', async () => {
    const i18n = await load('nl');
    const r = i18n.exerciseInstructions(row);
    expect(r.steps).toEqual(instr.steps_nl);
    expect(r.cues).toEqual(instr.cues_nl);
    expect(r.pregnancy_note).toBe('Stop als het trekt.');
    expect(r.postnatal_note).toBe('Bouw rustig op.');
    expect(r.why).toBe(instr.why);              // still resolved through t() by the caller
  });
  it('is Dutch by default (no stored language)', async () => {
    const i18n = await load(null);
    expect(i18n.exerciseInstructions(row).steps[0]).toBe('Start in een hoge plank.');
  });
  it('falls back to English for an untranslated row', async () => {
    const i18n = await load('nl');
    const r = i18n.exerciseInstructions({ instructions_json: JSON.stringify({ steps: ['A'], cues: ['B'], pregnancy_note: 'C' }) });
    expect(r.steps).toEqual(['A']);
    expect(r.cues).toEqual(['B']);
    expect(r.pregnancy_note).toBe('C');
  });
  it('falls back per list when the English changed length after translation', async () => {
    const i18n = await load('nl');
    const r = i18n.exerciseInstructions({ instructions_json: JSON.stringify({ ...instr, steps: ['One', 'Two', 'Three'] }) });
    expect(r.steps).toEqual(['One', 'Two', 'Three']);
    expect(r.cues).toEqual(instr.cues_nl);
  });
  it('accepts an already-parsed object, and is null for nothing or broken JSON', async () => {
    const i18n = await load('nl');
    expect(i18n.exerciseInstructions({ instructions_json: instr }).steps).toEqual(instr.steps_nl);
    expect(i18n.exerciseInstructions({ instructions_json: null })).toBeNull();
    expect(i18n.exerciseInstructions({ instructions_json: '{not json' })).toBeNull();
    expect(i18n.exerciseInstructions(null)).toBeNull();
  });
  it('setLang("en") switches back without a reload', async () => {
    const i18n = await load('nl');
    expect(i18n.exerciseInstructions(row).steps).toEqual(instr.steps_nl);
    i18n.setLang('en');
    expect(i18n.exerciseInstructions(row).steps).toEqual(instr.steps);
  });
});

describe('exerciseInstructions — English reader sees nothing change', () => {
  it('returns the stored object as it is', async () => {
    const i18n = await load('en');
    const r = i18n.exerciseInstructions(row);
    expect(r.steps).toEqual(instr.steps);
    expect(r.cues).toEqual(instr.cues);
    expect(r.pregnancy_note).toBe('Stop if it pulls.');
    expect(r.postnatal_note).toBe('Rebuild slowly.');
  });
});

describe('WorkoutView reads instructions only through the helper', () => {
  it('no JSON.parse of instructions_json left in the view', () => {
    const src = readFileSync(fileURLToPath(new URL('../src/WorkoutView.jsx', import.meta.url)), 'utf8');
    expect(src).not.toMatch(/JSON\.parse\([^)]*instructions_json/);
    expect((src.match(/exerciseInstructions\(/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });
});
