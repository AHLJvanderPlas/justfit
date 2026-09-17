/**
 * GET /api/records — personal records, C-F8.
 *
 * The Trophy room tracks *behaviour*: streaks, perfect weeks, comebacks. Nothing
 * tracked performance, because until C-F6 there was no load to track. This adds the
 * second kind, kept deliberately separate: a heavy week must never make a
 * consistency streak feel devalued, and the two are not comparable.
 *
 * Estimated 1RM uses Epley — w × (1 + reps/30) — which is the standard and is
 * honest within roughly 10 reps. Above that the formula overstates badly, so sets
 * beyond EPLEY_MAX_REPS are ignored rather than silently producing a fantasy number.
 */

import { getAuthUserId } from './_shared/auth.js';

const EPLEY_MAX_REPS = 12;
const LOOKBACK_DAYS = 365;

/** Epley estimated one-rep max. Returns null where the estimate is not defensible. */
export function estimate1RM(weightKg, reps) {
  const w = Number(weightKg), r = Number(reps);
  if (!(w > 0) || !(r > 0) || r > EPLEY_MAX_REPS) return null;
  if (r === 1) return w;
  return Math.round(w * (1 + r / 30) * 10) / 10;
}

export async function onRequestGet({ request, env }) {
  try {
    const userId = await getAuthUserId(request, env);
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const since = Date.now() - LOOKBACK_DAYS * 86_400_000;
    const { results } = await env.DB.prepare(`
      SELECT es.exercise_id, es.actual_json, ex.name AS exercise_name, ex.slug,
             e.date, COALESCE(e.ended_at_ms, e.created_at_ms) AS at_ms
        FROM execution_steps es
        JOIN executions e ON e.id = es.execution_id
        LEFT JOIN exercises ex ON ex.id = es.exercise_id
       WHERE e.user_id = ? AND e.status = 'completed'
         AND COALESCE(e.ended_at_ms, e.created_at_ms) >= ?
         AND es.actual_json LIKE '%weight_kg%'
       ORDER BY at_ms ASC
    `).bind(userId, since).all();

    // exercise_id → best estimated 1RM, plus the set that produced it.
    const best = new Map();
    // exercise_id → chronological series, for the per-exercise strength curve.
    const series = new Map();

    for (const row of results ?? []) {
      let a;
      try { a = JSON.parse(row.actual_json); } catch { continue; }
      if (a?.skipped) continue;
      const weights = a?.weight_kg ?? [];
      const reps = a?.reps_per_set ?? [];
      if (!weights.length) continue;

      let sessionBest = null;
      for (let i = 0; i < weights.length; i++) {
        // Warm-up sets are logged but are not attempts at anything.
        if (a.warmup_flags?.[i]) continue;
        const e1rm = estimate1RM(weights[i], reps[i]);
        if (e1rm == null) continue;
        if (!sessionBest || e1rm > sessionBest.e1rm) {
          sessionBest = { e1rm, weight_kg: Number(weights[i]), reps: Number(reps[i]) };
        }
      }
      if (!sessionBest) continue;

      const key = row.exercise_id;
      if (!series.has(key)) series.set(key, []);
      series.get(key).push({ date: row.date, e1rm: sessionBest.e1rm });

      const prev = best.get(key);
      if (!prev || sessionBest.e1rm > prev.e1rm) {
        best.set(key, {
          exercise_id: key,
          name: row.exercise_name ?? row.slug ?? 'Onbekende oefening',
          slug: row.slug ?? null,
          e1rm: sessionBest.e1rm,
          weight_kg: sessionBest.weight_kg,
          reps: sessionBest.reps,
          date: row.date,
          // Only a record if something preceded it — a first attempt is a baseline.
          improved_from: prev ? prev.e1rm : null,
        });
      }
    }

    const records = [...best.values()].sort((a, b) => b.e1rm - a.e1rm);

    return Response.json({
      ok: true,
      records,
      series: Object.fromEntries(
        [...series.entries()]
          .filter(([, pts]) => pts.length >= 2)   // one point is not a curve
          .map(([k, pts]) => [k, pts])
      ),
      lookback_days: LOOKBACK_DAYS,
    });
  } catch (e) {
    console.error('records:', e.message);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequest(context) {
  if (context.request.method === 'GET') return onRequestGet(context);
  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
