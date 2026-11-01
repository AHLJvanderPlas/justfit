import { describe, it, expect, vi } from 'vitest';
import { applyPathChoice } from '../src/pathApply.js';
import { loadEntitlement, entitlementSettled } from '../src/entitlement.js';
import { checkinFromRow, requestOrStoredCheckin } from '../../../functions/api/_shared/storedCheckin.js';

function harness({ profile, plan, profileFails = false, planFails = false } = {}) {
  let prefs = { sex: 'male', preferences: { primary_intent: null, training_goal: 'fat_loss' } };
  const calls = [];
  const api = {
    getProfile: vi.fn(async () => { calls.push('getProfile'); if (profileFails) throw new Error('net'); return profile; }),
    generatePlan: vi.fn(async () => { calls.push('generatePlan'); if (planFails) throw new Error('500'); return plan; }),
  };
  const s = {
    setShowPathChoice: vi.fn((v) => calls.push(`modal:${v}`)),
    setPrefs: vi.fn((fn) => { prefs = fn(prefs); }),
    setPlan: vi.fn(), setPlanError: vi.fn(), setIsGenerating: vi.fn(),
  };
  return { api, s, calls, prefs: () => prefs };
}

describe('applyPathChoice (UAT D3)', () => {
  it('closes the modal, takes the server preferences, then regenerates once with path_change', async () => {
    const serverPrefs = { primary_intent: 'running', run_coach: { enrolled: true, target_km: 5 } };
    const h = harness({ profile: { exists: true, preferences: serverPrefs }, plan: { id: 'p1', session_name: 'Running Day · Week 1' } });
    const out = await applyPathChoice('running', { api: h.api, userId: 'u1', today: '2026-11-01', isPro: true, ...h.s });
    expect(h.calls).toEqual(['modal:false', 'getProfile', 'generatePlan']);
    expect(h.prefs().preferences).toEqual(serverPrefs);
    expect(h.prefs().sex).toBe('male');
    expect(h.api.generatePlan).toHaveBeenCalledWith('u1', '2026-11-01', null, undefined, true, { pathChange: true });
    expect(h.s.setPlan).toHaveBeenCalledWith(out);
    expect(h.s.setPlanError).toHaveBeenCalledWith(null);
    expect(h.s.setIsGenerating.mock.calls).toEqual([[true], [false]]);
  });

  it('keeps the optimistic intent when the profile refetch fails, and still regenerates', async () => {
    const h = harness({ profileFails: true, plan: { id: 'p2' } });
    await applyPathChoice('military', { api: h.api, userId: 'u1', today: 'd', isPro: false, ...h.s });
    expect(h.prefs().preferences.primary_intent).toBe('military');
    expect(h.prefs().preferences.training_goal).toBe('fat_loss');
    expect(h.api.generatePlan).toHaveBeenCalledTimes(1);
  });

  it('a failed regeneration leaves the current plan and clears the spinner', async () => {
    const h = harness({ profile: { preferences: { primary_intent: 'general' } }, planFails: true });
    expect(await applyPathChoice('general', { api: h.api, userId: 'u1', today: 'd', isPro: false, ...h.s })).toBe(null);
    expect(h.s.setPlan).not.toHaveBeenCalled();
    expect(h.s.setIsGenerating.mock.calls.at(-1)).toEqual([false]);
  });

  it('without a session it does not call the planner', async () => {
    const h = harness({ profile: { preferences: {} } });
    await applyPathChoice('general', { api: h.api, userId: null, today: 'd', isPro: false, ...h.s });
    expect(h.api.generatePlan).not.toHaveBeenCalled();
  });
});

describe('loadEntitlement (UAT D5)', () => {
  const setup = (impl) => {
    const s = { setIsPro: vi.fn(), isProRef: { current: false }, setEarlyBirdRemaining: vi.fn() };
    return { s, api: { getSubscription: vi.fn(impl) } };
  };
  it('a trialing user is known Pro, ref included', async () => {
    const { s, api } = setup(async () => ({ isPro: true, status: 'trialing', early_bird_remaining: 150 }));
    expect(await loadEntitlement(api, s)).toBe('known');
    expect(s.setIsPro).toHaveBeenCalledWith(true);
    expect(s.isProRef.current).toBe(true);
    expect(s.setEarlyBirdRemaining).toHaveBeenCalledWith(150);
  });
  it('an expired user is known not-Pro', async () => {
    const { s, api } = setup(async () => ({ isPro: false, status: 'expired' }));
    expect(await loadEntitlement(api, s)).toBe('known');
    expect(s.setIsPro).toHaveBeenCalledWith(false);
  });
  it('a 401 body or a network error is "failed", never a silent not-Pro', async () => {
    const a = setup(async () => ({ error: 'Unauthorized' }));
    expect(await loadEntitlement(a.api, a.s)).toBe('failed');
    expect(a.s.setIsPro).not.toHaveBeenCalled();
    const b = setup(async () => { throw new Error('offline'); });
    expect(await loadEntitlement(b.api, b.s)).toBe('failed');
  });
  it('the path modal waits for an answer', () => {
    expect(entitlementSettled('loading')).toBe(false);
    expect(entitlementSettled('known')).toBe(true);
    expect(entitlementSettled('failed')).toBe(true);
  });
});

describe('stored check-in fallback (UAT D4)', () => {
  it('rebuilds a daily_checkins row into the sheet shape', () => {
    const row = { mood: 6, energy: 3, soreness: null, sleep_hours: 4, stress: 8, weight_kg: null, notes: null,
      checkin_json: JSON.stringify({ recovery_mode: true, pain_level: 0, time_budget: 30 }) };
    expect(checkinFromRow(row)).toEqual({ mood: 6, energy: 3, sleep_hours: 4, stress: 8,
      checkin_json: { recovery_mode: true, pain_level: 0, time_budget: 30 } });
  });
  it('tolerates a junk or empty checkin_json and keeps set extra columns', () => {
    expect(checkinFromRow({ mood: 5, checkin_json: '{nope', soreness: 4 }).checkin_json).toEqual({});
    expect(checkinFromRow({ mood: 5, checkin_json: '[1]', soreness: 4 }).soreness).toBe(4);
    expect(checkinFromRow(null)).toBe(null);
  });
  it('reads the row only when the request has no check-in and is not an adapt', async () => {
    const first = vi.fn(async () => ({ mood: 6, checkin_json: '{"recovery_mode":true}' }));
    const bind = vi.fn(() => ({ first }));
    const env = { DB: { prepare: vi.fn(() => ({ bind })) } };
    const own = { energy: 2 };
    expect(await requestOrStoredCheckin(env, 'u1', { date: 'd', checkin: own })).toBe(own);
    expect(await requestOrStoredCheckin(env, 'u1', { date: 'd', checkin: null, adapt_mode: true })).toBe(null);
    expect(await requestOrStoredCheckin(env, null, { date: 'd' })).toBe(null);
    expect(env.DB.prepare).not.toHaveBeenCalled();
    const got = await requestOrStoredCheckin(env, 'u1', { date: '2026-11-01', checkin: null });
    expect(bind).toHaveBeenCalledWith('u1', '2026-11-01');
    expect(got.checkin_json.recovery_mode).toBe(true);
  });
});
