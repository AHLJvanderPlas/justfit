// CRUD /api/trainer/exercises — custom exercises for a gym (P1D)
import { requireGymContext } from '../../lib/middleware.js';
import { writeAudit, ACTIONS } from '../../lib/audit.js';

export async function onRequest(context) {
  const { request, env } = context;
  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { user, gymId } = ctx;

  if (request.method === 'GET') {
    const rows = await env.DB.prepare(
      `SELECT * FROM exercises WHERE gym_id = ? AND is_active = 1 ORDER BY name ASC`
    ).bind(gymId).all();
    return Response.json(rows.results ?? []);
  }

  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    const { name, instructions_markdown, primary_muscles, secondary_muscles, equipment_required,
            contraindications, exercise_type, difficulty } = body;
    if (!name?.trim()) return Response.json({ error: 'name required' }, { status: 400 });

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO exercises (id, gym_id, created_by_user_id, slug, name, category,
       instructions_markdown, primary_muscles_json, secondary_muscles_json,
       equipment_required_json, contraindications_json, difficulty,
       visibility, is_active, tags_json, equipment_advised_json, created_at_ms, updated_at_ms)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,'team',1,'[]',NULL,?,?)`
    ).bind(id, gymId, user.userId, id, name.trim(), exercise_type ?? null,
           instructions_markdown ?? null,
           JSON.stringify(primary_muscles ?? []), JSON.stringify(secondary_muscles ?? []),
           JSON.stringify(equipment_required ?? []), JSON.stringify(contraindications ?? []),
           difficulty ?? null, now, now).run();

    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.EXERCISE_CREATED,
      targetType: 'exercise', targetId: id, request, env });
    return Response.json({ ok: true, id });
  }

  if (request.method === 'PUT') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await env.DB.prepare(`SELECT gym_id FROM exercises WHERE id = ?`).bind(id).first();
    if (!existing || existing.gym_id !== gymId) return Response.json({ error: 'Not found' }, { status: 404 });

    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const now = Date.now();
    await env.DB.prepare(
      `UPDATE exercises SET name=COALESCE(?,name), instructions_markdown=COALESCE(?,instructions_markdown),
       primary_muscles_json=COALESCE(?,primary_muscles_json), secondary_muscles_json=COALESCE(?,secondary_muscles_json),
       equipment_required_json=COALESCE(?,equipment_required_json), contraindications_json=COALESCE(?,contraindications_json),
       category=COALESCE(?,category), difficulty=COALESCE(?,difficulty), updated_at_ms=? WHERE id=?`
    ).bind(body.name ?? null, body.instructions_markdown ?? null,
           body.primary_muscles ? JSON.stringify(body.primary_muscles) : null,
           body.secondary_muscles ? JSON.stringify(body.secondary_muscles) : null,
           body.equipment_required ? JSON.stringify(body.equipment_required) : null,
           body.contraindications ? JSON.stringify(body.contraindications) : null,
           body.exercise_type ?? null, body.difficulty ?? null, now, id).run();

    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.EXERCISE_UPDATED,
      targetType: 'exercise', targetId: id, request, env });
    return Response.json({ ok: true });
  }

  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const existing = await env.DB.prepare(`SELECT gym_id FROM exercises WHERE id = ?`).bind(id).first();
    if (!existing || existing.gym_id !== gymId) return Response.json({ error: 'Not found' }, { status: 404 });

    await env.DB.prepare(`UPDATE exercises SET is_active = 0, updated_at_ms = ? WHERE id = ?`)
      .bind(Date.now(), id).run();
    await writeAudit({ gymId, actorUserId: user.userId, action: ACTIONS.EXERCISE_DELETED,
      targetType: 'exercise', targetId: id, request, env });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
