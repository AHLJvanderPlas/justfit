/**
 * /api/webhooks/strava — S-3: reflect Strava deletions within 48 hours (§6.3).
 *
 * This is not an optimisation of the existing sync. Polling `/athlete/activities`
 * with `after=` **structurally cannot** observe a deletion: a deleted activity
 * simply stops appearing, which is indistinguishable from it never having existed.
 * No amount of polling closes the gap, so the Webhook Events API is the only route
 * to §6.3 compliance, and any tier review will check it.
 *
 * GET  — subscription validation. Strava calls this once when the subscription is
 *        created and expects `hub.challenge` echoed back.
 * POST — events. Strava retries on failure, so every path is idempotent and the
 *        handler always answers 200 (same reasoning as the Resend handler).
 *
 * Events handled:
 *   activity + delete            → drop our copy of that activity
 *   activity + update            → expire the cached payload so the next sync refetches
 *   athlete  + update (deauth)   → the athlete revoked us at Strava's end; purge
 *                                  everything, exactly as our own disconnect does
 *
 * Registration is a one-off POST to /push_subscriptions. It cannot be done while the
 * Strava application is marked Inactive (S-1), so this handler ships ready and is
 * subscribed the day the app is reactivated.
 */

import { purgeStravaData } from '../_shared/strava.js';

/** GET — echo the challenge so Strava will accept the subscription. */
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !challenge) {
    return Response.json({ error: 'Bad request' }, { status: 400 });
  }
  // The verify token is the only thing proving this challenge came from our own
  // subscription request rather than someone pointing Strava at our endpoint.
  if (!env.STRAVA_WEBHOOK_VERIFY_TOKEN || token !== env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    console.error('[strava-webhook] challenge rejected: verify token mismatch');
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  return Response.json({ 'hub.challenge': challenge });
}

export async function onRequestPost({ request, env }) {
  let evt;
  try { evt = await request.json(); } catch { return new Response('OK', { status: 200 }); }

  const objectType = evt?.object_type;
  const aspect     = evt?.aspect_type;
  const objectId   = evt?.object_id;
  const ownerId    = evt?.owner_id;

  if (!objectType || !aspect || !ownerId) return new Response('OK', { status: 200 });

  try {
    const conn = await env.DB.prepare(
      'SELECT user_id FROM strava_connections WHERE athlete_id = ? LIMIT 1'
    ).bind(Number(ownerId)).first();

    // No connection: either never connected or already disconnected. Both are
    // correct end states, so acknowledge and stop.
    if (!conn?.user_id) return new Response('OK', { status: 200 });
    const userId = conn.user_id;

    if (objectType === 'athlete' && aspect === 'update') {
      // Strava sends updates.authorized === 'false' when the athlete revokes access
      // from their side. Treat it exactly as our own disconnect: revoking there and
      // keeping their data here would be the worst of both.
      const authorized = evt?.updates?.authorized;
      if (authorized === 'false' || authorized === false) {
        await purgeStravaData(env, userId);
        await env.DB.prepare('DELETE FROM strava_connections WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare(
          `INSERT INTO app_events (id, user_id, event_type, detail, created_at_ms) VALUES (?, ?, 'strava_deauthorized', ?, ?)`
        ).bind(crypto.randomUUID(), userId, JSON.stringify({ athlete_id: ownerId }), Date.now()).run();
      }
      return new Response('OK', { status: 200 });
    }

    if (objectType !== 'activity') return new Response('OK', { status: 200 });

    if (aspect === 'delete') {
      // §6.3 — the athlete deleted it there, so it goes here too. Steps first: they
      // carry the FK. Deleting an already-deleted row is a no-op, which is the
      // correct response to a retry rather than an error.
      const row = await env.DB.prepare(
        'SELECT id FROM executions WHERE user_id = ? AND strava_activity_id = ? LIMIT 1'
      ).bind(userId, Number(objectId)).first();

      if (row?.id) {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM execution_steps WHERE execution_id = ?').bind(row.id),
          env.DB.prepare('DELETE FROM executions WHERE id = ?').bind(row.id),
        ]);
      } else {
        // A JustFit session that was merely linked to the activity keeps its own
        // training record — that is our data, not Strava Data — but must shed the
        // Strava payload and identifier.
        await env.DB.prepare(
          `UPDATE executions
              SET strava_activity_id = NULL, strava_metadata_json = NULL,
                  strava_metadata_expires_at_ms = NULL, updated_at_ms = ?
            WHERE user_id = ? AND strava_activity_id = ?`
        ).bind(Date.now(), userId, Number(objectId)).run();
      }
      return new Response('OK', { status: 200 });
    }

    if (aspect === 'update') {
      // Title, type or privacy changed. Expire the cached payload rather than
      // refetching here: the next sync already knows how to fill it, and a webhook
      // should not make outbound API calls against a rate limit it cannot see.
      await env.DB.prepare(
        `UPDATE executions SET strava_metadata_expires_at_ms = ?, updated_at_ms = ?
          WHERE user_id = ? AND strava_activity_id = ?`
      ).bind(Date.now() - 1, Date.now(), userId, Number(objectId)).run();
    }
  } catch (e) {
    console.error('[strava-webhook]', e.message);
  }

  return new Response('OK', { status: 200 });
}

export async function onRequest(context) {
  const m = context.request.method;
  if (m === 'GET')  return onRequestGet(context);
  if (m === 'POST') return onRequestPost(context);
  return new Response('OK', { status: 200 });
}
