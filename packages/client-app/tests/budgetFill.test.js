// Finding 6 (UX review 2026-11-16) — R601 fills the session the user chose, and R510
// only says "time adjusted" when today's time really was cut.
import { describe, it, expect } from 'vitest';
import {
  fillSkipReason, fillToBudget, applyBudgetFill, FILL_LOW, FILL_CAP, FILL_MAX_STEPS, R525_RESERVE_SEC,
} from '../../../functions/api/_shared/budgetFill.js';
import { estimateSessionSec } from '../../../functions/api/_shared/session.js';
import { deriveChipLabel, classifyAdvisories, deriveCoachSentence, RULE_LABELS, STRUCTURAL_RULE_CODES } from '../src/messagePolicy.js';
import { t } from '../src/i18n.js';

// A rep step: 10 reps × 4 s + 45 s rest = 85 s per set.
const step = (id, sets = 2, extra = {}) => ({ exercise_id: id, exercise_slug: id, sets, target_reps: 10, rest_sec: 45, category: 'strength', ...extra });
const row = (id, slug = id, extra = {}) => ({ id, slug, category: 'strength', tags_json: '[]', ...extra });
const build = (r) => step(r.id, 3, { exercise_slug: r.slug });
const baseCtx = (over = {}) => ({
  slot_type: 'main', budget: 20, unlimited: false, bonusSession: false, forceAssessment: false,
  pregnancyContext: null, trace: ['R510 — Normal session (your own 20 min)'], isStandardMode: true,
  appendedIds: new Set(), injuryAreas: [], ...over,
});

describe('fillSkipReason — the days when less is the point', () => {
  it('lets an ordinary day through', () => {
    expect(fillSkipReason(baseCtx())).toBeNull();
  });
  it.each([
    ['rest', { slot_type: 'rest' }],
    ['micro', { slot_type: 'micro' }],
    ['unlimited', { unlimited: true }],
    ['bonus', { bonusSession: true }],
    ['forced_measurement', { forceAssessment: true }],
    ['body_mode', { pregnancyContext: { mode: 'pregnant' } }],
    ['body_mode', { pregnancyContext: { mode: 'postnatal' } }],
    ['coach', { runProgramOverride: {} }],
    ['coach', { crossTrainingOverride: {} }],
    ['coach', { cyclingProgramOverride: {} }],
    ['coach', { militaryProgramOverride: {} }],
    ['coach', { militaryDbSelection: [] }],
    ['coach', { militarySessionType: 'kracht' }],
  ])('%s', (reason, over) => {
    expect(fillSkipReason(baseCtx(over))).toBe(reason);
  });
  it.each(['R511 — Poor sleep', 'R512 — Low energy → x reps ×0.6', 'R513 — High stress', 'R517 — Low mood (3/10)',
    'R535 — Nausea today', 'R536 — T3 breathlessness', 'R558 — Back after 30-day break', 'R559 — Recovery mode',
    'R526 — Perimenopause + elevated stress ≥5 → low intensity'])('a downgrade in the trace: %s', (line) => {
    expect(fillSkipReason(baseCtx({ trace: [line] }))).toBe('less_today');
  });
  it('perimenopause without stress, R510 and R524 are no downgrade', () => {
    expect(fillSkipReason(baseCtx({ trace: ['R526 — Perimenopause mode: intensity capped at moderate', 'R524 — Bodyweight reps ×0.80'] }))).toBeNull();
  });
});

describe('fillToBudget — sets first, then exercises, inside the band', () => {
  it('does nothing at or above 70% of the budget', () => {
    const steps = [step('a', 3), step('b', 3), step('c', 3), step('d', 2)];   // ~14.8 of 20 min: above 70%, below the 85% aim
    expect(estimateSessionSec(steps)).toBeGreaterThanOrEqual(20 * 60 * FILL_LOW);
    expect(estimateSessionSec(steps)).toBeLessThan(20 * 60 * 0.85);
    const before = JSON.stringify(steps);
    const r = fillToBudget(steps, { budgetMin: 20, setCap: 3, candidates: [row('x')], buildStep: build });
    expect(r.setsAdded + r.added.length).toBe(0);
    expect(JSON.stringify(steps)).toBe(before);
  });
  it('restores sets up to the cap and never above it, keeping reps', () => {
    const steps = [step('a', 2), step('b', 2)];
    const r = fillToBudget(steps, { budgetMin: 20, setCap: 3, candidates: [], buildStep: build });
    expect(r.setsAdded).toBe(2);
    expect(steps.map(s => s.sets)).toEqual([3, 3]);
    expect(steps.every(s => s.target_reps === 10)).toBe(true);
  });
  it('does not grow a step canGrow refuses (fixed sets, measurement, appended)', () => {
    const steps = [step('a', 1), step('b', 2)];
    fillToBudget(steps, { budgetMin: 20, setCap: 3, canGrow: (s) => s.exercise_id !== 'a', candidates: [], buildStep: build });
    expect(steps[0].sets).toBe(1);
  });
  it('adds exercises in the given order, one per movement family, skipping ones already in', () => {
    const steps = [step('a', 2), step('b', 2)];
    const fam = (slug) => slug.replace(/^(knee|wall)-/, '');
    const cands = [row('a'), row('k', 'knee-push-up'), row('p', 'push-up'), row('w', 'wall-push-up'), row('s', 'squat'), row('l', 'lunge')];
    const r = fillToBudget(steps, { budgetMin: 20, setCap: 3, candidates: cands, buildStep: build, familyOf: fam });
    expect(r.added.map(x => x.id)).toEqual(['k', 's']);
    expect(steps.filter(s => fam(s.exercise_slug) === 'push-up')).toHaveLength(1);
  });
  it('lands between 70% of the budget and the cap', () => {
    const steps = [step('a', 2), step('b', 2)];
    const cands = Array.from({ length: 8 }, (_, i) => row('c' + i));
    fillToBudget(steps, { budgetMin: 20, setCap: 3, candidates: cands, buildStep: build });
    const sec = estimateSessionSec(steps);
    expect(sec).toBeGreaterThanOrEqual(20 * 60 * FILL_LOW);
    expect(sec).toBeLessThanOrEqual(20 * 60 * FILL_CAP);
  });
  it('never passes the cap, even when that leaves it short', () => {
    const steps = [step('a', 3)];
    const huge = (r) => step(r.id, 3, { target_reps: undefined, target_duration_sec: 600 });
    fillToBudget(steps, { budgetMin: 20, setCap: 3, candidates: [row('big')], buildStep: huge });
    expect(steps).toHaveLength(1);
    expect(estimateSessionSec(steps)).toBeLessThanOrEqual(20 * 60 * FILL_CAP);
  });
  it('keeps room for R525 when asked', () => {
    const steps = [step('a', 2), step('b', 2)];
    const cands = Array.from({ length: 8 }, (_, i) => row('c' + i));
    const oneSet = (r) => step(r.id, 1);   // 85 s steps: fine enough to reach into the reserve without it
    fillToBudget(steps, { budgetMin: 20, setCap: 3, candidates: cands, buildStep: oneSet, reserveSec: R525_RESERVE_SEC });
    expect(estimateSessionSec(steps)).toBeLessThanOrEqual(20 * 60 * FILL_CAP - R525_RESERVE_SEC);
  });
  it(`stops at ${FILL_MAX_STEPS} exercises`, () => {
    const tiny = (r) => step(r.id, 1, { target_reps: 3, rest_sec: 5 });
    const steps = [tiny(row('a'))];
    fillToBudget(steps, { budgetMin: 45, setCap: 1, candidates: Array.from({ length: 30 }, (_, i) => row('c' + i)), buildStep: tiny });
    expect(steps).toHaveLength(FILL_MAX_STEPS);
  });
  it('is deterministic', () => {
    const run = () => { const s = [step('a', 2)]; fillToBudget(s, { budgetMin: 30, setCap: 3, candidates: Array.from({ length: 8 }, (_, i) => row('c' + i)), buildStep: build }); return JSON.stringify(s); };
    expect(run()).toBe(run());
  });
});

describe('applyBudgetFill — the planner wiring', () => {
  const run = (ctxOver = {}, cands = Array.from({ length: 8 }, (_, i) => row('c' + i))) => {
    const ctx = baseCtx({ shuffled: cands, ...ctxOver });
    const steps = [step('a', 2), step('b', 2)];
    const r = applyBudgetFill(ctx, steps, { setCap: 3, isFixed: () => false, safePool: (_c, l) => l, buildStep: build, familyOf: (s) => s });
    return { ctx, steps, r };
  };
  it('traces R601 with before/after minutes', () => {
    const { ctx } = run();
    const line = ctx.trace.find(t => t.startsWith('R601'));
    expect(line).toMatch(/\+\d+ set\(s\), \+\d+ exercise\(s\) \(~\d+ → ~\d+ min\)/);
  });
  it('does nothing and traces nothing on a skipped day', () => {
    const { ctx, r, steps } = run({ bonusSession: true });
    expect(r).toBeNull();
    expect(steps.map(s => s.sets)).toEqual([2, 2]);
    expect(ctx.trace.some(t => t.startsWith('R601'))).toBe(false);
  });
  it('never offers a candidate that loads an injured area, whatever the pool says', () => {
    const shoulder = row('ohp', 'overhead-press', { tags_json: '["loads_shoulder"]' });
    const { steps } = run({ injuryAreas: ['shoulder'] }, [shoulder, row('squat')]);
    expect(steps.some(s => s.exercise_id === 'ohp')).toBe(false);
  });
  it('asks safePool for the candidates', () => {
    const ctx = baseCtx({ shuffled: [row('x'), row('y')] });
    const steps = [step('a', 3)];
    applyBudgetFill(ctx, steps, { setCap: 3, isFixed: () => false, safePool: (_c, l) => l.filter(r => r.id !== 'x'), buildStep: build, familyOf: (s) => s });
    expect(steps.some(s => s.exercise_id === 'x')).toBe(false);
  });
});

describe('R601 is explained; R510 only claims a cut that happened', () => {
  it('R601 has a label, is structure, and is Dutch', () => {
    expect(RULE_LABELS.R601).toBeTruthy();
    expect(STRUCTURAL_RULE_CODES.has('R601')).toBe(true);
    expect(t(RULE_LABELS.R601.text)).toBe('Sessie aangevuld tot je gekozen tijd.');
    const g = classifyAdvisories(['R601 — Session topped up to your 20-min choice: +2 set(s), +2 exercise(s) (~7 → ~17 min)']);
    expect(g.more.map(e => e.code)).toEqual(['R601']);
    expect(g.today).toHaveLength(0);
  });
  it('the user\'s own length is no chip and no "changed today" line', () => {
    for (const line of ['R510 — Normal session (your own 20 min)', 'R510 — Short session (≤20 min)', 'R510 — Normal session (>20 min)']) {
      expect(deriveChipLabel([line], null)).toBeNull();
      const g = classifyAdvisories([line]);
      expect([...g.today, ...g.standing, ...g.more].some(e => e.code === 'R510')).toBe(false);
      expect(deriveCoachSentence([line], null)).toBeNull();
    }
  });
  it('less time than usual today: a chip that says why, and a "changed today" line', () => {
    const line = 'R510 — Shorter today: 20 min instead of your usual 30 (today=20 usual=30)';
    expect(deriveChipLabel([line], null)).toBe('Shorter: less time today');
    expect(t('Shorter: less time today')).toBe('Korter: minder tijd vandaag');
    expect(classifyAdvisories([line]).today.map(e => e.code)).toEqual(['R510']);
    expect(deriveCoachSentence([line], null)).toBeNull();
  });
  it('a micro session keeps its chip and its coach sentence', () => {
    const line = 'R510 — Time ≤10 min or no_time → micro session';
    expect(deriveChipLabel([line], null)).toBe('Micro: little time today');
    expect(t('Micro: little time today')).toBe('Micro: weinig tijd vandaag');
    expect(deriveCoachSentence([line], null)).toMatch(/Micro session/);
  });
});
