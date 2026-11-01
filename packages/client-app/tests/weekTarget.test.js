// C-B32 — the weekly training-days target: one source of truth, the rest-day rule, and
// the week pill / Deze week counting against the same number.
import { describe, it, expect } from 'vitest';
import {
  weeklyTarget, coachActive, weekTargetApplies, weekCountTarget, isoWeekday, isoWeekStart, addDays,
  trainedDaysFrom, sanitizeWeekSim, isTrainingDayRow, trainingDaysThisWeek, weekTargetDecision, applyRestDays,
  WEEK_TARGET_KEY,
} from '../../../functions/api/_shared/weekTarget.js';
import { weekOutcomeCounts } from '../src/weekStatus.js';
import { previewWeekSim } from '../src/weekPlan.js';
import { classifyAdvisories, parseRuleTrace, coachLine, RULE_LABELS } from '../src/messagePolicy.js';
import { t } from '../src/i18n.js';   // the suite runs in Dutch, the default

const MON = '2026-11-02';                       // a Monday
const day = (i) => addDays(MON, i);              // 0 = Mon … 6 = Sun
const prefsWith = (n, extra = {}) => ({ training_goal: 'health', preferences: { [WEEK_TARGET_KEY]: n, ...extra } });

describe('weeklyTarget — preferences.training_days_per_week is the one source', () => {
  it('reads the preference, never the legacy days_per_week_target column', () => {
    expect(WEEK_TARGET_KEY).toBe('training_days_per_week');
    expect(weeklyTarget(prefsWith(3))).toBe(3);
    expect(weeklyTarget({ days_per_week_target: 3, preferences: {} })).toBeNull();
    expect(weeklyTarget(null)).toBeNull();
  });
  it('null for anything that is not an integer 1–7', () => {
    for (const bad of [null, undefined, '', 0, 8, 2.5, 'x']) expect(weeklyTarget(prefsWith(bad))).toBeNull();
    expect(weeklyTarget(prefsWith('4'))).toBe(4);
  });
  it('applies on the general path only — any programme coach owns its own week', () => {
    expect(weekTargetApplies(prefsWith(3))).toBe(true);
    expect(weekTargetApplies(prefsWith(null))).toBe(false);
    expect(weekTargetApplies(prefsWith(3, { run_coach: { enrolled: true } }))).toBe(false);
    expect(weekTargetApplies(prefsWith(3, { run_coach: { enrolled: true, completed: true } }))).toBe(true);
    expect(weekTargetApplies(prefsWith(3, { cycling_coach: { active: true } }))).toBe(false);
    expect(weekTargetApplies(prefsWith(3, { military_coach: { active: true } }))).toBe(false);
    expect(weekTargetApplies(prefsWith(3, { military_coach: { active: false, dcp: { enabled: true } } }))).toBe(true);
    expect(coachActive(prefsWith(3, { military_coach: { active: true }, primary_intent: 'general' }))).toBe(true);
  });
  it('the week pill counts against the target, else the goal number as before', () => {
    expect(weekCountTarget(prefsWith(2), 'endurance')).toBe(2);
    expect(weekCountTarget(prefsWith(null), 'endurance')).toBe(5);
    expect(weekCountTarget(prefsWith(null), 'strength')).toBe(4);
    expect(weekCountTarget(prefsWith(null), 'nope')).toBe(3);
  });
});

describe('ISO week arithmetic on plan dates (no clock)', () => {
  it('Monday first, Sunday last', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(i => isoWeekday(day(i)))).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(isoWeekStart(day(6))).toBe(MON);
    expect(isoWeekStart(MON)).toBe(MON);
    expect(isoWeekStart('2026-11-01')).toBe('2026-10-26');
  });
  it('the planner window reaches back two days on Monday and Tuesday for the streak check', () => {
    expect(trainedDaysFrom(MON)).toBe('2026-10-31');
    expect(trainedDaysFrom(day(1))).toBe('2026-11-01');
    expect(trainedDaysFrom(day(4))).toBe(MON);
  });
  it('sanitizeWeekSim keeps only real dates inside that window, before the plan date', () => {
    expect(sanitizeWeekSim([MON, day(1), day(3), day(4), 'nope', 7, MON], day(3))).toEqual([MON, day(1)]);
    expect(sanitizeWeekSim('2026-11-02', day(3))).toEqual([]);
    expect(sanitizeWeekSim([MON], 'bad')).toEqual([]);
  });
});

describe('weekTargetDecision — the rule', () => {
  const decide = (target, trainedDates, i, blockedWeekdays = []) => weekTargetDecision({ target, trainedDates, date: day(i), blockedWeekdays });

  it('target met → rest, R599', () => {
    const d = decide(2, [MON, day(2)], 3);
    expect(d).toMatchObject({ rest: true, code: 'R599', reason: 'met', target: 2, done: 2 });
    expect(decide(3, [MON, day(1), day(2), day(3)], 5).code).toBe('R599');   // more than the target: still rest
  });
  it('remaining days just enough → train, even a third day in a row', () => {
    expect(decide(3, [day(4)], 5)).toMatchObject({ rest: false, reason: 'forced', need: 2, remaining: 2 });
    expect(decide(5, [day(3), day(4)], 5)).toMatchObject({ rest: false, reason: 'forced' });
  });
  it('on pace → rest, R600; behind → train', () => {
    expect(decide(3, [MON], 1)).toMatchObject({ rest: true, code: 'R600', reason: 'pace' });
    expect(decide(3, [MON], 2)).toMatchObject({ rest: false, reason: 'behind' });
    expect(decide(3, [], 0)).toMatchObject({ rest: false, reason: 'behind' });   // a fresh week starts with a session
  });
  it('two training days in a row → rest, R600 — across the week boundary too', () => {
    expect(decide(5, [MON, day(1)], 2)).toMatchObject({ rest: true, code: 'R600', reason: 'streak' });
    expect(decide(4, ['2026-10-31', '2026-11-01'], 0)).toMatchObject({ rest: true, reason: 'streak' });
  });
  it('only this ISO week counts toward the target', () => {
    expect(decide(2, ['2026-10-29', '2026-10-30'], 0).done).toBe(0);
  });
  it('blocked weekdays are not available days', () => {
    // 3x with Sat+Sun blocked: on Friday with one done, two are needed and only Friday is left.
    expect(decide(3, [MON], 4, [0, 6])).toMatchObject({ rest: false, reason: 'forced', remaining: 1 });
  });

  const simulate = (target, blocked = [], weeks = 1) => {
    const trained = [];
    let s = '';
    for (let i = 0; i < 7 * weeks; i++) {
      const date = day(i);
      const isBlocked = blocked.includes(new Date(date + 'T12:00:00Z').getUTCDay());
      const rest = isBlocked || weekTargetDecision({ target, trainedDates: trained, date, blockedWeekdays: blocked }).rest;
      if (!rest) trained.push(date);
      s += rest ? '.' : 'T';
    }
    return s;
  };
  it('following the plan from a fresh Monday spreads the week exactly at the target', () => {
    expect(simulate(2)).toBe('T..T...');
    expect(simulate(3)).toBe('T.T.T..');
    expect(simulate(4)).toBe('TT.T.T.');
    expect(simulate(5)).toBe('TT.TT.T');
    expect(simulate(3, [0, 6])).toBe('TT.T...');
  });
  it('every simulated week lands exactly on its target, never above', () => {
    for (const target of [1, 2, 3, 4, 5, 6, 7]) {
      const s = simulate(target, [], 4);
      for (let w = 0; w < 4; w++) expect([...s.slice(w * 7, w * 7 + 7)].filter(c => c === 'T').length).toBe(target);
    }
  });
  it('up to 4x never three training days in a row, over four weeks', () => {
    for (const target of [2, 3, 4]) expect(simulate(target, [], 4)).not.toMatch(/TTT/);
  });
});

describe('applyRestDays — where the rule is allowed to act', () => {
  const ctx = (over = {}) => ({
    date: day(3), prefs: prefsWith(2), trainedDates: [MON, day(1)], blockedWeekdays: new Set(),
    bonusSession: false, inSpecialMode: false, forceAssessment: false, pinnedIds: [], slot_type: 'main', trace: [],
    ...over,
  });
  it('target met → rest day with the R599 trace the why-panel reads', () => {
    const c = ctx();
    applyRestDays(c);
    expect(c.slot_type).toBe('rest');
    expect(c.trace).toEqual(['R599 — Weekly target 2x reached (target=2 done=2) → rest day']);
  });
  it('no target, a coach, pregnancy/postnatal, a bonus, pins, a forced measurement or no history → unchanged', () => {
    for (const over of [{ prefs: prefsWith(null) }, { prefs: prefsWith(2, { cycling_coach: { active: true } }) },
      { inSpecialMode: true }, { bonusSession: true }, { pinnedIds: ['a'] }, { forceAssessment: true }, { trainedDates: null }]) {
      const c = ctx(over);
      applyRestDays(c);
      expect(c.slot_type).toBe('main');
      expect(c.trace.some(l => /R599|R600/.test(l))).toBe(false);
    }
  });
  it('a training day says why in a code-less diagnostic line', () => {
    const c = ctx({ prefs: prefsWith(4) });
    applyRestDays(c);
    expect(c.slot_type).toBe('main');
    expect(c.trace[0]).toMatch(/^Weekdoel — 2 van 4/);
  });
  it('R999 (blocked weekday) still comes first and is not doubled by the target', () => {
    const c = ctx({ blockedWeekdays: new Set([4]) });   // Thursday
    applyRestDays(c);
    expect(c.trace).toEqual(['R999 — Preferred rest day (weekday 4 blocked) → rest session']);
  });
});

describe('the why-panel and the Today card explain it as a change of today', () => {
  const trace = ['R500 — Goal: health → initial intensity: moderate', 'R599 — Weekly target 3x reached (target=3 done=3) → rest day'];
  it('R599 is labelled with the target number and shown under "Changed today"', () => {
    const groups = classifyAdvisories(trace, []);
    expect(groups.today.map(e => e.code)).toEqual(['R599']);
    expect(groups.today[0].vars).toEqual({ n: '3' });
    expect(t(groups.today[0].text, groups.today[0].vars)).toBe('Je weekdoel (3x) is gehaald — vandaag rust.');
  });
  it('R600 likewise; a trace with no target number is dropped, not rendered with a placeholder', () => {
    expect(classifyAdvisories(['R600 — Spreading 3 training days (target=3 done=1 pace) → rest day']).today[0].code).toBe('R600');
    expect(parseRuleTrace(['R599 — reached']).training).toEqual([]);
    expect(RULE_LABELS.R599.dynamic).toBe('weektarget');
  });
  it('the coach line names the weekly target on that rest day; pain still wins', () => {
    expect(coachLine({ slot_type: 'rest', rule_trace: trace, steps: [] })).toBe('Weekdoel gehaald — vandaag is een rustdag.');
    expect(coachLine({ slot_type: 'rest', rule_trace: ['R514 — Pain ≥2 (general) → rest session', ...trace], steps: [] }))
      .toBe(t('Rest day — you reported pain. Recovery is part of the work.'));
  });
});

describe('week pill and Deze week count the same training days as the planner', () => {
  const rows = [
    { date: '2026-10-28', status: 'completed', execution_type: 'workout' },           // last week
    { date: MON, status: 'completed', execution_type: 'workout' },
    { date: MON, status: 'completed', execution_type: 'bonus' },                      // same day: one training day
    { date: day(1), status: 'completed', execution_type: 'recovery' },                // "Gewoon rusten" is no training
    { date: day(2), status: 'abandoned', execution_type: 'workout', stopped_after: { exercises_done: 2 } },
    { date: day(3), status: 'abandoned', execution_type: 'workout', stopped_after: { exercises_done: 0 } },
    { date: day(5), status: 'completed', execution_type: 'workout' },                 // after "today"
  ];
  it('isTrainingDayRow mirrors the planner query', () => {
    expect(rows.map(isTrainingDayRow)).toEqual([true, true, true, false, true, false, true]);
    expect(isTrainingDayRow({ date: MON })).toBe(true);   // older rows carry no status
  });
  it('distinct days, this ISO week, up to today', () => {
    expect(trainingDaysThisWeek(rows, day(3))).toBe(2);
    expect(trainingDaysThisWeek(rows, day(6))).toBe(3);
  });
  it('weekOutcomeCounts: the target from the one source, done and the trend in training days', () => {
    expect(weekOutcomeCounts(rows, prefsWith(2), 'endurance', day(3))).toMatchObject({ target: 2, done: 2, trend: 1, explicit: true });
    expect(weekOutcomeCounts(rows, prefsWith(null), 'endurance', day(3))).toMatchObject({ target: 5, explicit: false });
    expect(weekOutcomeCounts(rows, prefsWith(2), 'health', day(3)).thisWeek).toHaveLength(5);
    expect(weekOutcomeCounts(null, prefsWith(2), 'health', day(3))).toMatchObject({ done: 0, trend: 0 });
  });
  it('the preview assumes today (when a session is planned and not done) and each earlier preview session', () => {
    const result = [{ date: day(1), plan: { slot_type: 'main' } }, { date: day(2), plan: { slot_type: 'rest' } }, { date: day(3), plan: null }];
    expect(previewWeekSim({ today: MON, todayPlanned: true, result })).toEqual([MON, day(1)]);
    expect(previewWeekSim({ today: MON, todayPlanned: false, result })).toEqual([day(1)]);
    expect(previewWeekSim({ today: MON, todayPlanned: true, result: undefined })).toEqual([MON]);
  });
});
