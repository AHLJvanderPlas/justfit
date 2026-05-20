// GET   /api/admin/team            — list admin users
// POST  /api/admin/team            — create admin user
// PATCH /api/admin/team            — {id, action} activate|deactivate|reset_password
import { verifyAdminSession, adminUnauthorized, hashPassword, logAudit } from './_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();

  try {
    const rows = await env.DB.prepare(
      `SELECT id, email, name, role, is_active, created_at_ms
       FROM admin_justfit_users ORDER BY created_at_ms ASC`
    ).all();

    const audit = await env.DB.prepare(
      `SELECT actor_id, action, created_at_ms FROM admin_justfit_audit
       ORDER BY created_at_ms DESC LIMIT 100`
    ).all();

    return Response.json({ ok: true, team: rows.results, audit: audit.results });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();
  if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { email, name, role, password } = await request.json();
    if (!email || !name || !password) {
      return Response.json({ error: 'email, name, password required' }, { status: 400 });
    }

    const secret = env.JWT_SECRET || '';
    const hash   = await hashPassword(password, secret);
    const id     = crypto.randomUUID();
    const now    = Date.now();

    await env.DB.prepare(
      `INSERT INTO admin_justfit_users (id, email, name, role, password_hash, is_active, created_at_ms, updated_at_ms)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`
    ).bind(id, email.toLowerCase(), name, role || 'admin', hash, now, now).run();

    await logAudit(env, admin.user_id, 'team.create', 'admin_user', id, { email, name, role });
    return Response.json({ ok: true, id });
  } catch (e) {
    console.error(e);
    if (e.message && e.message.includes('UNIQUE')) {
      return Response.json({ error: 'Email already exists' }, { status: 409 });
    }
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestPatch({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();
  if (admin.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const body = await request.json();
    const { id, action } = body;
    if (!id || !action) return Response.json({ error: 'id and action required' }, { status: 400 });

    // Prevent self-deactivation
    if (id === admin.user_id && action === 'deactivate') {
      return Response.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
    }

    const now = Date.now();

    if (action === 'activate') {
      await env.DB.prepare(`UPDATE admin_justfit_users SET is_active = 1, updated_at_ms = ? WHERE id = ?`).bind(now, id).run();
      await logAudit(env, admin.user_id, 'team.activate', 'admin_user', id);
      return Response.json({ ok: true });
    }

    if (action === 'deactivate') {
      await env.DB.prepare(`UPDATE admin_justfit_users SET is_active = 0, updated_at_ms = ? WHERE id = ?`).bind(now, id).run();
      // Invalidate all sessions
      await env.DB.prepare(`DELETE FROM admin_justfit_sessions WHERE user_id = ?`).bind(id).run();
      await logAudit(env, admin.user_id, 'team.deactivate', 'admin_user', id);
      return Response.json({ ok: true });
    }

    if (action === 'set_password') {
      const { password } = body;
      if (!password || password.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
      }
      const secret = env.JWT_SECRET || '';
      const hash   = await hashPassword(password, secret);
      await env.DB.prepare(
        `UPDATE admin_justfit_users SET password_hash = ?, updated_at_ms = ? WHERE id = ?`
      ).bind(hash, now, id).run();
      // Invalidate all sessions for security
      await env.DB.prepare(`DELETE FROM admin_justfit_sessions WHERE user_id = ?`).bind(id).run();
      await logAudit(env, admin.user_id, 'team.set_password', 'admin_user', id);
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
