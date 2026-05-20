// GET  /api/admin/users              — paginated list (search, filter)
// GET  /api/admin/users?id=xxx       — user detail
// PATCH /api/admin/users             — actions: deactivate | delete | reset_email
import { verifyAdminSession, adminUnauthorized, logAudit } from './_shared/auth.js';

const PAGE = 25;

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const url    = new URL(request.url);
    const id     = url.searchParams.get('id');

    if (id) return getUserDetail(env, id);

    const page   = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const search = (url.searchParams.get('search') || '').trim();
    const status = url.searchParams.get('status') || '';   // active | deleted | guest
    const hasTrainer = url.searchParams.get('has_trainer'); // 1 | 0
    const offset = (page - 1) * PAGE;

    let where = "WHERE 1=1";
    const binds = [];

    if (search) {
      where += ` AND (u.primary_email LIKE ? OR up.display_name LIKE ?)`;
      binds.push(`%${search}%`, `%${search}%`);
    }
    if (status === 'deleted') {
      where += ` AND u.status = 'deleted'`;
    } else if (status === 'guest') {
      where += ` AND u.primary_email IS NULL AND u.status != 'deleted'`;
    } else if (status === 'active') {
      where += ` AND u.status != 'deleted' AND u.primary_email IS NOT NULL`;
    } else {
      where += ` AND u.status != 'deleted'`;
    }
    if (hasTrainer === '1') {
      where += ` AND EXISTS (SELECT 1 FROM trainer_connections tc WHERE tc.user_id = u.id AND tc.status = 'active')`;
    } else if (hasTrainer === '0') {
      where += ` AND NOT EXISTS (SELECT 1 FROM trainer_connections tc WHERE tc.user_id = u.id AND tc.status = 'active')`;
    }

    const [rows, countRow] = await Promise.all([
      env.DB.prepare(
        `SELECT u.id, u.primary_email, u.status, u.created_at_ms,
                up.display_name, up.training_goal, up.experience_level, up.equipment_json,
                (SELECT MAX(e.created_at_ms) FROM executions e WHERE e.user_id = u.id) as last_active_ms,
                (SELECT COUNT(*) FROM executions e WHERE e.user_id = u.id) as session_count,
                (SELECT t.name FROM trainers t JOIN trainer_connections tc ON tc.trainer_id = t.id
                 WHERE tc.user_id = u.id AND tc.status = 'active' LIMIT 1) as trainer_name
         FROM users u
         LEFT JOIN user_preferences up ON up.user_id = u.id
         ${where}
         ORDER BY u.created_at_ms DESC
         LIMIT ? OFFSET ?`
      ).bind(...binds, PAGE, offset).all(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM users u LEFT JOIN user_preferences up ON up.user_id = u.id ${where}`
      ).bind(...binds).first(),
    ]);

    return Response.json({
      ok: true,
      users: rows.results,
      total: countRow.c,
      page,
      pages: Math.ceil(countRow.c / PAGE),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function getUserDetail(env, userId) {
  try {
    const [user, prefs, sessions, execCount, trainerConn] = await Promise.all([
      env.DB.prepare(
        `SELECT u.id, u.primary_email, u.status, u.created_at_ms,
                au.provider, au.last_login_at_ms
         FROM users u
         LEFT JOIN auth_users au ON au.user_id = u.id
         WHERE u.id = ?`
      ).bind(userId).first(),
      env.DB.prepare(
        `SELECT display_name, sex, weight_kg, height_cm, training_goal,
                experience_level, sessions_per_week, session_duration_min,
                equipment_json, preferences_json
         FROM user_preferences WHERE user_id = ?`
      ).bind(userId).first(),
      env.DB.prepare(
        `SELECT COUNT(*) as c FROM executions WHERE user_id = ?`
      ).bind(userId).first(),
      env.DB.prepare(
        `SELECT MAX(created_at_ms) as last_active FROM executions WHERE user_id = ?`
      ).bind(userId).first(),
      env.DB.prepare(
        `SELECT t.name, t.studio_name, tc.connected_at_ms
         FROM trainer_connections tc
         JOIN trainers t ON t.id = tc.trainer_id
         WHERE tc.user_id = ? AND tc.status = 'active'
         LIMIT 1`
      ).bind(userId).first(),
    ]);

    if (!user) return Response.json({ error: 'Not found' }, { status: 404 });

    return Response.json({
      ok: true,
      user: {
        ...user,
        prefs,
        session_count: sessions?.c || 0,
        last_active_ms: execCount?.last_active || null,
        trainer: trainerConn || null,
      },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const { id, action } = await request.json();
    if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 });

    const user = await env.DB.prepare('SELECT id, primary_email, status FROM users WHERE id = ?').bind(id).first();
    if (!user) return Response.json({ error: 'Not found' }, { status: 404 });

    const now = Date.now();

    if (action === 'deactivate') {
      await env.DB.prepare(`UPDATE users SET status = 'suspended', updated_at_ms = ? WHERE id = ?`).bind(now, id).run();
      await logAudit(env, admin.user_id, 'user.deactivate', 'user', id, { email: user.primary_email });
      return Response.json({ ok: true });
    }

    if (action === 'reactivate') {
      await env.DB.prepare(`UPDATE users SET status = 'active', updated_at_ms = ? WHERE id = ?`).bind(now, id).run();
      await logAudit(env, admin.user_id, 'user.reactivate', 'user', id, { email: user.primary_email });
      return Response.json({ ok: true });
    }

    if (action === 'delete') {
      // GDPR soft delete — nullify PII, keep aggregate data
      await env.DB.batch([
        env.DB.prepare(`UPDATE users SET status = 'deleted', primary_email = NULL, updated_at_ms = ? WHERE id = ?`).bind(now, id),
        env.DB.prepare(`UPDATE auth_users SET email = NULL, password_hash = NULL, updated_at_ms = ? WHERE user_id = ?`).bind(now, id),
        env.DB.prepare(`UPDATE user_preferences SET display_name = NULL, updated_at_ms = ? WHERE user_id = ?`).bind(now, id),
        env.DB.prepare(`UPDATE user_contact SET email = NULL, updated_at_ms = ? WHERE user_id = ?`).bind(now, id),
      ]);
      await logAudit(env, admin.user_id, 'user.delete_gdpr', 'user', id, { email: user.primary_email });
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
