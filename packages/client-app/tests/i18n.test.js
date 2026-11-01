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
  "Check-in",
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
const SAME_IN_DUTCH = new Set(['Open', 'Sprint', 'Check-in', "Beginner", "Kettlebell", "Power tower", "Lat pulldown"]);

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
    // coach-dcp R1 — the header button opens the check-in, so it says so; "Herijken" is gone.
    expect(i18n.t('Check-in')).toBe('Check-in');
    expect(i18n.t('Recalibrate')).toBe('Recalibrate');   // no Dutch entry left for the old key
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


// ─── coach-dcp release 2 — Doel & coach, Waar sta ik, the coach surfaces ──────
// Every key this release added (Settings → Doel & coach, the WAAR STA IK cards,
// the Coach view body, the path-choice modal, Voortgang's insight copy).
const R2_KEYS = [
  "A balanced all-round base across all movements.",
  "High power across all major movement patterns.",
  "Strong conditioning engine with a solid movement base.",
  "Focused hypertrophy stimulus across major muscle groups.",
  "Aerobic engine first, supported by leg and core endurance.",
  "Mobility and flexibility as the primary training focus.",
  "Military prep: conditioning and legs-heavy, with strong push and core.",
  "GENERAL\nFITNESS",
  "A coach picks one safe, useful session a day.",
  "RUNNING",
  "Build a runner, not a workout app.",
  "CYCLING",
  "Structured sessions, week by week.",
  "MILITARY",
  "Keuring or Opleiding. We taper for you.",
  "Welcome to JustFit.",
  "PICK YOUR",
  "TRAINING PATH.",
  "We coach four kinds of athletes.",
  "You train with one coach at a time. You can change later.",
  "Privacy-first. We store only what your coach needs. Export or delete any time in Settings → Privacy.",
  "What distance are you training for?",
  "Start Running Coach →",
  "General aerobic base",
  "Strength + sustained power",
  "Short explosive efforts",
  "Zone 2 foundation",
  "Event-ready conditioning",
  "What's your primary cycling goal?",
  "Start Cycling Coach →",
  "Choose your track and mode.",
  "Track",
  "Physical assessment KB–K6",
  "Training programme O1–O7",
  "Mode",
  "Target date",
  "Get fit",
  "Assessment date (optional)",
  "Start Military Coach →",
  "Saved ✓",
  "Goal: {goal}",
  "Profile aligned with your goal",
  "Building toward your goal",
  "Room to grow toward your goal",
  "Focus: {axis} — already on the planner's radar",
  "Goal on",
  "Goal off",
  "WHERE YOU ARE",
  "The measurement can wait — your plan keeps adapting either way.",
  "Last measured today",
  "Last measured {n} days ago",
  "Not measured yet",
  "Worth re-testing — your baseline is getting stale.",
  "A few short tests set the baseline your chart measures against.",
  "A few short tests replace the estimate below with a measurement.",
  "Pull and mobility are estimated, not measured — no equipment-free test gives an honest reading for either.",
  "Military goal",
  "Military fit {n}%",
  "How close your current profile is to your military fitness target.",
  "How your conditioning aligns with your running target.",
  "How your conditioning aligns with your cycling programme.",
  "How close your current profile matches your goal.",
  "Score: {n}",
  "Focus this week: {axis}",
  "{n} points behind your goal target — the planner is already on it.",
  "How the Planner Adapts",
  "Power",
  "Balanced",
  "Maximum strength output per muscle group",
  "Capacity for sustained effort per muscle group",
  "Average of Power and Endurance scores",
  "Flexibility and movement quality scores",
  "Push",
  "Pull",
  "Legs",
  "Core",
  "Your {axis} score hasn't been trained in {n} days — it's starting to fade. Add some {axis} work this week.",
  "Your biggest gap vs. your goal is {axis} ({n} points away). The planner will prioritise this.",
  "Your planner is prioritising {axis} because it's your largest gap vs. your {goal} goal (current: {current}, target: {target}).",
  "{axis} is also being boosted — {gap} points behind target.",
  "Sessions lean toward heavier, lower-rep strength work.",
  "Sessions lean toward higher-rep, shorter-rest metabolic work.",
  "Sessions mix strength and conditioning roughly equally.",
  "Sessions include extra flexibility and recovery work.",
  "WHERE DO I STAND",
  "KEURING {level} · in {n} days",
  "KEURING {level}",
  "12 min run",
  "March {kg} kg",
  "not measured yet",
  "Cooper {date}",
  "Push-ups · 2 min",
  "Sit-ups · 2 min",
  "{v} / {min} (safe {safe})",
  "DCP · test on {date} · in {n} days",
  "DCP · standing standard · keuring in {n} days",
  "DCP · standing standard",
  "Margin built — minimum is {min}.",
  "Still {gap} to the minimum of {min}. Next step: {next}.",
  "Minimum of {min} cleared. Working toward {target} — next step: {next}.",
  "Minimum {m} m — covered by your keuring target. Every cluster already asks for this.",
  "Last measured over {n} days ago — time to retest.",
  "Last measurement: — · retest every 6 weeks",
  "Last measurement: {date} · retest every 6 weeks",
  "Level not measured yet · goal {goal}",
  "{level} · goal {goal}",
  "Military drives Today. Other coaches adapt.",
  "Running drives Today. Other coaches fill rest days.",
  "Cycling drives Today. Other coaches fill gaps.",
  "General training runs when no coach claims today.",
  "Running Coach",
  "{km}km programme",
  "Week {w}",
  "of {n}",
  "Session {s} of 3 this week — any 3 days you train",
  "Run {n}",
  "{km}km plan — {n}-week progression",
  "Completed",
  "Current (week {w})",
  "Upcoming",
  "Running Coach — {km}km, week {w} of {total}",
  "Run {n} of 3 this week — warm-up and your Zone 2 easy run are included in today's plan.",
  "Run {n} of 3 this week — warm-up and your interval run are included in today's plan.",
  "{n} run(s) left this week — train any day that suits you.",
  "Week complete — great work. Your next running week starts when you're ready.",
  "heart rate zones",
  "{n} sessions this week — {pattern}.",
  "{n} session(s) remaining. Up next: {x}.",
  "Week complete — good work. Your next cycling week begins on your next session.",
  "Fatigue is high — keep it easy or take a recovery day",
  "Good training load — keep building",
  "Fresh enough for quality work",
  "Very fresh — good day for a hard session, test, or longer ride",
  "Cycling Coach — week {w} · {unit}",
  "FTP refresh recommended — tested {n} week(s) ago.",
  "FTP refresh recommended — no test on record.",
  "Go to FTP test",
  "Remind me next week",
  "{w} W current",
  "Active recovery",
  "Threshold",
  "Basis",
  "Entry",
  "Standard",
  "Infantry",
  "Above average",
  "High performance",
  "Special forces",
  "Next milestone: {level} — {desc}. Cooper target: ≥{m} m.",
  "{m} m to go.",
  "Your Cooper test measures your level. Until then the goal is {goal}; run 3×12-min efforts per week to build baseline endurance.",
  "Measured at {level}, working toward {goal}. Run 3×12-min efforts per week to build endurance.",
  "You're at your target level — keep training consistently to maintain it.",
  "Strength sessions focus on military compound lifts: push-up, pull-up, dips, and loaded march.",
  "At KB–K2: priority is aerobic base — keep heart rate in Zone 2 on duurloop days.",
  "At K3–K4: mix interval runs with longer easy runs to build capacity.",
  "At K5–K6: peak performance — taper carefully before your assessment.",
  "Opleiding programme trains all-round fitness. Build strength and running endurance in parallel.",
  "March sessions develop load-bearing endurance — the pack weight increases progressively.",
  "Foundation phase: focus on completing all sessions rather than intensity.",
  "Progression phase: small weekly volume increases, watch for signs of overload.",
  "Weakest axis: {axis} — focus on it this week.",
  "Cooper reference",
  "Last Cooper:",
  "{gap} m to {level} ({m} m)",
  "→ Next: {level}",
  "{n} days to the keuring",
  "Keuring today",
  "Keuring date passed",
  "Fit target — no fixed date",
  "Continuous progression",
  "NOW",
  "GOAL",
  "Coach Insights",
  "Cooper test",
  "({level} level)",
  "No test recorded",
  "{level} requires ≥{m} m",
  "{m} m to go",
  "achieved",
  "March weight",
  "max",
  "Not set",
  "{level} target: {kg} kg",
  "ready",
  "{kg} kg short",
  "Priority axis: {axis}",
  "Score {n} — the planner is already biasing sessions here.",
  "Cooper {m} m ({level} level)",
  "Goal & coach",
  "Path · coach · standards · training days",
  "GOAL & COACH",
  "Your path",
  "Change path →",
  "Other coaches",
  "You train with one coach at a time. Standards apply separately.",
  "Training days",
  "Session length",
  "Cycling (Pro)",
  "Block {b} of 6",
  "{x} today",
  "keuring in {n} days",
  "Week {w} of {total} · {km} km",
  "Week {w} · max HR {hr} bpm",
  "Week {w} · FTP {ftp} W",
  "Adaptive daily training",
  "strength",
  "endurance run",
  "interval run",
  "strength + march",
  "circuit",
  "rest",
  "Re-enrol · {km}km (resets progress)",
  "Switch to {km}km →",
  "Activate · {km}km Run Coach",
  "Activate · Cycling Coach",
  "Save changes · {x}",
  "Activate · Military Coach · {x}",
  "Save · {goal}",
  "Activate · {goal}",
  "Upgrade to Pro →",
  "Your goal",
  "Experience level",
  "General Health · Balanced movement",
  "Strength, cardio, mobility and recovery in rotation — the foundation of long-term fitness.",
  "Build Strength · Progressive overload",
  "Compound movements with increasing resistance. Push/pull/legs cycling ensures full recovery between sessions.",
  "Lose Weight · Mixed intensity",
  "Cardio and strength combined to maximise calorie burn and build metabolic resilience over time.",
  "Build Muscle · Volume focus",
  "Higher set counts and controlled tempo. Progressive overload accumulates the stimulus needed for hypertrophy.",
  "Endurance · Aerobic development",
  "Longer sessions with steady-state cardio and zone 2 work to expand your aerobic base sustainably.",
  "Mobility & Flex · Joint health",
  "Stretching, flows and recovery work to improve range of motion, posture and injury resilience.",
  "Add running shoes",
  "Required for the running programme — tap to add to your equipment list.",
  "{km}km · Week {w} · Session {s} of 3",
  "Progressive run programme — 3 sessions per week, any days you choose.",
  "Target distance",
  "Progression caution",
  "Starting at {km}km without completing the {prev}km plan first significantly increases injury risk. We strongly recommend following the ramp-up progression.",
  "{n} weeks · up to 3 sessions/week · any days",
  "Switching target will restart your programme at week 1.",
  "Running Coach · Structured progression",
  "3 sessions per week, any days you choose. Each target unlocks the next — safely building from 5 km to 30 km over time.",
  "Structured training — 5 goals, 7-week block cycle, 3–5 sessions per week, any days.",
  "Training unit",
  "Watts (power meter)",
  "Heart rate (bpm)",
  "Current FTP (W)",
  "Target FTP (W)",
  "Test FTP",
  "Max heart rate (bpm)",
  "Cycling sessions / week",
  "Min 2 rest days are always preserved.",
  "7-week block cycle (base → build → recovery) · {n} sessions/week · any days",
  "Z2 target: {lo}–{hi}W",
  "Z2 target: {lo}–{hi} bpm",
  "Save goal →",
  "Cross-training runs",
  "Add running sessions on short or rest days",
  "Run days / week",
  "Save settings",
  "Cycling Coach · FTP-based training",
  "Polarised 80/20 method — 80% zone 2 endurance, 20% high-intensity intervals. 3–5 sessions per week in 7-week cycles (base → build → recovery). Optional cross-training runs on rest or short days.",
  "Dutch Defensie prep — train toward your target level at your own pace or with a fixed assessment date.",
  "Assessment on a set date",
  "Goal level, no fixed date",
  "No goal or end date",
  "Fitness assessment · Basis → K6",
  "Training programme · O1 → O6",
  "Target level",
  "Basis — starting level",
  "Entry level service",
  "Standard service",
  "Infantry / most roles",
  "Special forces baseline",
  "Opleiding entry",
  "Standard training",
  "Infantry training",
  "Advanced training",
  "Assessment date",
  "Pack weight available (kg)",
  "Select all weights you own. The planner picks the heaviest available weight for each session.",
  "Add trail shoes / hiking boots",
  "Recommended for march sessions — tap to add to your equipment list.",
  "Open progression · Rolling 6-week cycle",
  "No assessment date needed. Continuously cycles through training phases — great for long-term fitness maintenance.",
  "Fit target · Progressive base building",
  "Train toward your goal level at your own pace. RPE signals advance your training automatically — no assessment date required.",
  "Assessment target · Two-phase training",
  "Training anchors to your assessment date. Base building starts immediately; a structured 6-week specific prep begins automatically at 6 weeks out.",
  "Too short",
  "Minimum 4 weeks needed for safe preparation. Choose a later date.",
  "{n} weeks until assessment · Base building now",
  "Progressive training starts today. Specific 6-week prep begins automatically at 6 weeks out.",
  "{n} weeks until assessment · Starting in {phase} phase",
  "Training anchors to your assessment date — phases shift automatically as the date approaches.",
  "Last result: {m} m",
  "No test recorded yet",
  "Log test →",
  "Build",
  "Peak",
  "BASE",
  "BUILD",
  "RECOVERY",
  "PEAK",
  "Sprint power",
];
// Same word in Dutch, or a training-science term that stays English.
const R2_SAME = new Set(["Score: {n}", "KEURING {level}", "Cooper {date}", "Week {w}", "Basis", "max", "Week {w} · FTP {ftp} W", "circuit", "Cardio", "KEURING", "OPLEIDING", "Push-ups", "Pull-ups", "Push-ups · 2 min", "Sit-ups · 2 min"]);

describe('coach-dcp R2 — every key has its own Dutch value', () => {
  it('lists 309 keys', () => { expect(R2_KEYS.length).toBe(309); });
  it('non-empty, and never equal to the key', async () => {
    const { i18n } = await load('nl');
    const bad = R2_KEYS.filter((k) => {
      const nl = i18n.t(k);
      return !nl || (nl === k && !R2_SAME.has(k));
    });
    expect(bad).toEqual([]);
  });
  it('the words the design names', async () => {
    const { i18n, policy } = await load('nl');
    expect(i18n.t('Goal & coach')).toBe('Doel & coach');
    expect(i18n.t('GOAL & COACH')).toBe('DOEL & COACH');
    expect(i18n.t('You train with one coach at a time. Standards apply separately.')).toBe('Je traint met één coach tegelijk. Normen gelden los daarvan.');
    expect(i18n.t('Change path →')).toBe('Wijzig pad →');
    expect(i18n.t('WHERE DO I STAND')).toBe('WAAR STA IK');
    expect(i18n.t('{v} / {min} (safe {safe})', { v: 0, min: 16, safe: 19 })).toBe('0 / 16 (veilig 19)');
    expect(i18n.t('DCP · standing standard · keuring in {n} days', { n: 60 })).toBe('DCP · doorlopende norm · keuring over 60 dagen');
    expect(i18n.t('Level not measured yet · goal {goal}', { goal: 'K3' })).toBe('Niveau nog niet gemeten · doel K3');
    expect(i18n.t('MILITARY · {x}', { x: i18n.t('KEURING') })).toBe('MILITAIR · KEURING');
    expect(i18n.t('Physical Assessment')).toBe('Keuring');
    expect(['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'].map(policy.axisLabel)).toEqual(['Duwen', 'Trekken', 'Benen', 'Romp', 'Cardio', 'Mobiliteit']);
  });
  it('the English reader keeps the keys (the e2e journeys match them)', async () => {
    const { i18n } = await load('en');
    expect(i18n.t('Goal & coach')).toBe('Goal & coach');
    expect(i18n.t('GENERAL\nFITNESS')).toBe('GENERAL\nFITNESS');
  });
});

// ─── UAT release 4 — Dutch sweep 3 ────────────────────────────────────────────
// Settings → Jij / Account / Privacy, Deze week, Voortgang, the Trophy room, the body-mode
// banners, the instruction why-line, the three orphan screens. The key list is a file so
// it can grow without this test getting longer.
import { readFileSync } from 'node:fs';
const R4_KEYS = JSON.parse(readFileSync(new URL('./uatRelease4.keys.json', import.meta.url), 'utf8'));
// Words that are the same in both languages (a Dutch reader also says "Week 3").
const R4_SAME = new Set(['Week {n}', 'Trimester {n}', 'Week {n} · Trimester {tri}']);

describe('UAT release 4 — every new key has its own Dutch value', () => {
  it('lists the new keys', () => { expect(R4_KEYS.length).toBeGreaterThanOrEqual(400); });
  it('non-empty, and never equal to the key', async () => {
    const { i18n } = await load('nl');
    const bad = R4_KEYS.filter((k) => {
      const nl = i18n.t(k);
      return !nl || (nl === k && !R4_SAME.has(k));
    });
    expect(bad).toEqual([]);
  });
  it('keeps every {placeholder} of the English key', async () => {
    const { i18n } = await load('nl');
    const vars = (s) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');
    const bad = R4_KEYS.filter((k) => vars(i18n.t(k)) !== vars(k));
    expect(bad).toEqual([]);
  });
  it('the pregnancy and postnatal milestone sentences are all translated', async () => {
    const { i18n } = await load('nl');
    const b = await import('../src/bodyBanner.js');
    const msgs = [...b.PREGNANCY_MILESTONES, ...b.POSTNATAL_MILESTONES].map((m) => m.msg);
    expect(msgs.length).toBe(17);
    expect(msgs.filter((m) => i18n.t(m) === m)).toEqual([]);
  });
  it('the seeded why-lines and muscle targets of migration 0055 are translated', async () => {
    const { i18n } = await load('nl');
    const sql = readFileSync(new URL('../../../migrations/0055_why_muscle_target.sql', import.meta.url), 'utf8');
    const seeded = [...sql.matchAll(/THEN '([^']+)'/g)].map((m) => m[1]);
    expect(seeded.length).toBeGreaterThanOrEqual(15);
    expect(seeded.filter((s) => i18n.t(s) === s)).toEqual([]);
  });
  it('the perimenopause banner is plain Dutch, no "stress threshold lowered"', async () => {
    const { i18n } = await load('nl');
    const nl = i18n.t('Perimenopause: intensity up to moderate, calmer sessions when you are stressed, cycle rules are off.');
    expect(nl).toBe('Overgangsmodus — intensiteit tot gemiddeld, bij stress kiezen we rustiger, cyclusregels staan uit');
    expect(i18n.t('Perimenopause mode')).toBe('Overgangsmodus');
  });
  it('the English reader keeps the keys (the e2e journeys match them)', async () => {
    const { i18n } = await load('en');
    expect(i18n.t('Your profile')).toBe('Your profile');
    expect(i18n.t('Fresh start — let’s build from here.')).toBe('Fresh start — let’s build from here.');
  });
  it('the Dutch short date reads "zo 1 nov", the English one "Sun 1 Nov"', async () => {
    const { utils } = await load('nl');
    const d = new Date(2026, 10, 1, 12);
    expect(utils.fmtDateShort(d, 'nl')).toBe('zo 1 nov');
    expect(utils.fmtDateShort(d, 'en')).toBe('Sun 1 Nov');
  });
});
