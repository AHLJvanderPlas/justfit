// POST /api/execution — save a completed workout execution
// GET  /api/execution — fetch execution history for a user
// DELETE /api/execution — delete an execution and its steps

// ─── JWT AUTH HELPER (inlined — Pages Functions cannot import across files) ───
async function _hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function _verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await _hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function getAuthUserId(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  const payload = await _verifyJWT(token, env.JWT_SECRET);
  return payload?.userId ?? null;
}

// ─── PROGRESSION ENGINE (inline copy — kept in sync with progression.js) ─────
// Cloudflare Pages Functions cannot import across api/*.js files, so the
// scoring helpers are duplicated here. If you change the formula in
// progression.js, update these constants too.

const PROG_DEFAULT_BASELINE = 15;
const RUN_PROGRAM_WEEKS = { 5: 8, 10: 12, 15: 14, 20: 16, 30: 20 };
const PROG_DEFAULT_SCORE    = 15;
const PROG_MAX_STIMULUS_PER_AXIS = 6;

const PROG_DECAY_CONFIG = {
  power:     { gracePeriodMs: 48 * 3_600_000, ratePerDay: 0.04  },
  endurance: { gracePeriodMs: 72 * 3_600_000, ratePerDay: 0.025 },
  mobility:  { gracePeriodMs: 96 * 3_600_000, ratePerDay: 0.015 },
};

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

function progApplyGain(currentScore, stimulus) {
  return Math.min(100, currentScore + stimulus * (1 - currentScore / 100));
}

function progApplyDecay(currentScore, baseline, lastStimulusAtMs, nowMs, mode) {
  if (!lastStimulusAtMs) return currentScore;
  const cfg = PROG_DECAY_CONFIG[mode];
  const elapsedMs = nowMs - lastStimulusAtMs;
  if (elapsedMs <= cfg.gracePeriodMs) return currentScore;
  const decayDays = (elapsedMs - cfg.gracePeriodMs) / 86_400_000;
  const factor = Math.pow(1 - cfg.ratePerDay, decayDays);
  return baseline + (currentScore - baseline) * factor;
}

function progApplyAllDecay(scores, nowMs) {
  const decayed = JSON.parse(JSON.stringify(scores));
  for (const axis of ['push', 'pull', 'legs', 'core', 'conditioning']) {
    const ax = decayed[axis];
    ax.power     = Math.max(ax.baseline, progApplyDecay(ax.power,     ax.baseline, ax.last_power_stimulus_at_ms,     nowMs, 'power'));
    ax.endurance = Math.max(ax.baseline, progApplyDecay(ax.endurance, ax.baseline, ax.last_endurance_stimulus_at_ms, nowMs, 'endurance'));
  }
  const mob = decayed.mobility;
  mob.mobility = Math.max(mob.baseline, progApplyDecay(mob.mobility, mob.baseline, mob.last_mobility_stimulus_at_ms, nowMs, 'mobility'));
  return decayed;
}

function progApplyStimulus(scores, stimulus, eventMs) {
  const updated = JSON.parse(JSON.stringify(scores));
  for (const [axis, gains] of Object.entries(stimulus)) {
    if (axis === 'mobility') {
      const mob = updated.mobility;
      if (gains.mobility > 0) {
        mob.mobility = progApplyGain(mob.mobility, gains.mobility);
        mob.last_mobility_stimulus_at_ms = eventMs;
      }
      continue;
    }
    const ax = updated[axis];
    if (!ax) continue;
    if (gains.power > 0) {
      ax.power = progApplyGain(ax.power, gains.power);
      ax.last_power_stimulus_at_ms = eventMs;
    }
    if (gains.endurance > 0) {
      ax.endurance = progApplyGain(ax.endurance, gains.endurance);
      ax.last_endurance_stimulus_at_ms = eventMs;
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
    const actual = step.actual_json ? JSON.parse(step.actual_json) : {};
    if (actual.skipped) continue;

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
      acc[axis].power = Math.min(acc[axis].power + sets * 0.8, PROG_MAX_STIMULUS_PER_AXIS);
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

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { date, day_plan_id, session_type, steps, perceived_exertion, duration_sec } = body;

    const user_id = await getAuthUserId(request, env);
    if (!user_id) return Response.json({ error: 'unauthorized' }, { status: 401 });
    if (!date) return Response.json({ error: 'date required' }, { status: 400 });

    const id  = crypto.randomUUID();
    const now = Date.now();

    // ── 1. Insert execution ───────────────────────────────────────────────────
    await env.DB.prepare(`
      INSERT INTO executions
        (id, user_id, date, day_plan_id, execution_type, status,
         total_duration_sec, perceived_exertion, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?)
    `).bind(
      id, user_id, date,
      day_plan_id ?? null,
      session_type ?? 'workout',
      duration_sec ?? null,
      perceived_exertion ?? null,
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
      await updateProgression(user_id, id, session_type, duration_sec, steps, env, now);
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
      await advanceCyclingCoach(user_id, steps, env, now);
    } catch (err) {
      console.error('Cycling coach advance failed (non-fatal):', err.message);
    }

    // ── 5. Track polarised endurance type (zone2 / hiit) for R558 balance ────
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

async function updateProgression(userId, executionId, sessionType, durationSec, steps, env, nowMs) {
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

  // Apply stimulus to get new scores
  const scoresAfter = progApplyStimulus(scoresBefore, stimulus, nowMs);

  // Upsert progression row
  if (row) {
    await env.DB.prepare(`
      UPDATE user_progression
      SET scores_json = ?, last_computed_at_ms = ?, updated_at_ms = ?
      WHERE user_id = ?
    `).bind(JSON.stringify(scoresAfter), nowMs, nowMs, userId).run();
  } else {
    await env.DB.prepare(`
      INSERT INTO user_progression (user_id, scores_json, sport_scores_json, last_computed_at_ms, created_at_ms, updated_at_ms)
      VALUES (?, ?, NULL, ?, ?, ?)
    `).bind(userId, JSON.stringify(scoresAfter), nowMs, nowMs, nowMs).run();
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

async function advanceCyclingCoach(userId, steps, env, nowMs) {
  if (!userId || !steps?.length) return;

  // Only advance when a cycling coach synthetic step was in this session
  const hasCyclingStep = steps.some(s =>
    typeof s.exercise_id === 'string' && s.exercise_id.startsWith('cycling_coach_')
  );
  if (!hasCyclingStep) return;

  const prefsRow = await env.DB.prepare(
    `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();
  if (!prefsRow?.preferences_json) return;

  const prefs = JSON.parse(prefsRow.preferences_json);
  const cc = prefs.cycling_coach;
  if (!cc?.active) return;

  const TOTAL_WEEKS = 8;
  let week = cc.week ?? 1;
  let sessionInWeek = cc.session_in_week ?? 0;
  let completed = cc.completed ?? false;

  // Regression: >10 day gap → step back one week
  const daysSinceLastRide = cc.last_ride_at_ms
    ? Math.floor((nowMs - cc.last_ride_at_ms) / 86_400_000) : 0;
  if (daysSinceLastRide > 10 && week > 1) {
    week = Math.max(1, week - 1);
    sessionInWeek = 0;
  }

  sessionInWeek = sessionInWeek + 1;
  if (sessionInWeek >= 3) {
    sessionInWeek = 0;
    week += 1;
  }
  if (week > TOTAL_WEEKS) {
    completed = true;
    week = TOTAL_WEEKS;
  }

  const updatedCc = { ...cc, week, session_in_week: sessionInWeek, completed, last_ride_at_ms: nowMs };
  await env.DB.prepare(
    `UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?`
  ).bind(JSON.stringify({ ...prefs, cycling_coach: updatedCc }), nowMs, userId).run();
}

// ─── Polarised endurance type tracker ────────────────────────────────────────
// After each workout, detects whether any completed exercise was tagged 'hiit' or
// 'zone2', then stores the result as sport_prefs.last_endurance_type. R558 in
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

    const result = await env.DB.prepare(
      `SELECT id, date, execution_type, status, total_duration_sec,
              perceived_exertion, created_at_ms
       FROM executions
       WHERE user_id = ?
       ORDER BY created_at_ms DESC
       LIMIT ?`
    ).bind(user_id, limit).all();

    return Response.json({ executions: result.results });
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
