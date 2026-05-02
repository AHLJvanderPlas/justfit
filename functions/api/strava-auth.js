/**
 * /api/strava-auth
 *
 * GET  — returns the Strava OAuth authorization URL for the current user.
 *         Client redirects the browser there to initiate the OAuth flow.
 *
 * POST — receives { code, state } from the OAuth callback (sent by App.jsx
 *         after Strava redirects back to the app).  Exchanges the code for
 *         tokens, fetches the athlete profile, and upserts strava_connections.
 *         Returns { ok, athlete_name, athlete_pic_url }.
 *
 * DELETE — removes the strava_connections row for the authenticated user
 *           (disconnect).
 *
 * All three actions require a valid Bearer JWT.
 *
 * Environment variables required:
 *   STRAVA_CLIENT_ID      — from strava.com/settings/api
 *   STRAVA_CLIENT_SECRET  — from strava.com/settings/api
 *   JWT_SECRET            — shared app secret for token verification
 */

const STRAVA_AUTH_URL   = 'https://www.strava.com/oauth/authorize';
const STRAVA_TOKEN_URL  = 'https://www.strava.com/oauth/token';
const STRAVA_ATHLETE_URL = 'https://www.strava.com/api/v3/athlete';
const SCOPE             = 'activity:read_all';

// ── JWT verification (inlined — no npm) ──────────────────────────────────────

async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sigBuf = Uint8Array.from(atob(sig.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify('HMAC', key, sigBuf, data);
  if (!valid) return null;
  const decoded = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded;
}

function authError(msg, status = 401) {
  return Response.json({ error: msg }, { status });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

async function getUserId(request, env) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = await verifyJwt(token, env.JWT_SECRET);
  return payload?.userId ?? null;
}

// ── Handlers ─────────────────────────────────────────────────────────────────

async function getByoCreds(userId, env) {
  try {
    const row = await env.DB.prepare(
      `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
    ).bind(userId).first();
    const prefs = JSON.parse(row?.preferences_json ?? '{}');
    const byo = prefs.strava_byo ?? {};
    return {
      clientId:     byo.client_id     || env.STRAVA_CLIENT_ID     || null,
      clientSecret: byo.client_secret || env.STRAVA_CLIENT_SECRET || null,
      isByo:        !!(byo.client_id && byo.client_secret),
    };
  } catch { return { clientId: env.STRAVA_CLIENT_ID ?? null, clientSecret: env.STRAVA_CLIENT_SECRET ?? null, isByo: false }; }
}

async function handleGet(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return authError('Unauthorized');

  const { clientId, isByo } = await getByoCreds(userId, env);
  if (!clientId) return Response.json({ error: 'Strava not configured' }, { status: 503 });

  // Fetch existing connection status
  let connection = null;
  try {
    const row = await env.DB.prepare(
      `SELECT athlete_name, athlete_city, athlete_pic_url, connected_at_ms, last_sync_at_ms
       FROM strava_connections WHERE user_id = ?`
    ).bind(userId).first();
    if (row) {
      connection = {
        athlete_name:    row.athlete_name,
        athlete_city:    row.athlete_city,
        athlete_pic_url: row.athlete_pic_url,
        connected_at_ms: row.connected_at_ms,
        last_sync_at_ms: row.last_sync_at_ms,
      };
    }
  } catch (e) {
    console.error('strava-auth GET connection lookup:', e);
  }

  // Build OAuth URL for initial connection
  const redirectUri = new URL(request.url).origin + '/';
  const state = btoa(JSON.stringify({ uid: userId, ts: Date.now() }));
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    approval_prompt: 'auto',
    scope: SCOPE,
    state,
  });

  return Response.json({
    auth_url: `${STRAVA_AUTH_URL}?${params}`,
    connection,
    is_byo: isByo,
  }, { headers: corsHeaders() });
}

async function handlePost(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return authError('Unauthorized');

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Bad request' }, { status: 400 }); }

  // ── Save BYO app credentials (targeted json_patch, no profile.js pipeline) ──
  if (body.action === 'save_byo') {
    const clientId     = (body.client_id     ?? '').trim();
    const clientSecret = (body.client_secret ?? '').trim();
    if (!clientId || !clientSecret) {
      return Response.json({ error: 'client_id and client_secret are required' }, { status: 400 });
    }
    try {
      const byoJson = JSON.stringify({ client_id: clientId, client_secret: clientSecret });
      const existingRow = await env.DB.prepare(
        `SELECT user_id FROM user_preferences WHERE user_id = ? LIMIT 1`
      ).bind(userId).first();
      if (existingRow) {
        await env.DB.prepare(
          `UPDATE user_preferences
           SET preferences_json = json_patch(preferences_json, json_object('strava_byo', json(?))),
               updated_at_ms = ?
           WHERE user_id = ?`
        ).bind(byoJson, Date.now(), userId).run();
      } else {
        await env.DB.prepare(
          `INSERT INTO user_preferences
             (user_id, units, training_goal, experience_level, intensity_pref,
              session_duration_min, days_per_week_target, preferences_json,
              created_at_ms, updated_at_ms)
           VALUES (?, 'metric', 'health', 'beginner', 5, 30, 3, ?, ?, ?)`
        ).bind(userId, JSON.stringify({ strava_byo: { client_id: clientId, client_secret: clientSecret } }), Date.now(), Date.now()).run();
      }
      return Response.json({ ok: true }, { headers: corsHeaders() });
    } catch (e) {
      console.error('strava-auth save_byo:', e);
      return Response.json({ error: 'Internal error' }, { status: 500 });
    }
  }

  const { code, state } = body;
  if (!code) return Response.json({ error: 'Missing code' }, { status: 400 });

  // Validate state param
  if (state) {
    try {
      const decoded = JSON.parse(atob(state));
      if (decoded.uid !== userId) return authError('State mismatch');
    } catch {
      // State decode failure is non-fatal — log and continue
      console.warn('strava-auth: could not decode state param');
    }
  }

  const { clientId, clientSecret } = await getByoCreds(userId, env);
  if (!clientId || !clientSecret) return Response.json({ error: 'Strava not configured' }, { status: 503 });

  // Exchange code for tokens
  let tokenData;
  try {
    const resp = await fetch(STRAVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('strava token exchange failed:', err);
      return Response.json({ error: 'Strava token exchange failed' }, { status: 502 });
    }
    tokenData = await resp.json();
  } catch (e) {
    console.error('strava-auth POST token exchange:', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }

  const {
    access_token,
    refresh_token,
    expires_at, // unix seconds
    athlete,
  } = tokenData;

  if (!access_token || !refresh_token) {
    return Response.json({ error: 'Invalid token response from Strava' }, { status: 502 });
  }

  const athleteId   = athlete?.id ?? null;
  const athleteName = [athlete?.firstname, athlete?.lastname].filter(Boolean).join(' ') || null;
  const athleteCity = athlete?.city ?? null;
  const athletePic  = athlete?.profile_medium ?? athlete?.profile ?? null;
  const expiresAtMs = (expires_at ?? 0) * 1000;
  const nowMs       = Date.now();

  try {
    await env.DB.prepare(`
      INSERT INTO strava_connections
        (id, user_id, athlete_id, access_token, refresh_token, expires_at_ms,
         scope, athlete_name, athlete_city, athlete_pic_url,
         connected_at_ms, created_at_ms, updated_at_ms)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        athlete_id     = excluded.athlete_id,
        access_token   = excluded.access_token,
        refresh_token  = excluded.refresh_token,
        expires_at_ms  = excluded.expires_at_ms,
        scope          = excluded.scope,
        athlete_name   = excluded.athlete_name,
        athlete_city   = excluded.athlete_city,
        athlete_pic_url = excluded.athlete_pic_url,
        connected_at_ms = excluded.connected_at_ms,
        updated_at_ms  = excluded.updated_at_ms
    `).bind(
      crypto.randomUUID(), userId, athleteId,
      access_token, refresh_token, expiresAtMs,
      SCOPE, athleteName, athleteCity, athletePic,
      nowMs, nowMs, nowMs
    ).run();
  } catch (e) {
    console.error('strava-auth POST DB upsert:', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }

  return Response.json({
    ok: true,
    athlete_name: athleteName,
    athlete_city: athleteCity,
    athlete_pic_url: athletePic,
  }, { headers: corsHeaders() });
}

async function handleDelete(request, env) {
  const userId = await getUserId(request, env);
  if (!userId) return authError('Unauthorized');

  try {
    await env.DB.prepare(`DELETE FROM strava_connections WHERE user_id = ?`).bind(userId).run();
  } catch (e) {
    console.error('strava-auth DELETE:', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }

  return Response.json({ ok: true }, { headers: corsHeaders() });
}

// ── Router ────────────────────────────────────────────────────────────────────

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (method === 'GET')    return handleGet(request, env);
  if (method === 'POST')   return handlePost(request, env);
  if (method === 'DELETE') return handleDelete(request, env);

  return Response.json({ error: 'Method not allowed' }, { status: 405 });
}
