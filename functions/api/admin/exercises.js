// GET   /api/admin/exercises           — list all exercises (including inactive)
// GET   /api/admin/exercises?id=xxx    — single exercise detail
// POST  /api/admin/exercises           — create exercise
// PUT   /api/admin/exercises           — {id, ...fields} full update
// PATCH /api/admin/exercises           — {id, action:'toggle'} toggle is_active
import { verifyAdminSession, adminUnauthorized, logAudit } from './_shared/auth.js';

const PAGE = 50;

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const url      = new URL(request.url);
    const id       = url.searchParams.get('id');

    if (id) {
      const ex = await env.DB.prepare('SELECT * FROM exercises WHERE id = ?').bind(id).first();
      if (!ex) return Response.json({ error: 'Not found' }, { status: 404 });
      return Response.json({ ok: true, exercise: ex });
    }

    const page     = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const search   = (url.searchParams.get('search') || '').trim();
    const category = url.searchParams.get('category') || '';
    const active   = url.searchParams.get('active');        // '1' | '0' | '' (all)
    const tag      = url.searchParams.get('tag') || '';
    const offset   = (page - 1) * PAGE;

    const binds = [];
    let where = 'WHERE 1=1';

    if (search) {
      where += ` AND (e.name LIKE ? OR e.slug LIKE ?)`;
      binds.push(`%${search}%`, `%${search}%`);
    }
    if (category) { where += ` AND e.category = ?`; binds.push(category); }
    if (active === '1') { where += ` AND e.is_active = 1`; }
    else if (active === '0') { where += ` AND e.is_active = 0`; }
    if (tag) { where += ` AND e.tags_json LIKE ?`; binds.push(`%${tag}%`); }

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        `SELECT e.id, e.slug, e.name, e.category, e.tags_json,
                e.equipment_required_json, e.is_active, e.created_at_ms, e.updated_at_ms
         FROM exercises e
         ${where}
         ORDER BY e.name ASC
         LIMIT ? OFFSET ?`
      ).bind(...binds, PAGE, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM exercises e ${where}`
      ).bind(...binds).first(),
    ]);

    return Response.json({
      ok: true,
      exercises: rows.results,
      total: countRow.c,
      page,
      pages: Math.ceil(countRow.c / PAGE),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

function normalizeJsonField(val, fallback = '[]') {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try { JSON.parse(val); return val; } catch { return fallback; }
  }
  return JSON.stringify(val);
}

export async function onRequestPost({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const body = await request.json();
    const { name, slug, category, tags_json, equipment_required_json, equipment_advised_json,
            instructions_json, metrics_json, alternatives_json } = body;

    if (!name || !slug || !category) {
      return Response.json({ error: 'name, slug, category required' }, { status: 400 });
    }
    if (!['strength','cardio','mobility','recovery','skill','mixed'].includes(category)) {
      return Response.json({ error: 'Invalid category' }, { status: 400 });
    }

    const id  = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(
      `INSERT INTO exercises
       (id, slug, name, category, tags_json, equipment_required_json, equipment_advised_json,
        instructions_json, metrics_json, alternatives_json, is_active, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(
      id, slug.trim(), name.trim(), category,
      normalizeJsonField(tags_json),
      normalizeJsonField(equipment_required_json, '["none"]'),
      normalizeJsonField(equipment_advised_json, null),
      normalizeJsonField(instructions_json, null),
      normalizeJsonField(metrics_json, '{"supports":["reps","sets"]}'),
      normalizeJsonField(alternatives_json, null),
      now, now
    ).run();

    await logAudit(env, admin.user_id, 'exercise.create', 'exercise', id, { slug, name });
    return Response.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    if (e.message && e.message.includes('UNIQUE')) {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPut({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const body = await request.json();
    const { id } = body;
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });

    const ex = await env.DB.prepare('SELECT id, slug FROM exercises WHERE id = ?').bind(id).first();
    if (!ex) return Response.json({ error: 'Not found' }, { status: 404 });

    const { name, slug, category, tags_json, equipment_required_json, equipment_advised_json,
            instructions_json, metrics_json, alternatives_json, is_active } = body;

    if (!name || !slug || !category) {
      return Response.json({ error: 'name, slug, category required' }, { status: 400 });
    }

    const now = Date.now();
    await env.DB.prepare(
      `UPDATE exercises SET
         name = ?, slug = ?, category = ?,
         tags_json = ?, equipment_required_json = ?, equipment_advised_json = ?,
         instructions_json = ?, metrics_json = ?, alternatives_json = ?,
         is_active = ?, updated_at_ms = ?
       WHERE id = ?`
    ).bind(
      name.trim(), slug.trim(), category,
      normalizeJsonField(tags_json),
      normalizeJsonField(equipment_required_json, '["none"]'),
      normalizeJsonField(equipment_advised_json, null),
      normalizeJsonField(instructions_json, null),
      normalizeJsonField(metrics_json, '{"supports":["reps","sets"]}'),
      normalizeJsonField(alternatives_json, null),
      is_active != null ? (is_active ? 1 : 0) : 1,
      now, id
    ).run();

    await logAudit(env, admin.user_id, 'exercise.update', 'exercise', id, { slug, name });
    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    if (e.message && e.message.includes('UNIQUE')) {
      return Response.json({ error: 'Slug already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const { id, action } = await request.json();
    if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 });

    const ex = await env.DB.prepare('SELECT id, slug, name, is_active FROM exercises WHERE id = ?').bind(id).first();
    if (!ex) return Response.json({ error: 'Not found' }, { status: 404 });

    if (action === 'toggle') {
      const newActive = ex.is_active ? 0 : 1;
      await env.DB.prepare(
        `UPDATE exercises SET is_active = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(newActive, Date.now(), id).run();
      await logAudit(env, admin.user_id, newActive ? 'exercise.activate' : 'exercise.deactivate', 'exercise', id, { slug: ex.slug });
      return Response.json({ ok: true, is_active: newActive });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
