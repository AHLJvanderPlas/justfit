// GET/PUT /api/client/intake — client intake form (P1C)
import { getUser } from '../_shared/auth.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  const user = await getUser(request, env);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const gymId = url.searchParams.get('gymId') ?? request.headers.get('X-Gym-Id');
  if (!gymId) return Response.json({ error: 'gymId required' }, { status: 400 });

  if (request.method === 'GET') {
    const intake = await env.DB.prepare(
      `SELECT * FROM client_intake WHERE user_id = ? AND gym_id = ? LIMIT 1`
    ).bind(user.userId, gymId).first();
    return Response.json(intake ?? null);
  }

  if (request.method === 'PUT') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const existing = await env.DB.prepare(
      `SELECT id, version FROM client_intake WHERE user_id = ? AND gym_id = ? LIMIT 1`
    ).bind(user.userId, gymId).first();

    const now = Date.now();
    const version = (existing?.version ?? 0) + 1;
    const isComplete = body.completed ?? false;

    if (existing) {
      await env.DB.prepare(
        `UPDATE client_intake SET
           goals_json=COALESCE(?,goals_json), goals_free_text=COALESCE(?,goals_free_text),
           experience_level=COALESCE(?,experience_level),
           training_history_json=COALESCE(?,training_history_json),
           injuries_json=COALESCE(?,injuries_json),
           contraindications_json=COALESCE(?,contraindications_json),
           available_days_json=COALESCE(?,available_days_json),
           session_duration_target_min=COALESCE(?,session_duration_target_min),
           equipment_access_json=COALESCE(?,equipment_access_json),
           completed_at_ms=COALESCE(?,completed_at_ms),
           version=?, updated_at_ms=? WHERE user_id=? AND gym_id=?`
      ).bind(
        body.goals ? JSON.stringify(body.goals) : null,
        body.goals_free_text ?? null,
        body.experience_level ?? null,
        body.training_history ? JSON.stringify(body.training_history) : null,
        body.injuries ? JSON.stringify(body.injuries) : null,
        body.contraindications ? JSON.stringify(body.contraindications) : null,
        body.available_days ? JSON.stringify(body.available_days) : null,
        body.session_duration_target_min ?? null,
        body.equipment_access ? JSON.stringify(body.equipment_access) : null,
        isComplete ? now : null,
        version, now, user.userId, gymId
      ).run();
    } else {
      await env.DB.prepare(
        `INSERT INTO client_intake (id, user_id, gym_id, goals_json, goals_free_text,
         experience_level, training_history_json, injuries_json, contraindications_json,
         available_days_json, session_duration_target_min, equipment_access_json,
         completed_at_ms, version, created_at_ms, updated_at_ms)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
      ).bind(
        crypto.randomUUID(), user.userId, gymId,
        body.goals ? JSON.stringify(body.goals) : null,
        body.goals_free_text ?? null, body.experience_level ?? null,
        body.training_history ? JSON.stringify(body.training_history) : null,
        body.injuries ? JSON.stringify(body.injuries) : null,
        body.contraindications ? JSON.stringify(body.contraindications) : null,
        body.available_days ? JSON.stringify(body.available_days) : null,
        body.session_duration_target_min ?? null,
        body.equipment_access ? JSON.stringify(body.equipment_access) : null,
        isComplete ? now : null, version, now, now
      ).run();
    }

    await writeAudit({ gymId, actorUserId: user.userId,
      action: existing ? ACTIONS.INTAKE_UPDATED : ACTIONS.INTAKE_SUBMITTED,
      targetType: 'intake', targetId: `${user.userId}:${gymId}`,
      payload: { version }, request, env });

    return Response.json({ ok: true, version });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
