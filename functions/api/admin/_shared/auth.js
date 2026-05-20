// Shared admin auth for admin.justfit.cc (admin_justfit_users + admin_justfit_sessions).
// Cookie: jf_admin_session={session_id}; HttpOnly; Secure; SameSite=Strict
// Password hash: SHA-256(salt + password + JWT_SECRET), stored as "salt:hash"

function parseCookies(request) {
  const header = request.headers.get('Cookie') ?? '';
  const out = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export async function verifyAdminSession(request, env) {
  const cookies = parseCookies(request);
  const sessionId = cookies['jf_admin_session'];
  if (!sessionId) return null;

  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT s.id, s.user_id, u.email, u.name, u.role
     FROM admin_justfit_sessions s
     JOIN admin_justfit_users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at_ms > ? AND u.is_active = 1`
  ).bind(sessionId, now).first();

  if (!row) return null;

  // Rolling session window
  env.DB.prepare(
    `UPDATE admin_justfit_sessions SET last_accessed_at_ms = ? WHERE id = ?`
  ).bind(now, sessionId).run().catch(() => {});

  return row;
}

export function adminUnauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export function makeSessionCookie(sessionId, maxAgeSec = 7200) {
  return `jf_admin_session=${sessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAgeSec}`;
}

export function clearSessionCookie() {
  return 'jf_admin_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

export async function hashPassword(password, secret) {
  const salt = crypto.randomUUID().replace(/-/g, '');
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(salt + password + (secret || '')));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${salt}:${hex}`;
}

export async function verifyPassword(password, stored, secret) {
  const colon = stored.indexOf(':');
  if (colon < 0) return false;
  const salt = stored.slice(0, colon);
  const storedHash = stored.slice(colon + 1);
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(salt + password + (secret || '')));
  const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hex === storedHash;
}

export async function logAudit(env, actorId, action, targetType, targetId, payload) {
  try {
    await env.DB.prepare(
      `INSERT INTO admin_justfit_audit (id, actor_id, action, target_type, target_id, payload, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(), actorId, action,
      targetType || null, targetId || null,
      payload ? JSON.stringify(payload) : null,
      Date.now()
    ).run();
  } catch { /* non-fatal */ }
}
