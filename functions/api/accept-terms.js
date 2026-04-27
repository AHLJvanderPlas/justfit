// POST /api/accept-terms
// Records a user's explicit acceptance of the current Terms & Privacy Policy.
// Requires a valid session JWT. Called from the in-app terms gate for existing
// users who signed up before acceptance tracking was introduced (or after a
// policy version bump).

import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from './_shared/legalVersions.js';
import { getUser } from './_shared/auth.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await getUser(request, env);
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
