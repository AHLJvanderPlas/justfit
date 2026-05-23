// POST /api/trainer/clients/invite — trainer sends an email invite to a client
import { requireGymContext } from '../../../lib/middleware.js';

function inviteEmailHtml(gymName, trainerName, acceptUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- Header -->
  <tr><td style="background:#020617;border-radius:16px 16px 0 0;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#10b981;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
        <span style="color:#fff;font-weight:900;font-size:12px;line-height:32px;">JF</span>
      </td>
      <td style="padding-left:10px;font-size:17px;font-weight:900;letter-spacing:-0.02em;color:#f8fafc;">
        Just<span style="color:#10b981;">Fit</span>.cc
      </td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#020617;padding:32px 32px 40px;border-radius:0 0 16px 16px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:0.15em;color:#10b981;text-transform:uppercase;">Trainer Invite</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;letter-spacing:-0.02em;color:#f8fafc;">${trainerName} wants to connect</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
      ${trainerName} at <strong style="color:#e2e8f0;">${gymName}</strong> has invited you to connect on JustFit.
      Accept to share your training data and receive personalised programming.
    </p>
    <a href="${acceptUrl}"
       style="display:inline-block;padding:14px 28px;background:#10b981;color:#020617;border-radius:12px;font-weight:900;font-size:15px;text-decoration:none;letter-spacing:-0.01em;">
      Accept Invitation →
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#475569;line-height:1.6;">
      This invite expires in 7 days. If you didn't expect this, you can safely ignore it.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 0 0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;">
      <a href="https://justfit.cc" style="color:#10b981;text-decoration:none;">justfit.cc</a> &mdash; Consistency over Intensity
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

function signupInviteEmailHtml(gymName, trainerName, signupUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

  <!-- Header -->
  <tr><td style="background:#020617;border-radius:16px 16px 0 0;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.08);">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#10b981;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
        <span style="color:#fff;font-weight:900;font-size:12px;line-height:32px;">JF</span>
      </td>
      <td style="padding-left:10px;font-size:17px;font-weight:900;letter-spacing:-0.02em;color:#f8fafc;">
        Just<span style="color:#10b981;">Fit</span>.cc
      </td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#020617;padding:32px 32px 40px;border-radius:0 0 16px 16px;">
    <p style="margin:0 0 6px;font-size:11px;font-weight:900;letter-spacing:0.15em;color:#10b981;text-transform:uppercase;">You're Invited</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;letter-spacing:-0.02em;color:#f8fafc;">Start training with ${trainerName}</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#94a3b8;line-height:1.6;">
      ${trainerName} at <strong style="color:#e2e8f0;">${gymName}</strong> has invited you to JustFit —
      your daily adaptive training coach.
    </p>
    <a href="${signupUrl}"
       style="display:inline-block;padding:14px 28px;background:#10b981;color:#020617;border-radius:12px;font-weight:900;font-size:15px;text-decoration:none;letter-spacing:-0.01em;">
      Get Started →
    </a>
    <p style="margin:24px 0 0;font-size:12px;color:#475569;line-height:1.6;">
      This invite expires in 7 days. Create your account and your trainer connection will be set up automatically.
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:20px 0 0;text-align:center;">
    <p style="margin:0;font-size:12px;color:#64748b;">
      <a href="https://justfit.cc" style="color:#10b981;text-decoration:none;">justfit.cc</a> &mdash; Consistency over Intensity
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  const ctx = await requireGymContext(request, env, ['owner', 'trainer']);
  if (ctx instanceof Response) return ctx;
  const { gymId, gym, user } = ctx;

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const { email } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Valid email required' }, { status: 400 });
  }
  const emailLower = email.toLowerCase();

  // Check if user is already an active member
  const existing = await env.DB.prepare(
    `SELECT gm.status FROM gym_memberships gm
     JOIN users u ON u.id = gm.user_id
     WHERE gm.gym_id = ? AND LOWER(u.primary_email) = ? AND gm.status = 'active'`
  ).bind(gymId, emailLower).first();
  if (existing) return Response.json({ error: 'already_member' }, { status: 409 });

  // Revoke any existing pending invite for this email+gym
  await env.DB.prepare(
    `UPDATE trainer_invites SET status='expired' WHERE gym_id=? AND email=? AND status='pending'`
  ).bind(gymId, emailLower).run();

  // Get trainer display name
  const trainerRow = await env.DB.prepare(
    `SELECT display_name FROM users WHERE id = ?`
  ).bind(user.userId).first();
  const trainerName = trainerRow?.display_name ?? 'Your trainer';

  const inviteToken = crypto.randomUUID();
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 days

  await env.DB.prepare(
    `INSERT INTO trainer_invites (id, gym_id, email, invite_token, status, created_at, expires_at)
     VALUES (?, ?, ?, ?, 'pending', ?, ?)`
  ).bind(crypto.randomUUID(), gymId, emailLower, inviteToken, now, expiresAt).run();

  if (env.RESEND_API_KEY) {
    // Check if the email belongs to an existing JustFit user
    const existingUser = await env.DB.prepare(
      `SELECT 1 FROM users WHERE LOWER(primary_email) = ? LIMIT 1`
    ).bind(emailLower).first();

    const html = existingUser
      ? inviteEmailHtml(gym.name, trainerName, `https://app.justfit.cc/trainer-invite?t=${inviteToken}`)
      : signupInviteEmailHtml(gym.name, trainerName, `https://app.justfit.cc/signup?invite=${inviteToken}`);
    const subject = existingUser
      ? `${trainerName} wants to connect with you on JustFit`
      : `${trainerName} invited you to JustFit`;

    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({ from: 'JustFit.cc <noreply@justfit.cc>', to: [emailLower], subject, html }),
    }).catch(() => {});
  }

  return Response.json({ ok: true, invite_token: inviteToken, expires_at: expiresAt });
}
