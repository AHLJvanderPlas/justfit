// UAT release 2 — "Today diet": the why-panel classification, the coach sentence
// that names what changed today, the session title that follows the session, the
// DCP row label, the 5 s timed targets and the safe stop's outcome rules.
// Traces are real planner output (functions/api/plan.js on the fixture library).
import { describe, it, expect } from 'vitest';
import { classifyAdvisories, ruleKind, deriveCoachSentence, coachLine, sessionTitle } from '../src/messagePolicy.js';
import { doneKind, stopSummary, showedUp } from '../src/sessionOutcome.js';
import { readExecutionStatus, creditedSteps, SHOWED_UP_SQL } from '../../../functions/api/_shared/sessionOutcome.js';
import { roundTo5Sec } from '../../../functions/api/_shared/session.js';
import { dcpTodayMeta } from '../src/dcpUi.js';

const step = (slug, tags = [], category = 'strength') => ({ exercise_slug: slug, category, tags_json: JSON.stringify(tags) });

// Lotte, pregnant week 21, no check-in signal (UAT D7: "Sessie van vandaag: beweging van vandaag.")
const PREGNANT = {
  session_name: "Today's movement", slot_type: 'main', intensity: 'moderate',
  rule_trace: [
    'R500 — Goal: health → initial intensity: moderate',
    'R596 — 11 Defensie-protocoloefening(en) buiten beschouwing gelaten (geen militaire coach actief)',
    'R510 — Normal session (>20 min)',
    'R516 — Bodyweight only (profile equipment=none) → 104 exercises remain',
    'R530 — T2: intensity capped at moderate',
    'R531 — Week 21: supine exercises filtered out',
    'R532 — High-impact exercises excluded during pregnancy',
    'R533 — T2+: prone exercises excluded',
    'R533 — Absolute exclusions: valsalva, inversion, crunch',
    'R534 — Pelvic floor exercise added',
  ],
  steps: [step('incline-push-up', ['bodyweight']), step('air-squat', ['bodyweight']), step('kegel-hold', ['pelvic_floor'], 'mobility')],
};
// Mark, BMI 33, dumbbells, no running shoes: R546 fires, the session has no run (UAT D7).
const MARK = {
  session_name: 'Fat Loss Circuit', slot_type: 'main', intensity: 'moderate',
  rule_trace: [
    'R500 — Goal: fat_loss → initial intensity: moderate',
    'R510 — Normal session (>20 min)',
    'R516 — Equipment filter from profile → 115 exercises remain',
    'R546 — BMI 33.1 (moderate caution) — run-walk progression recommended, intensity capped at moderate',
    'R550 — Progression profile loaded',
    'R551 — Gap axis: conditioning (15→80) — prioritised 18 exercise(s) in pool',
    'R553 — Mobility score decaying (999 days) — maintenance note added',
    'R554 — Cardio is your biggest gap (score 15 vs target 80) — planner is prioritising it',
    'R502 — Experience (beginner) → ×0.80 on reps of 4 exercise(s) and duration of 1 exercise(s)',
    'R519 — Volume 64% of baseline · factors: experience ×0.80, bodyweight ×0.80 · reasons: experience,bodyweight',
    'R525 — Mobility exercise appended: Cat-Cow (session is now 6 exercises)',
  ],
  steps: [step('pike-push-up', ['bodyweight']), step('tricep-chair-dip', ['bodyweight']), step('dumbbell-shoulder-press', ['dumbbell']), step('cat-cow', ['mobility'], 'mobility')],
};
// "Taking it easy" (R559) on a fat-loss goal.
const RECOVERY = {
  session_name: 'Fat Loss Circuit', slot_type: 'main', intensity: 'low',
  rule_trace: [
    'R500 — Goal: fat_loss → initial intensity: moderate',
    'R510 — Normal session (>20 min)',
    'R559 — Recovery mode → low intensity, mobility/recovery pool',
    'R516 — Bodyweight only (profile equipment=none) → 47 exercises remain',
    'R550 — Progression profile loaded',
    'R553 — Mobility score decaying (999 days) — maintenance note added',
    'R597 — Variety check',
  ],
  steps: [step('cat-cow', ['mobility'], 'mobility'), step('box-breathing', ['recovery'], 'recovery')],
};

describe('why-panel classification (item 1)', () => {
  it('a recovery day: R559 first, structure behind "More", R510 "Normal session" gone', () => {
    const g = classifyAdvisories(RECOVERY.rule_trace, RECOVERY.steps);
    expect(g.today.map(e => e.code)).toEqual(['R559']);
    expect(g.more.map(e => e.code).sort()).toEqual(['R500', 'R516', 'R550', 'R553', 'R597'].sort());
    expect([...g.today, ...g.standing, ...g.more].some(e => e.code === 'R510')).toBe(false);
  });
  it("Mark: no 'bodyweight session' bullet over a dumbbell press, no run-walk bullet without a run", () => {
    const g = classifyAdvisories(MARK.rule_trace, MARK.steps);
    const all = [...g.today, ...g.standing, ...g.more].map(e => e.code);
    expect(all).not.toContain('R516');
    expect(all).not.toContain('R546');
    expect(g.today).toEqual([]);
    // experience + body weight only → the volume sentence is structure, not news
    expect(g.more.map(e => e.code)).toContain('R519');
    expect(g.more.map(e => e.code)).toEqual(expect.arrayContaining(['R550', 'R551', 'R553', 'R502', 'R525']));
  });
  it('pregnancy safety stays visible (standing), Defensie filter goes under "More"', () => {
    const g = classifyAdvisories(PREGNANT.rule_trace, PREGNANT.steps);
    expect(g.standing.map(e => e.code)).toEqual(expect.arrayContaining(['R530', 'R531', 'R532', 'R533', 'R534']));
    expect(g.more.map(e => e.code)).toEqual(expect.arrayContaining(['R500', 'R596']));
  });
  it('check-in, pain, return, coach and measurement rules are today', () => {
    for (const code of ['R511', 'R512', 'R513', 'R514', 'R517', 'R558', 'R559', 'R562', 'R563', 'R564', 'R565', 'R556', 'R570', 'R598']) {
      expect(ruleKind(code, [`${code} — x`]), code).toBe('today');
    }
  });
  it('R510 / R516 by their trace line; R519 by its reasons', () => {
    expect(ruleKind('R510', ['R510 — Time ≤10 min or no_time → micro session'])).toBe('today');
    expect(ruleKind('R510', ['R510 — Normal session (>20 min)'])).toBe('hidden');
    expect(ruleKind('R516', ['R516 — Bodyweight only (checkin no_gear/traveling) → 40 exercises remain'])).toBe('today');
    expect(ruleKind('R516', ['R516 — Bodyweight only (profile equipment=none) → 104 exercises remain'])).toBe('more');
    expect(ruleKind('R516', ['R516 — Equipment filter from profile → 115 exercises remain'])).toBe('hidden');
    const vol = (reasons) => ({ volume: { pct: 60, reasons } });
    expect(ruleKind('R519', [], null, vol(['experience', 'sleep']))).toBe('today');
    expect(ruleKind('R519', [], null, vol(['experience', 'bodyweight']))).toBe('more');
  });
  it('run-walk wording needs a run step; low-impact cardio wording needs cardio', () => {
    const runStep = [step('run-interval-level-2', ['cardio', 'run_interval'], 'cardio')];
    expect(ruleKind('R546', ['R546 — x'], runStep)).toBe('standing');
    expect(ruleKind('R546', ['R546 — x'], MARK.steps)).toBe('hidden');
    expect(ruleKind('R545', ['R545 — x'], MARK.steps)).toBe('hidden');
    expect(ruleKind('R546', ['R546 — x'], null)).toBe('standing');   // unknown session: nothing hidden
  });
});

describe('coach sentence names what changed today (item 2)', () => {
  it('Taking it easy → the recovery sentence, not the goal line', () => {
    expect(deriveCoachSentence(RECOVERY.rule_trace, null, 'standard', 'main', RECOVERY.steps)).toBe('Taking it easy today — mobility and recovery only.');
    expect(coachLine(RECOVERY)).toBe('Rustig aan vandaag — alleen mobiliteit en herstel.');
  });
  it('a check-in signal outranks a standing pregnancy rule, prefix kept', () => {
    const s = deriveCoachSentence([...PREGNANT.rule_trace, 'R511 — Poor sleep (≤5h) → intensity capped at low, volume ×0.85'], null, 'pregnant', 'main', PREGNANT.steps);
    expect(s).toBe('Adapted for pregnancy — lighter intensity today — short sleep is worth respecting.');
  });
  it('the tautology case: pregnant, no check-in → a pregnancy-safe sentence, never "Sessie van vandaag: beweging van vandaag."', () => {
    const line = coachLine(PREGNANT, 'pregnant');
    expect(line).not.toMatch(/Sessie van vandaag/);
    expect(line).not.toMatch(/beweging van vandaag\.$/i);
    expect(line).toMatch(/^Aangepast voor zwangerschap — /);
    expect(line).toBe('Aangepast voor zwangerschap — bekkenbodemoefeningen toegevoegd aan de sessie van vandaag.');
    // never the prefix twice ("— adapted for pregnancy — … adapted for pregnancy")
    expect(deriveCoachSentence(PREGNANT.rule_trace.filter(t => !t.startsWith('R534')), null, 'pregnant', 'main')).toBe('Adapted for pregnancy — high-impact exercises are left out.');
  });
  it('the body-mode fallback when no rule carries the card', () => {
    expect(coachLine({ session_name: "Today's movement", slot_type: 'main', rule_trace: ['R500 — Goal'], steps: [] }, 'pregnant'))
      .toBe('Aangepast voor zwangerschap — rustig en veilig bewegen vandaag.');
    expect(coachLine({ session_name: 'A gentle moment', slot_type: 'main', rule_trace: [], steps: [] }, 'postnatal'))
      .toBe('Veilig na de bevalling — zacht bewegen om je kracht weer op te bouwen.');
  });
  it("Mark: no run step → not the run-walk sentence; the goal line is the fallback", () => {
    expect(deriveCoachSentence(MARK.rule_trace, null, 'standard', 'main', MARK.steps)).toBeNull();
    expect(coachLine(MARK)).toBe(`Sessie van vandaag: ${sessionTitle('Fat Loss Circuit').toLowerCase()}.`);
    const withRun = [...MARK.steps, step('run-interval-level-1', ['cardio', 'run_interval'], 'cardio')];
    expect(deriveCoachSentence(MARK.rule_trace, null, 'standard', 'main', withRun)).toBe('Walk-run intervals — the safe way to build running capacity.');
  });
  it('a profile-bodyweight user does not read "Bodyweight only today" every day; a no-gear check-in does', () => {
    expect(deriveCoachSentence(['R516 — Bodyweight only (profile equipment=none) → 104 exercises remain'], null)).toBeNull();
    expect(deriveCoachSentence(['R516 — Bodyweight only (checkin no_gear/traveling) → 40 exercises remain'], null)).toBe('Bodyweight only today — no kit needed.');
    expect(deriveCoachSentence(['R510 — Normal session (>20 min)'], null)).toBeNull();
    expect(deriveCoachSentence(['R510 — Short session (≤20 min)'], null)).toBeNull();
    expect(deriveCoachSentence(['R510 — Time ≤10 min or no_time → micro session'], null)).toBe('Micro session — adapted to the time you have.');
  });
  it('progression structure never carries the card', () => {
    expect(deriveCoachSentence(['R553 — Mobility score decaying', 'R551 — Gap axis'], null)).toBeNull();
  });
  it('a user-built session keeps its own line', () => {
    expect(coachLine({ authored_by_user: true, rule_trace: ['R559'] })).toMatch(/zelf samengesteld/);
  });
});

describe('the session title follows the session (item 7)', () => {
  it('recovery mode reads "Rustige sessie", not the goal name', () => {
    expect(sessionTitle('Fat Loss Circuit', RECOVERY)).toBe('Rustige sessie');
    expect(sessionTitle('Fat Loss Circuit', { slot_type: 'mobility' })).toBe('Rustige sessie');
  });
  it('a rest day reads "Herstel"', () => {
    expect(sessionTitle('Active Rest', { slot_type: 'rest' })).toBe('Herstel');
  });
  it('an ordinary day, a coach programme and a user-named session keep their name', () => {
    expect(sessionTitle('Fat Loss Circuit', MARK)).toBe(sessionTitle('Fat Loss Circuit'));
    expect(sessionTitle('Mijn training', { authored_by_user: true, rule_trace: ['R559'] })).toBe('Mijn training');
    expect(sessionTitle('Running Day · Week 2 · Zone 2', { run_program: {}, rule_trace: ['R559'] })).not.toBe('Rustige sessie');
  });
});

describe('DCP rows on Today (item 6)', () => {
  it('"DCP measurement · max in 2 min" for a measurement step, null otherwise', () => {
    expect(dcpTodayMeta({ max_effort: true, measure_window_sec: 120 })).toEqual(['DCP measurement · max in {m} min', { m: 2 }]);
    expect(dcpTodayMeta({ target_reps: 10 })).toBeNull();
  });
});

describe('timed targets round to 5 s (item 8)', () => {
  it('32 → 30, 23 → 25, 48 → 50, never below 5', () => {
    expect(roundTo5Sec(32)).toBe(30);
    expect(roundTo5Sec(23)).toBe(25);
    expect(roundTo5Sec(48)).toBe(50);
    expect(roundTo5Sec(2)).toBe(5);
    expect(roundTo5Sec(120)).toBe(120);
    expect(roundTo5Sec(null)).toBe(null);
  });
});

describe('safe stop — outcome rules (item 5)', () => {
  const done = (sets) => ({ actual: { sets_completed: sets, reps_per_set: Array(sets).fill(10), skipped: false } });
  it('stopSummary counts the exercises with a completed, non-skipped set', () => {
    expect(stopSummary([done(2), done(0), { actual: { sets_completed: 1, skipped: true } }, done(1)])).toEqual({ exercises_done: 2, exercises_total: 4 });
    expect(stopSummary(null)).toEqual({ exercises_done: 0, exercises_total: 0 });
  });
  it('the server accepts only "abandoned" from the client, recomputes the summary, refuses an empty stop', () => {
    expect(readExecutionStatus({ steps: [done(1)] })).toEqual({ status: 'completed', execution_json: null });
    const r = readExecutionStatus({ status: 'abandoned', stopped_after: { exercises_done: 9, exercises_total: 9 }, steps: [done(1), done(0)] });
    expect(r.status).toBe('abandoned');
    expect(r.stopped_after).toEqual({ exercises_done: 1, exercises_total: 2 });
    expect(JSON.parse(r.execution_json)).toEqual({ stopped_after: { exercises_done: 1, exercises_total: 2 } });
    expect(readExecutionStatus({ status: 'abandoned', steps: [done(0)] })).toEqual({ error: 'nothing_to_save' });
    expect(readExecutionStatus({ status: 'planned', steps: [done(1)] })).toEqual({ error: 'invalid_status' });
  });
  it('progression is credited for the steps done only on a stopped session', () => {
    const steps = [done(2), done(0)];
    expect(creditedSteps(steps, 'abandoned')).toEqual([steps[0]]);
    expect(creditedSteps(steps, 'completed')).toEqual(steps);
    // rows read back from execution_steps carry actual_json
    expect(creditedSteps([{ actual_json: '{"sets_completed":0}' }, { actual_json: '{"sets_completed":3}' }], 'abandoned')).toHaveLength(1);
  });
  it('showing up: completed, or stopped with a set done', () => {
    expect(showedUp({ status: 'completed' })).toBe(true);
    expect(showedUp({ status: 'abandoned', stopped_after: { exercises_done: 1, exercises_total: 5 } })).toBe(true);
    expect(showedUp({ status: 'abandoned', stopped_after: null })).toBe(false);
    expect(showedUp({ status: 'in_progress' })).toBe(false);
    expect(SHOWED_UP_SQL).toMatch(/status = 'abandoned'/);
  });
  it('doneKind: stopped, rest day ("Rest Day" or a reconstructed "recovery"), done', () => {
    expect(doneKind({ name: 'Fat Loss Circuit', stopped_after: { exercises_done: 1, exercises_total: 5 } })).toBe('stopped');
    expect(doneKind({ name: 'Rest Day', duration_sec: 0 })).toBe('rest');
    expect(doneKind({ name: 'recovery', duration_sec: 0 })).toBe('rest');
    expect(doneKind({ name: 'Fat Loss Circuit' })).toBe('done');
    expect(doneKind(null)).toBe('done');
  });
});
