// POST /api/admin/login — email+password login; bootstrap from env on first run
// GET  /api/admin/login — session check
// DELETE /api/admin/login — logout

import { verifyAdminSession, adminUnauthorized, makeSessionCookie, clearSessionCookie, hashPassword, verifyPassword } from './_shared/auth.js';

function parseCookies(request) {
  const header = request.headers.get('Cookie') ?? '';
  const out = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

async function createSession(env, userId, request) {
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO admin_justfit_sessions (id, user_id, created_at_ms, last_accessed_at_ms, expires_at_ms, ip, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId, userId, now, now, now + 7_200_000,
    request.headers.get('CF-Connecting-IP') || null,
    (request.headers.get('User-Agent') || '').slice(0, 200) || null
  ).run();
  return sessionId;
}

export async function onRequestGet({ request, env }) {
  const admin = await verifyAdminSession(request, env);
  if (!admin) return adminUnauthorized();
  return Response.json({ ok: true, admin: { id: admin.user_id, email: admin.email, name: admin.name, role: admin.role } });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = (body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const secret = env.JWT_SECRET || '';

    // Bootstrap: if no admin users exist and env vars match, auto-create first admin
    const { c } = await env.DB.prepare('SELECT COUNT(*) as c FROM admin_justfit_users').first();
    if (c === 0) {
      const bootstrapEmail = (env.ADMIN_EMAIL || '').toLowerCase();
      const bootstrapPass  = env.ADMIN_PASSWORD || '';
      if (!bootstrapEmail || !bootstrapPass || email !== bootstrapEmail || password !== bootstrapPass) {
        return Response.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      const hash   = await hashPassword(password, secret);
      const userId = crypto.randomUUID();
      const now    = Date.now();
      await env.DB.prepare(
        `INSERT INTO admin_justfit_users (id, email, name, role, password_hash, is_active, created_at_ms, updated_at_ms)
         VALUES (?, ?, 'Admin', 'admin', ?, 1, ?, ?)`
      ).bind(userId, email, hash, now, now).run();

      const sessionId = await createSession(env, userId, request);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Set-Cookie': makeSessionCookie(sessionId) },
      });
    }

    const user = await env.DB.prepare(
      `SELECT id, email, name, role, password_hash, is_active FROM admin_justfit_users WHERE email = ?`
    ).bind(email).first();

    if (!user || !user.is_active) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    if (!await verifyPassword(password, user.password_hash, secret)) {
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const sessionId = await createSession(env, user.id, request);
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': makeSessionCookie(sessionId) },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const sessionId = parseCookies(request)['jf_admin_session'];
    if (sessionId) {
      await env.DB.prepare('DELETE FROM admin_justfit_sessions WHERE id = ?').bind(sessionId).run();
    }
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
