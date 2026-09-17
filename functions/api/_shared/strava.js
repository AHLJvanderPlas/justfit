/**
 * Shared Strava helpers.
 *
 * Written against the Strava API Policy + API Agreement that took effect
 * 2026-06-01. The rules that shape this file:
 *
 *   §2.3 / §6.1  Strava Data may be shown only to the athlete it belongs to.
 *   §5.8         We may not charge end users for API functionality.
 *   §6.2         Cached Strava Data may not be retained beyond seven days.
 *   §6.3         Athlete deletions must be reflected within 48 hours.
 *   §7.2         Act on the scopes actually granted, not the ones requested.
 *   §7.4         Purge everything within 30 days of disconnect / deletion.
 *
 * Base URL: Strava is moving from https://www.strava.com/api/v3 to
 * https://api-v3.strava.com (available 2027-01-04, mandatory thereafter).
 * Set STRAVA_API_BASE to switch without a code change.
 */

const DEFAULT_API_BASE = 'https://www.strava.com/api/v3';

export const OAUTH_AUTHORIZE_URL = 'https://www.strava.com/oauth/authorize';
export const OAUTH_TOKEN_URL     = 'https://www.strava.com/oauth/token';
export const OAUTH_REVOKE_URL    = 'https://www.strava.com/oauth/revoke';

/** Read access. Requested always. */
export const SCOPE_READ  = 'activity:read_all';
/** Write access. Only requested when the athlete opts into pushing sessions back. */
export const SCOPE_WRITE = 'activity:write';

/** §6.2 — seven days, in ms. */
export const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function apiBase(env) {
  return (env.STRAVA_API_BASE ?? DEFAULT_API_BASE).replace(/\/+$/, '');
}

export function isConfigured(env) {
  return Boolean(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET);
}

// ── Signed OAuth state ────────────────────────────────────────────────────────
// The previous implementation base64-encoded {uid, ts} and treated a missing or
// unparseable state as acceptable. That let an attacker hand a victim a link
// carrying the attacker's authorization code and silently bind the attacker's
// Strava account to the victim's JustFit account. State is now mandatory,
// HMAC-signed, and time-bound.

const STATE_TTL_MS = 15 * 60 * 1000;

function b64url(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return b64url(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data)));
}

/** Constant-time string compare — avoids leaking the signature byte by byte. */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signState(userId, env) {
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    uid: userId,
    ts: Date.now(),
    n: b64url(crypto.getRandomValues(new Uint8Array(12))),
  })));
  return `${payload}.${await hmac(payload, env.JWT_SECRET)}`;
}

/** Returns the userId the state was minted for, or null if it is not valid. */
export async function verifyState(state, env) {
  if (typeof state !== 'string' || !state.includes('.')) return null;
  const idx = state.lastIndexOf('.');
  const payload = state.slice(0, idx);
  const sig     = state.slice(idx + 1);
  if (!safeEqual(sig, await hmac(payload, env.JWT_SECRET))) return null;
  try {
    const raw = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const { uid, ts } = JSON.parse(raw);
    if (!uid || typeof ts !== 'number') return null;
    if (Date.now() - ts > STATE_TTL_MS) return null;
    return uid;
  } catch { return null; }
}

// ── Rate limits ───────────────────────────────────────────────────────────────
// Limits are per application, not per athlete: 100 reads / 15 min and
// 1,000 / day at base tier, 200 / 2,000 once upgraded. Strava reports usage on
// every response; we surface it so callers can back off rather than discover
// the ceiling as a silent truncation.

export function readRateLimit(resp) {
  const parse = (h) => {
    const v = resp.headers.get(h);
    if (!v) return null;
    const [short, daily] = v.split(',').map((n) => parseInt(n.trim(), 10));
    return Number.isFinite(short) && Number.isFinite(daily) ? { short, daily } : null;
  };
  const limit = parse('X-ReadRateLimit-Limit') ?? parse('X-RateLimit-Limit');
  const usage = parse('X-ReadRateLimit-Usage') ?? parse('X-RateLimit-Usage');
  if (!limit || !usage) return null;
  return {
    limit, usage,
    shortPct: limit.short ? usage.short / limit.short : 0,
    dailyPct: limit.daily ? usage.daily / limit.daily : 0,
  };
}

export class StravaError extends Error {
  constructor(message, { status, rateLimited = false, reauth = false, forbidden = false, detail = null } = {}) {
    super(message);
    this.name = 'StravaError';
    this.status = status;
    this.rateLimited = rateLimited;
    this.reauth = reauth;
    // 403 with resource "Application" means the Strava app itself is disabled
    // (status Inactive, tier/subscription lapsed). Tokens still refresh fine, so
    // nothing else in the flow notices — it has to be surfaced explicitly or the
    // sync reports a clean zero-activity success.
    this.forbidden = forbidden;
    this.detail = detail;
  }
}

/** Pull resource/field/code out of a Strava error body; far more useful than `message`. */
export function parseStravaError(body) {
  try {
    const p = JSON.parse(body);
    const fields = (p?.errors ?? [])
      .map((e) => [e.resource, e.field, e.code].filter(Boolean).join(' '))
      .filter(Boolean);
    return fields.length ? fields.join('; ') : (p?.message || null);
  } catch { return (body || '').slice(0, 160) || null; }
}

/** Authorized fetch against the Strava API with typed failures. */
export async function stravaFetch(path, accessToken, env, init = {}) {
  const url = path.startsWith('http') ? path : `${apiBase(env)}${path}`;
  const resp = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${accessToken}` },
  });

  if (resp.status === 429) {
    throw new StravaError('Strava rate limit reached', { status: 429, rateLimited: true });
  }
  if (resp.status === 401) {
    throw new StravaError('Strava authorization rejected', { status: 401, reauth: true });
  }
  if (!resp.ok) {
    const body = await resp.text().catch(() => '');
    const detail = parseStravaError(body);
    throw new StravaError(`Strava ${resp.status}: ${body.slice(0, 300)}`, {
      status: resp.status,
      forbidden: resp.status === 403,
      detail,
    });
  }
  return resp;
}

// ── Tokens ────────────────────────────────────────────────────────────────────

export async function getConnection(env, userId) {
  return env.DB.prepare(`
    SELECT user_id, athlete_id, access_token, refresh_token, expires_at_ms,
           scope_granted, push_enabled, last_sync_at_ms, last_push_at_ms,
           athlete_name, athlete_city, athlete_pic_url, connected_at_ms
    FROM strava_connections WHERE user_id = ?
  `).bind(userId).first();
}

/**
 * Returns a usable access token, refreshing when it is close to expiry.
 * Strava rotates the refresh token on every exchange and invalidates the old
 * one immediately, so the new one must be persisted or the connection is lost.
 */
export async function getValidAccessToken(conn, env) {
  if (Date.now() < (conn.expires_at_ms ?? 0) - 60_000) return conn.access_token;

  const resp = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type:    'refresh_token',
    }),
  });

  if (!resp.ok) {
    // A rejected refresh token is terminal: the athlete revoked us, or the
    // token was rotated behind our back. Surface it as re-auth, not a blip.
    throw new StravaError(`Token refresh failed (${resp.status})`, {
      status: resp.status,
      reauth: resp.status === 400 || resp.status === 401,
    });
  }

  const data = await resp.json();
  if (!data.access_token || !data.refresh_token) {
    throw new StravaError('Malformed refresh response', { reauth: true });
  }

  await env.DB.prepare(`
    UPDATE strava_connections
       SET access_token = ?, refresh_token = ?, expires_at_ms = ?,
           scope_granted = COALESCE(?, scope_granted), updated_at_ms = ?
     WHERE user_id = ?
  `).bind(
    data.access_token, data.refresh_token, (data.expires_at ?? 0) * 1000,
    data.scope ?? null, Date.now(), conn.user_id
  ).run();

  return data.access_token;
}

/** §7.2 — only act on scopes the athlete actually granted. */
export function hasScope(conn, scope) {
  const granted = conn?.scope_granted;
  if (!granted) return false;
  return granted.split(/[\s,]+/).filter(Boolean).includes(scope);
}

// ── Revocation and deletion ───────────────────────────────────────────────────

/**
 * Revoke our authorization on Strava's side.
 * /oauth/revoke supersedes the legacy /oauth/deauthorize; it takes HTTP Basic
 * auth and revokes the whole token family. Best-effort: a failure here must not
 * block the local purge, which is the part we are actually obliged to do.
 */
export async function revokeToken(token, env) {
  if (!token) return false;
  try {
    const resp = await fetch(OAUTH_REVOKE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${env.STRAVA_CLIENT_ID}:${env.STRAVA_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ token }),
    });
    return resp.ok;
  } catch (e) {
    console.error('strava revoke:', e.message);
    return false;
  }
}

/**
 * §7.4 — purge every trace of Strava Data for one user.
 *
 * Imported activities are removed outright. Sessions the athlete logged in
 * JustFit and that we merely *linked* to a Strava activity are kept — they are
 * our own training records — but every Strava-derived field on them is cleared.
 *
 * Returns counts so the caller can give the athlete the written confirmation
 * §2.1(v) and §2.5 require.
 */
export async function purgeStravaData(env, userId) {
  const imported = await env.DB.prepare(`
    SELECT COUNT(*) AS n FROM executions
     WHERE user_id = ? AND execution_type LIKE 'strava_%'
  `).bind(userId).first();

  const linked = await env.DB.prepare(`
    SELECT COUNT(*) AS n FROM executions
     WHERE user_id = ? AND execution_type NOT LIKE 'strava_%'
       AND strava_activity_id IS NOT NULL
  `).bind(userId).first();

  await env.DB.batch([
    // Steps belonging to imported activities (FK, must go first).
    env.DB.prepare(`
      DELETE FROM execution_steps WHERE execution_id IN (
        SELECT id FROM executions WHERE user_id = ? AND execution_type LIKE 'strava_%'
      )`).bind(userId),
    env.DB.prepare(`
      DELETE FROM executions WHERE user_id = ? AND execution_type LIKE 'strava_%'
    `).bind(userId),
    // Strip Strava-derived fields from sessions the athlete owns.
    env.DB.prepare(`
      UPDATE executions
         SET strava_activity_id = NULL,
             strava_metadata_json = NULL,
             strava_metadata_expires_at_ms = NULL,
             strava_upload_activity_id = NULL,
             strava_upload_at_ms = NULL,
             tss_actual = CASE WHEN tss_source LIKE 'strava_%' THEN NULL ELSE tss_actual END,
             tss_source = CASE WHEN tss_source LIKE 'strava_%' THEN NULL ELSE tss_source END
       WHERE user_id = ?
         AND (strava_activity_id IS NOT NULL OR strava_upload_activity_id IS NOT NULL)
    `).bind(userId),
    env.DB.prepare('DELETE FROM strava_connections WHERE user_id = ?').bind(userId),
  ]);

  return { imported_removed: imported?.n ?? 0, links_cleared: linked?.n ?? 0 };
}

/**
 * §6.2 — drop cached Strava payloads once past their seven-day life.
 *
 * Cloudflare Pages has no cron trigger, so this runs opportunistically on every
 * sync and on every read of a user's history. The derived training record
 * (duration, sport, TSS) survives as JustFit's own data; only the cached Strava
 * payload is cleared.
 */
export async function sweepExpiredCache(env, userId) {
  const res = await env.DB.prepare(`
    UPDATE executions
       SET strava_metadata_json = NULL, strava_metadata_expires_at_ms = NULL
     WHERE user_id = ?
       AND strava_metadata_expires_at_ms IS NOT NULL
       AND strava_metadata_expires_at_ms <= ?
  `).bind(userId, Date.now()).run();
  return res?.meta?.changes ?? 0;
}

// ── Sport types ───────────────────────────────────────────────────────────────
// Includes the types Strava added on 2026-04-30 (Basketball, Cricket, Dance,
// Padel, PhysicalTherapy, Volleyball).

export const SPORT_CATEGORY = {
  Ride: 'cycling', VirtualRide: 'cycling', EBikeRide: 'cycling',
  MountainBikeRide: 'cycling', GravelRide: 'cycling', EMountainBikeRide: 'cycling',
  Velomobile: 'cycling', Handcycle: 'cycling',

  Run: 'running', TrailRun: 'running', VirtualRun: 'running',

  Walk: 'walking', Hike: 'hiking',

  Swim: 'swimming',

  Rowing: 'rowing', VirtualRow: 'rowing', Kayaking: 'rowing', Canoeing: 'rowing',

  Workout: 'fitness', WeightTraining: 'fitness', Yoga: 'fitness', Crossfit: 'fitness',
  Pilates: 'fitness', Elliptical: 'fitness', StairStepper: 'fitness',
  HighIntensityIntervalTraining: 'fitness', RockClimbing: 'fitness',
  Soccer: 'fitness', Tennis: 'fitness', Badminton: 'fitness', Squash: 'fitness',
  TableTennis: 'fitness', Racquetball: 'fitness', Pickleball: 'fitness',
  Basketball: 'fitness', Volleyball: 'fitness', Cricket: 'fitness', Dance: 'fitness',
  Padel: 'fitness', PhysicalTherapy: 'fitness',
  Golf: 'fitness', Skiing: 'fitness', Snowboard: 'fitness', AlpineSki: 'fitness',
  BackcountrySki: 'fitness', NordicSki: 'fitness', Snowshoe: 'fitness',
  IceSkate: 'fitness', InlineSkate: 'fitness', Skateboard: 'fitness',
  Surfing: 'fitness', Windsurf: 'fitness', Kitesurf: 'fitness', StandUpPaddling: 'fitness',
  Martial: 'fitness', Boxing: 'fitness', Sail: 'fitness', Wheelchair: 'fitness',
};

export const EXEC_TYPE_FOR = {
  cycling: 'strava_ride', running: 'strava_run', walking: 'strava_walk',
  hiking: 'strava_hike', swimming: 'strava_swim', rowing: 'strava_row',
  fitness: 'strava_workout',
};

export function categorise(act) {
  const sportType = act.sport_type ?? act.type ?? 'Workout';
  const category  = SPORT_CATEGORY[sportType] ?? 'fitness';
  return { sportType, category, execType: EXEC_TYPE_FOR[category] ?? 'strava_workout' };
}
