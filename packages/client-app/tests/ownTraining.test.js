// MANUAL_TRAINING_DESIGN.md phase 1 — "Eigen training". The client half of the
// acceptance guards (the server half is scripts/plan-override-requests.mjs block 10
// and scripts/execution-requests.mjs block 6).
import { describe, it, expect, afterEach, beforeAll, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  ownLine, runModeChoice, ownSessionBody, checkinForAdvice, sourceRefFor, completedInfo,
  isRetryable, execPayload, execArgs, saveOwnExtra,
} from '../src/ownTraining.js';
import api from '../src/apiClient.js';
import { LOG_WINDOW_DAYS } from '../../../functions/api/execution.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

const coach = { id: 'row-e', session_name: 'Fat Loss Circuit', slot_type: 'main', steps: [{ exercise_id: 'a', name: 'Push-up', sets: 3, target_reps: 10, tags_json: '[]' }] };
const rest = { id: 'row-r', session_name: 'Recovery day', slot_type: 'rest', steps: [] };
const own = { ...coach, id: 'row-u', session_name: 'Hotelbank', authored_by_user: true };

describe('acceptance 1 — "Eigen training" on every Today state', () => {
  let Dashboard;
  beforeAll(async () => {
    // i18n.js and the dashboard read localStorage at import/render; English keys.
    const store = new Map([['jf_lang', 'en']]);
    vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
    Dashboard = (await import('../src/Dashboard.jsx')).default;
  });
  const render = (props) => renderToStaticMarkup(createElement(Dashboard, {
    score: 40, prevScore: 40, history: [], prefs: { preferences: {} }, onOwnTraining() {}, onWhyNot() {}, ...props,
  }));
  const states = {
    plan: { plan: coach, todayCompleted: false },
    rest: { plan: rest, todayCompleted: false },
    completed: { plan: coach, todayCompleted: true, completedSession: { name: 'Fat Loss Circuit', duration_sec: 900 } },
    'user-authored': { plan: own, todayCompleted: false },
  };
  for (const [name, props] of Object.entries(states)) {
    it(`shows "Own training" — ${name}`, () => {
      expect(render(props)).toContain('Own training');
    });
  }
  it('"Can\'t do this?" sits next to it only beside an open coach plan', () => {
    expect(render(states.plan)).toContain("Can&#x27;t do this?");
    for (const s of ['rest', 'completed', 'user-authored']) expect(render(states[s])).not.toContain("Can&#x27;t do this?");
    expect(ownLine({ plan: coach, todayCompleted: false }).whyNot).toBe(true);
    expect(ownLine({ plan: own, todayCompleted: false }).whyNot).toBe(false);
  });
  it('the done card of an extra asks "Plan done?" only while the plan is open', () => {
    const extra = { name: 'Hotelbank', duration_sec: 600 };
    expect(render({ ...states.plan, extraDone: extra })).toContain("Today&#x27;s plan is still open");
    expect(render({ ...states.rest, extraDone: extra })).not.toContain("Today&#x27;s plan is still open");
    expect(render({ ...states.plan, extraDone: { ...extra, dismissed: true } })).toContain('Extra: Hotelbank');
  });
});

describe('acceptance 3 — a replacing session never runs without the explicit choice', () => {
  it('every mode but an explicit "replace" asks for an extra', () => {
    for (const mode of [undefined, null, 'extra', 'Replace', true]) {
      const b = ownSessionBody({ date: '2026-10-06', steps: [{ exercise_id: 'a', sets: 3, target_reps: 10 }], mode });
      expect(b.bonus_session, String(mode)).toBe(true);
    }
    const r = ownSessionBody({ date: '2026-10-06', steps: [{ exercise_id: 'a' }], mode: 'replace' });
    expect(r.bonus_session).toBeUndefined();
    expect(r.replace_user_plan).toBeUndefined();
  });
  it('replacing the user\'s own session needs the W4a confirmation', () => {
    expect(() => ownSessionBody({ date: 'd', steps: [{ exercise_id: 'a' }], mode: 'replace', userAuthored: true })).toThrow('replace_needs_confirmation');
    expect(ownSessionBody({ date: 'd', steps: [{ exercise_id: 'a' }], mode: 'replace', userAuthored: true, replaceConfirmed: true }).replace_user_plan).toBe(true);
  });
  it('the run-mode sheet defaults to extra, and is skipped when there is nothing to replace', () => {
    expect(runModeChoice({ plan: coach, todayCompleted: false })).toMatchObject({ skip: false, defaultMode: 'extra', replaceNeedsConfirm: false, planName: 'Fat Loss Circuit' });
    expect(runModeChoice({ plan: coach, todayCompleted: true })).toMatchObject({ skip: true, defaultMode: 'extra' });
    expect(runModeChoice({ plan: rest, todayCompleted: false })).toMatchObject({ skip: false, defaultMode: 'extra', restDay: true, planName: null });
    expect(runModeChoice({ plan: own, todayCompleted: false })).toMatchObject({ skip: false, defaultMode: 'extra', replaceNeedsConfirm: true });
    expect(runModeChoice({ plan: null, todayCompleted: false }).skip).toBe(true);
  });
});

describe('acceptance 5 — a session started from a template records source_ref', () => {
  it('saveOwnExtra sends source_ref, session_type bonus and no day_plan_id', async () => {
    let body = null;
    globalThis.fetch = async (_url, init) => { body = JSON.parse(init.body); return { ok: true, status: 200, json: async () => ({ ok: true, execution_id: 'x' }) }; };
    const plan = { session_name: 'Hotelbank', authored_by_user: true, source_ref: sourceRefFor({ id: 'tpl-1' }), steps: coach.steps };
    await saveOwnExtra(api, { userId: 'u', today: '2026-10-06', plan, stepsActual: null, durationSec: 300, perceivedExertion: 5, notes: null });
    expect(body).toMatchObject({ source_ref: 'template:tpl-1', session_type: 'bonus', day_plan_id: null, date: '2026-10-06' });
    expect(sourceRefFor(null)).toBe(null);
  });
  it('the queued form keeps it', () => {
    const args = ['u', null, 'd', [], 60, 5, 'bonus', null, 'n', 'template:t'];
    expect(execPayload(args).sourceRef).toBe('template:t');
    expect(execArgs(execPayload(args))).toEqual(args);
  });
});

describe('§6 — what the done card may offer', () => {
  it('"Bewaar als sjabloon" only for a session the user wrote that did not come from a template', () => {
    const steps = [...coach.steps, { exercise_id: 'm', max_effort: true }];
    expect(completedInfo({ ...own, steps }, 600).own_steps).toEqual([{ exercise_id: 'a', sets: 3, rest_sec: undefined, target_reps: 10, target_duration_sec: null }]);
    expect(completedInfo({ ...own, source_ref: 'template:t' }, 600).own_steps).toBeUndefined();
    expect(completedInfo(coach, 600).own_steps).toBeUndefined();
  });
});

describe('§5 — the advisory pass sees today\'s check-in', () => {
  it('flattens checkin_json so the pain guards read it', () => {
    const row = { date: '2026-10-06', energy: 3, checkin_json: JSON.stringify({ pain_level: 3, pain_scope: 'general' }) };
    expect(checkinForAdvice(row, '2026-10-06')).toMatchObject({ pain_level: 3, pain_scope: 'general', energy: 3 });
    expect(checkinForAdvice(row, '2026-10-07')).toBe(null);
  });
});

describe('item 7 — the offline queue and a rejected save (Oct 5 report)', () => {
  it('queue retention equals the server\'s log window', async () => {
    const { MUTATION_TTL_MS } = await import('../src/offlineCache.js');
    expect(MUTATION_TTL_MS).toBe(LOG_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  });
  it('saveExecution throws on a non-OK answer instead of resolving with the error body', async () => {
    globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ error: 'Internal error' }) });
    await expect(api.saveExecution('u', null, 'd', [], 60, null)).rejects.toMatchObject({ status: 500 });
    expect(isRetryable({ status: 500 })).toBe(true);
    expect(isRetryable({ status: 400 })).toBe(false);
    expect(isRetryable(new TypeError('Failed to fetch'))).toBe(true);
  });
});
