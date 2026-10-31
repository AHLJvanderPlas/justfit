// v1.2 — the Hergebruiken row: names line and the meta line with "laatst gedaan".
import { describe, it, expect, beforeAll, vi } from 'vitest';

let templateMeta, templateNames;
beforeAll(async () => {
  const store = new Map([['jf_lang', 'nl']]);
  vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  ({ templateMeta, templateNames } = await import('../src/templateMeta.js'));
});
const tpl = (extra = {}) => ({ steps: [{}, {}, {}], est_minutes: 12, ...extra });

describe('templateMeta', () => {
  it('minutes and count only when never done', () => {
    expect(templateMeta(tpl())).toBe('≈ 12 min · 3 oefeningen');
    expect(templateMeta(tpl({ last_done_at: null }))).toBe('≈ 12 min · 3 oefeningen');
  });
  it('appends "laatst gedaan" with the Dutch day label', () => {
    expect(templateMeta(tpl({ last_done_at: '2026-10-28' }))).toBe('≈ 12 min · 3 oefeningen · laatst gedaan wo 28 okt');
  });
  it('singular for one exercise, no minutes when unknown', () => {
    expect(templateMeta({ steps: [{}], est_minutes: null })).toBe('1 oefening');
  });
});

describe('templateNames', () => {
  it('joins the first names with a middle dot', () => {
    expect(templateNames({ step_names: ['Push-up', 'Plank', 'Air Squat'] })).toBe('Push-up · Plank · Air Squat');
  });
  it('is null when the server sent none', () => {
    expect(templateNames({})).toBeNull();
    expect(templateNames({ step_names: [] })).toBeNull();
  });
});
