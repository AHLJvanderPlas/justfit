// Shared JWT verification for all Pages Functions.
// auth.js is the only file that CREATES JWTs — this module only verifies them.

async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    if (sig !== await hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

const JWT_EXPIRY_SEC = 60 * 60 * 24 * 7; // must match auth.js JWT_EXPIRY

/** Returns full JWT payload { userId, email, exp } or null if invalid / missing. */
export async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  // Grace period: also accept __Host-jf_session cookie (HttpOnly, set by auth.js on login).
  // Bearer header fallback allows existing localStorage-stored tokens to keep working.
  if (!token) {
    const cookie = request.headers.get('Cookie') ?? '';
    const m = cookie.match(/(?:^|;\s*)__Host-jf_session=([^;]+)/);
    if (m) token = decodeURIComponent(m[1]);
  }
  if (!token || !env.JWT_SECRET) return null;
  const payload = await verifyJWT(token, env.JWT_SECRET);
  if (!payload) return null;

  // Check JWT invalidation: if token was issued before token_invalidated_at_ms, reject it.
  // This protects against stolen tokens remaining valid after a password reset.
  if (env.DB && payload.userId) {
    try {
      const row = await env.DB.prepare(
        `SELECT token_invalidated_at_ms FROM users WHERE id = ? LIMIT 1`
      ).bind(payload.userId).first();
      const invalidatedAt = row?.token_invalidated_at_ms;
      if (invalidatedAt) {
        const issuedAtMs = (payload.exp - JWT_EXPIRY_SEC) * 1000;
        if (issuedAtMs < invalidatedAt) return null;
      }
    } catch { /* non-fatal — fail open rather than lock out all users on DB hiccup */ }
  }

  return payload;
}

/** Returns userId string only, or null. Convenience wrapper for endpoints that only need the ID. */
export async function getAuthUserId(request, env) {
  const payload = await getUser(request, env);
  return payload?.userId ?? null;
}
