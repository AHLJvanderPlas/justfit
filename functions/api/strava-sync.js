/**
 * /api/strava-sync
 *
 * POST — fetches recent Strava activities for the authenticated user,
 *        classifies them by sport, computes TSS for cycling rides,
 *        and upserts them as execution records.
 *
 * Returns { ok, imported, skipped, by_type }.
 *
 * Design choices:
 *  - tss_source is only set for cycling activities → PMC chart stays cycling-only
 *  - All activity types are imported (running, walking, fitness etc.) so they
 *    contribute to consistency score / streak / planner last-activity awareness
 *  - Token refresh happens automatically when within 60s of expiry
 *  - Deduplication via UNIQUE INDEX on (user_id, strava_activity_id)
 *  - First sync: last 90 days; incremental: since last_sync_at_ms
 */

const STRAVA_ACTIVITIES_URL = 'https://www.strava.com/api/v3/athlete/activities';
const STRAVA_TOKEN_URL      = 'https://www.strava.com/oauth/token';
const MAX_LOOKBACK_DAYS     = 90;
const PER_PAGE              = 100;

// ── JWT (inlined, no npm) ─────────────────────────────────────────────────────

async function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
  );
  const data = new TextEncoder().encode(`${header}.${payload}`);
  const sigBuf = Uint8Array.from(atob(sig.replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
  const valid  = await crypto.subtle.verify('HMAC', key, sigBuf, data);
  if (!valid) return null;
  const decoded = JSON.parse(atob(payload.replace(/-/g,'+').replace(/_/g,'/')));
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded;
}

// ── Activity classification ───────────────────────────────────────────────────

const CATEGORY = {
  // Cycling
  Ride:             'cycling',
  VirtualRide:      'cycling',
  EBikeRide:        'cycling',
  MountainBikeRide: 'cycling',
  GravelRide:       'cycling',
  Velomobile:       'cycling',
  Handcycle:        'cycling',
  // Running
  Run:      'running',
  TrailRun: 'running',
  // Walking / hiking
  Walk: 'walking',
  Hike: 'hiking',
  // Other endurance
  Swim:   'swimming',
  Rowing: 'rowing',
  Kayaking: 'rowing',
  Canoeing: 'rowing',
  // Gym / general
  Workout:          'fitness',
  WeightTraining:   'fitness',
  Yoga:             'fitness',
  Crossfit:         'fitness',
  Pilates:          'fitness',
  Elliptical:       'fitness',
  StairStepper:     'fitness',
  RockClimbing:     'fitness',
  Soccer:           'fitness',
  Tennis:           'fitness',
  Badminton:        'fitness',
  Squash:           'fitness',
  Basketball:       'fitness',
  Volleyball:       'fitness',
  Golf:             'fitness',
  Skiing:           'fitness',
  Snowboard:        'fitness',
  IceSkate:         'fitness',
  Skateboard:       'fitness',
  Surfing:          'fitness',
  Windsurf:         'fitness',
  Kitesurf:         'fitness',
  Martial:          'fitness',
  Boxing:           'fitness',
};

const EXEC_TYPE_FOR = {
  cycling:  'strava_ride',
  running:  'strava_run',
  walking:  'strava_walk',
  hiking:   'strava_hike',
  swimming: 'strava_swim',
  rowing:   'strava_row',
  fitness:  'strava_workout',
};

// Default intensity factor per category for flat TSS estimate (cycling only uses this)
const DEFAULT_IF = {
  cycling: 0.65,
};

// ── TSS estimation (cycling only — other sports don't feed PMC) ───────────────

function estimateCyclingTss(act, ftpWatts, maxHr) {
  const hours = (act.moving_time || act.elapsed_time || 0) / 3600;
  if (hours < 0.05) return { tss: null, source: null };

  // Power-based: device_watts ensures it's from an actual power meter
  if (act.average_watts && act.device_watts && ftpWatts > 0) {
    const IF = act.average_watts / ftpWatts;
    return {
      tss: Math.round(hours * IF * IF * 100 * 10) / 10,
      source: 'strava_power',
    };
  }

  // HR-based estimate
  if (act.average_heartrate && maxHr > 0) {
    const IF_est = Math.min((act.average_heartrate / maxHr) * 1.08, 1.15);
    return {
      tss: Math.round(hours * IF_est * IF_est * 100 * 10) / 10,
      source: 'strava_estimated',
    };
  }

  // Flat estimate from default IF
  const IF = DEFAULT_IF.cycling;
  return {
    tss: Math.round(hours * IF * IF * 100 * 10) / 10,
    source: 'strava_estimated',
  };
}

// ── Token refresh ─────────────────────────────────────────────────────────────

async function getValidAccessToken(conn, env) {
  // 60-second buffer before expiry
  if (Date.now() < conn.expires_at_ms - 60_000) return conn.access_token;

  const resp = await fetch(STRAVA_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     env.STRAVA_CLIENT_ID,
      client_secret: env.STRAVA_CLIENT_SECRET,
      refresh_token: conn.refresh_token,
      grant_type:    'refresh_token',
    }),
  });

  if (!resp.ok) throw new Error(`Token refresh failed: ${resp.status}`);
  const data = await resp.json();

  await env.DB.prepare(`
    UPDATE strava_connections
    SET access_token = ?, refresh_token = ?, expires_at_ms = ?, updated_at_ms = ?
    WHERE user_id = ?
  `).bind(data.access_token, data.refresh_token, data.expires_at * 1000, Date.now(), conn.user_id).run();

  return data.access_token;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  // Auth
  const auth = request.headers.get('Authorization') ?? '';
  const rawToken = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!rawToken) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await verifyJwt(rawToken, env.JWT_SECRET);
  if (!payload) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = payload.userId;

  // Load connection + user preferences in parallel
  const [conn, prefsRow] = await Promise.all([
    env.DB.prepare(`
      SELECT access_token, refresh_token, expires_at_ms, last_sync_at_ms, user_id
      FROM strava_connections WHERE user_id = ?
    `).bind(userId).first(),
    env.DB.prepare(`SELECT preferences_json FROM user_preferences WHERE user_id = ?`)
      .bind(userId).first(),
  ]);

  if (!conn) return Response.json({ error: 'Strava not connected' }, { status: 404 });

  // Parse user prefs for FTP / max HR (used in TSS calculation)
  let ftpWatts = 0, maxHr = 0;
  try {
    const prefs = JSON.parse(prefsRow?.preferences_json ?? '{}');
    ftpWatts = prefs.cycling_coach?.ftp_watts ?? 0;
    maxHr    = prefs.cycling_coach?.max_hr ?? 0;
  } catch { /* ignore */ }

  // Get valid access token (refreshes if needed)
  let accessToken;
  try {
    accessToken = await getValidAccessToken(conn, env);
  } catch (e) {
    console.error('strava-sync token refresh:', e);
    return Response.json({ error: 'Token refresh failed — reconnect Strava' }, { status: 502 });
  }

  // Determine lookback window
  const nowSec  = Math.floor(Date.now() / 1000);
  const afterSec = conn.last_sync_at_ms
    ? Math.floor(conn.last_sync_at_ms / 1000) - 86400 // 1-day overlap to catch late-arriving activities
    : nowSec - MAX_LOOKBACK_DAYS * 86400;

  // Fetch activities from Strava (up to 2 pages = 200 activities)
  let activities = [];
  for (let page = 1; page <= 2; page++) {
    const url = `${STRAVA_ACTIVITIES_URL}?after=${afterSec}&per_page=${PER_PAGE}&page=${page}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      console.error('strava-sync activities fetch:', resp.status, await resp.text());
      break;
    }
    const batch = await resp.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    activities = activities.concat(batch);
    if (batch.length < PER_PAGE) break; // last page
  }

  // Process activities
  let imported = 0, skipped = 0;
  const byType = {};
  const nowMs  = Date.now();

  for (const act of activities) {
    const sportType = act.sport_type ?? act.type ?? 'Workout';
    const category  = CATEGORY[sportType] ?? 'fitness';
    const execType  = EXEC_TYPE_FOR[category] ?? 'strava_workout';
    const date      = (act.start_date_local ?? act.start_date ?? '').slice(0, 10);
    if (!date) continue;

    // TSS — only computed for cycling to keep PMC chart sport-specific
    let tssActual = null, tssSource = null;
    if (category === 'cycling') {
      const tssResult = estimateCyclingTss(act, ftpWatts, maxHr);
      tssActual = tssResult.tss;
      tssSource = tssResult.source;
    }

    const metadata = JSON.stringify({
      activity_id:        act.id,
      name:               act.name,
      type:               sportType,
      distance_m:         act.distance ?? null,
      elevation_m:        act.total_elevation_gain ?? null,
      average_watts:      act.average_watts ?? null,
      device_watts:       act.device_watts ?? false,
      average_heartrate:  act.average_heartrate ?? null,
      suffer_score:       act.suffer_score ?? null,
    });

    try {
      await env.DB.prepare(`
        INSERT INTO executions
          (id, user_id, date, day_plan_id, execution_type, status,
           total_duration_sec, perceived_exertion,
           tss_planned, tss_actual, tss_source,
           strava_activity_id, strava_metadata_json,
           created_at_ms, updated_at_ms)
        VALUES (?, ?, ?, NULL, ?, 'completed', ?, NULL, NULL, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, strava_activity_id)
          WHERE strava_activity_id IS NOT NULL
        DO NOTHING
      `).bind(
        crypto.randomUUID(), userId, date,
        execType,
        act.moving_time ?? act.elapsed_time ?? 0,
        tssActual, tssSource,
        act.id, metadata,
        nowMs, nowMs,
      ).run();

      // Count as imported (ON CONFLICT DO NOTHING → changes = 0 means skipped)
      byType[category] = (byType[category] ?? 0) + 1;
      imported++;
    } catch (e) {
      if (e.message?.includes('UNIQUE')) {
        skipped++;
      } else {
        console.error('strava-sync insert:', act.id, e.message);
        skipped++;
      }
    }
  }

  // Update last_sync_at_ms
  await env.DB.prepare(`
    UPDATE strava_connections SET last_sync_at_ms = ?, updated_at_ms = ? WHERE user_id = ?
  `).bind(nowMs, nowMs, userId).run();

  return Response.json({ ok: true, imported, skipped, by_type: byType });
}
