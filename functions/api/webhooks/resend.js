/**
 * POST /api/webhooks/resend — X-7: notice when email delivery fails.
 *
 * A bounced magic-link email is the worst failure mode this product has: the user
 * cannot log in, and cannot tell you they cannot log in. Today nothing observes it.
 *
 * Resend signs webhooks with Svix. The signature covers `{id}.{timestamp}.{body}`,
 * HMAC-SHA256 with the base64 secret that follows the `whsec_` prefix. The header
 * can carry several space-separated `v1,<sig>` values during secret rotation, so
 * every one is checked.
 *
 * Follows the Mollie handler's convention: always answer 200. A webhook endpoint
 * that returns an error gets retried, and a retry storm on a logging endpoint helps
 * nobody. Failures are logged and swallowed.
 */

const RELEVANT = new Set(['email.bounced', 'email.complained', 'email.delivery_delayed']);
const TOLERANCE_SEC = 5 * 60;

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function verifySvix(secret, svixId, svixTimestamp, svixSignature, body) {
  if (!secret || !svixId || !svixTimestamp || !svixSignature) return false;

  // Reject stale payloads — a captured webhook must not be replayable forever.
  const ts = Number(svixTimestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > TOLERANCE_SEC) return false;

  const raw = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  let keyBytes;
  try {
    keyBytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
  } catch { return false; }

  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const signed = `${svixId}.${svixTimestamp}.${body}`;
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  // `v1,<sig> v1,<sig2>` during rotation — any match is valid.
  return svixSignature.split(' ').some((part) => {
    const [version, sig] = part.split(',');
    return version === 'v1' && sig && timingSafeEqual(sig, expected);
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.RESEND_WEBHOOK_SECRET) return new Response('OK', { status: 200 });

  let body;
  try { body = await request.text(); } catch { return new Response('OK', { status: 200 }); }

  const ok = await verifySvix(
    env.RESEND_WEBHOOK_SECRET,
    request.headers.get('svix-id'),
    request.headers.get('svix-timestamp'),
    request.headers.get('svix-signature'),
    body
  ).catch(() => false);

  if (!ok) {
    // Unsigned or stale. Say nothing useful to the caller; this endpoint is not a
    // signature oracle. 200 so a misconfigured secret does not trigger retries.
    console.error('[resend-webhook] signature rejected');
    return new Response('OK', { status: 200 });
  }

  let evt;
  try { evt = JSON.parse(body); } catch { return new Response('OK', { status: 200 }); }

  const type = evt?.type;
  if (!RELEVANT.has(type)) return new Response('OK', { status: 200 });

  const data = evt?.data ?? {};
  const recipient = Array.isArray(data.to) ? data.to[0] : (data.to ?? null);

  try {
    // Resolve the user so support can act on it, but never fail on a miss —
    // transactional mail also goes to addresses with no account yet.
    let userId = null;
    if (recipient) {
      const row = await env.DB.prepare(
        'SELECT id FROM users WHERE lower(primary_email) = lower(?) LIMIT 1'
      ).bind(recipient).first();
      userId = row?.id ?? null;
    }

    await env.DB.prepare(
      `INSERT INTO app_events (id, user_id, user_email, event_type, detail, created_at_ms)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      crypto.randomUUID(),
      userId,
      recipient,
      type === 'email.complained' ? 'email_complained'
        : type === 'email.delivery_delayed' ? 'email_delayed'
        : 'email_bounced',
      JSON.stringify({
        subject: data.subject ?? null,
        email_id: data.email_id ?? null,
        reason: data.bounce?.message ?? data.reason ?? null,
        bounce_type: data.bounce?.type ?? null,
        // Knowing it was a magic link vs. an invoice changes how urgent this is.
        has_account: !!userId,
      }),
      Date.now()
    ).run();
  } catch (e) {
    console.error('[resend-webhook] insert failed:', e.message);
  }

  return new Response('OK', { status: 200 });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  // Resend sends no GET challenge; anything else is noise.
  return new Response('OK', { status: 200 });
}
