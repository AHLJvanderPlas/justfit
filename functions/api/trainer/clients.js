// GET /api/trainer/clients — returns Person Cards for all connected clients (P1B)
import { requireGymContext } from '../../lib/middleware.js';
import { unwrapGymKey, decryptField } from '../../lib/crypto.js';

/** Build a Person Card from a disclosure row + gym key. */
async function buildPersonCard(disc, gymKey) {
  const level = disc.level ?? 'L1';
  const card = {
    handle:       'u_' + disc.user_id.slice(-6).toLowerCase(),
    user_id:      disc.user_id,
    display_name: disc.display_name,
    photo_url:    disc.photo_r2_key ? `https://assets.justfit.cc/${disc.photo_r2_key}` : null,
    level,
    verified:     disc.email_verified === 1 || disc.phone_verified === 1,
    billable:     ['L3','L4'].includes(level),
    contact:      null,
    billing:      null,
    shares: {
      checkins:   disc.share_checkins === 1,
      pain_rpe:   disc.share_pain_rpe === 1,
      body_metrics: disc.share_body_metrics === 1,
      training_history: disc.share_training_history === 1,
      detailed_adherence: disc.share_detailed_adherence === 1,
    },
    has_contraindications: disc.has_contraindications === 1,
    last_session_date: disc.last_session_date ?? null,
    intake_completed: disc.intake_completed_at_ms != null,
    consent_purpose: disc.consent_purpose,
    connected_at_ms: disc.consented_at_ms,
  };

  if (gymKey && level >= 'L3') {
    const [firstName, lastName, billingName, billingAddr, billingPostal, billingCity, billingVat] = await Promise.all([
      decryptField(disc.real_name_first_enc, gymKey),
      decryptField(disc.real_name_last_enc, gymKey),
      decryptField(disc.billing_name_enc, gymKey),
      decryptField(disc.billing_address_enc, gymKey),
      decryptField(disc.billing_postal_enc, gymKey),
      decryptField(disc.billing_city_enc, gymKey),
      decryptField(disc.billing_vat_enc, gymKey),
    ]);
    card.billing = {
      name:    billingName || [firstName, lastName].filter(Boolean).join(' ') || null,
      address: billingAddr,
      postal:  billingPostal,
      city:    billingCity,
      country: disc.billing_country,
      vat:     billingVat,
    };
  }

  if (gymKey && level === 'L4') {
    const [email, phone] = await Promise.all([
      decryptField(disc.contact_email_enc, gymKey),
      decryptField(disc.contact_phone_enc, gymKey),
    ]);
    card.contact = { email, phone };
  }

  return card;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'GET') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner','trainer']);
  if (ctx instanceof Response) return ctx;
  const { gymId, gym } = ctx;

  const rows = await env.DB.prepare(
    `SELECT td.*,
            ci.completed_at_ms AS intake_completed_at_ms,
            (SELECT MAX(e.date) FROM executions e
               JOIN assigned_sessions asgn ON asgn.executed_session_id = e.id
               JOIN program_assignments pa ON pa.id = asgn.program_assignment_id
              WHERE pa.client_user_id = td.user_id AND pa.gym_id = ?) AS last_session_date,
            (SELECT 1 FROM client_intake ci2
              WHERE ci2.user_id = td.user_id AND ci2.gym_id = ? LIMIT 1) AS intake_completed,
            (SELECT 1 FROM client_intake ci3
              WHERE ci3.user_id = td.user_id AND ci3.gym_id = ?
                AND json_array_length(ci3.contraindications_json) > 0 LIMIT 1) AS has_contraindications
     FROM trainer_disclosures td
     WHERE td.gym_id = ?
     ORDER BY td.display_name ASC`
  ).bind(gymId, gymId, gymId, gymId).all();

  if (!rows.results?.length) return Response.json([]);

  let gymKey = null;
  if (gym.encryption_key_enc && gym.encryption_key_enc !== 'PENDING_KEY_GENERATION' && env.GYM_MASTER_KEK) {
    try { gymKey = await unwrapGymKey(gym.encryption_key_enc, env.GYM_MASTER_KEK); } catch {}
  }

  const cards = await Promise.all(rows.results.map(r => buildPersonCard(r, gymKey)));
  return Response.json(cards);
}
