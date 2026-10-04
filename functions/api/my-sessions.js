// GET/POST/DELETE /api/my-sessions — W4.3 "Mijn trainingen".
//
// A user's own saved trainings. This endpoint STORES what the user built; it
// never installs anything. Using a template is POST /api/plan with custom_steps
// (apiClient.useMySession), so the library check, clamping, the advisory safety
// pass, the blocking-note acknowledgement and overwrite protection all run at
// use time, against the athlete's state on that day.
//
//   GET                         → { ok, templates: [{ id, name, steps, est_minutes, created_at_ms, updated_at_ms }] }
//                                 last saved first, at most 50
//   POST { id?, name, steps[] } → { ok, template }   create, or update when id is the user's own (404 otherwise)
//   DELETE ?id=                 → 204, or 404 when it is not the user's
//
// All three answer 401 without a session.

import { getUser } from './_shared/auth.js';
// The same shape check and limits POST /api/plan applies to custom_steps, so a
// template that saves here is a template that installs there.
import { customStepsShapeError, CUSTOM_STEP_LIMITS } from './plan.js';

export const MAX_TEMPLATES = 30;
export const MAX_LIST = 50;
export const NAME_MAX = 60;

const json = (body, status = 200) => Response.json(body, { status });
const unauthorized = () => json({ error: 'Unauthorized' }, 401);

function clampInt(v, [lo, hi]) {
  if (v == null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

// Port of estimateMins (packages/client-app/src/planUtils.js) for a main
// session, so the list shows the number the builder and Today card show.
export function estimateMinutes(steps) {
  if (!steps.length) return 20;
  const totalSec = steps.reduce((s, step, i) => {
    const sets = step.sets ?? 3;
    const isLast = i === steps.length - 1;
    const active = step.target_duration_sec
      ? step.target_duration_sec * sets
      : (step.target_reps ?? 10) * sets * 4;
    const restPeriods = isLast ? Math.max(0, sets - 1) : sets;
    return s + active + (step.rest_sec ?? 45) * restPeriods;
  }, 0);
  const rawMin = Math.max(1, Math.ceil(totalSec / 60));
  return rawMin > 20 ? Math.ceil(rawMin / 5) * 5 : rawMin;
}

function cleanName(raw) {
  if (typeof raw !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const name = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return name.length >= 1 && name.length <= NAME_MAX ? name : null;
}

// Mirrors assembleCustomSession's clamps and its reps-OR-duration rule, so the
// stored template is exactly what the user will get. rest_sec is kept only when
// the user set it; POST /api/plan fills an absent rest from getDefaultRest.
function normaliseStep(raw, ex) {
  const L = CUSTOM_STEP_LIMITS;
  let m = {};
  try { m = JSON.parse(ex.metrics_json || '{}') ?? {}; } catch { /* unknown metrics */ }
  const supportsReps = (m.supports ?? []).includes('reps');
  let reps = clampInt(raw.target_reps, L.target_reps);
  let dur = clampInt(raw.target_duration_sec, L.target_duration_sec);
  if (reps != null && dur != null) { if (supportsReps) dur = null; else reps = null; }
  if (reps == null && dur == null) {
    if (supportsReps) reps = 10;
    else dur = clampInt(m.base_duration_sec ?? 30, L.target_duration_sec);
  }
  const step = { exercise_id: ex.id, sets: clampInt(raw.sets, L.sets) ?? clampInt(m.fixed_sets ?? 3, L.sets) };
  if (reps != null) step.target_reps = reps; else step.target_duration_sec = dur;
  const rest = clampInt(raw.rest_sec, L.rest_sec);
  if (rest != null) step.rest_sec = rest;
  return step;
}

function shape(row) {
  let steps = [];
  try { steps = JSON.parse(row.steps_json); } catch { /* malformed row — show it empty */ }
  return {
    id: row.id, name: row.name, steps: Array.isArray(steps) ? steps : [],
    est_minutes: row.est_minutes, created_at_ms: row.created_at_ms, updated_at_ms: row.updated_at_ms,
  };
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return unauthorized();
    const rows = await env.DB.prepare(
      `SELECT id, name, steps_json, est_minutes, created_at_ms, updated_at_ms
         FROM user_session_templates WHERE user_id = ?
        ORDER BY updated_at_ms DESC, created_at_ms DESC LIMIT ${MAX_LIST}`
    ).bind(user.userId).all();
    return json({ ok: true, templates: (rows.results ?? []).map(shape) });
  } catch (e) {
    console.error('GET /api/my-sessions', e);
    return json({ error: 'Internal error' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return unauthorized();
    let body;
    try { body = await request.json(); } catch { return json({ ok: false, error: 'invalid_json' }, 400); }
    if (!body || typeof body !== 'object') return json({ ok: false, error: 'invalid_json' }, 400);

    const name = cleanName(body.name);
    if (!name) return json({ ok: false, error: 'invalid_name', detail: `name must be 1–${NAME_MAX} characters` }, 400);
    const shapeErr = customStepsShapeError(body.steps);
    if (shapeErr) return json({ ok: false, error: 'invalid_steps', detail: shapeErr.replace(/^custom_steps/, 'steps') }, 400);
    const id = body.id == null || body.id === '' ? null : String(body.id);

    // The same library POST /api/plan installs from: active rows only.
    const ids = [...new Set(body.steps.map(st => String(st.exercise_id)))];
    const found = await env.DB.prepare(
      `SELECT id, metrics_json FROM exercises WHERE is_active = 1 AND gym_id IS NULL AND id IN (${ids.map(() => '?').join(',')})`
      // gym_id IS NULL: same scope as the planner's base query. A template is
      // installed through custom_steps, which validates against the planner's
      // gym-filtered pool, so a gym-private id would be rejected at install —
      // but it must not be SAVED either. (v1: gym-private rows cannot be
      // templated by members; the scoped install path is the only way to them.)
    ).bind(...ids).all();
    const byId = new Map((found.results ?? []).map(r => [String(r.id), r]));
    const unknown = ids.filter(x => !byId.has(x));
    if (unknown.length) return json({ ok: false, error: 'unknown_exercise', unknown_exercise_ids: unknown }, 400);

    const steps = body.steps.map(st => normaliseStep(st, byId.get(String(st.exercise_id))));
    const est = estimateMinutes(steps);
    const stepsJson = JSON.stringify(steps);
    const now = Date.now();

    if (id) {
      // user_id is in the WHERE: another user's id is indistinguishable from a missing one.
      const r = await env.DB.prepare(
        `UPDATE user_session_templates SET name = ?, steps_json = ?, est_minutes = ?, updated_at_ms = ?
          WHERE id = ? AND user_id = ?`
      ).bind(name, stepsJson, est, now, id, user.userId).run();
      if (!r.meta?.changes) return json({ ok: false, error: 'not_found' }, 404);
      const row = await env.DB.prepare(
        `SELECT id, name, steps_json, est_minutes, created_at_ms, updated_at_ms
           FROM user_session_templates WHERE id = ? AND user_id = ?`
      ).bind(id, user.userId).first();
      return json({ ok: true, template: shape(row) });
    }

    // The cap is part of the INSERT, so two concurrent saves cannot both slip under it.
    const newId = crypto.randomUUID();
    const r = await env.DB.prepare(
      `INSERT INTO user_session_templates (id, user_id, name, steps_json, est_minutes, created_at_ms, updated_at_ms)
       SELECT ?, ?, ?, ?, ?, ?, ?
        WHERE (SELECT COUNT(*) FROM user_session_templates WHERE user_id = ?) < ${MAX_TEMPLATES}`
    ).bind(newId, user.userId, name, stepsJson, est, now, now, user.userId).run();
    if (!r.meta?.changes) return json({ ok: false, error: 'template_limit', limit: MAX_TEMPLATES }, 400);
    return json({ ok: true, template: { id: newId, name, steps, est_minutes: est, created_at_ms: now, updated_at_ms: now } });
  } catch (e) {
    console.error('POST /api/my-sessions', e);
    return json({ error: 'Internal error' }, 500);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const user = await getUser(request, env);
    if (!user) return unauthorized();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return json({ ok: false, error: 'id required' }, 400);
    const r = await env.DB.prepare(
      'DELETE FROM user_session_templates WHERE id = ? AND user_id = ?'
    ).bind(id, user.userId).run();
    if (!r.meta?.changes) return json({ ok: false, error: 'not_found' }, 404);
    return new Response(null, { status: 204 });
  } catch (e) {
    console.error('DELETE /api/my-sessions', e);
    return json({ error: 'Internal error' }, 500);
  }
}
