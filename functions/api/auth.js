const SALT_ROUNDS = 10;
const JWT_SECRET = 'justfit-secret-change-in-production';
const JWT_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

// Simple JWT implementation (no external libs in edge functions)
async function createJWT(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY }));
  const signature = await hmacSign(`${header}.${body}`, JWT_SECRET);
  return `${header}.${body}.${signature}`;
}

async function verifyJWT(token) {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = await hmacSign(`${header}.${body}`, JWT_SECRET);
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Simple password hashing using SHA-256 + salt (edge-compatible)
async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + password + JWT_SECRET);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function onRequestPost({ request, env }) {
  try {
    const { action, email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: 'Email and password required' }, { status: 400 });
    }

    const emailLower = email.toLowerCase().trim();

    if (action === 'signup') {
      // Check if email already exists
      const existing = await env.DB.prepare(
        `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
      ).bind(emailLower).first();

      if (existing) {
        return Response.json({ error: 'Email already registered' }, { status: 409 });
      }

      // Create user
      const userId = crypto.randomUUID();
      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(password, salt);
      const now = Date.now();

      await env.DB.batch([
        env.DB.prepare(`
          INSERT INTO users (id, status, primary_email, created_at_ms, updated_at_ms)
          VALUES (?, 'active', ?, ?, ?)
        `).bind(userId, emailLower, now, now),

        env.DB.prepare(`
          INSERT INTO auth_users (id, user_id, provider, email, email_verified, password_hash, password_algo, created_at_ms, updated_at_ms)
          VALUES (?, ?, 'password', ?, 0, ?, 'sha256+salt', ?, ?)
        `).bind(crypto.randomUUID(), userId, emailLower, `${salt}:${passwordHash}`, now, now),

        env.DB.prepare(`
          INSERT INTO entitlements (id, user_id, product_code, source, status, starts_at_ms, created_at_ms, updated_at_ms)
          VALUES (?, ?, 'justfit_trial', 'manual', 'trialing', ?, ?, ?)
        `).bind(crypto.randomUUID(), userId, now, now, now),
      ]);

      const token = await createJWT({ userId, email: emailLower });
      return Response.json({ ok: true, token, userId });

    } else if (action === 'login') {
      // Find user
      const authUser = await env.DB.prepare(
        `SELECT a.id, a.user_id, a.password_hash 
         FROM auth_users a
         WHERE a.email = ? AND a.provider = 'password' LIMIT 1`
      ).bind(emailLower).first();

      if (!authUser) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Verify password
      const [salt, storedHash] = authUser.password_hash.split(':');
      const inputHash = await hashPassword(password, salt);

      if (inputHash !== storedHash) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Update last login
      await env.DB.prepare(
        `UPDATE auth_users SET last_login_at_ms = ? WHERE id = ?`
      ).bind(Date.now(), authUser.id).run();

      const token = await createJWT({ userId: authUser.user_id, email: emailLower });
      return Response.json({ ok: true, token, userId: authUser.user_id });

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  // Verify token endpoint
  try {
    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    if (!token) return Response.json({ valid: false }, { status: 401 });
    const payload = await verifyJWT(token);
    if (!payload) return Response.json({ valid: false }, { status: 401 });
    return Response.json({ valid: true, userId: payload.userId, email: payload.email });
  } catch (e) {
    return Response.json({ valid: false }, { status: 401 });
  }
}
