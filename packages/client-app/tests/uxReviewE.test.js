// UX review E (2026-11-16) — onboarding, login and the builder labels: the source guards smoke runs, and the
// strings the new controls read in Dutch.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { EQUIPMENT_OPTIONS, EXPERIENCE } from '../src/appConstants.js';
import { t } from '../src/i18n.js';

const rd = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');

describe('uxE.scan.mjs (smoke)', () => {
  it('passes on the source', () => {
    let out = '';
    try { execFileSync('node', ['scripts/uxE.scan.mjs'], { cwd: new URL('../../../', import.meta.url), encoding: 'utf8' }); } catch (e) { out = String(e.stdout); }
    expect(out).toBe('');
  });
});

describe('onboarding equipment: four common options, the rest behind "Meer materiaal"', () => {
  const ob = rd('src/OnboardingModal.jsx');
  const common = JSON.parse(ob.match(/COMMON_EQUIPMENT = (\[[^\]]*\])/)[1]);
  it('the common four are the first four options, in that order', () => {
    expect(EQUIPMENT_OPTIONS.slice(0, 4).map((o) => o.value)).toEqual(common);
    expect(common).toEqual(['none', 'dumbbell', 'resistance_bands', 'pull_up_bar']);
  });
  it('nothing is lost: every option is common or in the disclosure (4 hidden)', () => {
    expect(EQUIPMENT_OPTIONS.filter((o) => !common.includes(o.value))).toHaveLength(EQUIPMENT_OPTIONS.length - 4);
  });
  it('speaks Dutch', () => {
    expect(t('More equipment')).toBe('Meer materiaal');
    expect(t('Less equipment')).toBe('Minder materiaal');
    expect(t('Skip this step')).toBe('Sla deze stap over');
    expect(EQUIPMENT_OPTIONS.slice(0, 4).map((o) => t(o.label))).toEqual(['Geen materiaal', 'Dumbbells', 'Weerstandsbanden', 'Optrekstang']);
  });
  it('the experience chips have a one-line description each, in Dutch', () => {
    expect(EXPERIENCE).toHaveLength(3);
    for (const e of EXPERIENCE) { expect(e.sub.length).toBeGreaterThan(10); expect(t(e.sub)).not.toBe(e.sub); }
  });
});

describe('the data onboarding sends is unchanged (same payload shape)', () => {
  const ob = rd('src/OnboardingModal.jsx');
  it('profile payload keys and the path call', () => {
    expect(ob).toMatch(/training_goal: goal, experience_level: experience, session_duration_min: duration,\s*preferences: prefPayload, sex, cycle,/);
    expect(ob).toMatch(/const prefPayload = \{ available_equipment: equipment \};/);
    expect(ob).toMatch(/savePath\(api, token, intent, pathDetails\)/);
    expect(ob).toMatch(/useState\(p\.session_duration_min \?\? 45\)/);                  // the default length is pre-selected
  });
});

describe('builder column labels', () => {
  it('Dutch heads: Sets · Herhalingen / Seconden · Rust', () => {
    expect([t('Sets'), t('Reps'), t('Seconds'), t('Rest')]).toEqual(['Sets', 'Herhalingen', 'Seconden', 'Rust']);
  });
  it('parsing and the stored shape were not touched', () => {
    const ss = rd('src/sessionSheet.jsx');
    expect(ss).toMatch(/onChange\(f, e\.target\.value\)/);
    expect(ss).toMatch(/type="text" inputMode="numeric"/);
  });
});
