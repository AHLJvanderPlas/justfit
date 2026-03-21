const JWT_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

async function sendWelcomeEmail(email, apiKey) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'JustFit.cc <hello@justfit.cc>',
      to: [email],
      subject: 'Welcome to JustFit.cc — Consistency starts today',
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#020617;color:#f8fafc;padding:40px 32px;border-radius:16px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
            <div style="width:36px;height:36px;background:#10b981;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#fff;">JF</div>
            <span style="font-weight:900;font-size:18px;">JustFit<span style="color:#10b981">.cc</span></span>
          </div>
          <h1 style="font-size:28px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;">You're in.</h1>
          <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">
            Your first plan is ready. Check in daily — even 10 minutes counts. Consistency beats intensity every time.
          </p>
          <a href="https://justfit.cc" style="display:inline-block;background:#10b981;color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;letter-spacing:0.04em;">
            Open JustFit →
          </a>
          <p style="color:#334155;font-size:11px;margin-top:40px;">
            JustFit.cc — Privacy-first fitness. We never sell your data.
          </p>
        </div>
      `,
    }),
  });
}

// Simple JWT implementation (no external libs in edge functions)
async function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY }));
  const signature = await hmacSign(`${header}.${body}`, secret);
  return `${header}.${body}.${signature}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, signature] = token.split('.');
    const expectedSig = await hmacSign(`${header}.${body}`, secret);
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
async function hashPassword(password, salt, secret) {
  const data = new TextEncoder().encode(salt + password + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

export async function onRequestPost({ request, env }) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ error: 'Server misconfiguration' }, { status: 500 });

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
      const passwordHash = await hashPassword(password, salt, secret);
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

      const token = await createJWT({ userId, email: emailLower }, secret);

      // Send welcome email (fire-and-forget — don't block signup on email failure)
      if (env.RESEND_API_KEY) {
        sendWelcomeEmail(emailLower, env.RESEND_API_KEY).catch(() => {});
      }

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
      const inputHash = await hashPassword(password, salt, secret);

      if (inputHash !== storedHash) {
        return Response.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      // Update last login
      await env.DB.prepare(
        `UPDATE auth_users SET last_login_at_ms = ? WHERE id = ?`
      ).bind(Date.now(), authUser.id).run();

      const token = await createJWT({ userId: authUser.user_id, email: emailLower }, secret);
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
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ valid: false }, { status: 500 });
    const auth = request.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    if (!token) return Response.json({ valid: false }, { status: 401 });
    const payload = await verifyJWT(token, secret);
    if (!payload) return Response.json({ valid: false }, { status: 401 });
    return Response.json({ valid: true, userId: payload.userId, email: payload.email });
  } catch (e) {
    return Response.json({ valid: false }, { status: 401 });
  }
}
