/**
 * /api/assessment
 *
 * GET  — assessment status: presets, the battery, last + previous results,
 *        whether one is due, and whether one is currently blocked on safety.
 * POST — submit results: score them, persist, and fold the scores into
 *        user_progression as a personal baseline.
 *
 * Free for every account (Principle 1): "where am I" is the most basic question
 * the product answers. The defensible paid line is trend history, not access.
 *
 * See docs/FITNESS_ASSESSMENT_DESIGN.md.
 */

import { getUser } from './_shared/auth.js';
import {
  PRESETS, TESTS, presetList, scoreSubmission, applyToProgression,
  assessmentBlock, buildInsights, defaultPushVariant, PUSH_VARIANTS, buildDefaultScores,
  DEFAULT_INTERVAL_WEEKS, MEASURED_AXES, UNMEASURED_AXES,
} from './_shared/assessment.js';

function json(body, status = 200) {
  return Response.json(body, { status });
}

const DAY_MS = 86_400_000;

/** Today's date in the user's local terms — the client sends it; fall back to UTC. */
function todayDate(request) {
  const d = new URL(request.url).searchParams.get('date');
  return /^\d{4}-\d{2}-\d{2}$/.test(d ?? '') ? d : new Date().toISOString().slice(0, 10);
}

/** Safety inputs: body mode and today's wellbeing check-in. */
async function loadGateInputs(env, userId, date) {
  const [cycle, checkin] = await Promise.all([
    env.DB.prepare('SELECT mode FROM cycle_profile WHERE user_id = ?').bind(userId).first()
      .catch(() => null),
    env.DB.prepare('SELECT checkin_json, sleep_hours FROM daily_checkins WHERE user_id = ? AND date = ?')
      .bind(userId, date).first().catch(() => null),
  ]);
  return { cycle, checkin };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  const date = todayDate(request);

  const [rows, prefsRow, gate] = await Promise.all([
    env.DB.prepare(`
      SELECT id, date, focus, results_json, scores_json, created_at_ms
        FROM fitness_assessments
       WHERE user_id = ?
       ORDER BY created_at_ms DESC
       LIMIT 20
    `).bind(user.userId).all().catch(() => ({ results: [] })),
    env.DB.prepare('SELECT preferences_json FROM user_preferences WHERE user_id = ?')
      .bind(user.userId).first().catch(() => null),
    loadGateInputs(env, user.userId, date),
  ]);

  const parse = (row) => row && ({
    id: row.id,
    date: row.date,
    focus: row.focus,
    created_at_ms: row.created_at_ms,
    scores: JSON.parse(row.scores_json ?? '{}'),
    results: JSON.parse(row.results_json ?? '[]'),
  });

  const all = (rows.results ?? []).map(parse);
  const last = all[0] ?? null;
  const previous = all[1] ?? null;

  let experience = 'beginner';
  let intervalWeeks = DEFAULT_INTERVAL_WEEKS;
  try {
    const prefs = JSON.parse(prefsRow?.preferences_json ?? '{}');
    experience = prefs.experience_level ?? 'beginner';
    intervalWeeks = prefs.assessment_interval_weeks ?? DEFAULT_INTERVAL_WEEKS;
  } catch { /* defaults are fine */ }

  const daysSince = last
    ? Math.floor((Date.now() - last.created_at_ms) / DAY_MS)
    : null;

  return json({
    available: true,
    presets: presetList(),
    battery: Object.fromEntries(Object.entries(TESTS).map(([id, t]) => [id, {
      id, axis: t.axis, name: t.name, slug: t.slug, metric: t.metric, mode: t.mode,
      timeCapSec: t.timeCapSec, repCap: t.repCap ?? null,
      fixedDuration: Boolean(t.fixedDuration), hasVariant: Boolean(t.hasVariant),
      instruction: t.instruction,
    }])),
    push_variants: Object.entries(PUSH_VARIANTS).map(([slug, v]) => ({ slug, label: v.label })),
    push_variant_default: defaultPushVariant(experience),
    measured_axes: MEASURED_AXES,
    unmeasured_axes: UNMEASURED_AXES,
    last,
    previous,
    history: all,
    days_since: daysSince,
    interval_weeks: intervalWeeks,
    due: daysSince == null || daysSince >= intervalWeeks * 7,
    blocked: assessmentBlock(gate.cycle, gate.checkin),
  });
}

// ── POST ──────────────────────────────────────────────────────────────────────

export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const focus = body?.focus;
  if (!PRESETS[focus]) return json({ error: 'Unknown focus' }, 400);

  const date = /^\d{4}-\d{2}-\d{2}$/.test(body?.date ?? '')
    ? body.date
    : new Date().toISOString().slice(0, 10);

  // Re-check the safety gate server-side. The client hides the entry point, but a
  // refusal must not depend on the client honouring it.
  const gate = await loadGateInputs(env, user.userId, date);
  const blocked = assessmentBlock(gate.cycle, gate.checkin);
  if (blocked) return json({ error: blocked.message, blocked }, 409);

  const { results, scores, errors } = scoreSubmission(focus, body?.results);
  if (errors.length) return json({ error: errors[0], errors }, 400);
  if (!results.length) return json({ error: 'No valid results submitted' }, 400);

  const nowMs = Date.now();
  const id = crypto.randomUUID();

  // Previous assessment, for deltas — read before inserting this one.
  const prevRow = await env.DB.prepare(`
    SELECT scores_json FROM fitness_assessments
     WHERE user_id = ? ORDER BY created_at_ms DESC LIMIT 1
  `).bind(user.userId).first().catch(() => null);
  let previousScores = null;
  try { previousScores = prevRow ? JSON.parse(prevRow.scores_json) : null; } catch { /* ignore */ }

  // ── Fold into progression ───────────────────────────────────────────────────
  const progRow = await env.DB.prepare(
    'SELECT scores_json FROM user_progression WHERE user_id = ?'
  ).bind(user.userId).first().catch(() => null);

  let progScores = null;
  try { progScores = progRow ? JSON.parse(progRow.scores_json) : null; } catch { /* ignore */ }

  // Cold start: a user who has completed no sessions has no progression row, and
  // that is exactly who benefits most from measuring. Create the row from defaults
  // rather than discarding the baselines we just computed.
  const isColdStart = !progRow;
  if (isColdStart) progScores = buildDefaultScores();

  const statements = [
    env.DB.prepare(`
      INSERT INTO fitness_assessments
        (id, user_id, date, focus, results_json, scores_json, created_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.userId, date, focus,
            JSON.stringify(results), JSON.stringify(scores), nowMs),
  ];

  if (progScores) {
    const updated = applyToProgression(progScores, results, nowMs);
    statements.push(
      isColdStart
        ? env.DB.prepare(`
            INSERT INTO user_progression
              (user_id, scores_json, last_computed_at_ms, created_at_ms, updated_at_ms)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              scores_json = excluded.scores_json,
              last_computed_at_ms = excluded.last_computed_at_ms,
              updated_at_ms = excluded.updated_at_ms
          `).bind(user.userId, JSON.stringify(updated), nowMs, nowMs, nowMs)
        : env.DB.prepare(`
            UPDATE user_progression
               SET scores_json = ?, last_computed_at_ms = ?, updated_at_ms = ?
             WHERE user_id = ?
          `).bind(JSON.stringify(updated), nowMs, nowMs, user.userId),
      env.DB.prepare(`
        INSERT INTO user_progression_events
          (id, user_id, execution_id, event_type, scores_before_json, scores_after_json, created_at_ms)
        VALUES (?, ?, NULL, 'assessment', ?, ?, ?)
      `).bind(crypto.randomUUID(), user.userId,
              JSON.stringify(progScores), JSON.stringify(updated), nowMs),
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (e) {
    console.error('assessment POST:', e);
    return json({ error: 'Internal error' }, 500);
  }

  return json({
    ok: true,
    id,
    date,
    focus,
    scores,
    results,
    insights: buildInsights(results, previousScores),
    progression_updated: Boolean(progScores),
  });
}

export async function onRequest(context) {
  const m = context.request.method.toUpperCase();
  if (m === 'GET')  return onRequestGet(context);
  if (m === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed' }, 405);
}
