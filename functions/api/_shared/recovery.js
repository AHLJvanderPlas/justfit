/**
 * Per-muscle recovery — C-F7.
 *
 * The six progression axes in progression.js answer "how strong is this pattern".
 * They cannot answer "is it sensible to train quads today", because push/pull/legs
 * is far coarser than the anatomy the app already draws. This module fills that
 * gap from data the product already stores: execution steps, their exercises, and
 * the muscles those exercises name.
 *
 * Model, deliberately kept the same shape as progression.js applyDecay():
 *   - a completed step deposits LOAD on each region its exercise works
 *   - load sits flat during a grace period, then decays exponentially
 *   - freshness = 100 − min(100, accumulated load)
 *
 * Decay reduces the accumulated load rather than raising freshness directly, so
 * overlapping sessions compose correctly and freshness stays monotonic between
 * stimuli. Introducing a second, differently-shaped decay curve in the same
 * codebase would be a maintenance trap.
 *
 * No new tables: this is derived state, recomputed on read from a 14-day window.
 */

import { MUSCLE_REGIONS, REGION_TIER, musclesFromJson } from './muscles.js';

/** How far back a stimulus can still matter. Beyond this, load has fully decayed. */
export const RECOVERY_WINDOW_DAYS = 14;

/**
 * Grace period then per-day decay rate, by muscle size.
 *
 * Tuned against JustFit's own execution history, NOT copied from Fitbod's
 * seven-day full-recovery window — at our training frequency that curve leaves an
 * active user's map permanently red, which turns a motivating screen into a
 * discouraging one. Large muscles hold fatigue longest; core recovers fastest
 * because it is trained at low relative intensity and high frequency.
 */
const TIER_DECAY = {
  large: { graceMs: 24 * 3_600_000, ratePerDay: 0.42 },
  small: { graceMs: 18 * 3_600_000, ratePerDay: 0.52 },
  core:  { graceMs: 12 * 3_600_000, ratePerDay: 0.62 },
};

/** A primary muscle takes the full deposit; a secondary muscle takes this share. */
const SECONDARY_WEIGHT = 0.4;

/** Load deposited by one fully completed set. 100 = a region taken to zero freshness. */
const LOAD_PER_SET = 11;

/** Cap on what a single exercise can deposit, so a 10-set finisher cannot flatten a region alone. */
const MAX_LOAD_PER_EXERCISE = 55;

/**
 * Cardio deposits on the legs at a low rate. A 45-minute ride loads the quads,
 * but not the way a squat session does, and treating them alike would make the
 * map useless for anyone who also cycles.
 */
const CARDIO_REGIONS = ['quads', 'hamstrings', 'glutes', 'calves'];
const CARDIO_LOAD_PER_MIN = 0.55;
const CARDIO_TYPES = ['run', 'walk', 'bike', 'rowing'];

function decayLoad(load, elapsedMs, tier) {
  const cfg = TIER_DECAY[tier] ?? TIER_DECAY.small;
  if (elapsedMs <= cfg.graceMs) return load;
  const days = (elapsedMs - cfg.graceMs) / 86_400_000;
  return load * Math.pow(1 - cfg.ratePerDay, days);
}

/**
 * Volume proxy for one completed step. Strength work scales on sets; timed work
 * (holds, intervals) scales on total seconds so a 3-minute plank is not counted
 * as "1 set" of the same weight as a 3-rep squat.
 */
function stepVolume(actual, prescribed) {
  const sets = actual?.sets_completed ?? 0;
  if (sets <= 0) return 0;
  const reps = actual?.reps_per_set ?? [];
  const isTimed = !prescribed?.reps && !!prescribed?.duration_sec;
  if (isTimed) {
    const totalSec = reps.reduce((s, r) => s + (Number(r) || 0), 0);
    return totalSec > 0 ? totalSec / 45 : sets;
  }
  return sets;
}

/**
 * Compute freshness per region.
 *
 * @param {Array} rows  execution steps joined to their exercise, newest first:
 *   { ended_at_ms, execution_type, total_duration_sec,
 *     primary_muscles_json, secondary_muscles_json, actual_json, prescribed_json }
 * @param {number} nowMs
 * @returns {{ freshness: Object, lastLoadedAtMs: Object }}
 */
export function computeRecovery(rows, nowMs = Date.now()) {
  const load = {};
  const lastLoadedAtMs = {};
  for (const r of MUSCLE_REGIONS) { load[r] = 0; lastLoadedAtMs[r] = null; }

  const cardioSeen = new Set();

  for (const row of rows ?? []) {
    const atMs = row.ended_at_ms ?? row.created_at_ms;
    if (!atMs) continue;
    const elapsedMs = nowMs - atMs;
    if (elapsedMs < 0 || elapsedMs > RECOVERY_WINDOW_DAYS * 86_400_000) continue;

    // ── Pure cardio sessions carry no steps; load the legs from duration ──────
    if (!row.exercise_id && CARDIO_TYPES.includes(row.execution_type)) {
      if (cardioSeen.has(row.execution_id)) continue;
      cardioSeen.add(row.execution_id);
      const minutes = (row.total_duration_sec ?? 0) / 60;
      if (minutes <= 0) continue;
      const raw = Math.min(minutes * CARDIO_LOAD_PER_MIN, MAX_LOAD_PER_EXERCISE);
      for (const region of CARDIO_REGIONS) {
        load[region] += decayLoad(raw, elapsedMs, REGION_TIER[region]);
        if (!lastLoadedAtMs[region] || atMs > lastLoadedAtMs[region]) lastLoadedAtMs[region] = atMs;
      }
      continue;
    }

    let actual = {}, prescribed = {};
    try { actual = row.actual_json ? JSON.parse(row.actual_json) : {}; } catch { /* default */ }
    try { prescribed = row.prescribed_json ? JSON.parse(row.prescribed_json) : {}; } catch { /* default */ }
    if (actual.skipped) continue;

    const volume = stepVolume(actual, prescribed);
    if (volume <= 0) continue;

    const primary   = musclesFromJson(row.primary_muscles_json);
    const secondary = musclesFromJson(row.secondary_muscles_json);
    if (primary.size === 0 && secondary.size === 0) continue;

    const raw = Math.min(volume * LOAD_PER_SET, MAX_LOAD_PER_EXERCISE);

    for (const region of primary) {
      if (!(region in load)) continue;
      load[region] += decayLoad(raw, elapsedMs, REGION_TIER[region]);
      if (!lastLoadedAtMs[region] || atMs > lastLoadedAtMs[region]) lastLoadedAtMs[region] = atMs;
    }
    for (const region of secondary) {
      if (!(region in load) || primary.has(region)) continue;
      load[region] += decayLoad(raw * SECONDARY_WEIGHT, elapsedMs, REGION_TIER[region]);
      if (!lastLoadedAtMs[region] || atMs > lastLoadedAtMs[region]) lastLoadedAtMs[region] = atMs;
    }
  }

  const freshness = {};
  for (const region of MUSCLE_REGIONS) {
    freshness[region] = Math.round(100 - Math.min(100, load[region]));
  }
  return { freshness, lastLoadedAtMs };
}

/** Regions below this are treated as fatigued by the planner and the UI. */
export const FATIGUE_THRESHOLD = 40;

/** Rank regions for display: most fatigued first, freshest last. */
export function summariseRecovery(freshness, count = 3) {
  const sorted = MUSCLE_REGIONS
    .map((r) => ({ region: r, freshness: freshness[r] ?? 100 }))
    .sort((a, b) => a.freshness - b.freshness);
  return {
    mostFatigued: sorted.slice(0, count).filter((x) => x.freshness < 100),
    freshest: sorted.slice(-count).reverse(),
  };
}

/**
 * SQL for the recovery window. Steps LEFT JOIN exercises so a step whose exercise
 * was deleted still counts as nothing rather than breaking the query; pure cardio
 * executions are UNIONed in because they have no steps at all.
 */
export const RECOVERY_QUERY = `
  SELECT e.id AS execution_id, e.execution_type, e.total_duration_sec,
         COALESCE(e.ended_at_ms, e.created_at_ms) AS ended_at_ms,
         es.exercise_id, es.actual_json, es.prescribed_json,
         ex.primary_muscles_json, ex.secondary_muscles_json
    FROM executions e
    LEFT JOIN execution_steps es ON es.execution_id = e.id
    LEFT JOIN exercises ex ON ex.id = es.exercise_id
   WHERE e.user_id = ?
     AND e.status = 'completed'
     AND COALESCE(e.ended_at_ms, e.created_at_ms) >= ?
`;
