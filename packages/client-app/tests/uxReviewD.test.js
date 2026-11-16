// UX review D (2026-11-16) — Today and chrome: the merged week line and the one back control.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { weekLineState } from '../src/weekStatus.js';
import { takeSettingsStart, openSettingsAt } from '../src/settingsStart.js';
import { t } from '../src/i18n.js';

const MON = '2026-11-02';   // a Monday
const row = (date) => ({ date, status: 'completed', execution_type: 'workout' });
const prefs3 = { training_goal: 'health', preferences: { training_days_per_week: 3 } };

describe('weekLineState — the one line under the week strip (finding 10)', () => {
  it('nothing done: 0 van 3 · nog 3 te gaan', () => {
    expect(weekLineState([], prefs3, 'health', '2026-11-04')).toEqual({ done: 0, target: 3, toGo: 3, reached: false });
  });
  it('counts the ISO week only (Mon–Sun), not the rolling 7 days', () => {
    const history = [row('2026-11-01'), row('2026-11-02')];   // Sunday of last week + Monday
    expect(weekLineState(history, prefs3, 'health', '2026-11-04').done).toBe(1);
  });
  it('the target is the user\'s weekly target, else the goal\'s number', () => {
    expect(weekLineState([], { preferences: {} }, 'health', MON).target).toBe(3);
    expect(weekLineState([], { preferences: {} }, 'endurance', MON).target).toBeGreaterThan(3);
  });
  it('reached once the target is met; toGo never negative', () => {
    const history = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'].map(row);
    expect(weekLineState(history, prefs3, 'health', '2026-11-05')).toMatchObject({ done: 4, toGo: 0, reached: true });
  });
  it('has Dutch strings for both states', () => {
    expect(t('{done} of {target} training days · {n} to go', { done: 1, target: 3, n: 2 })).toBe('1 van 3 trainingsdagen · nog 2 te gaan');
    expect(t('{done} of {target} training days · week goal reached', { done: 3, target: 3 })).toBe('3 van 3 trainingsdagen · weekdoel gehaald');
  });
});

describe('settingsStart — the Today goal link opens Settings on Goal & coach', () => {
  it('hands the sub-view over once', () => {
    expect(takeSettingsStart()).toBeNull();
    openSettingsAt('coach');
    expect(takeSettingsStart()).toBe('coach');
    expect(takeSettingsStart()).toBeNull();
  });
});

describe('the one back control and the header (findings 11, 15)', () => {
  const src = (f) => readFileSync(new URL(`../src/${f}`, import.meta.url), 'utf8');
  it('BackLink: a real button, accessible name via t(), chevron hidden from screen readers', () => {
    const s = src('BackLink.jsx');
    expect(s).toMatch(/<button type="button"/);
    expect(s).toMatch(/aria-label=\{t\("Back to \{name\}"/);
    expect(s).toMatch(/aria-hidden="true">‹/);
    expect(t('Back to {name}', { name: 'Instellingen' })).toBe('Terug naar Instellingen');
  });
  it('every view that had its own back arrow uses BackLink', () => {
    for (const f of ['CoachView.jsx', 'AwardsView.jsx', 'SettingsView.jsx', 'WorkoutView.jsx', 'ProGate.jsx']) expect(src(f), f).toMatch(/<BackLink /);
    expect(src('SettingsView.jsx')).not.toMatch(/jf-back-btn/);
    expect(src('CoachView.jsx')).not.toMatch(/← Terug|\{t\("← Today"\)\}/);
  });
});
