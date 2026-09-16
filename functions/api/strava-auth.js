/**
 * /api/strava-auth
 *
 * GET    — connection status + a freshly signed OAuth authorization URL.
 * POST   — exchange { code, state } from the OAuth callback for tokens.
 * PATCH  — toggle { push_enabled } (writing JustFit sessions back to Strava).
 * DELETE — disconnect: revoke on Strava's side, then purge locally.
 *
 * All actions require a valid session cookie.
 *
 * Changes against the 2026 API Policy:
 *  §5.8  The Pro entitlement gate is gone. Charging end users for API
 *        functionality is prohibited; import is available to every account.
 *  §7.2  The scope actually granted is stored and honoured, rather than
 *        assuming we received everything we asked for.
 *  §7.4  Disconnect revokes the token family and purges all Strava Data,
 *        and reports back what was deleted (§2.1(v), §2.5).
 *
 * Security: the OAuth `state` is now mandatory and HMAC-signed. It was
 * previously optional and unsigned, which allowed an attacker to bind their
 * own Strava account to a victim's JustFit account via a crafted callback URL.
 *
 * Environment:
 *   STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET — the JustFit platform app
 *   STRAVA_API_BASE  — optional; for the api-v3.strava.com migration
 *   JWT_SECRET       — signs the OAuth state
 */

import { getAuthUserId } from './_shared/auth.js';
import {
  OAUTH_AUTHORIZE_URL, OAUTH_TOKEN_URL,
  SCOPE_READ, SCOPE_WRITE,
  isConfigured, signState, verifyState,
  getConnection, revokeToken, purgeStravaData, hasScope,
} from './_shared/strava.js';

function json(body, status = 200) {
  return Response.json(body, { status });
}

// ── GET ───────────────────────────────────────────────────────────────────────

async function handleGet(request, env) {
  const userId = await getAuthUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  // `available` lets the client hide the integration entirely rather than
  // render a Connect button that cannot succeed.
  if (!isConfigured(env)) {
    return json({ available: false, connection: null });
  }

  const row = await getConnection(env, userId).catch((e) => {
    console.error('strava-auth GET lookup:', e);
    return null;
  });

  const connection = row ? {
    athlete_name:    row.athlete_name,
    athlete_city:    row.athlete_city,
    athlete_pic_url: row.athlete_pic_url,
    connected_at_ms: row.connected_at_ms,
    last_sync_at_ms: row.last_sync_at_ms,
    last_push_at_ms: row.last_push_at_ms,
    push_enabled:    Boolean(row.push_enabled),
    can_push:        hasScope(row, SCOPE_WRITE),
    scope_granted:   row.scope_granted ?? null,
  } : null;

  // Ask for write access only when the athlete has said they want uploads.
  // A fresh connection asks for read only; enabling uploads re-runs consent.
  const url = new URL(request.url);
  const wantWrite = url.searchParams.get('write') === '1';
  const scope = wantWrite ? `${SCOPE_READ},${SCOPE_WRITE}` : SCOPE_READ;

  const params = new URLSearchParams({
    client_id: env.STRAVA_CLIENT_ID,
    redirect_uri: `${url.origin}/`,
    response_type: 'code',
    // `force` so the athlete sees the permission screen when scopes change,
    // which §7.2 requires on any change to what we collect.
    approval_prompt: wantWrite ? 'force' : 'auto',
    scope,
    state: await signState(userId, env),
  });

  return json({
    available: true,
    connection,
    auth_url: `${OAUTH_AUTHORIZE_URL}?${params}`,
    requested_scope: scope,
  });
}

// ── POST — token exchange ─────────────────────────────────────────────────────

async function handlePost(request, env) {
  const userId = await getAuthUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);
  if (!isConfigured(env)) return json({ error: 'Strava not configured' }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }

  const { code, state } = body;
  if (!code) return json({ error: 'Missing code' }, 400);

  // Mandatory, signed, bound to this user, and time-limited.
  const stateUser = await verifyState(state, env);
  if (!stateUser || stateUser !== userId) {
    return json({ error: 'Invalid or expired authorization state. Start the connection again.' }, 400);
  }

  let tokenData;
  try {
    const resp = await fetch(OAUTH_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id:     env.STRAVA_CLIENT_ID,
        client_secret: env.STRAVA_CLIENT_SECRET,
        code,
        grant_type:    'authorization_code',
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('strava token exchange failed:', resp.status, err.slice(0, 300));
      // Athlete capacity is the most likely cause of a rejection in practice,
      // and "try again" is the wrong advice for it.
      // Surface Strava's own reason. Its errors are short and specific
      // ("invalid", "code already used", athlete-capacity messages) and without
      // them the user only ever sees "try again", which is often wrong advice.
      // Strava's `message` is almost always the generic "Authorization Error".
      // The discriminator is the errors[] array, which names the resource, field
      // and code — e.g. {resource:"Application", field:"client_id", code:"invalid"}
      // vs {resource:"AccessToken", field:"code", code:"invalid"}. One means our
      // stored credentials are wrong, the other means the code was reused or
      // expired. Prefer it over the generic message.
      let detail = null;
      try {
        const parsed = JSON.parse(err);
        const fields = (parsed?.errors ?? [])
          .map((e) => [e.resource, e.field, e.code].filter(Boolean).join(' '))
          .filter(Boolean);
        detail = fields.length ? fields.join('; ') : (parsed?.message || null);
      } catch { detail = err.slice(0, 160) || null; }
      // Strava reports which thing it rejected. "Application" means our stored
      // client_id/secret are wrong — nothing to do with the athlete, the code,
      // athlete capacity or a subscription — so say that instead of guessing.
      const badApp = /Application/i.test(detail ?? '');
      return json({
        error: badApp
          ? 'Strava rejected this app\'s credentials. STRAVA_CLIENT_ID / STRAVA_CLIENT_SECRET need updating — this is not about your Strava account.'
          : 'Strava refused the connection. If this app has reached its athlete capacity, the limit must be raised in the Strava API settings.',
        strava_status: resp.status,
        // Strava's own resource/field/code, e.g. "Application invalid" (our
        // credentials are wrong) vs "AuthorizationCode code invalid" (the code
        // was reused or expired). The raw body is logged, not returned.
        strava_detail: detail,
      }, 409);
    }
    tokenData = await resp.json();
  } catch (e) {
    console.error('strava-auth POST exchange:', e);
    return json({ error: 'Could not reach Strava' }, 503);
  }

  const { access_token, refresh_token, expires_at, scope, athlete } = tokenData;
  if (!access_token || !refresh_token) {
    return json({ error: 'Invalid token response from Strava' }, 409);
  }

  const athleteId = athlete?.id ?? null;
  if (athleteId == null) {
    // athlete_id is NOT NULL; fail loudly rather than on a constraint error.
    return json({ error: 'Strava did not return an athlete profile' }, 409);
  }

  const athleteName = [athlete?.firstname, athlete?.lastname].filter(Boolean).join(' ') || null;
  const athleteCity = athlete?.city ?? null;
  const athletePic  = athlete?.profile_medium ?? athlete?.profile ?? null;
  // Since 2026-04-23 the response carries the scopes actually granted. Store
  // those — the athlete may have declined some of what we asked for.
  const granted     = scope ?? SCOPE_READ;
  const expiresAtMs = (expires_at ?? 0) * 1000;
  const nowMs       = Date.now();

  try {
    await env.DB.prepare(`
      INSERT INTO strava_connections
        (id, user_id, athlete_id, access_token, refresh_token, expires_at_ms,
         scope, scope_granted, athlete_name, athlete_city, athlete_pic_url,
         connected_at_ms, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        athlete_id      = excluded.athlete_id,
        access_token    = excluded.access_token,
        refresh_token   = excluded.refresh_token,
        expires_at_ms   = excluded.expires_at_ms,
        scope           = excluded.scope,
        scope_granted   = excluded.scope_granted,
        athlete_name    = excluded.athlete_name,
        athlete_city    = excluded.athlete_city,
        athlete_pic_url = excluded.athlete_pic_url,
        connected_at_ms = excluded.connected_at_ms,
        updated_at_ms   = excluded.updated_at_ms
    `).bind(
      crypto.randomUUID(), userId, athleteId,
      access_token, refresh_token, expiresAtMs,
      granted, granted, athleteName, athleteCity, athletePic,
      nowMs, nowMs, nowMs
    ).run();

    // Losing write scope must switch uploads off, or we would keep trying.
    if (!granted.includes(SCOPE_WRITE)) {
      await env.DB.prepare(
        'UPDATE strava_connections SET push_enabled = 0 WHERE user_id = ?'
      ).bind(userId).run();
    }
  } catch (e) {
    console.error('strava-auth POST upsert:', e);
    return json({ error: 'Could not save the connection' }, 500);
  }

  return json({
    ok: true,
    athlete_name: athleteName,
    athlete_city: athleteCity,
    athlete_pic_url: athletePic,
    scope_granted: granted,
    can_push: granted.includes(SCOPE_WRITE),
  });
}

// ── PATCH — upload opt-in ─────────────────────────────────────────────────────

async function handlePatch(request, env) {
  const userId = await getAuthUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Bad request' }, 400); }
  if (typeof body.push_enabled !== 'boolean') {
    return json({ error: 'push_enabled must be a boolean' }, 400);
  }

  const conn = await getConnection(env, userId);
  if (!conn) return json({ error: 'Strava not connected' }, 404);

  // Cannot switch uploads on without the scope that makes them possible.
  if (body.push_enabled && !hasScope(conn, SCOPE_WRITE)) {
    return json({
      error: 'Reconnect Strava and allow uploads first.',
      needsReauth: true,
    }, 409);
  }

  await env.DB.prepare(
    'UPDATE strava_connections SET push_enabled = ?, updated_at_ms = ? WHERE user_id = ?'
  ).bind(body.push_enabled ? 1 : 0, Date.now(), userId).run();

  return json({ ok: true, push_enabled: body.push_enabled });
}

// ── DELETE — disconnect ───────────────────────────────────────────────────────

async function handleDelete(request, env) {
  const userId = await getAuthUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  const conn = await getConnection(env, userId);
  if (!conn) return json({ ok: true, already_disconnected: true });

  // Revoke first so Strava stops considering us authorized even if the local
  // purge somehow fails; revoking a refresh token kills its access tokens too.
  const revoked = await revokeToken(conn.refresh_token ?? conn.access_token, env);

  let deleted;
  try {
    deleted = await purgeStravaData(env, userId);
  } catch (e) {
    console.error('strava-auth DELETE purge:', e);
    return json({ error: 'Could not complete the disconnect' }, 500);
  }

  // §2.1(v) / §2.5 — the athlete must get written confirmation that deletion
  // actually happened, and what it covered.
  return json({
    ok: true,
    revoked,
    deleted,
    confirmation: `Strava disconnected. ${deleted.imported_removed} imported activit${deleted.imported_removed === 1 ? 'y' : 'ies'} deleted and Strava data removed from ${deleted.links_cleared} JustFit session${deleted.links_cleared === 1 ? '' : 's'}. No Strava data is retained.`,
  });
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;
  switch (request.method.toUpperCase()) {
    case 'GET':    return handleGet(request, env);
    case 'POST':   return handlePost(request, env);
    case 'PATCH':  return handlePatch(request, env);
    case 'DELETE': return handleDelete(request, env);
    default:       return json({ error: 'Method not allowed' }, 405);
  }
}
