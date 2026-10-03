// Behavioural guard for the planner — a persona × property matrix (W1.1).
//
// Source-scanning checks could not have caught the bug that started this: R590
// and R593 reordered ctx.pool after the selection list was derived, so they
// printed their trace lines and changed no session while every guard passed.
// Everything below runs the REAL planner against a fixture of real library rows
// and asserts on the SESSION, which is the only thing a user ever sees.
//
// Contract (scripts/smoke.sh depends on it): stdout is exactly "OK" on success,
// or a "; "-joined list of failures with a non-zero exit. smoke.sh captures both
// streams and compares the whole thing to "OK", so nothing else may be printed
// unless a human asked for it — hence the TTY/--verbose gate on the report.
//
//   node scripts/planner-behaviour.mjs --verbose   # the persona × property matrix
//   MEASURE=1 node scripts/planner-behaviour.mjs --verbose
//                                                 # + the measured volume ratio
//                                                 #   per persona per date (W3.2)
//
import { runPlanner, movementFamily, isLongContinuousCardio, continuousCardioCapSec } from '../functions/api/plan.js';
import { estimateMins } from '../packages/client-app/src/planUtils.js';
import { RULE_LABELS, INTERNAL_RULE_CODES, parseVolumeTrace } from '../packages/client-app/src/messagePolicy.js';
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

// ── Properties that land with a later wave ───────────────────────────────────
//
// Property 7 (volume floor) is the acceptance test for W3.2 and property 8
// (every emitted R-code has a RULE_LABELS entry) for W2.1. Both are implemented
// in full here and reported as SKIP until the work they verify ships.
const PENDING = new Set();

const DAY = 86400000;
const TODAY = '2026-10-02';                       // a Friday; nothing is weekday-gated except R999
const todayMs = new Date(TODAY + 'T12:00:00Z').getTime();
const daysAgo = (n) => new Date(todayMs - n * DAY).toISOString().slice(0, 10);

// ── Fixture-adjacent real data ───────────────────────────────────────────────
// Three real cycling_workouts rows, verbatim from migrations/0035_cycling_workouts.sql.
// They live in their own table, not in the exercise library, so they cannot come
// from the exercise fixture.
const CYCLING_WORKOUTS = [
  { id: 'cw01', slug: 'cw-z2-45', name: 'Zone 2 · 45 min', sub_goal: 'build_fitness',
    workout_type: 'endurance', tss_estimate: 32, duration_min: 45,
    intervals_json: '[{"label":"Zone 2","duration_sec":2700,"power_pct_low":55,"power_pct_high":75,"sets":1}]' },
  { id: 'cw02', slug: 'cw-ss-2x12', name: 'Sweet Spot · 2×12 min', sub_goal: 'build_fitness',
    workout_type: 'sweet_spot', tss_estimate: 45, duration_min: 47,
    intervals_json: '[{"label":"Warm-up","duration_sec":600,"power_pct_low":50,"power_pct_high":65,"sets":1},{"label":"Sweet spot","duration_sec":720,"power_pct_low":88,"power_pct_high":93,"sets":2},{"label":"Recovery","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":2},{"label":"Cool-down","duration_sec":300,"power_pct_low":45,"power_pct_high":55,"sets":1}]' },
  { id: 'cw03', slug: 'cw-tempo-30', name: 'Tempo · 30 min', sub_goal: 'build_fitness',
    workout_type: 'threshold', tss_estimate: 42, duration_min: 45,
    intervals_json: '[{"label":"Warm-up","duration_sec":480,"power_pct_low":55,"power_pct_high":65,"sets":1},{"label":"Tempo","duration_sec":1800,"power_pct_low":76,"power_pct_high":90,"sets":1},{"label":"Cool-down","duration_sec":420,"power_pct_low":45,"power_pct_high":55,"sets":1}]' },
];

const HOME_KIT = ['none', 'dumbbell', 'resistance_bands', 'pull_up_bar', 'kettlebell', 'chair'];
// R518's seeded `gym` profile resolves to GYM_EQUIPMENT, which is HOME_EQUIPMENT
// plus the machines — and HOME_EQUIPMENT includes `rucksack`. A persona that
// ticks "at the gym" therefore genuinely owns a rucksack as far as R516/R518 are
// concerned, so the harness must grant it too or it would assert a contract the
// engine never promised.
const GYM_KIT  = [...HOME_KIT, 'rucksack', 'barbell', 'bench', 'bench_press_rack', 'squat_rack', 'cable',
  'machine', 'multi_gym', 'leg_press', 'lat_pulldown', 'chest_press_machine', 'leg_curl_machine',
  'leg_extension_machine', 'seated_row_machine', 'pec_deck', 'dip_station', 'ez_bar', 'weight_plates'];

const SCORES = (n = 40) => ({
  push: { power: n, endurance: n }, pull: { power: n, endurance: n },
  legs: { power: n, endurance: n }, core: { power: n, endurance: n },
  conditioning: { power: n, endurance: n }, mobility: { mobility: n },
});

// ── Persona → runPlanner arguments ───────────────────────────────────────────
//
// Every field a persona does not state is a deliberate default: 40-minute
// budget, `health` goal, intermediate, 80 kg / 180 cm male, no check-in, no
// coach. A persona therefore reads as the one thing it is testing.
const build = (p, date = TODAY) => {
  const sex      = p.sex ?? 'male';
  const weightKg = p.weight_kg ?? 80;
  const heightCm = p.height_cm ?? 180;
  const prefs = {
    training_goal: p.goal ?? 'health',
    experience_level: p.experience ?? 'intermediate',
    session_duration_min: p.budget ?? 40,
    intensity_pref: p.intensity_pref ?? null,
    sex, weight_kg: weightKg, height_cm: heightCm,
    preferences: {
      primary_intent: p.primary_intent ?? 'general',
      available_equipment: p.equipment ?? ['none'],
      chronic_injury_areas: p.chronic ?? [],
      ...(p.blockedWeekdays ? { blocked_weekdays: p.blockedWeekdays } : {}),
      sport_prefs: p.sportPrefs ?? { bias_enabled: false },
      ...(p.militaryCoach ? { military_coach: p.militaryCoach } : {}),
      ...(p.runCoach ? { run_coach: p.runCoach } : {}),
      ...(p.cyclingCoach ? { cycling_coach: p.cyclingCoach } : {}),
    },
  };
  const progression = p.noProgression ? null : {
    chartMode: 'balanced',
    scores: SCORES(p.conditioning ?? 40),
    last_workout_date: p.lastWorkoutDate ?? null,
  };
  return [
    date, p.checkIn ?? null, exercises, prefs, [], [],
    { sex, weight_kg: weightKg, height_cm: heightCm },
    p.cycleContext ?? null, p.pregnancyContext ?? null, false, progression,
    p.isPro ?? false,
    p.cyclingCoach ? CYCLING_WORKOUTS : [],
    p.cyclingTsb ?? null, p.cyclingSessionsLast7 ?? 0, p.runSessionsLast7 ?? 0,
    p.crossRunsLast7 ?? 0, null, null, p.opts ?? {},
  ];
};
const plan = (p, date = TODAY) => runPlanner(...build(p, date));

// The same persona on a neutral day: the situational de-loads and the body-mass
// leg of the volume stack removed, everything else identical. Property 7 reads
// the stack's product off these two sessions instead of off the source.
const neutralTwin = (p) => ({
  ...p, checkIn: null, experience: 'intermediate', weight_kg: 70,
  lastWorkoutDate: null, opts: {},
});

const MIL = (over = {}) => ({
  active: true, track: 'keuring', mode: 'target',
  cluster_current: 3, cluster_target: 3,
  target_date: daysAgo(-30), block_number: 2, block_session_index: 1,
  last_cooper_distance_m: 2500, pack_weights_available_kg: [5, 10, 15],
  ...over,
});
const DCP = { enabled: true, bias_enabled: true, birth_year: 1989 };

// ⚠ OPEN PLANNER BUG — do not "tidy" this away.
//
// Every DCP-bias persona below carries a selected sport. That is not incidental:
// with the DCP bias on and NO sport selected, computeSportBiasedTargets resolves
// `primary` to undefined and plan.js:720 throws
//   TypeError: Cannot read properties of undefined (reading 'push')
// → the handler returns {error:"Internal error"} and the user gets no plan at
// all. The early return is `!knownSports.length && !dcpBias`, so the dcpBias leg
// deliberately continues into a branch that requires a sport.
//
// It only fires once the athlete has a progression row, which is why the first
// version of this harness never saw it: it passed progressionState = null.
// Reproduce by deleting `sportPrefs` from the `dcp-due` persona.
// Reported in the Wave 1 write-up; the fix belongs to plan.js, not here.
const DCP_SPORT = { sports: ['running'], primary: 'running', bias_enabled: false };

// ── Open gaps, recorded as ratchets ─────────────────────────────────────────
//
// A property the engine does not yet satisfy is written down here at its exact
// current size and referenced by the personas it affects (`gaps`, `timeOverMin`,
// `dupAllow`). A guard that quietly loosened its own threshold would be the bug
// this whole workstream exists to correct, so the property still fails the
// moment a figure gets worse, and an entry is DELETED — never raised — when the
// planner is fixed.
//
// Wave 3 (2026-10-03) deleted all four Wave 1 entries — POOL_REBUILD_IGNORES_
// FILTERS, NO_TOTAL_TIME_BOUND, MARCH_APPENDED_AFTER_COUNT, MARCH_DUPLICATED_
// AFTER_SELECTION — and the `optillen-vanaf-de-grond` protocol waiver. Nothing
// is waived today.
const KNOWN_GAPS = {};

// The runs R555 exists to keep an unprepared athlete off: real running volume
// with no graded structure. R555 removes these and re-admits exactly one
// `run-interval-level-N` matched to the athlete's conditioning, so the contract
// is "no ungraded run", not "no running".
const UNGUARDED_RUNS = ['easy-run-outdoor', 'tempo-run-outdoor', 'run-intervals-outdoor',
  'treadmill-run-steady', 'hardlopen-zone-2-30-minuten', '12-minute-cooper-test'];

// forbid.tags         — tags no step may carry for this persona
// forbid.equip        — equipment tokens no step may require
// forbid.equipAllowOnly — the only equipment tokens permitted
// gaps                — KNOWN_GAPS keys that waive a leg of a property here
// timeOverMin         — declared, ratcheted overrun in minutes (see KNOWN_GAPS)
// Everything in forbid is justified by the rule named beside it.
const PERSONAS = [
  // ── Pregnancy — R530–R537 ──
  { id: 'pregnant-t1', sex: 'female', pregnancyContext: { mode: 'pregnant', week: 9, trimester: 1 },
    forbid: { tags: ['high_impact', 'valsalva', 'inversion', 'crunch'] } },                   // R532, R533
  { id: 'pregnant-t2', sex: 'female', pregnancyContext: { mode: 'pregnant', week: 20, trimester: 2 },
    forbid: { tags: ['high_impact', 'valsalva', 'inversion', 'crunch', 'supine', 'prone'] } }, // + R531, R533
  { id: 'pregnant-t3', sex: 'female', pregnancyContext: { mode: 'pregnant', week: 34, trimester: 3 },
    checkIn: { pregnancy_signals: { breathless: true } },
    forbid: { tags: ['high_impact', 'valsalva', 'inversion', 'crunch', 'supine', 'prone'] } }, // + R536
  { id: 'pregnant-t1-nausea', sex: 'female', pregnancyContext: { mode: 'pregnant', week: 8, trimester: 1 },
    checkIn: { pregnancy_signals: { nausea: true } },
    forbid: { tags: ['high_impact', 'valsalva', 'inversion', 'crunch'] } },                   // R535

  // ── Postnatal — R539–R544 ──
  { id: 'postnatal-immediate', sex: 'female',
    pregnancyContext: { mode: 'postnatal', postnatal_phase: 'immediate', postnatal_cleared_for_exercise: 0, postnatal_birth_type: 'vaginal' },
    forbid: { tags: ['high_impact', 'valsalva', 'crunch'] } },                                 // R540
  { id: 'postnatal-uncleared', sex: 'female',
    pregnancyContext: { mode: 'postnatal', postnatal_phase: 'rebuilding', postnatal_cleared_for_exercise: 0, postnatal_birth_type: 'vaginal' },
    forbid: { tags: ['high_impact', 'valsalva', 'crunch'] } },                                 // R539 holds at immediate
  { id: 'postnatal-rebuilding', sex: 'female',
    pregnancyContext: { mode: 'postnatal', postnatal_phase: 'rebuilding', postnatal_cleared_for_exercise: 1, postnatal_birth_type: 'vaginal' },
    forbid: { tags: ['high_impact', 'valsalva', 'crunch'] } },                                 // R540
  { id: 'postnatal-caesarean', sex: 'female',
    pregnancyContext: { mode: 'postnatal', postnatal_phase: 'rebuilding', postnatal_cleared_for_exercise: 1, postnatal_birth_type: 'caesarean' },
    forbid: { tags: ['high_impact', 'valsalva', 'crunch', 'prone'] } },                        // + R542

  // ── Perimenopause — R526 ──
  { id: 'perimenopause', sex: 'female', pregnancyContext: { mode: 'perimenopause' },
    checkIn: { stress: 6 }, expectIntensity: 'low' },

  // ── Military — R570–R577 ──
  { id: 'military-k3-strength', budget: 60, goal: 'military', primary_intent: 'military',
    militaryCoach: MIL({ block_session_index: 1 }), conditioning: 55 },
  { id: 'military-k3-march', budget: 60, goal: 'military', primary_intent: 'military',
    militaryCoach: MIL({ block_session_index: 3 }), conditioning: 55 },                         // R574
  { id: 'military-k3-zone2', budget: 60, goal: 'military', primary_intent: 'military',
    militaryCoach: MIL({ block_session_index: 0, block_number: 2 }), conditioning: 55,
    prescribed: true },
  // The one persona R595 actually protects. For a civilian the long marches are
  // already gone (R596) and the long runs too (R555), so only a military-coach
  // athlete whose goal makes the target category CARDIO can still meet a
  // 25-minute march in a 25-minute window. Without this persona R595 can be
  // deleted and the matrix still passes — which is no coverage at all.
  { id: 'military-short-cardio', budget: 25, goal: 'fat_loss', primary_intent: 'military',
    militaryCoach: MIL({ block_session_index: 1 }), conditioning: 55 },                         // R595
  { id: 'military-k3-cooper', budget: 60, goal: 'military', primary_intent: 'military',
    militaryCoach: MIL({ block_session_index: 0, block_number: 1, last_cooper_distance_m: null }),
    conditioning: 55, prescribed: true },

  // ── Endurance coaches — R555–R557 ──
  { id: 'running-coach-wk6', budget: 45, goal: 'endurance', isPro: true,
    equipment: ['none', 'running_shoes'], conditioning: 50, prescribed: true,
    runCoach: { enrolled: true, completed: false, target_km: 5, week: 6, session_in_week: 1 } },
  { id: 'cycling-coach-build', budget: 60, goal: 'endurance', isPro: true,
    equipment: ['none', 'indoor_bike'], prescribed: true, singleStepOk: true,
    cyclingCoach: { active: true, sub_goal: 'build_fitness', unit: 'watts', ftp_watts: 250,
      week: 4, session_in_week: 1, sessions_total: 10, cycling_days_per_week: 3 } },

  // ── Body composition — R545/R546/R583 ──
  { id: 'bmi32-beginner', weight_kg: 98, height_cm: 175, experience: 'beginner', goal: 'fat_loss',
    equipment: ['none', 'running_shoes'], conditioning: 15,
    forbid: { slugs: UNGUARDED_RUNS } },                                                       // R546 + R555
  { id: 'bmi36-strict', weight_kg: 110, height_cm: 175, experience: 'beginner', goal: 'fat_loss',
    equipment: ['none', 'running_shoes'], conditioning: 15,
    forbid: { equip: ['running_shoes', 'treadmill'] } },                                       // R545 strict band
  // W3.1 — the hole R555's tag test left: treadmill-run-steady is a 25-minute
  // continuous run that needs a treadmill, not running shoes, and carries no
  // `running` tag, so isRunVolumeExercise never saw it. A deconditioned athlete
  // who owns a treadmill was offered it. The property test catches it by duration.
  { id: 'treadmill-deconditioned', goal: 'fat_loss', experience: 'beginner',
    equipment: ['none', 'treadmill', 'rowing_machine', 'exercise_bike'], conditioning: 15 },   // R555 (property)
  { id: 'bmi19-advanced', weight_kg: 58, height_cm: 175, experience: 'advanced', goal: 'strength',
    equipment: HOME_KIT },

  // ── Injury and pain — R514, R562–R565 ──
  { id: 'injury-knee', checkIn: { pain_level: 3, pain_scope: 'specific', pain_areas: ['knee'] },
    forbid: { tags: ['loads_knee'] } },                                                        // R563
  { id: 'injury-shoulder', chronic: ['shoulder'], forbid: { tags: ['loads_shoulder'] } },      // R563
  { id: 'pain-general', checkIn: { pain_level: 3, pain_scope: 'general' }, expectRest: true },  // R514
  { id: 'recovery-mode', checkIn: { recovery_mode: true }, expectIntensity: 'low',
    onlyCategories: ['mobility', 'recovery'] },                                                // R559

  // ── Time and kit — R501, R510, R516, R518 ──
  { id: 'budget-10', budget: 10, expectSlot: 'micro' },                                        // R510
  { id: 'budget-90', budget: 90 },
  { id: 'no-equipment', equipment: [], forbid: { equipAllowOnly: ['none', 'chair'] } },        // R516
  { id: 'full-gym', equipment: GYM_KIT, checkIn: { equipment_profile_id: 'gym' } },           // R518

  // ── Standing standards and return — R558, R593, R598 ──
  { id: 'dcp-due', militaryCoach: { active: false, dcp: DCP }, sportPrefs: DCP_SPORT,
    expectAssessment: true },                                                                   // R593, R594, R598
  // The DCP switch on with NO sport selected. This was a live 500: R594 ran the
  // sport-bias path with no sport, indexed SPORT_DEMAND[undefined], and threw.
  // The matrix's own first run found it; this persona keeps it found.
  { id: 'dcp-no-sport', militaryCoach: { active: false, dcp: DCP },
    expectAssessment: true },                                                                   // R594 without R560
  // ── Remaining rule paths the personas above never reach ──
  // Every weekday blocked, so the sweep always lands on a rest day: the rest
  // path has to hold on every date, not on the one in seven a single blocked
  // weekday would give.
  { id: 'all-days-blocked', blockedWeekdays: [0, 1, 2, 3, 4, 5, 6], expectRest: true },        // R999
  { id: 'low-mood', checkIn: { mood: 3 }, expectIntensity: 'low' },                            // R517
  { id: 'bmi29-pace-note', weight_kg: 89, height_cm: 175, goal: 'fat_loss',
    equipment: ['none', 'running_shoes'], conditioning: 25 },                                  // R583
  // Only an explicit check-in time_budget turns R592 on, so nothing above
  // exercises superset pairing — the one rule that rewrites steps after assembly.
  { id: 'time-pressed-supersets', budget: 60, goal: 'strength', equipment: HOME_KIT,
    checkIn: { time_budget: 45 } },                                                             // R592

  { id: 'returning-30d', lastWorkoutDate: daysAgo(30) },                                       // R558
  { id: 'deloaded-stack', experience: 'beginner', weight_kg: 110, height_cm: 190,
    lastWorkoutDate: daysAgo(17), checkIn: { sleep_hours: 5 } },                                 // the audit's worked example
  { id: 'deloaded-worst', experience: 'beginner', weight_kg: 110, height_cm: 190,
    lastWorkoutDate: daysAgo(17), checkIn: { sleep_hours: 5, energy: 3 } },                      // R502 × R511/R558 × R512 × R524
  // W3.2/W3.3 — the case where R524 used to run AFTER the 3-rep clamp: strength
  // (5 reps), beginner, low energy, and NO measurement, so R524 falls back to the
  // body-weight proxy (130 kg → ×0.73). The old order produced 2-rep sets.
  { id: 'heavy-unmeasured-strength', goal: 'strength', experience: 'beginner', weight_kg: 130,
    height_cm: 180, noProgression: true, checkIn: { energy: 3 } },                                // R524 inside the floor
];

// ── Assertions ───────────────────────────────────────────────────────────────
const errs = [];
const results = [];                              // [{persona, property, state, detail}]
const PROPS = ['contraindications', 'time-budget', 'pool-floor', 'prescription',
  'variety', 'step-vs-session', 'volume-floor', 'trace-labels'];
const unlabelledSeen = new Set();                // the W2.1 work list, observed

const exById  = new Map(exercises.map(e => [e.id, e]));
const bmiOf   = (p) => (p.weight_kg ?? 80) / (((p.height_cm ?? 180) / 100) ** 2);
const tagsOf  = (s) => { try { return JSON.parse(s.tags_json || '[]'); } catch { return []; } };
const equipOf = (s) => { try { return JSON.parse(s.equipment_required_json || '["none"]'); } catch { return ['none']; } };

// R596's own discriminator: a military-tagged cardio/skill row, rucksack work, or
// a name-declared fixed prescription is Defence protocol, not general training.
const isProtocolStep = (s) => {
  const t = tagsOf(s);
  if (t.includes('protocol')) return true;            // W5.3 data tag, when the library carries it
  if (!t.includes('military')) return false;
  if (s.category === 'cardio' || s.category === 'skill') return true;
  if (equipOf(s).includes('rucksack')) return true;
  return /marsen|rugzak|cooper|graaftest|optillen/.test(s.exercise_slug ?? '');
};

// Property 7's escape hatch is deliberately NOT "a trace says the floor fired".
// A floor that fired puts the session AT the floor, never under it, so accepting
// floor wording as an excuse would pass a floor that printed its line and
// clamped nothing — the exact R590/R593 failure this harness exists to catch.
// What legitimately excuses a very light day is a rule that says the session is
// meant to be minimal: a micro slot, a nausea day, recovery mode, or a
// measurement set that must not be scaled at all.
// R510 is excluded on purpose: it pushes a trace line on EVERY session
// ("R510 — Normal session (>20 min)"), so matching it would excuse every
// persona and the property would be unfailable. The micro slot is read off
// the output instead.
const DELIBERATELY_MINIMAL = /\bR(535|559|598)\b/;
const VOLUME_FLOOR = 0.5;

// estimateMins() is the client's own estimator — the "existing overhead
// allowance" the spec refers to. It rounds up to the next 5 above 20 minutes,
// so a session may legitimately read 5 minutes over a 5-minute-aligned budget.
const TIME_ALLOWANCE_MIN = 5;

// Selection is a SEEDED SHUFFLE of the pool, so one date samples one ordering.
// A contraindicated row that survived its filter would therefore surface on some
// days and not others, and a single-date guard would call that coverage. Every
// persona is planned across two months of dates and a property must hold on all
// of them. That is what turns "I did not see it today" into "it cannot happen":
// the 60-date sweep is what surfaced four of the findings in the Wave 1 report,
// each of which a single-date run called clean.
const DATES = Array.from({ length: 60 }, (_, i) => new Date(todayMs + i * DAY).toISOString().slice(0, 10));

for (const p of PERSONAS) {
  const waives = (gap) => (p.gaps ?? []).includes(gap);
  const seen = new Map();                 // prop → first verdict, failures winning
  const notes = new Set();                // persona-level expectation breaches
  let DATE = DATES[0];
  const say = (prop, state, detail) => {
    const prev = seen.get(prop);
    if (prev?.state === 'FAIL') return;                 // keep the first failure
    if (prev && state !== 'FAIL') return;               // keep the first non-failure
    seen.set(prop, { state, detail, date: DATE });
  };

  for (DATE of DATES) {
    let out;
    try {
      out = plan(p, DATE);
    } catch (e) {
      for (const prop of PROPS) say(prop, 'FAIL', `planner threw: ${e.message}`);
      continue;
    }
    const steps = out.steps ?? [];
    const trace = (out.rule_trace ?? []).map(String);
    // The check-in's time_budget overrides the profile budget inside the planner
    // (_initPlannerContext), and R510/R595/R592 all read the override. Properties
    // 2 and 6 must measure against the same number the engine did.
    const budget = p.checkIn?.time_budget ?? p.budget ?? 40;
    const isRest = out.slot_type === 'rest';

    // Persona-level expectations, so a persona cannot silently stop being the
    // thing it claims to be — a pregnancy test that quietly returns a rest day
    // would pass every property below while testing nothing.
    if (p.expectRest && !isRest) notes.add(`expected a rest session, got ${out.slot_type}`);
    if (!p.expectRest && isRest) notes.add('unexpected rest session — this persona no longer exercises the rules it was built for');
    if (p.expectSlot && out.slot_type !== p.expectSlot) notes.add(`expected slot ${p.expectSlot}, got ${out.slot_type}`);
    if (p.expectIntensity && out.intensity !== p.expectIntensity) notes.add(`expected intensity ${p.expectIntensity}, got ${out.intensity}`);
    if (p.expectAssessment && out.assessment_planned !== true) notes.add('R598 did not schedule the due measurement');

    // ── 1. No contraindicated tag (or kit) for this persona's body mode ──
    {
      const bad = [];
      for (const s of steps) {
        const t = tagsOf(s), e = equipOf(s);
        for (const f of (p.forbid?.tags ?? [])) if (t.includes(f)) bad.push(`${s.exercise_slug}[${f}]`);
        for (const f of (p.forbid?.equip ?? [])) if (e.includes(f)) bad.push(`${s.exercise_slug}(${f})`);
        for (const f of (p.forbid?.slugs ?? [])) if (s.exercise_slug === f) bad.push(`${s.exercise_slug}[unguarded]`);
        const only = p.forbid?.equipAllowOnly;
        if (only) for (const kit of e) if (!only.includes(kit)) bad.push(`${s.exercise_slug}(${kit})`);
        if (p.onlyCategories && !p.onlyCategories.includes(s.category)) bad.push(`${s.exercise_slug}<${s.category}>`);
        // Equipment the persona does not own is contraindicated by circumstance.
        const owned = (p.equipment?.length ? p.equipment : ['none']);
        const allowed = new Set([...owned, 'none', 'chair', ...(p.checkIn?.equipment_profile_id === 'gym' ? GYM_KIT : [])]);
        if (!p.prescribed) {
          for (const kit of e) if (!allowed.has(kit)) bad.push(`${s.exercise_slug}!${kit}`);
        }
        // A civilian session must never carry Defence protocol work (R596) —
        // including via a pool rebuild that forgot the filters (W3.0), which is
        // how a caesarean-recovery session once reached a rucksack-loaded
        // Defence lift test (`optillen-vanaf-de-grond-rugzak`).
        if (p.primary_intent !== 'military' && isProtocolStep(s)) bad.push(`${s.exercise_slug}{protocol}`);
        // W3.1 — no continuous cardio effort above this persona's conditioning
        // band, whatever the exercise is called. Prescribed blueprints are the
        // coach's own budgeted programme, not a pool pick.
        // Steps do not carry metrics_json, so the property is read off the
        // library row — reading it off the step would make this check unfailable.
        const row = exById.get(s.exercise_id);
        if (!p.prescribed && row && isLongContinuousCardio(row)) {
          const cap = continuousCardioCapSec(p.noProgression ? 15 : (p.conditioning ?? 40), bmiOf(p), row);
          const len = s.target_duration_sec ?? 0;
          if (len > cap) bad.push(`${s.exercise_slug}<${Math.round(len / 60)}min > ${Math.round(cap / 60)}min band>`);
        }
      }
      // W3.0 — the backstop removed a step that a rebuild let through. The user
      // was protected, but a rule bypassed _safePool, and that is a failure.
      for (const t of trace) if (t.includes('pool-guard backstop')) bad.push(`backstop: ${t}`);
      say('contraindications', bad.length ? 'FAIL' : 'PASS',
        bad.length ? `contraindicated in steps: ${[...new Set(bad)].join(', ')}` : `${steps.length} step(s) clean`);
    }

    // ── 2. Total estimated time within the budget + the existing allowance ──
    {
      const est = estimateMins(out);
      const ratchet = p.timeOverMin ?? 0;
      const limit = budget + TIME_ALLOWANCE_MIN + ratchet;
      if (isRest || est == null) say('time-budget', 'PASS', 'rest day — no session to time');
      else say('time-budget', est <= limit ? 'PASS' : 'FAIL',
        `~${est} min vs ${budget}-min budget (+${TIME_ALLOWANCE_MIN} allowance` +
        (ratchet ? `, +${ratchet} declared gap` : '') + ')');
    }

    // ── 3. The pool never empties ──
    {
      const min = p.singleStepOk ? 1 : 2;
      if (isRest) say('pool-floor', 'PASS', 'rest day');
      else say('pool-floor', steps.length >= min ? 'PASS' : 'FAIL',
        `${steps.length} step(s), need ≥ ${min}`);
    }

    // ── 4. Every step prescribes either reps or a duration, reps within 3–30 ──
    // The 3–30 clamp is the planner's own contract. W3.2: R524 used to run after
    // it, so a body-mass slow start could take a 3-rep set to 2.
    {
      const mute = steps.filter(s => !(s.target_reps > 0) && !(s.target_duration_sec > 0));
      const outOfRange = steps.filter(s => s.target_reps != null && (s.target_reps < 3 || s.target_reps > 30));
      say('prescription', (mute.length || outOfRange.length) ? 'FAIL' : 'PASS',
        mute.length ? `step(s) with neither reps nor duration: ${mute.map(s => s.exercise_slug).join(', ')}`
          : outOfRange.length ? `rep target outside the 3–30 clamp: ${outOfRange.map(s => `${s.exercise_slug}×${s.target_reps}`).join(', ')}`
          : `${steps.length} step(s) prescribed`);
    }

    // ── 5. One exercise per movement family (R597) ──
    {
      const fams = steps.map(s => movementFamily(s.exercise_slug));
      const dupFam = fams.filter((f, i) => fams.indexOf(f) !== i);
      const slugs = steps.map(s => s.exercise_slug);
      const dupSlug = slugs.filter((s, i) => slugs.indexOf(s) !== i);
      const allow = new Set(p.dupAllow ?? []);
      const bad = [...new Set([...dupFam, ...dupSlug])].filter(x => !allow.has(x));
      // A prescribed blueprint is a fixed protocol, not a pool selection: its
      // warm-up/run/cool-down shape is the prescription and R597 never sees it.
      if (p.prescribed) say('variety', 'PASS', 'prescribed blueprint — not a pool selection');
      else say('variety', bad.length ? 'FAIL' : 'PASS',
        bad.length ? `repeated movement families: ${bad.join(', ')}` : `${new Set(fams).size} distinct families`);
    }

    // ── 6. No single step is longer than the whole session ──
    {
      const over = steps.filter(s => (s.target_duration_sec ?? 0) * (s.sets ?? 1) > budget * 60);
      say('step-vs-session', over.length ? 'FAIL' : 'PASS',
        over.length ? `longer than the ${budget}-min session: ${over.map(s =>
          `${s.exercise_slug} ${Math.round((s.target_duration_sec * (s.sets ?? 1)) / 60)}min`).join(', ')}`
          : `longest step fits ${budget} min`);
    }

    // ── 7. Volume is above the floor, or a trace explains why not (W3.2) ──
    //
    // Measured, not read: the same persona is replanned on a neutral day with the
    // situational de-loads and the body-mass leg removed, and the mean prescribed
    // reps of the two sessions are compared. Every scaler in the stack multiplies
    // every rep-based step, so the ratio IS the stack's product — no source is
    // consulted and no internal is imported.
    {
      const meanReps = (s) => {
        const r = (s.steps ?? []).map(x => x.target_reps).filter(x => x > 0);
        return r.length ? r.reduce((a, b) => a + b, 0) / r.length : null;
      };
      const measure = !PENDING.has('volume-floor') || !!process.env.MEASURE;
      const mine = measure ? meanReps(out) : null;
      const base = (measure && mine != null) ? meanReps(plan(neutralTwin(p), DATE)) : null;
      if (process.env.MEASURE && mine != null && base) process.stderr.write(`VOL ${p.id} ${DATE} ${(mine / base).toFixed(3)}\n`);
      if (PENDING.has('volume-floor')) say('volume-floor', 'SKIP', 'lands with W3.2 (ctx.volumeFloor)');
      else if (mine == null || base == null || base === 0) say('volume-floor', 'PASS', 'no rep-based step to measure');
      else {
        const ratio = mine / base;
        const minimalOnPurpose = out.slot_type === 'micro'
          || trace.some(t => DELIBERATELY_MINIMAL.test(t));
        say('volume-floor', (ratio >= VOLUME_FLOOR - 0.001 || minimalOnPurpose) ? 'PASS' : 'FAIL',
          `volume ×${ratio.toFixed(2)} of a neutral day, floor ${VOLUME_FLOOR}` +
          (minimalOnPurpose ? ' (session declared minimal on purpose)' : ' and nothing declares the session minimal'));
      }
    }

    // ── 8. Every emitted R-code is explainable (W2.1) ──
    // Same contract as the W2.1 smoke guard: a code is explainable when it has a
    // RULE_LABELS entry OR is declared in INTERNAL_RULE_CODES with a written
    // reason (R501 exercise-count arithmetic, R573 military pool diagnostics).
    // Codes with a variant suffix (R500a, R557b) are judged on the base code.
    {
      const codes = [...new Set(trace.flatMap(t => t.match(/R\d{3}/g) ?? []))];
      const unlabelled = codes.filter(c => !RULE_LABELS[c] && !INTERNAL_RULE_CODES[c]);
      for (const c of unlabelled) unlabelledSeen.add(c);
      if (PENDING.has('trace-labels')) say('trace-labels', 'SKIP',
        `lands with W2.1 (${unlabelled.length} unlabelled in this session)`);
      else say('trace-labels', unlabelled.length ? 'FAIL' : 'PASS',
        unlabelled.length ? `emitted with no RULE_LABELS entry and no INTERNAL_RULE_CODES reason, so parseRuleTrace drops them: ${unlabelled.join(', ')}`
          : `${codes.length} code(s) all labelled`);
    }
  }  // ── end of the date sweep ──

  for (const n of notes) errs.push(`${p.id}: ${n}`);
  for (const [prop, r] of seen) {
    results.push({ persona: p.id, prop, state: r.state, detail: r.detail });
    if (r.state === 'FAIL') errs.push(`${p.id}/${prop} (${r.date}): ${r.detail}`);
  }
}

// ── Rule-specific regressions kept from the original harness ──────────────────
// These are not persona properties: each pins one rule's exact contract.
{
  const check = (cond, msg) => { if (!cond) errs.push(msg); };
  const dcpPrefs = (dcp, active = false) => ({
    militaryCoach: { active, dcp }, sportPrefs: DCP_SPORT, budget: 40, goal: 'strength',
  });

  // R598 — scheduled when due, silent when not, and ALWAYS both movements. A
  // one-sided measurement is worse than none: it writes half a baseline the bias
  // then treats as complete.
  const due = plan(dcpPrefs(DCP));
  const m = (due.steps || []).filter(s => s.max_effort);
  check(due.assessment_planned === true, 'R598 did not schedule a measurement that is due');
  check(m.length === 2, `R598 scheduled ${m.length} measurement set(s), expected both movements`);
  check(m.every(s => s.sets === 1 && s.target_reps == null && s.target_duration_sec === 120),
    'a measurement set is not 1 unscaled set over the 2-minute protocol window');
  const kinds = new Set(m.map(s => s.measures));
  check(kinds.has('dcp_pushups') && kinds.has('dcp_situps'), 'both DCP movements must be measured');

  const fresh = plan(dcpPrefs({ ...DCP, last: { pushups: 30, situps: 40, at_ms: todayMs } }));
  check(fresh.assessment_planned === false, 'R598 re-measured a baseline taken today');

  const stale = plan(dcpPrefs({ ...DCP, last: { pushups: 30, situps: 40, at_ms: todayMs - 60 * DAY } }));
  check(stale.assessment_planned === true, 'R598 did not re-measure a 60-day-old baseline');

  const notTarget = plan(dcpPrefs({ enabled: true, bias_enabled: false, birth_year: 1989 }));
  check(notTarget.assessment_planned === false, 'R598 fired for a DCP that is switched off');
  check(!(notTarget.rule_trace || []).some(t => String(t).includes('R593')),
    'R593 steered a plan whose DCP is switched off');

  const forced = plan({ ...dcpPrefs({ ...DCP, last: { pushups: 30, situps: 40, at_ms: todayMs } }), opts: { forceAssessment: true } });
  check(forced.assessment_planned === true, 'a forced assessment was ignored');

  // R596 — no Defence protocol work in a civilian session.
  //
  // Must be asserted with a goal whose target category is CARDIO. The marches are
  // cardio, so a strength session filters them out by category alone and the
  // assertion would pass even with R596 disabled — which is precisely the shape of
  // the original bug: a fat_loss user, whose target category is cardio, got three
  // rucksack marches.
  const civ = plan({ goal: 'fat_loss', militaryCoach: { enabled: false } });
  const bad = (civ.steps || []).filter(s => /^(marsen|hardlopen)|cooper|rugzak|weighted-march/.test(s.exercise_slug));
  check(bad.length === 0, `civilian session contained protocol work: ${bad.map(s => s.exercise_slug).join(', ')}`);
  check((civ.steps || []).length > 0, 'civilian fat_loss session came back empty');

  // R519 — when the volume floor holds, the session SAYS so (W3.2). Property 7
  // proves the floor clamps; this proves the user is told. A floor that held in
  // silence is the same failure as a stack that went to ×0.29 in silence.
  {
    const worst = PERSONAS.find(x => x.id === 'deloaded-worst');
    const line = (plan(worst).rule_trace || []).map(String).find(t => t.startsWith('R519')) ?? '';
    const v = parseVolumeTrace(line);
    check(v && v.factors.floor > 1 && v.reasons.includes('floor') && v.pct === 50,
      `the volume floor held but R519 does not say so: "${line}"`);
    check(v && Math.abs(v.product - v.pct / 100) < 0.01,
      `R519 states ${v?.pct}% but its factors multiply to ${Math.round((v?.product ?? 0) * 100)}%`);
  }

  // R524 — measured conditioning beats the body-weight proxy (W3.3).
  //
  // Product owner: the weight cut protects heavy users from unachievable goals
  // and injuries, because weight indicates a lack of fitness. Weight is the
  // weakest signal for that, so it is the FALLBACK: a DCP self-test or measured
  // progression wins, and the trace names the basis used.
  {
    const heavy = { goal: 'strength', weight_kg: 120, height_cm: 185 };
    const r524 = (o) => (o.rule_trace || []).map(String).find(t => t.startsWith('R524')) ?? '';
    const bwReps = (o) => (o.steps || []).filter(st => tagsOf(st).includes('bodyweight') && st.target_reps)
      .map(st => st.exercise_slug + ':' + st.target_reps).join(',');

    const unmeasured = plan({ ...heavy, noProgression: true });
    check(/basis: weight/.test(r524(unmeasured)) && /direction: down/.test(r524(unmeasured)),
      `R524 with no measurement must fall back to the weight proxy, traced: "${r524(unmeasured)}"`);

    const measuredFit = plan({ ...heavy, conditioning: 45 });
    const measuredTwin = plan({ ...heavy, conditioning: 45, weight_kg: 70 });
    check(/basis: progression/.test(r524(measuredFit)) && !/×0\./.test(r524(measuredFit)),
      `R524 cut a measured, conditioned athlete by body weight: "${r524(measuredFit)}"`);
    check(bwReps(measuredFit) !== '', 'R524 regression has no bodyweight rep step to compare — it would pass vacuously');
    check(bwReps(measuredFit) === bwReps(measuredTwin),
      `measured progression must make body weight irrelevant to bodyweight reps: ${bwReps(measuredFit)} vs ${bwReps(measuredTwin)}`);

    const measuredWeak = plan({ ...heavy, conditioning: 10 });
    check(/basis: progression/.test(r524(measuredWeak)) && /×0\.80/.test(r524(measuredWeak)),
      `measured deconditioning must still slow the start: "${r524(measuredWeak)}"`);

    const dcpLow = plan({ ...heavy, conditioning: 45, sportPrefs: DCP_SPORT,
      militaryCoach: { active: false, dcp: { ...DCP, last: { pushups: 4, situps: 6, at_ms: todayMs } } } });
    check(/basis: dcp/.test(r524(dcpLow)),
      `a DCP self-test is the strongest evidence and must be preferred: "${r524(dcpLow)}"`);
  }

  // R534 — the pelvic-floor injection avoids supine work by RULE, not by row
  // order (W3.4). The library is reordered adversarially so that every supine
  // row comes first: a `find()` over raw rows then picks a lying pelvic tilt for
  // a week-20 pregnancy, which R531 forbids. Same for the caesarean R541 path.
  {
    const supineFirst = [...exercises].sort((a, b) =>
      (JSON.parse(b.tags_json || '[]').includes('supine') ? 1 : 0)
      - (JSON.parse(a.tags_json || '[]').includes('supine') ? 1 : 0));
    const withLibrary = (p, d) => { const a = build(p, d); a[2] = supineFirst; return runPlanner(...a); };
    let injected = 0;
    for (const id of ['pregnant-t2', 'pregnant-t3', 'postnatal-caesarean']) {
      const p = PERSONAS.find(x => x.id === id);
      for (const d of DATES.slice(0, 14)) {
        const o = withLibrary(p, d);
        if ((o.rule_trace || []).some(t => /^R5(34|41)/.test(String(t)))) injected++;
        const bs = (o.rule_trace || []).map(String).find(t => t.includes('pool-guard backstop'));
        if (bs) check(false, `${id} (${d}) with the library reordered: ${bs}`);
        for (const st of o.steps || []) {
          for (const f of p.forbid.tags) {
            if (tagsOf(st).includes(f)) { check(false, `${id} (${d}) with the library reordered: ${st.exercise_slug}[${f}] — a rule relies on row order`); }
          }
        }
      }
    }
    check(injected > 0, 'R534/R541 never injected under the reordered library — the by-rule test is vacuous');
  }

  // R596 — the `protocol` tag (W5.3, migration 0116) is honoured wherever it is
  // present. The fixture predates that migration, so one general cardio row is
  // tagged here: if R596 reads the tag, a civilian never sees it; if it only
  // runs its heuristic, the row is an ordinary movement and turns up.
  {
    const tagged = exercises.map(e => e.slug === 'jumping-jacks'
      ? { ...e, tags_json: JSON.stringify([...JSON.parse(e.tags_json || '[]'), 'protocol']) } : e);
    let seenUntagged = false;
    for (const d of DATES.slice(0, 30)) {
      const a = build({ goal: 'fat_loss' }, d);
      if ((runPlanner(...a).steps || []).some(st => st.exercise_slug === 'jumping-jacks')) seenUntagged = true;
      a[2] = tagged;
      const leak = (runPlanner(...a).steps || []).find(st => st.exercise_slug === 'jumping-jacks');
      if (leak) { check(false, `R596 ignored the protocol tag: jumping-jacks (tagged protocol) in a civilian session on ${d}`); break; }
    }
    check(seenUntagged, 'protocol-tag regression is vacuous: the untagged row never reaches a civilian session');
  }

  // R595 — nothing longer than the session it sits in.
  const short = plan({ budget: 20, equipment: ['none', 'running_shoes'] });
  const over = (short.steps || []).filter(s => (s.target_duration_sec ?? 0) * (s.sets ?? 1) > 20 * 60);
  check(over.length === 0, `step longer than the whole 20-min session: ${over.map(s => s.exercise_slug).join(', ')}`);
}

// ── Report ───────────────────────────────────────────────────────────────────
if (process.argv.includes('--verbose') || process.stdout.isTTY) {
  const w = Math.max(...PERSONAS.map(p => p.id.length));
  const mark = { PASS: '·', FAIL: 'X', SKIP: '–' };
  process.stderr.write(`\n${' '.repeat(w)}  ${PROPS.map((_, i) => i + 1).join(' ')}\n`);
  for (const p of PERSONAS) {
    const cells = PROPS.map(prop => mark[results.find(r => r.persona === p.id && r.prop === prop)?.state] ?? '?');
    process.stderr.write(`${p.id.padEnd(w)}  ${cells.join(' ')}\n`);
  }
  for (const [i, prop] of PROPS.entries()) process.stderr.write(`  ${i + 1} ${prop}\n`);
  const skipped = [...new Set(results.filter(r => r.state === 'SKIP').map(r => r.prop))];
  if (skipped.length) {
    process.stderr.write(`\nSKIPPED (pending a later wave): ${skipped.join(', ')}\n`);
    for (const s of skipped) {
      const one = results.find(r => r.prop === s && r.state === 'SKIP');
      process.stderr.write(`  ${s}: ${one.detail}\n`);
    }
    if (unlabelledSeen.size) {
      process.stderr.write(`  W2.1 work list — codes this matrix saw emitted with no RULE_LABELS entry:\n` +
        `    ${[...unlabelledSeen].sort().join(', ')}\n`);
    }
  }
  process.stderr.write(`\n${PERSONAS.length} personas × ${PROPS.length} properties = ` +
    `${results.filter(r => r.state === 'PASS').length} pass, ` +
    `${results.filter(r => r.state === 'FAIL').length} fail, ` +
    `${results.filter(r => r.state === 'SKIP').length} skipped\n\n`);
}

process.stdout.write(errs.length ? errs.join('; ') : 'OK');
if (errs.length) process.exitCode = 1;
