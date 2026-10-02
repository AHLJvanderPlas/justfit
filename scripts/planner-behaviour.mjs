// Behavioural guard for the planner. Source-scanning checks could not have caught
// the bug that started this: R590 and R593 reordered ctx.pool after the selection
// list was derived, so they printed their trace lines and changed no session while
// every guard passed. These assertions run the real planner against a fixture of
// real library rows and check the SESSION, which is the only thing that matters.
import { runPlanner } from '../functions/api/plan.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const rows = JSON.parse(fs.readFileSync(path.join(here, 'fixtures/planner-exercises.json'), 'utf8'));
const exercises = rows.map((r, i) => ({
  id: 'ex' + i, slug: r.slug, name: r.name, category: r.category,
  tags_json: r.tags_json, equipment_required_json: r.equipment_required_json,
  metrics_json: r.metrics_json, instructions_json: null, alternatives_json: null,
  primary_muscles_json: '[]', secondary_muscles_json: '[]', media_json: null,
}));

const prefsWith = (dcp, active = false, extra = {}) => ({
  training_goal: 'strength', experience_level: 'intermediate', session_duration_min: 40,
  sex: 'male', weight_kg: 80, height_cm: 180,
  preferences: { primary_intent: 'general', military_coach: { active, dcp }, ...extra },
});
const plan = (prefs, opts = {}) => runPlanner('2026-10-02', null, exercises, prefs, [], [],
  { sex: 'male', weight_kg: 80, height_cm: 180 }, null, null, false, null, false,
  [], null, 0, 0, 0, null, null, opts);

const errs = [];
const check = (cond, msg) => { if (!cond) errs.push(msg); };
const DAY = 86400000;
const dcpTarget = { enabled: true, bias_enabled: true, birth_year: 1989 };

// R598 — scheduled when due, silent when not, and ALWAYS both movements. A
// one-sided measurement is worse than none: it writes half a baseline the bias
// then treats as complete.
{
  const due = plan(prefsWith(dcpTarget));
  const m = (due.steps || []).filter(s => s.max_effort);
  check(due.assessment_planned === true, 'R598 did not schedule a measurement that is due');
  check(m.length === 2, `R598 scheduled ${m.length} measurement set(s), expected both movements`);
  check(m.every(s => s.sets === 1 && s.target_reps == null && s.target_duration_sec === 120),
    'a measurement set is not 1 unscaled set over the 2-minute protocol window');
  const kinds = new Set(m.map(s => s.measures));
  check(kinds.has('dcp_pushups') && kinds.has('dcp_situps'), 'both DCP movements must be measured');

  const fresh = plan(prefsWith({ ...dcpTarget, last: { pushups: 30, situps: 40, at_ms: Date.now() } }));
  check(fresh.assessment_planned === false, 'R598 re-measured a baseline taken today');

  const stale = plan(prefsWith({ ...dcpTarget, last: { pushups: 30, situps: 40, at_ms: Date.now() - 60 * DAY } }));
  check(stale.assessment_planned === true, 'R598 did not re-measure a 60-day-old baseline');

  const notTarget = plan(prefsWith({ enabled: true, bias_enabled: false, birth_year: 1989 }));
  check(notTarget.assessment_planned === false, 'R598 fired for a DCP that is switched off');
  check(!(notTarget.rule_trace || []).some(t => String(t).includes('R593')),
    'R593 steered a plan whose DCP is switched off');

  const forced = plan(prefsWith({ ...dcpTarget, last: { pushups: 30, situps: 40, at_ms: Date.now() } }), { forceAssessment: true });
  check(forced.assessment_planned === true, 'a forced assessment was ignored');
}

// R596 — no Defence protocol work in a civilian session.
//
// Must be asserted with a goal whose target category is CARDIO. The marches are
// cardio, so a strength session filters them out by category alone and the
// assertion would pass even with R596 disabled — which is precisely the shape of
// the original bug: a fat_loss user, whose target category is cardio, got three
// rucksack marches.
{
  const civ = prefsWith({ enabled: false });
  civ.training_goal = 'fat_loss';
  const p = plan(civ);
  const bad = (p.steps || []).filter(s => /^(marsen|hardlopen)|cooper|rugzak|weighted-march/.test(s.exercise_slug));
  check(bad.length === 0, `civilian session contained protocol work: ${bad.map(s => s.exercise_slug).join(', ')}`);
  check((p.steps || []).length > 0, 'civilian fat_loss session came back empty');
}

// R597 — no two exercises from one movement family.
{
  const p = plan(prefsWith(dcpTarget));
  const fams = (p.steps || []).map(s => s.exercise_slug.replace(/^(knee|wall|incline|hand-release|weighted|bent-knee|anchored)-/, ''));
  check(new Set(fams).size === fams.length, `duplicate movement families in one session: ${fams.join(', ')}`);
}

// R595 — nothing longer than the session it sits in.
{
  const p = plan({ ...prefsWith({ enabled: false }), session_duration_min: 20 });
  const over = (p.steps || []).filter(s => (s.target_duration_sec ?? 0) * (s.sets ?? 1) > 20 * 60);
  check(over.length === 0, `step longer than the whole 20-min session: ${over.map(s => s.exercise_slug).join(', ')}`);
}

process.stdout.write(errs.length ? errs.join('; ') : 'OK');
