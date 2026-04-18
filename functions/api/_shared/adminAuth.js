// Shared admin auth helpers for dashboard endpoints.
// Cookie format: jf_dash_session={issuedAt}.{hmac-sha256-b64url}
// Secret: DASHBOARD_PASSWORD ?? ADMIN_KEY

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function hmacSign(data, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return b64url(sig);
}

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

function getSecret(env) {
  return env.DASHBOARD_PASSWORD ?? env.ADMIN_KEY ?? '';
}

export async function createSessionCookie(env) {
  const secret = getSecret(env);
  const issuedAt = Date.now().toString();
  const sig = await hmacSign(issuedAt, secret);
  return `jf_dash_session=${issuedAt}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=7200`;
}

export async function verifySession(request, env) {
  const secret = getSecret(env);
  if (!secret) return false;
  const cookies = parseCookies(request);
  const raw = cookies['jf_dash_session'];
  if (!raw) return false;
  const dot = raw.lastIndexOf('.');
  if (dot < 0) return false;
  const issuedAt = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const age = Date.now() - Number(issuedAt);
  if (!issuedAt || isNaN(age) || age > 7_200_000 || age < 0) return false;
  const expected = await hmacSign(issuedAt, secret);
  return sig === expected;
}

export async function isAdminAuthorized(request, env) {
  if (await verifySession(request, env)) return true;
  const ak = request.headers.get('X-Admin-Key') ?? '';
  if (env.ADMIN_KEY && ak === env.ADMIN_KEY) return true;
  return false;
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
