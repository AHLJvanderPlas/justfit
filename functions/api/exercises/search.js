// GET /api/exercises/search — unified search returning global + gym custom exercises (P1D)
// Query params: q, muscle, equipment, type, gymId (optional, adds custom exercises)
import { getUser } from '../_shared/auth.js';

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const user = await getUser(request, env);
  const url = new URL(request.url);
  const q = url.searchParams.get('q')?.toLowerCase() ?? '';
  const muscle = url.searchParams.get('muscle') ?? '';
  const equipment = url.searchParams.get('equipment') ?? '';
  const type = url.searchParams.get('type') ?? '';
  const gymId = url.searchParams.get('gymId') ?? request.headers.get('X-Gym-Id');
  const exclude_contraindications = url.searchParams.get('exclude_contraindications') ?? '';

  // Global exercises
  let whereGlobal = `e.is_active = 1`;
  const bindGlobal = [];
  if (q) { whereGlobal += ` AND lower(e.name) LIKE ?`; bindGlobal.push(`%${q}%`); }
  if (muscle) { whereGlobal += ` AND e.tags_json LIKE ?`; bindGlobal.push(`%${muscle}%`); }
  if (equipment) { whereGlobal += ` AND (e.equipment_required_json LIKE ? OR e.equipment_required_json LIKE ?)`;
    bindGlobal.push(`%${equipment}%`, '%"none"%'); }
  if (type) { whereGlobal += ` AND e.category = ?`; bindGlobal.push(type); }
  if (exclude_contraindications) {
    const tags = exclude_contraindications.split(',').map(t => t.trim()).filter(Boolean);
    for (const tag of tags) { whereGlobal += ` AND e.tags_json NOT LIKE ?`; bindGlobal.push(`%${tag}%`); }
  }

  const globalRows = await env.DB.prepare(
    `SELECT id, slug, name, category, tags_json, equipment_required_json, instructions_json,
            metrics_json, alternatives_json, gif_url, NULL AS gym_id, 'global' AS source
     FROM exercises e WHERE ${whereGlobal} LIMIT 100`
  ).bind(...bindGlobal).all();

  let customRows = { results: [] };
  if (gymId && user) {
    // Verify membership
    const mem = await env.DB.prepare(
      `SELECT 1 FROM gym_memberships WHERE gym_id = ? AND user_id = ? AND status = 'active' LIMIT 1`
    ).bind(gymId, user.userId).first();
    if (mem) {
      let whereCustom = `ce.gym_id = ? AND ce.is_active = 1`;
      const bindCustom = [gymId];
      if (q) { whereCustom += ` AND lower(ce.name) LIKE ?`; bindCustom.push(`%${q}%`); }
      if (muscle) { whereCustom += ` AND (ce.primary_muscles_json LIKE ? OR ce.secondary_muscles_json LIKE ?)`; bindCustom.push(`%${muscle}%`, `%${muscle}%`); }
      if (type) { whereCustom += ` AND ce.exercise_type = ?`; bindCustom.push(type); }
      if (exclude_contraindications) {
        const tags = exclude_contraindications.split(',').map(t => t.trim()).filter(Boolean);
        for (const tag of tags) { whereCustom += ` AND ce.contraindications_json NOT LIKE ?`; bindCustom.push(`%${tag}%`); }
      }
      customRows = await env.DB.prepare(
        `SELECT ce.id, ce.name AS slug, ce.name, ce.exercise_type AS category,
                ce.primary_muscles_json AS tags_json, ce.equipment_required_json,
                ce.instructions_markdown AS instructions_json,
                NULL AS metrics_json, NULL AS alternatives_json, ce.image_r2_key AS gif_url,
                ce.gym_id, 'custom' AS source
         FROM custom_exercises ce WHERE ${whereCustom} LIMIT 50`
      ).bind(...bindCustom).all();
    }
  }

  const results = [...(globalRows.results ?? []), ...(customRows.results ?? [])];
  return Response.json(results);
}
