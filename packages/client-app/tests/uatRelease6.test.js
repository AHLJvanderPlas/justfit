// UAT release 6 — small phones and the first five minutes: the check-in payload (sheet and
// mood row are one builder), when the check-in asks, the path as data (onboarding and the
// modal write the same thing), and the timed set's neutral face before Start.
import { describe, it, expect, vi } from 'vitest';
import {
  buildCheckinPayload, MOOD_MAP, MOOD_OPTIONS, defaultTimeBudget, autoOpenCheckin, quickCheckinVisible,
} from '../src/checkinQuick.js';
import {
  pathPreferences, savePath, pathLocked, onboardingPathToSave, onboardingReplan, onboardingSteps, DEFAULT_PATH_DETAILS, PATH_INTRO, SPORT_PATHS,
} from '../src/pathPrefs.js';
import { timerFace } from '../src/timerFace.js';
import { t } from '../src/i18n.js';

describe('buildCheckinPayload — the sheet and the mood row send the same thing', () => {
  it('"Goed" with nothing else is the sheet\'s mood → Toepassen', () => {
    const p = buildCheckinPayload({ feeling: 3, location: 'home', timeBudget: 30 });
    expect(p).toEqual({
      mood: 9, stress: 2, energy: 5, sleep_hours: null,
      checkin_json: {
        no_clothing: false, no_gear: false, no_time: false, equipment_profile_id: 'home', gym_today: false, traveling: false,
        recovery_mode: false, pain_level: 0, pain_scope: null, pain_areas: [], period_today: false, free_text: '',
        motivation: 9, time_budget: 30,
        pregnancy_signals: { nausea: false, breathless: false, pelvic_discomfort: false },
        postnatal_signals: { running_today: false, heaviness: false },
      },
    });
  });
  it('maps the three moods to the F8 numbers (R513 sees stress 8 on "Niet zo goed")', () => {
    expect(buildCheckinPayload({ feeling: 1 }).stress).toBe(8);
    expect(buildCheckinPayload({ feeling: 2 }).mood).toBe(6);
    expect(buildCheckinPayload({ feeling: 3 }).checkin_json.motivation).toBe(9);
    expect(buildCheckinPayload({ feeling: 99 })).toEqual(buildCheckinPayload({ feeling: 2 }));
    expect(Object.keys(MOOD_MAP)).toEqual(['1', '2', '3']);
    expect(MOOD_OPTIONS.map((o) => o.label)).toEqual(['Not great', 'Okay', 'Good']);
  });
  it('carries the sheet\'s signals when they are given', () => {
    const p = buildCheckinPayload({ feeling: 2, chips: ['pain', 'poor_sleep', 'low_energy', 'taking_easy', 'zero_time', 'period'],
      painScope: 'specific', painAreas: ['knee'], location: 'gym', freeText: 'x' });
    expect(p.energy).toBe(3);
    expect(p.sleep_hours).toBe(4);
    expect(p.checkin_json).toMatchObject({ pain_level: 3, pain_scope: 'specific', pain_areas: ['knee'], recovery_mode: true,
      no_time: true, period_today: true, gym_today: true, equipment_profile_id: 'gym', free_text: 'x' });
  });
  it('drops pain scope and areas when the pain chip is off', () => {
    const p = buildCheckinPayload({ chips: [], painScope: 'specific', painAreas: ['knee'] });
    expect(p.checkin_json.pain_scope).toBe(null);
    expect(p.checkin_json.pain_areas).toEqual([]);
  });
  it('the Dutch row reads "Niet zo goed / Gaat wel / Goed"', () => {
    globalThis.localStorage ??= { getItem: () => null, setItem() {} };
    expect(MOOD_OPTIONS.map((o) => t(o.label))).toEqual(['Niet zo goed', 'Gaat wel', 'Goed']);
  });
});

describe('defaultTimeBudget', () => {
  it('uses the session length, or the weekday schedule when it is on', () => {
    expect(defaultTimeBudget({})).toBe(45);
    expect(defaultTimeBudget({ session_duration_min: 20 })).toBe(20);
    const sun = new Date('2026-11-01T10:00:00Z');
    expect(defaultTimeBudget({ session_duration_min: 20, preferences: { schedule_advanced: true, weekly_schedule: { sun: 60 } } }, sun)).toBe(60);
    expect(defaultTimeBudget({ session_duration_min: 20, preferences: { schedule_advanced: true, weekly_schedule: { sun: 0 } } }, sun)).toBe(20);
  });
});

describe('when the check-in asks', () => {
  const today = '2026-11-01';
  it('the sheet does not open by itself on the onboarding day — the mood row is the check-in', () => {
    expect(autoOpenCheckin({ mode: 'once_a_day', today, quickDate: today })).toBe(false);
    expect(autoOpenCheckin({ mode: 'once_a_day', today, quickDate: '2026-10-31' })).toBe(true);
    expect(autoOpenCheckin({ mode: 'once_a_day', today, checkedInDate: today })).toBe(false);
    expect(autoOpenCheckin({ mode: 'every_time', today, quickDate: today })).toBe(true);
    expect(autoOpenCheckin({ mode: 'manual', today })).toBe(false);
    expect(autoOpenCheckin({ today })).toBe(true);
  });
  it('the mood row shows while today\'s check-in is open, never for manual mode or a done day', () => {
    expect(quickCheckinVisible({ today, checkedInDate: null })).toBe(true);
    expect(quickCheckinVisible({ today, checkedInDate: today })).toBe(false);
    expect(quickCheckinVisible({ today, checkedInDate: '2026-10-31' })).toBe(true);
    expect(quickCheckinVisible({ today, mode: 'manual' })).toBe(false);
    expect(quickCheckinVisible({ today, todayCompleted: true })).toBe(false);
    expect(quickCheckinVisible({ today, hasPlan: false })).toBe(false);
    expect(quickCheckinVisible({ today, mode: undefined })).toBe(true);
  });
});

describe('pathPreferences — what PathChoiceModal has always saved', () => {
  const NOW = 1_762_000_000_000;
  it('general', () => expect(pathPreferences('general')).toEqual({ primary_intent: 'general' }));
  it('running', () => expect(pathPreferences('running', { runKm: 10 })).toEqual({
    primary_intent: 'running', run_coach: { enrolled: true, target_km: 10, week: 1, session_in_week: 0 }, sport_prefs: { sports: ['running'], primary: 'running' },
  }));
  it('cycling', () => expect(pathPreferences('cycling', { cycleSubgoal: 'climbing' })).toEqual({
    primary_intent: 'cycling', cycling_coach: { active: true, sub_goal: 'climbing', week: 1 }, sport_prefs: { sports: ['cycling'], primary: 'cycling' },
  }));
  it('military — keuring starts at cluster 0, opleiding at 1; an empty date is null', () => {
    expect(pathPreferences('military', {}, NOW)).toEqual({ primary_intent: 'military', military_coach: { active: true, track: 'keuring', mode: 'target',
      cluster_current: 0, cluster_target: 3, target_date: null, block_session_index: 0, block_number: 1, enrolled_at_ms: NOW } });
    const o = pathPreferences('military', { milTrack: 'opleiding', milMode: 'open', milTargetDate: '2027-01-10' }, NOW).military_coach;
    expect(o).toMatchObject({ track: 'opleiding', mode: 'open', cluster_current: 1, target_date: '2027-01-10' });
  });
  it('defaults are the modal\'s defaults (5 km, build_fitness, keuring · target)', () => {
    expect(DEFAULT_PATH_DETAILS).toEqual({ runKm: 5, cycleSubgoal: 'build_fitness', milTrack: 'keuring', milMode: 'target', milTargetDate: '' });
    expect(pathPreferences('running').run_coach.target_km).toBe(5);
  });
  it('savePath makes the modal\'s one call: saveProfile(token, { preferences })', async () => {
    const api = { saveProfile: vi.fn(async () => ({ ok: true })) };
    expect(await savePath(api, 'tok', 'running', { runKm: 15 })).toBe('running');
    expect(api.saveProfile).toHaveBeenCalledTimes(1);
    expect(api.saveProfile.mock.calls[0][0]).toBe('tok');
    expect(api.saveProfile.mock.calls[0][1]).toEqual({ preferences: pathPreferences('running', { runKm: 15 }) });
  });
});

describe('pathLocked — Fietsen locks only for a known not-Pro (UAT D5)', () => {
  it('a trialing (Pro) day-1 user and an unknown entitlement may pick it', () => {
    expect(pathLocked('cycling', { isPro: true, entitlementKnown: true })).toBe(false);
    expect(pathLocked('cycling', { isPro: false, entitlementKnown: false })).toBe(false);
    expect(pathLocked('cycling', {})).toBe(false);
  });
  it('a known not-Pro sees the lock; no other path ever locks', () => {
    expect(pathLocked('cycling', { isPro: false, entitlementKnown: true })).toBe(true);
    for (const k of ['general', 'running', 'military']) expect(pathLocked(k, { isPro: false, entitlementKnown: true })).toBe(false);
  });
});

describe('onboarding asks the goal once', () => {
  it('the follow-up step appears only after a sport path was tapped', () => {
    expect(onboardingSteps('general', true)).toEqual(['waiver', 'goal', 'about', 'setup']);
    expect(onboardingSteps('running', true)).toEqual(['waiver', 'goal', 'path', 'about', 'setup']);
    expect(onboardingSteps('running', false)).toEqual(['waiver', 'goal', 'about', 'setup']);
    for (const k of SPORT_PATHS) expect(PATH_INTRO[k]).toBeTruthy();
  });
  it('a new account always gets a path (general by default) — the modal never follows onboarding', () => {
    expect(onboardingPathToSave({ existingIntent: null, pathKey: 'general', touched: false })).toBe('general');
    expect(onboardingPathToSave({ existingIntent: null, pathKey: 'running', touched: true })).toBe('running');
    expect(onboardingPathToSave({ existingIntent: null, pathKey: 'nonsense', touched: true })).toBe('general');
  });
  it('a re-done onboarding that never touched the goal step keeps the stored path (and its coach progress)', () => {
    expect(onboardingPathToSave({ existingIntent: 'military', pathKey: 'military', touched: false })).toBe(null);
    expect(onboardingPathToSave({ existingIntent: 'military', pathKey: 'general', touched: true })).toBe('general');
  });
  it('only a re-done onboarding that saved a path replans today (D3); the first run builds the plan at start-up', () => {
    expect(onboardingReplan({ firstRun: true, savedIntent: 'running' })).toBe(false);
    expect(onboardingReplan({ firstRun: false, savedIntent: 'running' })).toBe(true);
    expect(onboardingReplan({ firstRun: false, savedIntent: null })).toBe(false);
  });
});

describe('timerFace — neutral until Start (UAT D9)', () => {
  it('before Start: the set\'s duration, idle tone — never "0:00" in red', () => {
    expect(timerFace({ running: false, remaining: 0, total: 30 })).toEqual({ seconds: 30, text: '0:30', tone: 'idle' });
    expect(timerFace({ running: false, remaining: 3, total: 90 })).toMatchObject({ text: '1:30', tone: 'idle' });
  });
  it('while running: emerald → amber at 10 s → red at 5 s', () => {
    expect(timerFace({ running: true, remaining: 25, total: 30 }).tone).toBe('run');
    expect(timerFace({ running: true, remaining: 10, total: 30 }).tone).toBe('warn');
    expect(timerFace({ running: true, remaining: 5, total: 30 })).toMatchObject({ text: '0:05', tone: 'danger' });
  });
  it('never shows a negative or missing duration', () => {
    expect(timerFace({ running: true, remaining: -2, total: 30 }).text).toBe('0:00');
    expect(timerFace({ running: false, remaining: 0, total: undefined }).text).toBe('0:00');
  });
});

import { titleFitClass } from '../src/titleFit.js';
describe('titleFitClass — the Today title steps down for long Dutch words', () => {
  it('short titles keep the clamp() size; 11+ letters step down; 15+ step down twice', () => {
    expect(titleFitClass('RUSTIGE', 'SESSIE')).toBe('');
    expect(titleFitClass('GEBALANCEERDE', 'SESSIE')).toBe('jf-today__title--long');
    expect(titleFitClass('CARDIOVERBRANDING', null)).toBe('jf-today__title--xlong');
    expect(titleFitClass(null, undefined)).toBe('');
  });
});
