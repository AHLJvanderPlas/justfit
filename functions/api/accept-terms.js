// POST /api/accept-terms
// Records a user's explicit acceptance of the current Terms & Privacy Policy.
// Requires a valid session JWT. Called from the in-app terms gate for existing
// users who signed up before acceptance tracking was introduced (or after a
// policy version bump).

import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from './_shared/legalVersions.js';

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

async function getSessionUser(request, secret) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token || !secret) return null;
  return verifyJWT(token, secret);
}

export async function onRequestPost({ request, env }) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ error: 'Server misconfiguration' }, { status: 500 });

    const user = await getSessionUser(request, secret);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const termsVersion   = body.termsVersion   ?? CURRENT_TERMS_VERSION;
    const privacyVersion = body.privacyVersion ?? CURRENT_PRIVACY_VERSION;

    // Only record if user is accepting the current versions
    if (termsVersion !== CURRENT_TERMS_VERSION) {
      return Response.json({ error: 'Invalid terms version.' }, { status: 400 });
    }
    if (privacyVersion !== CURRENT_PRIVACY_VERSION) {
      return Response.json({ error: 'Invalid privacy version.' }, { status: 400 });
    }

    const now = Date.now();
    await env.DB.prepare(`
      UPDATE users
      SET accepted_terms_version   = ?,
          accepted_terms_at_ms     = ?,
          accepted_privacy_version = ?,
          accepted_privacy_at_ms   = ?,
          updated_at_ms            = ?
      WHERE id = ?
    `).bind(termsVersion, now, privacyVersion, now, now, user.userId).run();

    return Response.json({ ok: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
