// GET /api/client/trainer
// Returns assigned trainer profile, gym team roster, pending switch/support requests, and allow_trainer_switch flag.

import { getUser } from '../_shared/auth.js';

const AVAIL_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

function resolveAvailability(status, updatedAtMs) {
  if (!updatedAtMs) return 'offline';
  if (Date.now() - updatedAtMs > AVAIL_TTL_MS) return 'offline';
  return status ?? 'offline';
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  try {
    const user = await getUser(request, env);
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Get client's gym membership
    const membership = await env.DB.prepare(`
      SELECT gm.gym_id, gm.assigned_trainer_user_id, gm.allow_trainer_switch,
             gm.availability_status, gm.availability_updated_at_ms,
             gm.consent_json,
             g.model AS gym_model, g.switch_auto_approve, g.name AS gym_name
      FROM gym_memberships gm
      JOIN gyms g ON g.id = gm.gym_id
      WHERE gm.user_id = ? AND gm.role = 'client' AND gm.status = 'active'
      LIMIT 1
    `).bind(user.userId).first();

    if (!membership) {
      return Response.json({
        gym_id: null, gym_model: null, assigned_trainer: null,
        gym_team: null, pending_switch_request: null,
        active_support_request: null, allow_trainer_switch: true,
      });
    }

    const gymId = membership.gym_id;
    const now = Date.now();

    // Parallel fetches
    const [assignedTrainer, teamRows, pendingSwitch, activeSupport] = await Promise.all([
      // Assigned trainer profile
      membership.assigned_trainer_user_id
        ? env.DB.prepare(`
            SELECT tp.user_id, tp.display_name, tp.bio, tp.photo_r2_key, tp.specialties_json,
                   gm.availability_status, gm.availability_updated_at_ms
            FROM trainer_profiles tp
            JOIN gym_memberships gm ON gm.user_id = tp.user_id AND gm.gym_id = ?
            WHERE tp.user_id = ?
            LIMIT 1
          `).bind(gymId, membership.assigned_trainer_user_id).first()
        : Promise.resolve(null),

      // Gym team roster (all trainers with show_in_client_app=1)
      env.DB.prepare(`
        SELECT tp.user_id, tp.display_name, tp.bio, tp.photo_r2_key, tp.specialties_json,
               gm.availability_status, gm.availability_updated_at_ms
        FROM gym_memberships gm
        JOIN trainer_profiles tp ON tp.user_id = gm.user_id
        WHERE gm.gym_id = ? AND gm.role IN ('trainer','owner')
          AND gm.status = 'active' AND gm.show_in_client_app = 1
        ORDER BY tp.display_name ASC
      `).bind(gymId).all(),

      // Pending switch request
      env.DB.prepare(`
        SELECT tsr.id, tsr.to_trainer_user_id, tsr.initiated_by, tsr.status, tsr.created_at_ms,
               tp.display_name AS to_trainer_name, tp.photo_r2_key AS to_trainer_photo_r2_key
        FROM trainer_switch_requests tsr
        LEFT JOIN trainer_profiles tp ON tp.user_id = tsr.to_trainer_user_id
        WHERE tsr.client_user_id = ? AND tsr.status = 'pending'
        ORDER BY tsr.created_at_ms DESC LIMIT 1
      `).bind(user.userId).first(),

      // Active support request
      env.DB.prepare(`
        SELECT sr.id, sr.status, sr.message, sr.broadcast, sr.created_at_ms,
               sr.accepted_at_ms, sr.reply_message, sr.accepted_by_user_id,
               tp.display_name AS accepted_by_name, tp.photo_r2_key AS accepted_by_photo_r2_key
        FROM support_requests sr
        LEFT JOIN trainer_profiles tp ON tp.user_id = sr.accepted_by_user_id
        WHERE sr.client_user_id = ? AND sr.status IN ('open','accepted')
        ORDER BY sr.created_at_ms DESC LIMIT 1
      `).bind(user.userId).first(),
    ]);

    const photoBase = 'https://assets.justfit.cc/';

    function formatTrainer(row) {
      if (!row) return null;
      let specialties = [];
      try { specialties = JSON.parse(row.specialties_json || '[]'); } catch { /* ignore */ }
      return {
        user_id: row.user_id,
        display_name: row.display_name,
        bio: row.bio,
        photo_url: row.photo_r2_key ? photoBase + row.photo_r2_key : null,
        specialties,
        availability_status: resolveAvailability(row.availability_status, row.availability_updated_at_ms),
      };
    }

    const team = (teamRows?.results ?? []).map(r => ({
      ...formatTrainer(r),
      is_assigned: r.user_id === membership.assigned_trainer_user_id,
    }));

    let consentData = null;
    try { consentData = JSON.parse(membership.consent_json || 'null'); } catch { /* ignore */ }
    const consentSigned = !!(consentData?.dpa_signed_at_ms);

    return Response.json({
      gym_id: gymId,
      gym_name: membership.gym_name ?? null,
      gym_model: membership.gym_model ?? 'staff',
      consent_signed: consentSigned,
      consent_at_ms: consentData?.dpa_signed_at_ms ?? null,
      assigned_trainer: formatTrainer(assignedTrainer),
      gym_team: team.length > 0 ? team : null,
      pending_switch_request: pendingSwitch ? {
        id: pendingSwitch.id,
        to_trainer_name: pendingSwitch.to_trainer_name,
        to_trainer_photo_url: pendingSwitch.to_trainer_photo_r2_key
          ? photoBase + pendingSwitch.to_trainer_photo_r2_key : null,
        initiated_by: pendingSwitch.initiated_by,
        status: pendingSwitch.status,
        created_at_ms: pendingSwitch.created_at_ms,
      } : null,
      active_support_request: activeSupport ? {
        id: activeSupport.id,
        status: activeSupport.status,
        message: activeSupport.message,
        broadcast: !!activeSupport.broadcast,
        created_at_ms: activeSupport.created_at_ms,
        accepted_at_ms: activeSupport.accepted_at_ms,
        reply_message: activeSupport.reply_message,
        accepted_by: activeSupport.accepted_by_user_id ? {
          display_name: activeSupport.accepted_by_name,
          photo_url: activeSupport.accepted_by_photo_r2_key
            ? photoBase + activeSupport.accepted_by_photo_r2_key : null,
        } : null,
      } : null,
      allow_trainer_switch: membership.allow_trainer_switch !== 0,
    });
  } catch (e) {
    console.error('GET /api/client/trainer', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
