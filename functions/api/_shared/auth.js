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

/** Returns full JWT payload { userId, email, exp } or null if invalid / missing. */
export async function getUser(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !env.JWT_SECRET) return null;
  return verifyJWT(token, env.JWT_SECRET);
}

/** Returns userId string only, or null. Convenience wrapper for endpoints that only need the ID. */
export async function getAuthUserId(request, env) {
  const payload = await getUser(request, env);
  return payload?.userId ?? null;
}
