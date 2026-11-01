// Builder v1.5 — exerciseName(): the one way an exercise name is shown. Dutch
// when the language is Dutch AND the row has a Dutch name; otherwise `name`.
// English readers see nothing change. Each language loads its own module
// instance, because i18n.js caches the language on first read.
import { describe, it, expect, afterEach, vi } from 'vitest';

async function load(lang) {
  vi.resetModules();
  const store = new Map(lang ? [['jf_lang', lang]] : []);
  vi.stubGlobal('localStorage', { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) });
  vi.stubGlobal('window', { dispatchEvent() {}, addEventListener() {}, removeEventListener() {} });
  return {
    i18n: await import('../src/i18n.js'),
    own: await import('../src/ownTraining.js'),
    meta: await import('../src/templateMeta.js'),
    policy: await import('../src/messagePolicy.js'),
    utils: await import('../src/planUtils.js'),
  };
}
afterEach(() => vi.unstubAllGlobals());

const pushUp = { name: 'Push-up', name_nl: 'Opdrukken' };

describe('exerciseName — Dutch reader', () => {
  it('shows name_nl when it is set', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName(pushUp)).toBe('Opdrukken');
  });
  it('falls back to name when name_nl is empty, null or absent', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName({ name: 'Push-up', name_nl: '' })).toBe('Push-up');
    expect(i18n.exerciseName({ name: 'Push-up', name_nl: null })).toBe('Push-up');
    expect(i18n.exerciseName({ name: 'Push-up' })).toBe('Push-up');
  });
  it('Dutch is the default when no language is stored', async () => {
    const { i18n } = await load(null);
    expect(i18n.exerciseName(pushUp)).toBe('Opdrukken');
  });
  it('a missing row is an empty string, never a crash', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName(null)).toBe('');
    expect(i18n.exerciseName(undefined)).toBe('');
  });
  it('setLang("en") switches the label without a reload', async () => {
    const { i18n } = await load('nl');
    expect(i18n.exerciseName(pushUp)).toBe('Opdrukken');
    i18n.setLang('en');
    expect(i18n.exerciseName(pushUp)).toBe('Push-up');
  });
});

describe('exerciseName — English reader sees nothing change', () => {
  it('always name, even when name_nl is set', async () => {
    const { i18n } = await load('en');
    expect(i18n.exerciseName(pushUp)).toBe('Push-up');
    expect(i18n.exerciseName({ name: 'Plank', name_nl: 'Plank' })).toBe('Plank');
  });
});

describe('its callers', () => {
  const rows = [{ ex: pushUp }, { ex: { name: 'Plank', name_nl: 'Plank' } }, { ex: { name: 'Air Squat', name_nl: 'Squat zonder gewicht' } }];
  it('sessionName: an unsaved session is "Opdrukken + Plank" in Dutch, "Push-up + Plank" in English', async () => {
    expect((await load('nl')).own.sessionName(rows)).toBe('Opdrukken + Plank');
    expect((await load('en')).own.sessionName(rows)).toBe('Push-up + Plank');
  });
  it('sessionName: plain plan steps carry the names directly', async () => {
    expect((await load('nl')).own.sessionName([pushUp, { name: 'Plank' }])).toBe('Opdrukken + Plank');
  });
  it('templateNames reads step_names_nl row for row, English names where it is null', async () => {
    const tpl = { step_names: ['Push-up', 'Gym press', 'Air Squat'], step_names_nl: ['Opdrukken', null, 'Squat zonder gewicht'] };
    expect((await load('nl')).meta.templateNames(tpl)).toBe('Opdrukken · Gym press · Squat zonder gewicht');
    expect((await load('en')).meta.templateNames(tpl)).toBe('Push-up · Gym press · Air Squat');
  });
  it('templateNames from a server that sent no Dutch names', async () => {
    expect((await load('nl')).meta.templateNames({ step_names: ['Push-up'] })).toBe('Push-up');
  });
});

// ─── Builder v1.6 — a Dutch shell around the sheets ───────────────────────────
// Every key the Today card, WorkoutView and the Coach header strip resolve through
// t(). Each must have a Dutch value, and that value must not be the key (a
// copy-paste would pass a "non-empty" check and ship English).
const V16_KEYS = [
  "TODAY",
  "DAY {n}",
  "NO SESSION",
  "{n} moves",
  "+ {n} more",
  "START SESSION",
  "Recovery Mode Active",
  "Why this plan?",
  "THIS WEEK",
  "This week",
  "Recovery day. Rest is training.",
  "Designing your session...",
  "You built this session yourself — it counts like any other.",
  "Today's session: {name}.",
  "Your check-in reported significant pain — rest is the right call today.",
  "Your session is kept gentle until you confirm exercise clearance with your healthcare provider.",
  "Update clearance in Settings when you're cleared.",
  "Health & Safety",
  "Complete the daily check-in to generate today's session.",
  "{sets} × {dur} run",
  "Run Day",
  "Cross-Training · Level {n}",
  "Cycling",
  "LOW",
  "MODERATE",
  "HIGH",
  "Rest day",
  "Micro session",
  "Full session",
  "{n} sessions this week — let's get started.",
  "Goal hit — {done} of {target} sessions done. Bonus available.",
  "One more to hit your weekly goal.",
  "{done} of {target} done — {remaining} to go.",
  "Lose weight & feel better",
  "Build strength & muscle",
  "Improve overall fitness",
  "Boost energy & manage stress",
  "Build muscle",
  "Build endurance",
  "MILITARY COACH",
  "RUNNING COACH",
  "CYCLING COACH",
  "{km}km programme · Week {w}",
  "Training goal",
  "General Health",
  "Build Strength",
  "Lose Weight",
  "Build Muscle",
  "Endurance",
  "Mobility & Flex",
  "Beginner",
  "Intermediate",
  "Advanced",
  "Balanced movement & consistency",
  "Calorie burn & metabolic conditioning",
  "Progressive strength overload",
  "Maximum force & compound lifts",
  "Aerobic capacity & stamina",
  "Flexibility, range of motion & recovery",
  "Full-body variety across all domains",
  "Consistent daily movement",
  "Military Coach",
  "Physical Assessment",
  "Educational Fitness",
  "↑ {x} target",
  "Today: {x}",
  "{kg} kg march",
  "Below K1",
  "BLOCK {b} OF 6",
  "Fit target",
  "Base build",
  "On-ramp",
  "Taper",
  "Endurance Run",
  "Strength + March",
  "Interval Run",
  "Intervals",
  "Run Coach",
  "{km}km Plan · Week {w} of {total}",
  "Session {a} of {b} this week",
  "WEEK {w} OF {total}",
  "Cycle Coach — Cross-Training",
  "Cycle Coach",
  "Run · Level {n}",
  "{n} cross-training runs completed",
  "HR-based",
  "Zone 2 — aerobic base",
  "Sweet Spot — sub-threshold",
  "Threshold — FTP work",
  "VO2max — high intensity",
  "Anaerobic — sprint power",
  "Intervals — power development",
  "SPECIALIST COACHING",
  "Want a structured training programme?",
  "Add Running, Cycling, or Military coaching as an add-on alongside your current goal.",
  "Explore coaches →",
  "Not for me",
  "Updated how you're feeling?",
  "Check in →",
  "Consistency score: {prev} → {score}",
  "Log extra activity",
  "Log it →",
  "Activity logged",
  "Bonus session — minutes?",
  "No plan generated",
  "Try again",
  "Report sent",
  "Sending…",
  "Send report",
  "Could not reach the plan engine. This is usually a temporary connection issue — check your signal and try again.",
  "The plan engine returned an unexpected error on the server.",
  "No exercises matched your current equipment and injury settings. Try adjusting your profile in Settings.",
  "An unknown error occurred during plan generation.",
  "~{n} min incl. {m}m overhead",
  "{n} reps",
  "Keep original",
  "Add a note (optional)",
  "Barely any effort",
  "Zone 1 · Recovery pace",
  "Zone 2 · Comfortable, conversational",
  "Zone 3 · Breathing harder",
  "Zone 4–5 · Pushing your limits",
  "Zone 5+ · At or near your limit",
  "Run {a} · Walk {b} · × {n} rounds",
  "Your target · {level}",
  "Pelvic Floor",
  "Core & Abs",
  "Active Recovery",
  "Flexibility & Joint Health",
  "Cardiovascular System",
  "Chest & Triceps",
  "Back & Biceps",
  "Legs & Glutes",
  "Shoulders",
  "Core & Stability",
  "Full Body Strength",
  "Start at a pace where you can hold a full conversation. If breathing becomes laboured, slow down or pause — that's not a setback, it's the right call.",
  "Keep your pace conversational — you should be able to speak short sentences throughout. Progress comes from consistency, not from pushing to breathless today.",
  "Hold at mild tension — not pain. Breathe into the stretch on each exhale.",
  "Keep the movement passive. Focus on releasing tension, not working through it.",
  "Steady effort — you should be able to speak a sentence but feel the work. Zone 2 is where fat burns.",
  "Zone 2 — conversational pace you can sustain. This builds your aerobic engine.",
  "Conversational pace throughout. Steady and sustainable beats hard and short.",
  "Last 2 reps of each set should feel genuinely hard. If they don't, that's your signal to add load next session.",
  "Control the movement, keep rest short (45–60s). Strength work is metabolic — treat it that way.",
  "Complete all sets with good form. One quality rep builds more than three sloppy ones.",
  "Focus on the movement, not the clock. Quality over speed.",
  "Supports muscle recovery and keeps you ready for your next session.",
  "Maintains joint range of motion and helps prevent injury over time.",
  "Trains your heart and lungs — the base that makes every other exercise feel easier.",
  "A strong core and stable pelvis protect your spine and improve every other movement.",
  "Bodyweight strength builds movement quality and control before adding load.",
  "Progressive strength training increases muscle, improves bone density, and raises your resting metabolism.",
  "Consistent movement in this pattern builds the physical capacity your goal requires.",
  "Running shoes",
  "Trail shoes / hiking boots",
  "Yoga mat",
  "Resistance bands",
  "Jump rope",
  "Foam roller",
  "Kettlebell",
  "Pull-up bar",
  "Adjustable bench",
  "Stability ball",
  "Ankle weights",
  "Barbell",
  "Weight plates",
  "Push-up handles",
  "Medicine ball",
  "Fitness tracker",
  "Road / racing bike",
  "Mountain bike",
  "Indoor bike trainer",
  "Stationary bike",
  "Rowing machine",
  "Suspension trainer",
  "Step platform",
  "Power tower",
  "Punching bag",
  "Smith machine",
  "Elliptical trainer",
  "Home squat rack",
  "Cable machine",
  "Lat pulldown",
  "Seated row machine",
  "Chest press machine",
  "Pec deck / fly machine",
  "Leg press",
  "Leg curl machine",
  "Leg extension machine",
  "Flat bench",
  "Dip station / parallel bars",
  "EZ curl bar",
  "Multi-gym / home gym station",
  "Bench press rack",
  "Burn Session",
  "Fat Loss Circuit",
  "Metabolic Boost",
  "Cardio Burn",
  "Build Session",
  "Hypertrophy Block",
  "Strength & Size",
  "Muscle Focus",
  "Endurance Push",
  "Aerobic Block",
  "Cardio Session",
  "Stamina Work",
  "Strength Session",
  "Power Block",
  "Heavy Work",
  "Strength Focus",
  "Mobility Flow",
  "Flexibility Session",
  "Movement Practice",
  "Stretch & Recover",
  "Daily Training",
  "Health Session",
  "Full Body",
  "Balanced Session",
  "Full Body Circuit",
  "Mixed Training",
  "Variety Session",
  "All-Round Work",
  "Military Training",
  "Soldier Prep",
  "Combat Fitness",
  "Military Conditioning",
  "Mobility Session",
  "Five minutes for you",
  "Strong & supported",
  "Today's movement",
  "A gentle moment",
  "Rebuilding your foundation",
  "Today's recovery",
  "Active Rest",
  "Micro Session",
  "Recovery day",
  "Cooper Test · Block {n} · {x}",
  "Military · {x} · Block {n}",
  "Running Day · Week {n} · {x}",
  "Cycling Day · Week {n} · {x}",
  "Cross-Training Run · Level {n}",
  "Zone 2 Run",
  "Strength & March",
  "Assessment",
  "Recalibrate",
  "General health",
  "Consistent daily training",
  "Block {b} of 6 · Session {s} of 4",
  "Week {w} of {total} · Session {s} of 3",
  "Week {w} · Session {s} of {total}",
  "{km}km goal",
  "Active",
  "MILITARY · {x}",
  "RUNNING · {km}km",
  "CYCLING · WEEK {w}",
  "Your daily plan is ready. {pro} users can regenerate.",
  "Deload",
  "Open",
  "baseline",
  "progress check",
  "assessment simulation",
  "Adapted for pregnancy",
  "Postnatal-safe",
  "Build fitness",
  "Climbing",
  "Sprint",
  "Aerobic base",
  "Race fitness"
];
// Loanwords that are the same word in Dutch.
const SAME_IN_DUTCH = new Set(['Open', 'Sprint', "Beginner", "Kettlebell", "Power tower", "Lat pulldown"]);

describe('v1.6 shell — every key has its own Dutch value', () => {
  it('lists 269 keys', () => { expect(V16_KEYS.length).toBe(269); });
  it('non-empty, and never equal to the key', async () => {
    const { i18n } = await load('nl');
    const bad = V16_KEYS.filter((k) => {
      const nl = i18n.t(k);
      return !nl || (nl === k && !SAME_IN_DUTCH.has(k));
    });
    expect(bad).toEqual([]);
  });
  it('the English reader gets the key back, placeholders filled', async () => {
    const { i18n } = await load('en');
    expect(i18n.t('{n} moves', { n: 6 })).toBe('6 moves');
    expect(i18n.t('START SESSION')).toBe('START SESSION');
  });
  it('the photographed strings read as the brief says', async () => {
    const { i18n } = await load('nl');
    expect(i18n.t('{n} moves', { n: 6 })).toBe('6 oefeningen');
    expect(i18n.t('+ {n} more', { n: 3 })).toBe('+ 3 meer');
    expect(i18n.t('START SESSION')).toBe('START SESSIE');
    expect(i18n.t('Start Workout')).toBe('Start training');
    expect(i18n.t('Recalibrate').toUpperCase()).toBe('HERIJKEN');
    expect(i18n.t('Why this plan?')).toBe('Waarom dit plan?');
    expect(i18n.t('THIS WEEK')).toBe('DEZE WEEK');
    expect(i18n.t('Improve overall fitness').toUpperCase()).not.toBe('IMPROVE OVERALL FITNESS');
  });
  it('training-science terms stay English inside the Dutch values', async () => {
    const { i18n } = await load('nl');
    expect(i18n.t('Zone 2 \u2014 aerobic base')).toContain('Zone 2');
    expect(i18n.t('Threshold \u2014 FTP work')).toContain('FTP');
    expect(i18n.t('VO2max \u2014 high intensity')).toContain('VO2max');
  });
  it('experience labels: Beginner / Gemiddeld / Gevorderd', async () => {
    const { i18n } = await load('nl');
    expect([i18n.t('Beginner'), i18n.t('Intermediate'), i18n.t('Advanced')]).toEqual(['Beginner', 'Gemiddeld', 'Gevorderd']);
  });
});

describe('v1.6 shell — engine session names', () => {
  it('t("Health Session") is "Gezondheidssessie" in Dutch, unchanged in English', async () => {
    expect((await load('nl')).i18n.t('Health Session')).toBe('Gezondheidssessie');
    expect((await load('en')).i18n.t('Health Session')).toBe('Health Session');
  });
  it('sessionTitle: fixed names, parameterised names, and a name the user typed', async () => {
    const nl = (await load('nl')).policy;
    expect(nl.sessionTitle('Balanced Session')).toBe('Gebalanceerde sessie');
    expect(nl.sessionTitle('Fat Loss Circuit')).toBe('Vetverbrandingscircuit');
    expect(nl.sessionTitle('Micro Session')).toBe('Microsessie');
    expect(nl.sessionTitle('Military \u00b7 Strength & March \u00b7 Block 3')).toBe('Militair \u00b7 Kracht & mars \u00b7 Blok 3');
    expect(nl.sessionTitle('Running Day \u00b7 Week 2 \u00b7 Intervals')).toBe('Hardloopdag \u00b7 Week 2 \u00b7 Intervallen');
    expect(nl.sessionTitle('Cross-Training Run \u00b7 Level 2')).toBe('Crosstraining-run \u00b7 Niveau 2');
    expect(nl.sessionTitle('Mijn training')).toBe('Mijn training');
    expect(nl.sessionTitle(undefined)).toBeUndefined();
    const en = (await load('en')).policy;
    expect(en.sessionTitle('Military \u00b7 Circuit \u00b7 Block 3')).toBe('Military \u00b7 Circuit \u00b7 Block 3');
  });
  it('every goal-name the planner can emit has a Dutch value', async () => {
    const { i18n } = await load('nl');
    const names = [
      'Burn Session', 'Fat Loss Circuit', 'Metabolic Boost', 'Cardio Burn', 'Build Session', 'Hypertrophy Block', 'Strength & Size', 'Muscle Focus',
      'Endurance Push', 'Aerobic Block', 'Cardio Session', 'Stamina Work', 'Strength Session', 'Power Block', 'Heavy Work', 'Strength Focus',
      'Mobility Flow', 'Flexibility Session', 'Movement Practice', 'Stretch & Recover', 'Daily Training', 'Health Session', 'Full Body', 'Balanced Session',
      'Full Body Circuit', 'Mixed Training', 'Variety Session', 'All-Round Work', 'Military Training', 'Soldier Prep', 'Combat Fitness', 'Military Conditioning',
      'Active Rest', 'Micro Session', 'Five minutes for you', 'Strong & supported', "Today's movement", 'A gentle moment', 'Rebuilding your foundation', "Today's recovery",
    ];
    expect(names.filter((n) => i18n.t(n) === n)).toEqual([]);
  });
});

describe('v1.6 shell — review fixes', () => {
  it('Cooper titles end in Dutch', async () => {
    const { sessionTitle } = (await load('nl')).policy;
    expect(sessionTitle('Cooper Test \u00b7 Block 2 \u00b7 baseline')).toBe('Cooper Test \u00b7 Blok 2 \u00b7 nulmeting');
    expect(sessionTitle('Cooper Test \u00b7 Block 2 \u00b7 progress check')).toBe('Cooper Test \u00b7 Blok 2 \u00b7 voortgangstest');
    expect(sessionTitle('Cooper Test \u00b7 Block 6 \u00b7 assessment simulation')).toBe('Cooper Test \u00b7 Blok 6 \u00b7 proefkeuring');
  });
  it('coachSentenceT translates the pregnancy prefix and the sentence apart', async () => {
    const m = await load('nl');
    const base = m.policy.deriveCoachSentence(['R512'], null, 'standard', '');
    const preg = m.policy.deriveCoachSentence(['R512'], null, 'pregnant', '');
    expect(preg.startsWith('Adapted for pregnancy')).toBe(true);
    const out = m.policy.coachSentenceT(preg);
    expect(out.startsWith('Aangepast voor zwangerschap \u2014 ')).toBe(true);
    expect(out).not.toMatch(/Adapted|your|today/i);
    expect(m.policy.coachSentenceT(base)).toBe(m.i18n.t(base));
  });
  it('cycling sub-goals', async () => {
    const { cycleSubGoalLabel } = (await load('nl')).policy;
    expect(['build_fitness', 'climbing', 'sprint', 'aerobic_base', 'race_fitness'].map(cycleSubGoalLabel))
      .toEqual(['Conditie opbouwen', 'Klimmen', 'Sprint', 'Aerobe basis', 'Wedstrijdvorm']);
    expect(cycleSubGoalLabel('other_thing')).toBe('other thing');
  });
});

describe('v1.6 shell \u2014 intensity and slot words, one translation for both screens', () => {
  it('intensityLabel: LAAG / GEMIDDELD / HOOG in Dutch', async () => {
    const { intensityLabel } = (await load('nl')).policy;
    expect(intensityLabel('low')).toBe('LAAG');
    expect(intensityLabel('moderate')).toBe('GEMIDDELD');
    expect(intensityLabel('high')).toBe('HOOG');
  });
  it('intensityLabel: LOW / MODERATE / HIGH in English', async () => {
    const { intensityLabel } = (await load('en')).policy;
    expect(intensityLabel('low')).toBe('LOW');
    expect(intensityLabel('moderate')).toBe('MODERATE');
    expect(intensityLabel('HIGH')).toBe('HIGH');
  });
  it('an unknown or missing level never crashes', async () => {
    const { intensityLabel } = (await load('nl')).policy;
    expect(intensityLabel('extreme')).toBe('EXTREME');
    expect(intensityLabel(undefined)).toBe('');
  });
  it('slotLabel', async () => {
    expect((await load('nl')).policy.slotLabel('rest')).toBe('Rustdag');
    expect((await load('en')).policy.slotLabel('micro')).toBe('Micro session');
    expect((await load('nl')).policy.slotLabel('whatever')).toBe('whatever');
  });
});

describe('v1.6 shell — dates in the reader\'s language', () => {
  const d = new Date(2026, 10, 1); // Sunday 1 Nov 2026
  it('the strip: "SUN \u00b7 NOV 1" in English, "zo \u00b7 1 nov" in Dutch', async () => {
    const { fmtDayStrip } = (await load('nl')).utils;
    expect(fmtDayStrip(d, 'en')).toBe('SUN \u00b7 NOV 1');
    expect(fmtDayStrip(d, 'nl')).toBe('zo \u00b7 1 nov');
  });
  it('the week letters, Monday first', async () => {
    const { weekdayLetters } = (await load('nl')).utils;
    expect(weekdayLetters('en').join(' ')).toBe('M T W T F S S');
    expect(weekdayLetters('nl').join(' ')).toBe('M D W D V Z Z');
  });
});
