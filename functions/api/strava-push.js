/**
 * /api/strava-push
 *
 * POST — upload one completed JustFit session to Strava as an activity.
 *
 * Uses the JSON upload format Strava introduced on 2026-05-21, which carries
 * structured per-set data (exercise_type, repetitions, weight, duration) for
 * WeightTraining / HighIntensityIntervalTraining / Workout / Crossfit. That is
 * a far better fit than a manual activity: the sets land as real set data on
 * the athlete's Strava activity rather than as prose.
 *
 * On the muscle map: Strava has no public media-upload endpoint — attaching
 * photos is limited to partner apps — so the map is rendered as a text bar
 * chart in the activity description instead of posted as an image.
 *
 * Writing to Strava is unrelated to the §6.2 seven-day cache rule: this sends
 * JustFit's own training data out, it does not pull Strava Data in.
 *
 * Requires: a connection whose granted scopes include activity:write, and
 * push_enabled = 1 (a separate, explicit opt-in — §7.2).
 */

import { getAuthUserId } from './_shared/auth.js';
import {
  isConfigured, getConnection, getValidAccessToken, hasScope,
  stravaFetch, apiBase, StravaError, SCOPE_WRITE,
} from './_shared/strava.js';
import {
  exerciseTypeFor, isUploadableCategory, rankMuscles,
} from './_shared/strava-exercises.js';

const UPLOAD_POLL_ATTEMPTS = 6;
const UPLOAD_POLL_DELAY_MS = 1200;

// JSON uploads are accepted only for these sport types.
const JSON_SPORT_TYPES = new Set([
  'WeightTraining', 'HighIntensityIntervalTraining', 'Workout', 'Crossfit',
]);

function json(body, status = 200) {
  return Response.json(body, { status });
}

function parseJson(raw, fallback = {}) {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}

// ── Session → Strava payload ──────────────────────────────────────────────────

/**
 * Decide the Strava sport type from the mix of work in the session.
 * A session that is mostly cardio reads better as HIIT than as WeightTraining.
 */
function sportTypeFor(steps) {
  let strength = 0, cardio = 0;
  for (const s of steps) {
    const cat = s.exercise?.category;
    if (cat === 'strength' || cat === 'mixed' || cat === 'skill') strength++;
    else if (cat === 'cardio') cardio++;
  }
  if (strength === 0 && cardio === 0) return 'Workout';
  if (cardio > strength) return 'HighIntensityIntervalTraining';
  return 'WeightTraining';
}

/**
 * Build the `sets` array. Time-based exercises carry `duration`; rep-based
 * carry `repetitions`. Strava requires at least one set.
 */
function buildSets(steps, startMs) {
  const sets = [];
  let cursorMs = startMs;

  for (const step of steps) {
    const actual = parseJson(step.actual_json);
    if (actual.skipped) continue;

    const exercise = step.exercise;
    if (!exercise || !isUploadableCategory(exercise.category)) continue;

    const prescribed = parseJson(step.prescribed_json);
    const isTimeBased = !prescribed.reps && !!prescribed.duration_sec;
    const exerciseType = exerciseTypeFor(exercise);

    // reps_per_set holds seconds for time-based work and reps otherwise.
    const perSet = Array.isArray(actual.reps_per_set) ? actual.reps_per_set : [];
    const completed = actual.sets_completed ?? perSet.length;
    if (!completed) continue;

    for (let i = 0; i < completed; i++) {
      const value = perSet[i] ?? (isTimeBased ? prescribed.duration_sec : prescribed.reps) ?? null;
      const set = {
        exercise_type: exerciseType,
        start_time: new Date(cursorMs).toISOString(),
      };

      if (isTimeBased) {
        const dur = Number(value) || Number(prescribed.duration_sec) || 30;
        set.duration = Math.round(dur);
        cursorMs += (dur + (prescribed.rest_sec ?? 0)) * 1000;
      } else {
        const reps = Number(value);
        if (Number.isFinite(reps) && reps > 0) set.repetitions = Math.round(reps);
        // Weight is optional and JustFit does not record load today; omitted
        // rather than sent as a misleading zero.
        const est = (Number.isFinite(reps) ? reps : 10) * 3;
        cursorMs += (est + (prescribed.rest_sec ?? 0)) * 1000;
      }

      sets.push(set);
    }
  }

  return sets;
}

/**
 * The muscle map, as text. Renders the same emphasis the in-app SVG shows.
 */
function buildDescription(execution, steps, sets) {
  const lines = [];

  const entries = steps
    .filter((s) => s.exercise && !parseJson(s.actual_json).skipped)
    .map((s) => ({
      muscles: [
        ...parseJson(s.exercise.primary_muscles_json, []),
        ...parseJson(s.exercise.secondary_muscles_json, []),
      ],
      sets: parseJson(s.actual_json).sets_completed ?? 1,
    }));

  const ranked = rankMuscles(entries);
  if (ranked.length) {
    const top = ranked[0].score || 1;
    lines.push('Muscles worked');
    for (const { label, score } of ranked) {
      const filled = Math.max(1, Math.round((score / top) * 10));
      lines.push(`  ${label.padEnd(12)} ${'█'.repeat(filled)}${'·'.repeat(10 - filled)}`);
    }
    lines.push('');
  }

  const totalReps = sets.reduce((n, s) => n + (s.repetitions ?? 0), 0);
  const holdSec   = sets.reduce((n, s) => n + (s.duration ?? 0), 0);

  const stats = [`${sets.length} sets`];
  if (totalReps) stats.push(`${totalReps} reps`);
  if (holdSec)   stats.push(`${Math.round(holdSec / 60)} min holds`);
  if (execution.total_duration_sec) stats.push(`${Math.round(execution.total_duration_sec / 60)} min`);
  lines.push(stats.join(' · '));

  if (execution.perceived_exertion) lines.push(`RPE ${execution.perceived_exertion}/10`);

  const named = steps
    .filter((s) => s.exercise && !parseJson(s.actual_json).skipped)
    .map((s) => s.exercise.name);
  if (named.length) {
    lines.push('');
    lines.push(named.join(' · '));
  }

  lines.push('');
  lines.push('Logged with JustFit');

  return lines.join('\n');
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  const userId = await getAuthUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);
  if (!isConfigured(env)) return json({ error: 'Strava not configured' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  const executionId = body?.execution_id;
  if (!executionId) return json({ error: 'Missing execution_id' }, 400);

  const conn = await getConnection(env, userId);
  if (!conn) return json({ error: 'Strava not connected' }, 404);
  if (!conn.push_enabled) return json({ error: 'Strava upload is switched off' }, 409);
  if (!hasScope(conn, SCOPE_WRITE)) {
    return json({
      error: 'JustFit is not authorised to write to Strava. Reconnect and allow uploads.',
      needsReauth: true,
    }, 403);
  }

  // Load the session. Scoped to the caller — a session is only ever uploaded
  // to its own athlete's Strava account.
  const execution = await env.DB.prepare(`
    SELECT id, date, execution_type, status, total_duration_sec, perceived_exertion,
           notes, created_at_ms, strava_activity_id, strava_upload_activity_id
      FROM executions
     WHERE id = ? AND user_id = ?
  `).bind(executionId, userId).first();

  if (!execution) return json({ error: 'Session not found' }, 404);
  if (execution.strava_upload_activity_id) {
    return json({ ok: true, already_uploaded: true, activity_id: execution.strava_upload_activity_id });
  }
  // An activity imported *from* Strava must never be pushed back to Strava.
  if (execution.strava_activity_id || String(execution.execution_type).startsWith('strava_')) {
    return json({ error: 'This session came from Strava — it will not be uploaded back.' }, 409);
  }

  const stepRows = await env.DB.prepare(`
    SELECT es.step_index, es.prescribed_json, es.actual_json,
           e.slug, e.name, e.category, e.primary_muscles_json, e.secondary_muscles_json
      FROM execution_steps es
      LEFT JOIN exercises e ON e.id = es.exercise_id
     WHERE es.execution_id = ?
     ORDER BY es.step_index ASC
  `).bind(executionId).all();

  const steps = (stepRows.results ?? []).map((r) => ({
    prescribed_json: r.prescribed_json,
    actual_json: r.actual_json,
    exercise: r.slug ? {
      slug: r.slug, name: r.name, category: r.category,
      primary_muscles_json: r.primary_muscles_json,
      secondary_muscles_json: r.secondary_muscles_json,
    } : null,
  }));

  const startMs = execution.created_at_ms
    ?? new Date(`${execution.date}T12:00:00Z`).getTime();

  const sets = buildSets(steps, startMs);
  if (!sets.length) {
    return json({ error: 'Nothing to upload — this session has no completed sets.' }, 422);
  }

  const sportType = sportTypeFor(steps);
  if (!JSON_SPORT_TYPES.has(sportType)) {
    return json({ error: `Strava does not accept JSON uploads for ${sportType}` }, 422);
  }

  const elapsed = execution.total_duration_sec
    || Math.max(60, Math.round((sets.length * 45)));

  const payload = {
    version: '1.0',
    start_time: new Date(startMs).toISOString(),
    utc_offset: 0,
    elapsed_time: elapsed,
    active_time: Math.min(elapsed, Math.round(elapsed * 0.85)),
    creator: { name: 'JustFit' },
    sets,
  };

  const description = buildDescription(execution, steps, sets);
  const name = body.name?.trim() || defaultName(execution, sportType);

  // ── Upload ──────────────────────────────────────────────────────────────────
  let accessToken;
  try {
    accessToken = await getValidAccessToken(conn, env);
  } catch (e) {
    return json({
      error: 'Strava authorisation expired — reconnect Strava.',
      needsReauth: e instanceof StravaError ? e.reauth : true,
    }, 409);
  }

  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(payload)], { type: 'application/json' }),
    `justfit-${execution.id}.json`);
  form.append('data_type', 'json');
  form.append('sport_type', sportType);
  form.append('name', name);
  form.append('description', description);
  form.append('trainer', '1');
  form.append('external_id', `justfit-${execution.id}`);

  let upload;
  try {
    const resp = await stravaFetch('/uploads', accessToken, env, { method: 'POST', body: form });
    upload = await resp.json();
  } catch (e) {
    if (e instanceof StravaError && e.rateLimited) {
      return json({ error: 'Strava rate limit reached — try again in 15 minutes.', rateLimited: true }, 429);
    }
    console.error('strava-push upload:', e.message);
    return json({ error: 'Strava rejected the upload.', detail: e.message?.slice(0, 200) }, 409);
  }

  if (upload.error) {
    return json({ error: `Strava rejected the upload: ${upload.error}` }, 422);
  }

  // ── Poll for the created activity ───────────────────────────────────────────
  let activityId = upload.activity_id ?? null;
  const uploadId = upload.id_str ?? upload.id;

  for (let i = 0; !activityId && uploadId && i < UPLOAD_POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, UPLOAD_POLL_DELAY_MS));
    try {
      const resp = await stravaFetch(`/uploads/${uploadId}`, accessToken, env);
      const status = await resp.json();
      if (status.error) {
        return json({ error: `Strava could not process the upload: ${status.error}` }, 422);
      }
      if (status.activity_id) { activityId = status.activity_id; break; }
    } catch (e) {
      console.error('strava-push poll:', e.message);
      break;
    }
  }

  const nowMs = Date.now();
  await env.DB.batch([
    env.DB.prepare(`
      UPDATE executions
         SET strava_upload_activity_id = ?, strava_upload_at_ms = ?, updated_at_ms = ?
       WHERE id = ? AND user_id = ?
    `).bind(activityId, nowMs, nowMs, executionId, userId),
    env.DB.prepare(`
      UPDATE strava_connections SET last_push_at_ms = ?, updated_at_ms = ? WHERE user_id = ?
    `).bind(nowMs, nowMs, userId),
  ]);

  return json({
    ok: true,
    activity_id: activityId,
    // Null while Strava is still processing — the upload succeeded either way.
    activity_url: activityId ? `https://www.strava.com/activities/${activityId}` : null,
    pending: !activityId,
    sets: sets.length,
    sport_type: sportType,
  });
}

function defaultName(execution, sportType) {
  const label = sportType === 'HighIntensityIntervalTraining' ? 'Conditioning' : 'Strength';
  const d = new Date(`${execution.date}T12:00:00Z`);
  const hour = new Date(execution.created_at_ms ?? d.getTime()).getUTCHours();
  const part = hour < 11 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${part} ${label} · JustFit`;
}

export async function onRequest(context) {
  const { request } = context;
  if (request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed' }, 405);
}
