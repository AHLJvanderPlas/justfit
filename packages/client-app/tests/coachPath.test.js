// coach-dcp R2 review — one path label for JE PAD and Voortgang's "Doel: …".
import { describe, it, expect, vi, afterEach } from 'vitest';
import { activeCoachOf, pathGoal, pathTitle } from '../src/coachPath.js';

const mil = { preferences: { primary_intent: 'military', military_coach: { active: true, track: 'keuring', mode: 'target', cluster_current: 1, cluster_target: 3 } }, training_goal: 'health' };
const run = { preferences: { primary_intent: 'running', run_coach: { enrolled: true, target_km: 10 } } };
const cyc = { preferences: { primary_intent: 'cycling', cycling_coach: { active: true, sub_goal: 'build_fitness' } } };
const gen = { preferences: { primary_intent: 'general' }, training_goal: 'strength' };

describe('activeCoachOf', () => {
  it('the four paths', () => {
    expect([mil, run, cyc, gen].map(activeCoachOf)).toEqual(['military', 'running', 'cycling', 'general']);
  });
  it('an intent whose coach is off falls back to the active coach', () => {
    expect(activeCoachOf({ preferences: { primary_intent: 'running', military_coach: { active: true } } })).toBe('military');
  });
});

describe('pathGoal / pathTitle — the four paths (keys)', () => {
  it('military: the track and the TARGET level, never the self-declared one', () => {
    expect(pathGoal(mil)).toBe('Physical Assessment K3');
    expect(pathTitle(mil)).toBe('Military · Physical Assessment K3');
  });
  it('running: the distance', () => {
    expect(pathGoal(run)).toBe('10 km');
    expect(pathTitle(run)).toBe('Running · 10 km');
  });
  it('cycling: coach and sub-goal', () => {
    expect(pathGoal(cyc)).toBe('Cycling · Build fitness');
    expect(pathTitle(cyc)).toBe('Cycling · Build fitness');
  });
  it('general: the training goal', () => {
    expect(pathGoal(gen)).toBe('Build Strength');
    expect(pathTitle(gen)).toBe('Build Strength');
  });
});

afterEach(() => vi.unstubAllGlobals());
describe('in Dutch', () => {
  it('Doel: Keuring K3 / 10 km / Fietsen · Conditie opbouwen / Kracht opbouwen', async () => {
    vi.resetModules();
    vi.stubGlobal('localStorage', { getItem: () => 'nl', setItem() {}, removeItem() {} });
    vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
    const { t } = await import('../src/i18n.js');
    const m = await import('../src/coachPath.js');
    expect([mil, run, cyc].map((p) => m.pathGoal(p, t))).toEqual(['Keuring K3', '10 km', 'Fietsen · Conditie opbouwen']);
    expect(m.pathTitle(mil, t)).toBe('Militair · Keuring K3');
    expect(m.pathGoal(gen, t)).not.toBe('Build Strength');
  });
});
