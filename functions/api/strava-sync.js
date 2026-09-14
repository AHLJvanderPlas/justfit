/**
 * /api/strava-sync
 *
 * POST — pull recent Strava activities for the authenticated athlete, classify
 *        them by sport, compute TSS for rides, and store them as executions.
 *
 * Returns { ok, imported, skipped, by_type, recent, rate_limit, truncated }.
 *
 * Policy notes (2026-06-01):
 *  §5.8  No entitlement gate — charging for API functionality is prohibited.
 *  §6.2  The raw Strava payload is stamped with a seven-day expiry and swept
 *        on every sync. The derived JustFit record (duration, sport, TSS)
 *        survives as our own training data.
 *  §6.1  Nothing here is ever shown to anyone but the athlete it belongs to.
 *
 * Rate limits are per application, not per athlete: 100 reads / 15 min and
 * 1,000 / day at base tier. Every response is inspected and a 429 is reported
 * rather than being swallowed as a successful empty sync.
 */

import { getAuthUserId } from './_shared/auth.js';
import {
  isConfigured, getConnection, getValidAccessToken,
  stravaFetch, readRateLimit, StravaError,
  sweepExpiredCache, categorise, CACHE_TTL_MS,
} from './_shared/strava.js';

const MAX_LOOKBACK_DAYS = 90;
const PER_PAGE          = 100;
// Five pages covers 500 activities in the window. Each page is one read against
// an app-wide budget, so this is a deliberate ceiling, not a guess.
const MAX_PAGES         = 5;

function json(body, status = 200) {
  return Response.json(body, { status });
}

// ── TSS estimation (cycling only — the PMC chart is sport-specific) ───────────

function estimateCyclingTss(act, ftpWatts, maxHr) {
  const hours = (act.moving_time || act.elapsed_time || 0) / 3600;
  if (hours < 0.05) return { tss: null, source: null };

  // device_watts confirms a real power meter rather than Strava's estimate.
  if (act.average_watts && act.device_watts && ftpWatts > 0) {
    const IF = act.average_watts / ftpWatts;
    return { tss: Math.round(hours * IF * IF * 1000) / 10, source: 'strava_power' };
  }

  if (act.average_heartrate && maxHr > 0) {
    const IF = Math.min((act.average_heartrate / maxHr) * 1.08, 1.15);
    return { tss: Math.round(hours * IF * IF * 1000) / 10, source: 'strava_estimated' };
  }

  const IF = 0.65; // flat default for rides with neither power nor HR
  return { tss: Math.round(hours * IF * IF * 1000) / 10, source: 'strava_estimated' };
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function onRequestPost(context) {
  const { request, env } = context;

  const userId = await getAuthUserId(request, env);
  if (!userId) return json({ error: 'Unauthorized' }, 401);
  if (!isConfigured(env)) return json({ error: 'Strava not configured' }, 503);

  const [conn, prefsRow] = await Promise.all([
    getConnection(env, userId),
    env.DB.prepare('SELECT preferences_json FROM user_preferences WHERE user_id = ?')
      .bind(userId).first(),
  ]);

  if (!conn) return json({ error: 'Strava not connected' }, 404);

  // §6.2 — expire stale cached payloads before doing anything else, so a failed
  // sync still honours the retention limit.
  const swept = await sweepExpiredCache(env, userId).catch(() => 0);

  let ftpWatts = 0, maxHr = 0;
  try {
    const prefs = JSON.parse(prefsRow?.preferences_json ?? '{}');
    ftpWatts = prefs.cycling_coach?.ftp_watts ?? 0;
    maxHr    = prefs.cycling_coach?.max_hr ?? 0;
  } catch { /* defaults are fine */ }

  let accessToken;
  try {
    accessToken = await getValidAccessToken(conn, env);
  } catch (e) {
    console.error('strava-sync token refresh:', e.message);
    return json({
      error: 'Strava authorisation expired — reconnect Strava.',
      needsReauth: e instanceof StravaError ? e.reauth : true,
      swept,
    }, 409);
  }

  // Always reach back at least seven days so activities that sync late from a
  // watch are never missed.
  const nowSec = Math.floor(Date.now() / 1000);
  const afterSec = conn.last_sync_at_ms
    ? Math.min(Math.floor(conn.last_sync_at_ms / 1000) - 86_400, nowSec - 7 * 86_400)
    : nowSec - MAX_LOOKBACK_DAYS * 86_400;

  // With `after`, Strava returns results oldest-first. The previous two-page cap
  // therefore imported the *oldest* 200 activities of a first sync and silently
  // dropped everything recent. Page until the window is exhausted.
  const activities = [];
  let truncated = false;
  let rateLimit = null;

  for (let page = 1; page <= MAX_PAGES; page++) {
    let resp;
    try {
      resp = await stravaFetch(
        `/athlete/activities?after=${afterSec}&per_page=${PER_PAGE}&page=${page}`,
        accessToken, env
      );
    } catch (e) {
      if (e instanceof StravaError && e.rateLimited) {
        // Partial results are still worth keeping; say so rather than
        // reporting a clean sync.
        return json({
          error: 'Strava rate limit reached — try again in 15 minutes.',
          rateLimited: true,
          imported: 0,
          partial: activities.length > 0,
        }, 429);
      }
      if (e instanceof StravaError && e.reauth) {
        return json({ error: 'Strava authorisation rejected — reconnect Strava.', needsReauth: true }, 409);
      }
      console.error('strava-sync fetch:', e.message);
      truncated = true;
      break;
    }

    rateLimit = readRateLimit(resp) ?? rateLimit;

    const batch = await resp.json();
    if (!Array.isArray(batch) || batch.length === 0) break;
    activities.push(...batch);
    if (batch.length < PER_PAGE) break;
    if (page === MAX_PAGES) truncated = true;
  }

  // ── Store ───────────────────────────────────────────────────────────────────

  let imported = 0, skipped = 0;
  const byType = {};
  const recent = [];
  const nowMs  = Date.now();
  const cacheExpiresAt = nowMs + CACHE_TTL_MS;

  for (const act of activities) {
    const { sportType, category, execType } = categorise(act);
    const date = (act.start_date_local ?? act.start_date ?? '').slice(0, 10);
    if (!date) continue;

    let tssActual = null, tssSource = null;
    if (category === 'cycling') {
      ({ tss: tssActual, source: tssSource } = estimateCyclingTss(act, ftpWatts, maxHr));
    }

    const metadata = JSON.stringify({
      activity_id:       act.id,
      name:              act.name,
      type:              sportType,
      distance_m:        act.distance ?? null,
      elevation_m:       act.total_elevation_gain ?? null,
      average_speed_ms:  act.average_speed ?? null,
      average_watts:     act.average_watts ?? null,
      device_watts:      act.device_watts ?? false,
      average_heartrate: act.average_heartrate ?? null,
      suffer_score:      act.suffer_score ?? null,
      calories:          act.calories ?? null,
      kilojoules:        act.kilojoules ?? null,
    });

    const activityId = Number(act.id);
    const duration   = act.moving_time ?? act.elapsed_time ?? 0;

    try {
      // Rides: reconcile with a cycling_coach session already logged that day
      // so a planned ride and its Strava record do not both appear.
      if (category === 'cycling') {
        const existing = await env.DB.prepare(`
          SELECT id, strava_activity_id FROM executions
           WHERE user_id = ? AND date = ? AND execution_type = 'cycling_coach' LIMIT 1
        `).bind(userId, date).first();

        if (existing) {
          if (!existing.strava_activity_id) {
            await env.DB.prepare(`
              UPDATE executions SET
                strava_activity_id = ?, strava_metadata_json = ?,
                strava_metadata_expires_at_ms = ?,
                tss_actual = COALESCE(tss_actual, ?), tss_source = COALESCE(tss_source, ?),
                updated_at_ms = ?
              WHERE id = ?
            `).bind(activityId, metadata, cacheExpiresAt, tssActual, tssSource, nowMs, existing.id).run();
            byType[category] = (byType[category] ?? 0) + 1;
            imported++;
            if (recent.length < 10) recent.push({ name: act.name, date, category, duration_sec: duration });
          } else {
            skipped++;
          }
          continue;
        }
      }

      const dayPlan = category === 'cycling'
        ? await env.DB.prepare('SELECT id FROM day_plans WHERE user_id = ? AND date = ? LIMIT 1')
            .bind(userId, date).first()
        : null;

      const res = await env.DB.prepare(`
        INSERT INTO executions
          (id, user_id, date, day_plan_id, execution_type, status,
           total_duration_sec, perceived_exertion,
           tss_planned, tss_actual, tss_source,
           strava_activity_id, strava_metadata_json, strava_metadata_expires_at_ms,
           created_at_ms, updated_at_ms)
        VALUES (?, ?, ?, ?, ?, 'completed', ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, strava_activity_id)
          WHERE strava_activity_id IS NOT NULL
        DO NOTHING
      `).bind(
        crypto.randomUUID(), userId, date,
        dayPlan?.id ?? null, execType, duration,
        tssActual, tssSource,
        activityId, metadata, cacheExpiresAt,
        nowMs, nowMs
      ).run();

      // DO NOTHING means it was already imported — that is a skip, not an import.
      if ((res?.meta?.changes ?? 1) === 0) { skipped++; continue; }

      byType[category] = (byType[category] ?? 0) + 1;
      imported++;
      if (recent.length < 10) recent.push({ name: act.name, date, category, duration_sec: duration });
    } catch (e) {
      skipped++;
      if (!e.message?.includes('UNIQUE')) {
        console.error('strava-sync insert:', act.id, e.message);
      }
    }
  }

  await env.DB.prepare(
    'UPDATE strava_connections SET last_sync_at_ms = ?, updated_at_ms = ? WHERE user_id = ?'
  ).bind(nowMs, nowMs, userId).run();

  return json({
    ok: true,
    imported,
    skipped,
    by_type: byType,
    recent,
    truncated,
    cache_swept: swept,
    rate_limit: rateLimit
      ? { short: `${rateLimit.usage.short}/${rateLimit.limit.short}`,
          daily: `${rateLimit.usage.daily}/${rateLimit.limit.daily}` }
      : null,
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ error: 'Method not allowed' }, 405);
}
