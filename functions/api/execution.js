// POST /api/execution — save a completed workout execution
// GET  /api/execution — fetch execution history for a user
// DELETE /api/execution — delete an execution and its steps

import { getAuthUserId } from './_shared/auth.js';
import { isProUser } from './_shared/entitlements.js';

// ─── PROGRESSION ENGINE (inline copy — kept in sync with progression.js) ─────
// Cloudflare Pages Functions cannot import across api/*.js files, so the
// scoring helpers are duplicated here. If you change the formula in
// progression.js, update these constants too.

const PROG_DEFAULT_BASELINE = 15;
const RUN_PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
const PROG_DEFAULT_SCORE    = 15;
import { applyGain as progApplyGain, applyDecay as progApplyDecay,
         applyBaselineRatchet, MAX_STIMULUS_PER_AXIS as PROG_MAX_STIMULUS_PER_AXIS,
         GAIN_PER_SET } from './_shared/progressionModel.js';


const PROG_MUSCLE_TO_AXIS = {
  chest: 'push', pectorals: 'push', pectoral: 'push',
  triceps: 'push', tricep: 'push',
  deltoids: 'push', shoulders: 'push', shoulder: 'push',
  'anterior deltoid': 'push', 'front deltoid': 'push',
  back: 'pull', lats: 'pull', lat: 'pull', 'latissimus dorsi': 'pull',
  rhomboids: 'pull', rhomboid: 'pull',
  trapezius: 'pull', traps: 'pull', trap: 'pull',
  biceps: 'pull', bicep: 'pull',
  'rear deltoid': 'pull', 'posterior deltoid': 'pull',
  'rotator cuff': 'pull', 'upper back': 'pull', 'mid back': 'pull',
  quadriceps: 'legs', quads: 'legs', quad: 'legs',
  hamstrings: 'legs', hamstring: 'legs',
  glutes: 'legs', glute: 'legs', gluteus: 'legs', 'gluteus maximus': 'legs',
  calves: 'legs', calf: 'legs', gastrocnemius: 'legs', soleus: 'legs',
  'hip flexors': 'legs', 'hip flexor': 'legs',
  adductors: 'legs', adductor: 'legs',
  abductors: 'legs', abductor: 'legs',
  'hip abductors': 'legs', 'hip adductors': 'legs',
  abs: 'core', abdominals: 'core', abdominal: 'core',
  obliques: 'core', oblique: 'core',
  'transverse abdominis': 'core', 'transversus abdominis': 'core',
  'lower back': 'core', 'erector spinae': 'core', erectors: 'core',
  core: 'core',
};

const PROG_CATEGORY_FALLBACK = {
  strength: 'core', cardio: 'conditioning',
  mobility: 'mobility', recovery: 'mobility', mixed: 'core', skill: 'core',
};

function progExerciseToAxis(exercise) {
  // Mirror of progGetExerciseAxis in plan.js — see the note there. Credit on
  // save must route a run to the same axis the planner reasoned about.
  if (exercise.category === 'cardio') return 'conditioning';
  const muscles = JSON.parse(exercise.primary_muscles_json || '[]');
  for (const m of muscles) {
    const axis = PROG_MUSCLE_TO_AXIS[m.toLowerCase()];
    if (axis) return axis;
  }
  return PROG_CATEGORY_FALLBACK[exercise.category] ?? 'core';
}

function progExerciseToMode(exercise) {
  const cat = exercise.category ?? 'strength';
  if (cat === 'cardio') return 'endurance';
  if (cat === 'mobility' || cat === 'recovery') return 'mobility';
  return 'power';
}

function progBuildDefaultScores() {
  return {
    push:         { power: PROG_DEFAULT_SCORE, endurance: PROG_DEFAULT_SCORE, baseline: PROG_DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    pull:         { power: PROG_DEFAULT_SCORE, endurance: PROG_DEFAULT_SCORE, baseline: PROG_DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    legs:         { power: PROG_DEFAULT_SCORE, endurance: PROG_DEFAULT_SCORE, baseline: PROG_DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    core:         { power: PROG_DEFAULT_SCORE, endurance: PROG_DEFAULT_SCORE, baseline: PROG_DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    conditioning: { power: PROG_DEFAULT_SCORE, endurance: PROG_DEFAULT_SCORE, baseline: PROG_DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    mobility:     { mobility: PROG_DEFAULT_SCORE, baseline: PROG_DEFAULT_BASELINE, last_mobility_stimulus_at_ms: null },
  };
}



function progApplyAllDecay(scores, nowMs) {
  const decayed = structuredClone(scores);
  for (const axis of ['push', 'pull', 'legs', 'core', 'conditioning']) {
    const ax = decayed[axis];
    ax.power     = Math.max(ax.baseline, progApplyDecay(ax.power,     ax.baseline, ax.last_power_stimulus_at_ms,     nowMs, 'power'));
    ax.endurance = Math.max(ax.baseline, progApplyDecay(ax.endurance, ax.baseline, ax.last_endurance_stimulus_at_ms, nowMs, 'endurance'));
  }
  const mob = decayed.mobility;
  mob.mobility = Math.max(mob.baseline, progApplyDecay(mob.mobility, mob.baseline, mob.last_mobility_stimulus_at_ms, nowMs, 'mobility'));
  return decayed;
}

// A session logged for an earlier day (POST date < today) is credited at that
// day, but must not wind a more recent stimulus clock BACK — decay would then run
// from the older session. For a session saved today eventMs is now, so this is
// the plain assignment it always was.
const progLatest = (prev, eventMs) => (prev != null && prev > eventMs ? prev : eventMs);

// The request carries each step's actuals as `actual` (an object — apiClient and
// WorkoutView's stepsActualRef); a row read back from execution_steps carries
// `actual_json` (a string). Reading only `actual_json` here meant every POSTed
// strength step scored as zero sets.
function progStepActual(step) {
  if (step?.actual && typeof step.actual === 'object') return step.actual;
  const raw = typeof step?.actual === 'string' ? step.actual : step?.actual_json;
  if (!raw) return {};
  try { return JSON.parse(raw) ?? {}; } catch { return {}; }
}

function progApplyStimulus(scores, stimulus, eventMs) {
  const updated = structuredClone(scores);
  for (const [axis, gains] of Object.entries(stimulus)) {
    if (axis === 'mobility') {
      const mob = updated.mobility;
      if (gains.mobility > 0) {
        mob.mobility = progApplyGain(mob.mobility, gains.mobility);
        mob.last_mobility_stimulus_at_ms = progLatest(mob.last_mobility_stimulus_at_ms, eventMs);
        mob.baseline = applyBaselineRatchet(mob.baseline ?? 0, mob.mobility);
      }
      continue;
    }
    const ax = updated[axis];
    if (!ax) continue;
    if (gains.power > 0) {
      ax.power = progApplyGain(ax.power, gains.power);
      ax.last_power_stimulus_at_ms = progLatest(ax.last_power_stimulus_at_ms, eventMs);
      // Sustained work leaves retained adaptation; the floor rises with it.
      ax.baseline = applyBaselineRatchet(ax.baseline ?? 0, Math.max(ax.power, ax.endurance ?? 0));
    }
    if (gains.endurance > 0) {
      ax.endurance = progApplyGain(ax.endurance, gains.endurance);
      ax.last_endurance_stimulus_at_ms = progLatest(ax.last_endurance_stimulus_at_ms, eventMs);
    }
    // Cross-training bonus: strength gives small endurance benefit and vice versa
    if (gains.power > 0 && axis !== 'conditioning') {
      ax.endurance = progApplyGain(ax.endurance, gains.power * 0.15);
    }
    if (gains.endurance > 0 && axis !== 'conditioning') {
      ax.power = progApplyGain(ax.power, gains.endurance * 0.1);
    }
  }
  return updated;
}

/**
 * Load multiplier for a logged step — C-F6.
 *
 * Relative to a 20 kg reference (an empty barbell, a pair of mid-weight dumbbells)
 * and compressed with a square root so the curve rewards getting stronger without
 * letting a heavy lifter's scores run away: 20 kg → 1.0, 40 kg → 1.41, 80 kg → 2.0.
 * Capped at 2.5.
 *
 * Returns exactly 1.0 when nothing was logged, which is what keeps every existing
 * bodyweight session scoring identically to before.
 */
const PROG_LOAD_REFERENCE_KG = 20;
const PROG_LOAD_MAX_MULT = 2.5;
function progLoadMultiplier(actual) {
  const w = (actual?.weight_kg ?? []).filter((x) => Number(x) > 0);
  if (!w.length) return 1.0;
  const avg = w.reduce((a, b) => a + Number(b), 0) / w.length;
  return Math.min(Math.sqrt(avg / PROG_LOAD_REFERENCE_KG), PROG_LOAD_MAX_MULT);
}

// Compute how much stimulus each exercise step contributes to each axis
function progComputeStimulus(steps, execType, totalDurationSec, exerciseMap, _eventMs) {
  const acc = {};

  // Pure cardio sessions (run/walk/bike/rowing) with no exercise steps
  if (['run', 'walk', 'bike', 'rowing'].includes(execType) && (!steps || !steps.length)) {
    const durationMin = (totalDurationSec ?? 0) / 60;
    const s = Math.min(durationMin * 0.4, PROG_MAX_STIMULUS_PER_AXIS);
    if (!acc.conditioning) acc.conditioning = { power: 0, endurance: 0, mobility: 0 };
    acc.conditioning.endurance += s;
    if (!acc.legs) acc.legs = { power: 0, endurance: 0, mobility: 0 };
    acc.legs.endurance += s * 0.4;
  }

  for (const step of (steps ?? [])) {
    if (!step.exercise_id) continue;
    const actual = progStepActual(step);
    if (actual.skipped) continue;   // a skipped exercise stays in the record and earns nothing

    const exercise = exerciseMap.get(step.exercise_id);
    if (!exercise) continue;

    const axis = progExerciseToAxis(exercise);
    const mode = progExerciseToMode(exercise);
    if (!acc[axis]) acc[axis] = { power: 0, endurance: 0, mobility: 0 };

    if (mode === 'endurance') {
      const reps   = actual.reps_per_set ?? [];
      const durSec = reps.reduce((s, r) => s + r, 0) || (totalDurationSec ?? 0);
      const durMin = durSec / 60;
      acc[axis].endurance = Math.min(acc[axis].endurance + durMin * 0.4, PROG_MAX_STIMULUS_PER_AXIS);
    } else if (mode === 'mobility') {
      const sets = actual.sets_completed ?? 0;
      acc[axis].mobility = Math.min(acc[axis].mobility + sets * 0.6, PROG_MAX_STIMULUS_PER_AXIS);
    } else {
      const sets = actual.sets_completed ?? 0;
      // C-F6 — weight moved now counts. Before this, 8 reps at 40 kg and 8 reps at
      // 100 kg produced identical stimulus, so an athlete getting genuinely stronger
      // on a fixed rep scheme registered as flat.
      //
      // Bodyweight and unlogged sets must score EXACTLY as before, or every existing
      // user's history silently re-bases. Hence a multiplier of 1.0 whenever there is
      // no weight, and a cap so one heavy session cannot dominate an axis.
      acc[axis].power = Math.min(acc[axis].power + sets * GAIN_PER_SET * progLoadMultiplier(actual), PROG_MAX_STIMULUS_PER_AXIS);
    }
  }

  // Final per-axis cap
  for (const axis in acc) {
    const a = acc[axis];
    a.power     = Math.min(a.power,     PROG_MAX_STIMULUS_PER_AXIS);
    a.endurance = Math.min(a.endurance, PROG_MAX_STIMULUS_PER_AXIS);
    a.mobility  = Math.min(a.mobility,  PROG_MAX_STIMULUS_PER_AXIS);
  }

  return acc;
}

// ─── POST: Save execution + update progression ────────────────────────────────

// Need C (PLANNER_AUDIT_2026-10 §5.2): "log something done elsewhere". A session
// may be recorded for today or up to LOG_WINDOW_DAYS before it — the UTC date of
// the request, the same clock the client's `today` uses. Further back is a
// different product (a diary import), and a future date is never a record.
export const LOG_WINDOW_DAYS = 6;
const DAY_MS = 86_400_000;
const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
export function logWindow(nowMs) {
  return { from: isoDay(nowMs - LOG_WINDOW_DAYS * DAY_MS), to: isoDay(nowMs) };
}

// MANUAL_TRAINING_DESIGN §7 — what a performed session was started from (migration
// 0122). A reference, not a foreign key; the shape is the contract.
export const SOURCE_REF_PATTERN = /^(template|assigned_session):[A-Za-z0-9_-]{1,64}$/;

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { date, day_plan_id, session_type, session_program, steps, perceived_exertion, duration_sec, notes, source_ref } = body;

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!date) return Response.json({ error: 'date required' }, { status: 400 });
    if (source_ref != null && (typeof source_ref !== 'string' || !SOURCE_REF_PATTERN.test(source_ref))) {
      return Response.json({ error: 'invalid_source_ref' }, { status: 400 });
    }

    const id  = crypto.randomUUID();
    const now = Date.now();

    const win = logWindow(now);
    const validDay = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)
      && isoDay(Date.parse(`${date}T12:00:00Z`) || 0) === date;
    if (!validDay || date < win.from || date > win.to) {
      return Response.json({ error: 'date_out_of_range', window: win }, { status: 400 });
    }
    // Progression is credited on the day the work was done, not the day it was
    // typed in: noon UTC of a past date, the request time for today (unchanged).
    const sessionMs = date < win.to ? Date.parse(`${date}T12:00:00Z`) : now;

    // ── 1a. Compute TSS for cycling coach sessions ────────────────────────────
    // Detected by synthetic exercise_id prefix 'cycling_coach_'.
    // Phase 3a: use pre-computed tss_planned embedded in plan step when available.
    // Legacy fallback: estimate from step duration + IF heuristic (zone2=0.65, intervals=0.75).
    let tss_planned_val = null;
    let tss_actual_val  = null;
    let tss_source_val  = null;

    const cyclingStep = (steps ?? []).find(
      s => typeof s.exercise_id === 'string' && s.exercise_id.startsWith('cycling_coach_')
    );
    if (cyclingStep) {
      const rpeModifier = { 3: 0.85, 5: 1.0, 8: 1.15 }[perceived_exertion] ?? 1.0;
      // Prefer pre-computed TSS from plan step (Phase 3a plans embed tss_planned on the step)
      const precomputed = cyclingStep.tss_planned ?? cyclingStep.prescribed?.tss_planned ?? null;
      if (precomputed != null) {
        tss_planned_val = precomputed;
        tss_actual_val  = Math.round(precomputed * rpeModifier * 10) / 10;
        tss_source_val  = 'rpe_estimated';
      } else {
        // Legacy: estimate from step duration + zone-based IF
        const stepDurationSec = cyclingStep.prescribed?.duration_sec ?? duration_sec ?? 0;
        const isZ2 = cyclingStep.exercise_id.includes('_z2_');
        const avgIF = isZ2 ? 0.65 : 0.75;
        tss_planned_val = Math.round((stepDurationSec / 3600) * avgIF * avgIF * 100 * 10) / 10;
        tss_actual_val  = Math.round(tss_planned_val * rpeModifier * 10) / 10;
        tss_source_val  = 'rpe_estimated';
      }
    }

    // ── 1b. Insert execution ──────────────────────────────────────────────────
    await env.DB.prepare(`
      INSERT INTO executions
        (id, user_id, date, day_plan_id, execution_type, status,
         total_duration_sec, perceived_exertion,
         tss_planned, tss_actual, tss_source,
         notes, source_ref, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, user_id, date,
      day_plan_id ?? null,
      session_type ?? 'workout',
      duration_sec ?? null,
      perceived_exertion ?? null,
      tss_planned_val,
      tss_actual_val,
      tss_source_val,
      typeof notes === 'string' ? (notes.trim() || null) : null,
      source_ref ?? null,
      now, now
    ).run();

    // ── 2. Batch insert steps ─────────────────────────────────────────────────
    if (steps?.length) {
      const stmts = steps.map((step, i) =>
        env.DB.prepare(`
          INSERT INTO execution_steps
            (id, execution_id, step_index, step_type, exercise_id,
             prescribed_json, actual_json, created_at_ms, updated_at_ms)
          VALUES (?, ?, ?, 'exercise', ?, ?, ?, ?, ?)
        `).bind(
          crypto.randomUUID(),
          id,
          i,
          step.exercise_id ?? null,
          JSON.stringify(step.prescribed ?? {}),
          JSON.stringify(step.actual ?? {}),
          now, now
        )
      );
      await env.DB.batch(stmts);
    }

    // ── 3. Update progression (fire-and-forget style, errors don't fail the response) ──
    try {
      await updateProgression(user_id, id, session_type, duration_sec, steps, env, sessionMs, now);
    } catch (progErr) {
      console.error('Progression update failed (non-fatal):', progErr.message);
    }

    // ── 4. Advance run coach progression ─────────────────────────────────────
    try {
      await advanceRunCoach(user_id, steps, env, now);
    } catch (err) {
      console.error('Run coach advance failed (non-fatal):', err.message);
    }

    // ── 4b. Advance cycling coach progression ────────────────────────────────
    try {
      await advanceCyclingCoach(user_id, steps, session_type, env, now);
    } catch (err) {
      console.error('Cycling coach advance failed (non-fatal):', err.message);
    }

    // ── 4c. Military coach — Cooper result + RPE-based cluster drift ─────────
    // Only advance when the session that was just completed was a military session.
    // Non-military RPE (yoga, strength, etc.) must not drift cluster_current.
    if (session_program === 'military') {
      try {
        await advanceMilitaryCoach(user_id, day_plan_id, steps, perceived_exertion, env, now);
      } catch (err) {
        console.error('Military coach update failed (non-fatal):', err.message);
      }
    }

    // ── 4d. R598 — record a DCP self-assessment taken inside the session ─────
    try {
      await recordDcpMeasurement(user_id, steps, env, now);
    } catch (err) {
      console.error('DCP measurement capture failed (non-fatal):', err.message);
    }

    // ── 5. Track polarised endurance type (zone2 / hiit) for R568 balance ────
    try {
      await updatePolarisedEnduranceType(user_id, steps, env, now);
    } catch (err) {
      console.error('Polarised type update failed (non-fatal):', err.message);
    }

    return Response.json({ ok: true, execution_id: id });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── Progression update helper ────────────────────────────────────────────────

// nowMs is the SESSION's time (it drives decay, the stimulus clocks and the
// event's created_at_ms); writtenAtMs is when the row is actually written.
async function updateProgression(userId, executionId, sessionType, durationSec, steps, env, nowMs, writtenAtMs = nowMs) {
  // Fetch exercise metadata for all exercise_ids in this session (one query)
  const exerciseIds = [...new Set((steps ?? []).map(s => s.exercise_id).filter(Boolean))];
  const exerciseMap = new Map();

  if (exerciseIds.length) {
    const placeholders = exerciseIds.map(() => '?').join(',');
    const exResult = await env.DB.prepare(
      `SELECT id, category, primary_muscles_json FROM exercises WHERE id IN (${placeholders})`
    ).bind(...exerciseIds).all();
    for (const ex of exResult.results) exerciseMap.set(ex.id, ex);
  }

  // Fetch or create user progression row
  const row = await env.DB.prepare(
    `SELECT scores_json, last_computed_at_ms FROM user_progression WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();

  let currentScores = row ? JSON.parse(row.scores_json) : progBuildDefaultScores();

  // Apply decay since last computation
  const scoresBefore = progApplyAllDecay(currentScores, nowMs);

  // Compute stimulus from this session
  const stimulus = progComputeStimulus(steps, sessionType, durationSec, exerciseMap, nowMs);

  // C-F6 — the load term changes what a session is worth. Record both the old and
  // new figures whenever they differ so the switch is auditable after the fact
  // rather than a silent re-baselining nobody can reconstruct. Costs one insert on
  // the sessions where weight was actually logged, and nothing on any other.
  try {
    const anyLoad = (steps ?? []).some((st) =>
      (progStepActual(st)?.weight_kg ?? []).some((w) => Number(w) > 0));
    if (anyLoad) {
      const unweighted = progComputeStimulus(
        (steps ?? []).map((st) => {
          const { weight_kg: _w, ...a } = progStepActual(st);
          return { ...st, actual: a, actual_json: undefined };
        }), sessionType, durationSec, exerciseMap, nowMs
      );
      await env.DB.prepare(
        `INSERT INTO app_events (id, user_id, event_type, detail, created_at_ms) VALUES (?, ?, 'progression_load_delta', ?, ?)`
      ).bind(crypto.randomUUID(), userId,
        JSON.stringify({ with_load: stimulus, without_load: unweighted }), nowMs).run();
    }
  } catch (e) {
    // Auditing must never block saving a workout.
    console.error('load delta audit:', e.message);
  }

  // Apply stimulus to get new scores
  const scoresAfter = progApplyStimulus(scoresBefore, stimulus, nowMs);

  // Upsert progression row
  if (row) {
    await env.DB.prepare(`
      UPDATE user_progression
      SET scores_json = ?, last_computed_at_ms = ?, updated_at_ms = ?
      WHERE user_id = ?
    `).bind(JSON.stringify(scoresAfter), writtenAtMs, writtenAtMs, userId).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO user_progression (user_id, scores_json, sport_scores_json, last_computed_at_ms, created_at_ms, updated_at_ms)
      VALUES (?, ?, NULL, ?, ?, ?)
    `).bind(userId, JSON.stringify(scoresAfter), writtenAtMs, writtenAtMs, writtenAtMs).run();
  }

  // Log the event (non-critical — fire and forget any errors)
  await env.DB.prepare(`
    INSERT INTO user_progression_events
      (id, user_id, execution_id, event_type, scores_before_json, scores_after_json, stimulus_json, created_at_ms)
    VALUES (?, ?, ?, 'workout', ?, ?, ?, ?)
  `).bind(
    crypto.randomUUID(),
    userId,
    executionId,
    JSON.stringify(scoresBefore),
    JSON.stringify(scoresAfter),
    JSON.stringify(stimulus),
    nowMs
  ).run();
}

// ─── Run Coach progression ─────────────────────────────────────────────────

async function advanceRunCoach(userId, steps, env, nowMs) {
  if (!userId || !steps?.length) return;

  const exerciseIds = [...new Set(steps.map(s => s.exercise_id).filter(Boolean))];
  if (!exerciseIds.length) return;

  const placeholders = exerciseIds.map(() => '?').join(',');
  const runExCheck = await env.DB.prepare(
    `SELECT id FROM exercises WHERE id IN (${placeholders})
     AND (tags_json LIKE '%run_interval%' OR tags_json LIKE '%run_continuous%') LIMIT 1`
  ).bind(...exerciseIds).first();
  if (!runExCheck) return;

  const prefsRow = await env.DB.prepare(
    `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  if (!prefsRow?.preferences_json) return;

  const prefs = JSON.parse(prefsRow.preferences_json);
  const rc = prefs.run_coach;
  if (!rc?.enrolled || rc?.completed) return;

  const totalWeeks = RUN_PROGRAM_WEEKS[rc.target_km ?? 5] ?? 8;
  let week = rc.week ?? 1;
  let sessionInWeek = rc.session_in_week ?? 0;
  let completed = false;
  let unlockedTargets = rc.unlocked_targets ?? [];

  // ── Regression on extended break ──────────────────────────────────────────
  // Philosophy: Consistency first, but achievable targets.
  // If the user hasn't run in >7 days, returning to their previous week could
  // be too aggressive — the body needs to rebuild. Step back one week so the
  // return session is appropriate for current fitness, not past fitness.
  // This prevents injury from re-entering week 8 after a 3-week absence.
  // R555 (conditioning score decay) also reduces run level, but this makes
  // the week regression explicit and communicates it clearly in the trace.
  const daysSinceLastRun = rc.last_run_at_ms
    ? Math.floor((nowMs - rc.last_run_at_ms) / 86_400_000)
    : 0;
  if (daysSinceLastRun > 7 && week > 1) {
    week = Math.max(1, week - 1);
    sessionInWeek = 0; // restart the regressed week fresh
  }

  // Advance: this completed session counts as next session in current week
  sessionInWeek = sessionInWeek + 1;

  if (sessionInWeek >= 3) {
    sessionInWeek = 0;
    week += 1;
  }
  if (week > totalWeeks) {
    completed = true;
    const targetKey = String(rc.target_km ?? 5);
    if (!unlockedTargets.includes(targetKey)) unlockedTargets = [...unlockedTargets, targetKey];
    week = totalWeeks;
  }

  const updatedRc = {
    ...rc,
    week,
    session_in_week: sessionInWeek,
    completed,
    unlocked_targets: unlockedTargets,
    last_run_at_ms: nowMs,
  };
  await env.DB.prepare(
    `UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?`
  ).bind(JSON.stringify({ ...prefs, run_coach: updatedRc }), nowMs, userId).run();
}

// ─── Cycling Coach progression ────────────────────────────────────────────────

async function advanceCyclingCoach(userId, steps, sessionType, env, nowMs) {
  if (!userId || !steps?.length) return;

  const isCyclingSession = sessionType === 'cycling_coach'
    || steps.some(s => typeof s.exercise_id === 'string' && s.exercise_id.startsWith('cycling_coach_'));
  const isCrossTrainRun = sessionType === 'cycling_cross_run';

  if (!isCyclingSession && !isCrossTrainRun) return;

  const prefsRow = await env.DB.prepare(
    `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  if (!prefsRow?.preferences_json) return;

  const prefs = JSON.parse(prefsRow.preferences_json);
  const cc = prefs.cycling_coach;
  if (!cc?.active) return;

  let updatedCc = { ...cc };

  if (isCyclingSession) {
    const TOTAL_WEEKS = 8;
    const cyclingDaysPerWeek = cc.cycling_days_per_week ?? 3;
    let week = cc.week ?? 1;
    let sessionInWeek = cc.session_in_week ?? 0;
    let sessionsTotal = cc.sessions_total ?? 0;
    let completed = cc.completed ?? false;

    // Regression: >10 day gap → step back one week
    const daysSinceLastRide = cc.last_ride_at_ms
      ? Math.floor((nowMs - cc.last_ride_at_ms) / 86_400_000) : 0;
    if (daysSinceLastRide > 10 && week > 1) {
      week = Math.max(1, week - 1);
      sessionInWeek = 0;
    }

    sessionsTotal += 1;
    sessionInWeek = sessionInWeek + 1;
    if (sessionInWeek >= cyclingDaysPerWeek) {
      sessionInWeek = 0;
      week += 1;
    }
    if (week > TOTAL_WEEKS) {
      completed = true;
      week = TOTAL_WEEKS;
    }

    updatedCc = { ...updatedCc, week, session_in_week: sessionInWeek, sessions_total: sessionsTotal, completed, last_ride_at_ms: nowMs };
  }

  if (isCrossTrainRun) {
    const CROSS_RUN_ADVANCE_EVERY = 3; // sessions per level step
    const MAX_RUN_LEVEL = 21;
    let runLevel = cc.run_level ?? 1;
    let runSessionsTotal = cc.run_sessions_total ?? 0;

    // Regression: >14 day gap → step back one level
    const daysSinceLastCrossRun = cc.last_cross_run_at_ms
      ? Math.floor((nowMs - cc.last_cross_run_at_ms) / 86_400_000) : 0;
    if (daysSinceLastCrossRun > 14 && runLevel > 1) {
      runLevel = Math.max(1, runLevel - 1);
    }

    runSessionsTotal += 1;
    if (runSessionsTotal % CROSS_RUN_ADVANCE_EVERY === 0) {
      runLevel = Math.min(MAX_RUN_LEVEL, runLevel + 1);
    }

    updatedCc = { ...updatedCc, run_level: runLevel, run_sessions_total: runSessionsTotal, last_cross_run_at_ms: nowMs };
  }

  await env.DB.prepare(
    `UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?`
  ).bind(JSON.stringify({ ...prefs, cycling_coach: updatedCc }), nowMs, userId).run();
}

// ─── Military coach — post-session update ────────────────────────────────────
// Handles three things after every military session:
//   1. Cooper test result → persists last_cooper_distance_m
//   2. RPE-based cluster drift — cluster_current silently adjusts up/down based
//      on consecutive easy (RPE=3) or hard (RPE=8) sessions; this lets users
//      exceed their assessment target naturally without any explicit prompt
//   3. Post-assessment rollover — when target_date has passed, mode flips to
//      'open' so training continues seamlessly on the rolling phase cycle
//
// Cluster drift rules:
//   - 3 consecutive easy sessions  → cluster_current + 1 (no ceiling other than track max)
//   - 2 consecutive hard sessions  → cluster_current - 1 (floor = 1)
//   - Any other RPE → resets streak counters
//   - cluster_current is used by plan.js for group selection; cluster_target is
//     preserved forever as the original assessment benchmark

async function advanceMilitaryCoach(userId, planId, steps, perceivedExertion, env, nowMs) {
  if (!userId) return;

  const prefsRow = await env.DB.prepare(
    `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  if (!prefsRow?.preferences_json) return;

  const prefs = JSON.parse(prefsRow.preferences_json);
  const mil   = prefs.military_coach;
  if (!mil?.active) return;

  let updated = { ...mil };

  // ── 1. Cooper test result ─────────────────────────────────────────────────
  if (steps?.length) {
    for (const s of steps) {
      const actual = typeof s.actual === 'string' ? JSON.parse(s.actual) : (s.actual ?? {});
      if (actual.cooper_distance_m != null && actual.cooper_distance_m > 0) {
        updated.last_cooper_distance_m = actual.cooper_distance_m;
        updated.last_cooper_at_ms      = nowMs;
        break;
      }
    }
  }

  // ── 2. RPE-based cluster drift ────────────────────────────────────────────
  const trackMax       = (mil.track ?? 'keuring') === 'keuring' ? 6 : 7;
  let clusterCurrent   = mil.cluster_current ?? mil.cluster_target ?? 1;
  let easyStreak       = mil.rpe_easy_streak  ?? 0;
  let hardStreak       = mil.rpe_hard_streak  ?? 0;

  if (perceivedExertion === 3) {        // too easy
    easyStreak += 1;
    hardStreak  = 0;
    if (easyStreak >= 3) {
      clusterCurrent = Math.min(clusterCurrent + 1, trackMax);
      easyStreak = 0;
    }
  } else if (perceivedExertion === 8) { // too hard
    hardStreak += 1;
    easyStreak  = 0;
    if (hardStreak >= 2) {
      clusterCurrent = Math.max(clusterCurrent - 1, 1);
      hardStreak = 0;
    }
  } else {
    easyStreak = 0;
    hardStreak = 0;
  }

  updated.cluster_current = clusterCurrent;
  updated.rpe_easy_streak = easyStreak;
  updated.rpe_hard_streak = hardStreak;

  // ── 3. Rolling block advancement ─────────────────────────────────────────
  // Determine if the session just completed was a rest day or a training session.
  // Rest day completion → start a new block; training session → advance within block.
  let isRestSession = false;
  if (planId) {
    try {
      const planRow = await env.DB.prepare(
        `SELECT plan_json FROM day_plans WHERE id = ? AND user_id = ? LIMIT 1`
      ).bind(planId, userId).first();
      if (planRow?.plan_json) {
        isRestSession = JSON.parse(planRow.plan_json).slot_type === 'rest';
      }
    } catch { /* non-fatal — fall through with isRestSession = false */ }
  }

  const blockIdx = mil.block_session_index ?? 0;
  const blockNum = mil.block_number ?? 1;

  if (isRestSession) {
    // Rest day done: earned recovery is complete, start fresh training block
    updated.block_session_index = 0;
    updated.block_number = blockNum + 1;
  } else {
    // Training session done: advance position within current block
    updated.block_session_index = blockIdx + 1;
    // block_number stays the same until the earned rest day is completed
  }

  // ── 4. Post-assessment rollover ───────────────────────────────────────────
  if (mil.mode === 'target' && mil.target_date) {
    const assessMs = new Date(mil.target_date + 'T00:00:00Z').getTime();
    if (nowMs >= assessMs) {
      // Assessment day has arrived — roll to open mode silently.
      updated.mode           = 'open';
      updated.target_date    = null;
      updated.block_session_index = 0;
      updated.block_number   = (blockNum + 1);
    }
  }

  await env.DB.prepare(
    `UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?`
  ).bind(JSON.stringify({ ...prefs, military_coach: updated }), nowMs, userId).run();
}

// ─── Polarised endurance type tracker ────────────────────────────────────────
// After each workout, detects whether any completed exercise was tagged 'hiit' or
// 'zone2', then stores the result as sport_prefs.last_endurance_type. R568 in
// plan.js reads this to alternate between types on the next session.

async function updatePolarisedEnduranceType(userId, steps, env, nowMs) {
  if (!userId || !steps?.length) return;

  const exerciseIds = [...new Set(steps.map(s => s.exercise_id).filter(Boolean))];
  if (!exerciseIds.length) return;

  const placeholders = exerciseIds.map(() => '?').join(',');
  const rows = await env.DB.prepare(
    `SELECT tags_json FROM exercises WHERE id IN (${placeholders})`
  ).bind(...exerciseIds).all();

  let hasHiit = false;
  let hasZone2 = false;
  for (const row of (rows?.results ?? [])) {
    const tags = JSON.parse(row.tags_json || '[]');
    if (tags.includes('hiit'))  hasHiit  = true;
    if (tags.includes('zone2')) hasZone2 = true;
  }
  if (!hasHiit && !hasZone2) return;

  const newType = hasHiit ? 'hiit' : 'zone2';

  const prefsRow = await env.DB.prepare(
    `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  if (!prefsRow?.preferences_json) return;

  const prefs = JSON.parse(prefsRow.preferences_json);
  if (!prefs.sport_prefs?.polarised_training) return; // only track when feature is on

  prefs.sport_prefs = { ...prefs.sport_prefs, last_endurance_type: newType };
  await env.DB.prepare(
    `UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?`
  ).bind(JSON.stringify(prefs), nowMs, userId).run();
}

// ─── GET: Fetch execution history ─────────────────────────────────────────────

export async function onRequestGet({ request, env }) {
  try {
    const url   = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') ?? '30');

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });

    const isPro = await isProUser(env, user_id, Date.now());
    const effectiveLimit = isPro ? 1000 : limit;
    const cutoffMs = isPro ? 0 : Date.now() - 30 * 24 * 60 * 60 * 1000;

    const [result, stepsResult, plansResult] = await Promise.all([
      env.DB.prepare(
        `SELECT id, date, execution_type, status, total_duration_sec,
                perceived_exertion, tss_planned, tss_actual, tss_source,
                strava_activity_id, strava_metadata_json,
                notes, source_ref, created_at_ms
         FROM executions
         WHERE user_id = ?
           ${isPro ? '' : 'AND created_at_ms >= ?'}
         ORDER BY created_at_ms DESC
         LIMIT ?`
      ).bind(...isPro ? [user_id, effectiveLimit] : [user_id, cutoffMs, effectiveLimit]).all(),
      env.DB.prepare(
        `SELECT es.execution_id, ex.name AS exercise_name, es.step_index,
                es.prescribed_json, es.actual_json
         FROM execution_steps es
         LEFT JOIN exercises ex ON es.exercise_id = ex.id
         WHERE es.execution_id IN (
           SELECT id FROM executions WHERE user_id = ?
             ${isPro ? '' : 'AND created_at_ms >= ?'}
           ORDER BY created_at_ms DESC LIMIT ?
         )
         ORDER BY es.execution_id, es.step_index`
      ).bind(...isPro ? [user_id, effectiveLimit] : [user_id, cutoffMs, effectiveLimit]).all(),
      // Fetch rule_trace from day_plans for the same date window (adaptation memory)
      env.DB.prepare(
        `SELECT date, JSON_EXTRACT(plan_json, '$.rule_trace') AS rule_trace_json
         FROM day_plans
         WHERE user_id = ?
           AND date IN (
             SELECT DISTINCT date FROM executions WHERE user_id = ?
               ${isPro ? '' : 'AND created_at_ms >= ?'}
             ORDER BY created_at_ms DESC LIMIT ?
           )`
      ).bind(...isPro ? [user_id, user_id, effectiveLimit] : [user_id, user_id, cutoffMs, effectiveLimit]).all(),
    ]);

    const stepsByExec = {};
    for (const s of stepsResult.results) {
      if (!stepsByExec[s.execution_id]) stepsByExec[s.execution_id] = [];
      stepsByExec[s.execution_id].push({
        name: s.exercise_name,
        prescribed_json: s.prescribed_json,
        actual_json: s.actual_json,
      });
    }

    // rule_trace keyed by date for O(1) lookup
    const ruleTraceByDate = {};
    for (const p of plansResult.results) {
      try { ruleTraceByDate[p.date] = p.rule_trace_json ? JSON.parse(p.rule_trace_json) : null; }
      catch { /* ignore malformed */ }
    }

    const executions = result.results.map(e => ({
      ...e,
      steps: stepsByExec[e.id] ?? [],
      rule_trace: ruleTraceByDate[e.date] ?? null,
    }));

    return Response.json({ executions, truncated: !isPro });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── DELETE: Remove execution and its steps ───────────────────────────────────

export async function onRequestDelete({ request, env }) {
  try {
    const url          = new URL(request.url);
    const execution_id = url.searchParams.get('execution_id');

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!execution_id) return Response.json({ error: 'missing execution_id' }, { status: 400 });

    // Verify ownership before touching any rows
    const owned = await env.DB.prepare(
      'SELECT id FROM executions WHERE id = ? AND user_id = ? LIMIT 1'
    ).bind(execution_id, user_id).first();
    if (!owned) return Response.json({ error: 'not found' }, { status: 404 });

    await env.DB.batch([
      env.DB.prepare('DELETE FROM execution_steps WHERE execution_id = ?').bind(execution_id),
      env.DB.prepare('DELETE FROM executions WHERE id = ?').bind(execution_id),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * R598 — write the DCP baseline from max-effort sets performed in the session.
 *
 * dcp.last was read in four places and written by none, so the card showed 0/19
 * forever and R593/R594 biased toward a baseline that did not exist. The planner
 * marks the two measurement steps with `measures`; whatever the user actually
 * completed in the 2-minute window is the measurement.
 *
 * Only ever raises or records — a set abandoned at 2 reps because someone felt
 * unwell should not overwrite a genuine 30 with a 2 and then drive six weeks of
 * training off it. A real decline is captured by the next deliberate retest,
 * which the user can force from Recalibrate at any time.
 */
async function recordDcpMeasurement(userId, steps, env, now) {
  const measured = {};
  for (const step of (steps ?? [])) {
    const kind = step.measures ?? step.prescribed?.measures ?? null;
    if (kind !== 'dcp_pushups' && kind !== 'dcp_situps') continue;
    const actual = step.actual ?? {};
    if (actual.skipped) continue;
    const reps = Array.isArray(actual.reps_per_set) && actual.reps_per_set.length
      ? Math.max(...actual.reps_per_set.map(Number).filter(Number.isFinite))
      : null;
    if (reps == null || !(reps > 0)) continue;
    measured[kind === 'dcp_pushups' ? 'pushups' : 'situps'] = reps;
  }
  if (!Object.keys(measured).length) return;

  const row = await env.DB.prepare(
    'SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1'
  ).bind(userId).first();
  if (!row?.preferences_json) return;

  const prefs = JSON.parse(row.preferences_json);
  const dcp = prefs?.military_coach?.dcp;
  if (!dcp?.enabled) return;

  const prev = dcp.last ?? {};
  dcp.last = {
    pushups: Math.max(measured.pushups ?? 0, prev.pushups ?? 0),
    situps:  Math.max(measured.situps  ?? 0, prev.situps  ?? 0),
    at_ms:   now,
  };
  await env.DB.prepare(
    'UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?'
  ).bind(JSON.stringify(prefs), now, userId).run();
}
