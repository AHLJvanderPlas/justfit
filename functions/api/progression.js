// GET  /api/progression          — fetch current progression state + goal fit
// POST /api/progression          — update sport/progression preferences
// POST /api/progression?action=recompute — admin: rebuild from execution history

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const AXES = ['push', 'pull', 'legs', 'core', 'conditioning', 'mobility'];

// Default baseline and starting score for every user
const DEFAULT_BASELINE = 15;
const DEFAULT_SCORE    = 15;

// Decay parameters — tune these without changing logic
const DECAY_CONFIG = {
  power:     { gracePeriodMs: 48 * 3_600_000, ratePerDay: 0.04  }, // starts after 2 days
  endurance: { gracePeriodMs: 72 * 3_600_000, ratePerDay: 0.025 }, // starts after 3 days
  mobility:  { gracePeriodMs: 96 * 3_600_000, ratePerDay: 0.015 }, // starts after 4 days
};

// Goal → default chart mode + target profile (0–100 per axis)
const GOAL_TARGET_PROFILES = {
  health: {
    chartMode: 'balanced',
    targets: { push: 60, pull: 60, legs: 60, core: 60, conditioning: 55, mobility: 55 },
    description: 'A balanced all-round base across all movements.',
  },
  strength: {
    chartMode: 'power',
    targets: { push: 80, pull: 80, legs: 80, core: 65, conditioning: 40, mobility: 40 },
    description: 'High power across all major movement patterns.',
  },
  fat_loss: {
    chartMode: 'endurance',
    targets: { push: 50, pull: 50, legs: 60, core: 55, conditioning: 80, mobility: 45 },
    description: 'Strong conditioning engine with a solid movement base.',
  },
  muscle_gain: {
    chartMode: 'power',
    targets: { push: 75, pull: 75, legs: 75, core: 65, conditioning: 40, mobility: 35 },
    description: 'Focused hypertrophy stimulus across major muscle groups.',
  },
  endurance: {
    chartMode: 'endurance',
    targets: { push: 45, pull: 45, legs: 65, core: 60, conditioning: 85, mobility: 50 },
    description: 'Aerobic engine first, supported by leg and core endurance.',
  },
  mobility: {
    chartMode: 'mobility',
    targets: { push: 40, pull: 40, legs: 45, core: 55, conditioning: 35, mobility: 85 },
    description: 'Mobility and flexibility as the primary training focus.',
  },
  military: {
    chartMode: 'balanced',
    targets: { push: 70, pull: 60, legs: 75, core: 70, conditioning: 80, mobility: 40 },
    description: 'Military prep: conditioning and legs-heavy, with strong push and core.',
  },
};

// Axis display labels
const AXIS_LABELS = {
  push:         'Push',
  pull:         'Pull',
  legs:         'Legs',
  core:         'Core',
  conditioning: 'Cardio',
  mobility:     'Mobility',
};

// ─── SCORE HELPERS ───────────────────────────────────────────────────────────

// Build an empty scores object at the default starting values
function buildDefaultScores() {
  return {
    push:         { power: DEFAULT_SCORE, endurance: DEFAULT_SCORE, baseline: DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    pull:         { power: DEFAULT_SCORE, endurance: DEFAULT_SCORE, baseline: DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    legs:         { power: DEFAULT_SCORE, endurance: DEFAULT_SCORE, baseline: DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    core:         { power: DEFAULT_SCORE, endurance: DEFAULT_SCORE, baseline: DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    conditioning: { power: DEFAULT_SCORE, endurance: DEFAULT_SCORE, baseline: DEFAULT_BASELINE, last_power_stimulus_at_ms: null, last_endurance_stimulus_at_ms: null },
    mobility:     { mobility: DEFAULT_SCORE, baseline: DEFAULT_BASELINE, last_mobility_stimulus_at_ms: null },
  };
}

// Gain formula: diminishing returns — harder to improve when already high
function applyGain(currentScore, stimulus) {
  return Math.min(100, currentScore + stimulus * (1 - currentScore / 100));
}

// Decay formula: exponential decay above the personal baseline
function applyDecay(currentScore, baseline, lastStimulusAtMs, nowMs, mode) {
  if (!lastStimulusAtMs) return currentScore; // never trained → no decay needed
  const cfg = DECAY_CONFIG[mode];
  const elapsedMs = nowMs - lastStimulusAtMs;
  if (elapsedMs <= cfg.gracePeriodMs) return currentScore; // within grace period
  const decayDays = (elapsedMs - cfg.gracePeriodMs) / 86_400_000;
  const factor = Math.pow(1 - cfg.ratePerDay, decayDays);
  return baseline + (currentScore - baseline) * factor;
}

// Apply decay to all axes — returns a new scores object (does not mutate)
function applyAllDecay(scores, nowMs) {
  const decayed = JSON.parse(JSON.stringify(scores)); // deep clone

  for (const axis of ['push', 'pull', 'legs', 'core', 'conditioning']) {
    const ax = decayed[axis];
    ax.power     = applyDecay(ax.power,     ax.baseline, ax.last_power_stimulus_at_ms,     nowMs, 'power');
    ax.endurance = applyDecay(ax.endurance, ax.baseline, ax.last_endurance_stimulus_at_ms, nowMs, 'endurance');
    // Clamp to baseline minimum
    ax.power     = Math.max(ax.baseline, ax.power);
    ax.endurance = Math.max(ax.baseline, ax.endurance);
  }

  const mob = decayed.mobility;
  mob.mobility = applyDecay(mob.mobility, mob.baseline, mob.last_mobility_stimulus_at_ms, nowMs, 'mobility');
  mob.mobility = Math.max(mob.baseline, mob.mobility);

  return decayed;
}

// ─── GOAL FIT & INSIGHTS ─────────────────────────────────────────────────────

// Returns 0–100: how close the current profile matches the goal target
function computeGoalFit(scores, goal, chartMode) {
  const profile = GOAL_TARGET_PROFILES[goal];
  if (!profile) return 50;

  const targets = profile.targets;
  let totalGap = 0;
  let maxPossibleGap = 0;

  for (const axis of AXES) {
    const target = targets[axis] ?? 50;
    const current = getDisplayScore(scores, axis, chartMode);
    // Only gap where current < target contributes to fitness penalty
    totalGap += Math.max(0, target - current);
    maxPossibleGap += target; // max gap if current were 0
  }

  if (maxPossibleGap === 0) return 100;
  return Math.round(100 - (totalGap / maxPossibleGap) * 100);
}

// Get the displayable score for an axis given the current chart mode
function getDisplayScore(scores, axis, chartMode) {
  if (axis === 'mobility') {
    return Math.round(scores.mobility?.mobility ?? DEFAULT_SCORE);
  }
  const ax = scores[axis] ?? {};
  if (chartMode === 'power')     return Math.round(ax.power     ?? DEFAULT_SCORE);
  if (chartMode === 'endurance') return Math.round(ax.endurance ?? DEFAULT_SCORE);
  if (chartMode === 'balanced')  return Math.round(((ax.power ?? DEFAULT_SCORE) + (ax.endurance ?? DEFAULT_SCORE)) / 2);
  if (chartMode === 'mobility')  return Math.round(ax.endurance ?? DEFAULT_SCORE); // mobility mode shows endurance capacity
  return Math.round(ax.power ?? DEFAULT_SCORE);
}

// Compute insights: strongest, weakest, most decayed, fastest improving
function computeInsights(scores, goal, chartMode, nowMs, createdAtMs) {
  const profile = GOAL_TARGET_PROFILES[goal];
  const targets  = profile?.targets ?? {};

  let strongest      = null; let strongestVal = -1;
  let weakest        = null; let weakestVal   = 101;
  let biggestGap     = null; let biggestGapVal = -1;
  let mostDecayed    = null; let mostDecayedMs = 0;

  for (const axis of AXES) {
    const current = getDisplayScore(scores, axis, chartMode);
    const target  = targets[axis] ?? 50;
    const gap     = Math.max(0, target - current);

    if (current > strongestVal) { strongestVal = current; strongest = axis; }
    if (current < weakestVal)   { weakestVal   = current; weakest   = axis; }
    if (gap > biggestGapVal)    { biggestGapVal = gap;    biggestGap = axis; }

    // Find most decayed axis (furthest from last stimulus)
    // Cap elapsed at (nowMs - createdAtMs) so null timestamps don't produce epoch-based giant numbers
    const ax = scores[axis];
    if (ax) {
      const profileAgeMs = createdAtMs ? (nowMs - createdAtMs) : 0;
      const lastMs = axis === 'mobility'
        ? (ax.last_mobility_stimulus_at_ms ?? (nowMs - profileAgeMs))
        : Math.min(
            ax.last_power_stimulus_at_ms     ?? nowMs,
            ax.last_endurance_stimulus_at_ms ?? nowMs,
          );
      const elapsed = Math.min(nowMs - lastMs, profileAgeMs);
      if (elapsed > mostDecayedMs) { mostDecayedMs = elapsed; mostDecayed = axis; }
    }
  }

  const decayDays = Math.floor(mostDecayedMs / 86_400_000);
  const insightDecay = mostDecayed && decayDays >= 4
    ? `Your ${AXIS_LABELS[mostDecayed]} score hasn't been trained in ${decayDays} days — it's starting to fade. Add some ${mostDecayed === 'mobility' ? 'mobility work' : mostDecayed + ' exercises'} this week.`
    : null;

  const insightGap = biggestGap
    ? `Your biggest gap vs. your goal is ${AXIS_LABELS[biggestGap]} (${Math.round(biggestGapVal)} points away). The planner will prioritise this.`
    : null;

  return {
    strongest:    strongest ? { axis: strongest, score: strongestVal, label: AXIS_LABELS[strongest] } : null,
    weakest:      weakest   ? { axis: weakest,   score: weakestVal,   label: AXIS_LABELS[weakest]   } : null,
    biggest_gap:  biggestGap ? { axis: biggestGap, gap: Math.round(biggestGapVal), label: AXIS_LABELS[biggestGap] } : null,
    most_decayed: mostDecayed && decayDays >= 4 ? { axis: mostDecayed, days: decayDays, label: AXIS_LABELS[mostDecayed] } : null,
    insight_text: [insightDecay, insightGap].filter(Boolean),
  };
}

// Build planner_influence explanation for the frontend
function buildPlannerExplanation(scores, goal, chartMode) {
  const profile = GOAL_TARGET_PROFILES[goal];
  const targets  = profile?.targets ?? {};
  const lines    = [];

  // Collect gaps, sorted by size
  const gaps = AXES
    .map(axis => ({
      axis,
      label: AXIS_LABELS[axis],
      current: getDisplayScore(scores, axis, chartMode),
      target: targets[axis] ?? 50,
      gap: Math.max(0, (targets[axis] ?? 50) - getDisplayScore(scores, axis, chartMode)),
    }))
    .filter(g => g.gap >= 5)
    .sort((a, b) => b.gap - a.gap);

  if (gaps.length) {
    const top = gaps[0];
    lines.push(`Your planner is prioritising ${top.label} because it's your largest gap vs. your ${formatGoalLabel(goal)} goal (current: ${top.current}, target: ${top.target}).`);
  }

  if (gaps.length >= 2) {
    const sec = gaps[1];
    lines.push(`${sec.label} is also being boosted — ${sec.gap} points behind target.`);
  }

  const chartNote = {
    power:     'Sessions lean toward heavier, lower-rep strength work.',
    endurance: 'Sessions lean toward higher-rep, shorter-rest metabolic work.',
    balanced:  'Sessions mix strength and conditioning roughly equally.',
    mobility:  'Sessions include extra flexibility and recovery work.',
  }[chartMode];
  if (chartNote) lines.push(chartNote);

  return lines;
}

function formatGoalLabel(goal) {
  return { health: 'General Health', strength: 'Build Strength', fat_loss: 'Lose Weight',
    muscle_gain: 'Build Muscle', endurance: 'Endurance', mobility: 'Mobility & Flex' }[goal] ?? goal;
}

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  return verifyJWT(token, env.JWT_SECRET);
}

// ─── FETCH OR INITIALISE PROGRESSION ROW ─────────────────────────────────────

async function getOrCreateProgression(userId, env) {
  const row = await env.DB.prepare(
    `SELECT scores_json, sport_scores_json, last_computed_at_ms, created_at_ms FROM user_progression WHERE user_id = ? LIMIT 1`
  ).bind(userId).first();

  if (row) {
    return {
      scores: JSON.parse(row.scores_json),
      sportScores: row.sport_scores_json ? JSON.parse(row.sport_scores_json) : null,
      lastComputedAtMs: row.last_computed_at_ms,
      createdAtMs: row.created_at_ms,
      existed: true,
    };
  }

  // First time — initialise with defaults
  const scores = buildDefaultScores();
  const now    = Date.now();
  await env.DB.prepare(`
    INSERT INTO user_progression (user_id, scores_json, sport_scores_json, last_computed_at_ms, created_at_ms, updated_at_ms)
    VALUES (?, ?, NULL, ?, ?, ?)
  `).bind(userId, JSON.stringify(scores), now, now, now).run();

  return { scores, sportScores: null, lastComputedAtMs: now, createdAtMs: now, existed: false };
}

// ─── MUSCLE → AXIS LOOKUP ────────────────────────────────────────────────────
// Used by recompute endpoint (and shared with execution.js via this constant).

const MUSCLE_TO_AXIS = {
  // Push
  chest: 'push', pectorals: 'push', pectoral: 'push',
  triceps: 'push', tricep: 'push',
  deltoids: 'push', shoulders: 'push', shoulder: 'push',
  'anterior deltoid': 'push', 'front deltoid': 'push',
  // Pull
  back: 'pull', lats: 'pull', lat: 'pull', 'latissimus dorsi': 'pull',
  rhomboids: 'pull', rhomboid: 'pull',
  trapezius: 'pull', traps: 'pull', trap: 'pull',
  biceps: 'pull', bicep: 'pull',
  'rear deltoid': 'pull', 'posterior deltoid': 'pull',
  'rotator cuff': 'pull', 'upper back': 'pull', 'mid back': 'pull',
  // Legs
  quadriceps: 'legs', quads: 'legs', quad: 'legs',
  hamstrings: 'legs', hamstring: 'legs',
  glutes: 'legs', glute: 'legs', gluteus: 'legs', 'gluteus maximus': 'legs',
  calves: 'legs', calf: 'legs', gastrocnemius: 'legs', soleus: 'legs',
  'hip flexors': 'legs', 'hip flexor': 'legs',
  adductors: 'legs', adductor: 'legs',
  abductors: 'legs', abductor: 'legs',
  'hip abductors': 'legs', 'hip adductors': 'legs',
  // Core
  abs: 'core', abdominals: 'core', abdominal: 'core',
  obliques: 'core', oblique: 'core',
  'transverse abdominis': 'core', 'transversus abdominis': 'core',
  'lower back': 'core', 'erector spinae': 'core', erectors: 'core',
  core: 'core',
};

// Category fallback when no muscles map
const CATEGORY_FALLBACK_AXIS = {
  strength: 'core',      // rare — compound movements usually map
  cardio: 'conditioning',
  mobility: 'mobility',
  recovery: 'mobility',
  mixed: 'core',
  skill: 'core',
};

// Determine primary axis from exercise
function exerciseToAxis(exercise) {
  const muscles = JSON.parse(exercise.primary_muscles_json || '[]');
  for (const m of muscles) {
    const axis = MUSCLE_TO_AXIS[m.toLowerCase()];
    if (axis) return axis;
  }
  return CATEGORY_FALLBACK_AXIS[exercise.category] ?? 'core';
}

// Mode from exercise category
function exerciseToMode(exercise) {
  const cat = exercise.category ?? 'strength';
  if (cat === 'cardio')                  return 'endurance';
  if (cat === 'mobility' || cat === 'recovery') return 'mobility';
  return 'power'; // strength, mixed, skill
}

// ─── RECOMPUTE FROM HISTORY ──────────────────────────────────────────────────

async function recomputeFromHistory(userId, env) {
  // Fetch all completed executions + their steps
  const execs = await env.DB.prepare(`
    SELECT id, date, execution_type, total_duration_sec, perceived_exertion, created_at_ms
    FROM executions
    WHERE user_id = ? AND status = 'completed'
    ORDER BY created_at_ms ASC
  `).bind(userId).all();

  if (!execs.results.length) return buildDefaultScores();

  // Fetch all exercise metadata once
  const exerciseMap = new Map();
  const allEx = await env.DB.prepare(
    `SELECT id, category, primary_muscles_json FROM exercises`
  ).all();
  for (const ex of allEx.results) exerciseMap.set(ex.id, ex);

  let scores = buildDefaultScores();
  const now = Date.now();

  for (const exec of execs.results) {
    const eventMs = exec.created_at_ms;

    // Apply decay since last event before this one
    scores = applyAllDecay(scores, eventMs);

    // Compute stimulus from steps
    const steps = await env.DB.prepare(`
      SELECT exercise_id, actual_json FROM execution_steps WHERE execution_id = ?
    `).bind(exec.id).all();

    const stimulus = computeStimulusFromSteps(steps.results, exec, exerciseMap, eventMs);
    scores = applyStimulusToScores(scores, stimulus, eventMs);
  }

  // Final decay to now
  scores = applyAllDecay(scores, now);
  return scores;
}

// ─── STIMULUS COMPUTATION ────────────────────────────────────────────────────
// Also exported (conceptually) — used by execution.js via direct inline copy.

const STIMULUS_PER_SET = {
  strength: 0.8,
  cardio:   0.5, // per minute, not per set
  mobility: 0.6,
  recovery: 0.3,
  mixed:    0.65,
  skill:    0.4,
};

const MAX_STIMULUS_PER_AXIS_PER_SESSION = 6; // prevents a single session from spiking scores

function computeStimulusFromSteps(steps, exec, exerciseMap, _eventMs) {
  const axisAccumulator = {}; // axis → { power: 0, endurance: 0, mobility: 0 }

  const execType = exec.execution_type ?? 'workout';

  // Handle pure cardio execution types with no steps
  if (['run', 'walk', 'bike', 'rowing'].includes(execType) && (!steps || !steps.length)) {
    const durationMin = (exec.total_duration_sec ?? 0) / 60;
    const rawStimulus = Math.min(durationMin * 0.4, MAX_STIMULUS_PER_AXIS_PER_SESSION);
    if (!axisAccumulator.conditioning) axisAccumulator.conditioning = { power: 0, endurance: 0, mobility: 0 };
    axisAccumulator.conditioning.endurance += rawStimulus;
    if (!axisAccumulator.legs) axisAccumulator.legs = { power: 0, endurance: 0, mobility: 0 };
    axisAccumulator.legs.endurance += rawStimulus * 0.4;
  }

  for (const step of (steps ?? [])) {
    if (!step.exercise_id) continue;
    const actual = step.actual_json ? JSON.parse(step.actual_json) : {};
    if (actual.skipped) continue;

    const exercise = exerciseMap.get(step.exercise_id);
    if (!exercise) continue;

    const axis = exerciseToAxis(exercise);
    const mode = exerciseToMode(exercise);
    if (!axisAccumulator[axis]) axisAccumulator[axis] = { power: 0, endurance: 0, mobility: 0 };

    let rawStimulus = 0;

    if (mode === 'endurance') {
      // Cardio: stimulus from duration
      const durationSec = (actual.reps_per_set ?? []).reduce((s, r) => s + r, 0);
      const durationMin = durationSec / 60 || (exec.total_duration_sec ?? 0) / 60;
      rawStimulus = durationMin * 0.4;
      axisAccumulator[axis].endurance += Math.min(rawStimulus, MAX_STIMULUS_PER_AXIS_PER_SESSION);
    } else if (mode === 'mobility') {
      const setsCompleted = actual.sets_completed ?? 0;
      rawStimulus = setsCompleted * STIMULUS_PER_SET.mobility;
      axisAccumulator[axis].mobility += Math.min(rawStimulus, MAX_STIMULUS_PER_AXIS_PER_SESSION);
    } else {
      // Strength: stimulus from sets completed
      const setsCompleted = actual.sets_completed ?? 0;
      rawStimulus = setsCompleted * STIMULUS_PER_SET.strength;
      axisAccumulator[axis].power += Math.min(rawStimulus, MAX_STIMULUS_PER_AXIS_PER_SESSION);
    }
  }

  // Cap per-axis totals
  for (const axis in axisAccumulator) {
    const a = axisAccumulator[axis];
    a.power     = Math.min(a.power,     MAX_STIMULUS_PER_AXIS_PER_SESSION);
    a.endurance = Math.min(a.endurance, MAX_STIMULUS_PER_AXIS_PER_SESSION);
    a.mobility  = Math.min(a.mobility,  MAX_STIMULUS_PER_AXIS_PER_SESSION);
  }

  return axisAccumulator;
}

function applyStimulusToScores(scores, stimulus, eventMs) {
  const updated = JSON.parse(JSON.stringify(scores));

  for (const [axis, gains] of Object.entries(stimulus)) {
    if (axis === 'mobility') {
      const mob = updated.mobility;
      if (gains.mobility > 0) {
        mob.mobility = applyGain(mob.mobility, gains.mobility);
        mob.last_mobility_stimulus_at_ms = eventMs;
      }
      continue;
    }

    const ax = updated[axis];
    if (!ax) continue;

    if (gains.power > 0) {
      ax.power = applyGain(ax.power, gains.power);
      ax.last_power_stimulus_at_ms = eventMs;
    }
    if (gains.endurance > 0) {
      ax.endurance = applyGain(ax.endurance, gains.endurance);
      ax.last_endurance_stimulus_at_ms = eventMs;
    }
    // Strength training also gives a small endurance benefit and vice versa
    if (gains.power > 0 && axis !== 'conditioning') {
      ax.endurance = applyGain(ax.endurance, gains.power * 0.15);
    }
    if (gains.endurance > 0 && axis !== 'conditioning') {
      ax.power = applyGain(ax.power, gains.endurance * 0.1);
    }
  }

  return updated;
}

// ─── GET HANDLER ─────────────────────────────────────────────────────────────

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const nowMs = Date.now();

    // Fetch progression + preferences in parallel
    const [{ scores: rawScores, sportScores, createdAtMs }, prefs] = await Promise.all([
      getOrCreateProgression(user.userId, env),
      env.DB.prepare(
        `SELECT training_goal, preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
      ).bind(user.userId).first(),
    ]);

    // Apply decay
    const scores   = applyAllDecay(rawScores, nowMs);
    const goal     = prefs?.training_goal ?? 'health';
    const parsedPrefs = prefs?.preferences_json ? JSON.parse(prefs.preferences_json) : {};
    const chartMode = parsedPrefs.progression_chart_mode
      ?? GOAL_TARGET_PROFILES[goal]?.chartMode
      ?? 'balanced';

    const profile   = GOAL_TARGET_PROFILES[goal] ?? GOAL_TARGET_PROFILES.health;
    const goalFit   = computeGoalFit(scores, goal, chartMode);
    const insights  = computeInsights(scores, goal, chartMode, nowMs, createdAtMs);
    const plannerExplanation = buildPlannerExplanation(scores, goal, chartMode);

    // Build display scores (axis → number)
    const displayScores = {};
    for (const axis of AXES) displayScores[axis] = getDisplayScore(scores, axis, chartMode);

    // Build per-mode display scores for client-side mode switching
    const displayByMode = {};
    for (const mode of ['power', 'endurance', 'balanced', 'mobility']) {
      displayByMode[mode] = {};
      for (const axis of AXES) displayByMode[mode][axis] = getDisplayScore(scores, axis, mode);
    }

    return Response.json({
      ok: true,
      scores: displayScores,
      scores_by_mode: displayByMode,
      raw_scores: scores,   // full detail with timestamps, for advanced frontend use
      goal,
      chart_mode: chartMode,
      goal_profile: { ...profile, goal },
      goal_fit: goalFit,
      insights,
      planner_explanation: plannerExplanation,
      axes: AXES,
      axis_labels: AXIS_LABELS,
      sport_scores: sportScores,
    });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── POST HANDLER ─────────────────────────────────────────────────────────────

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // ── Admin recompute ──
    if (action === 'recompute') {
      const scores = await recomputeFromHistory(user.userId, env);
      const now = Date.now();
      await env.DB.prepare(`
        UPDATE user_progression
        SET scores_json = ?, last_computed_at_ms = ?, updated_at_ms = ?
        WHERE user_id = ?
      `).bind(JSON.stringify(scores), now, now, user.userId).run();

      // Log recompute event
      await env.DB.prepare(`
        INSERT INTO user_progression_events
          (id, user_id, execution_id, event_type, scores_after_json, created_at_ms)
        VALUES (?, ?, NULL, 'recompute', ?, ?)
      `).bind(crypto.randomUUID(), user.userId, JSON.stringify(scores), now).run();

      return Response.json({ ok: true, recomputed: true });
    }

    // ── Update preferences (sport prefs, chart mode) ──
    const body = await request.json();
    const { sport_prefs, progression_chart_mode } = body;

    const existing = await env.DB.prepare(
      `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
    ).bind(user.userId).first();

    if (!existing) {
      return Response.json({ error: 'Profile not found. Complete onboarding first.' }, { status: 404 });
    }

    const currentPrefs = existing.preferences_json ? JSON.parse(existing.preferences_json) : {};
    const updatedPrefs = { ...currentPrefs };

    if (sport_prefs !== undefined)           updatedPrefs.sport_prefs           = sport_prefs;
    if (progression_chart_mode !== undefined) updatedPrefs.progression_chart_mode = progression_chart_mode;

    await env.DB.prepare(
      `UPDATE user_preferences SET preferences_json = ?, updated_at_ms = ? WHERE user_id = ?`
    ).bind(JSON.stringify(updatedPrefs), Date.now(), user.userId).run();

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

// ─── RE-EXPORTS (used by execution.js and plan.js helpers) ───────────────────
// These are inline-duplicated in those files to avoid cross-module imports
// (Cloudflare Pages Functions don't support relative imports between api/*.js files).
// Keep them in sync if you modify the scoring logic here.

export {
  buildDefaultScores,
  applyGain,
  applyDecay,
  applyAllDecay,
  applyStimulusToScores,
  computeStimulusFromSteps,
  DECAY_CONFIG,
  GOAL_TARGET_PROFILES,
  AXIS_LABELS,
  AXES,
  DEFAULT_BASELINE,
  DEFAULT_SCORE,
  MAX_STIMULUS_PER_AXIS_PER_SESSION,
  MUSCLE_TO_AXIS,
  CATEGORY_FALLBACK_AXIS,
  exerciseToAxis,
  exerciseToMode,
  getDisplayScore,
  STIMULUS_PER_SET,
};
