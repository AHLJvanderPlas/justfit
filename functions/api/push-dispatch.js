/**
 * /api/push-dispatch
 *
 * POST — dispatches Web Push notifications to subscribers who have not
 *        logged a workout today (UTC). Intended to be called by a Cloudflare
 *        Cron trigger (or any authenticated external scheduler) once per day.
 *
 * Required env vars:
 *   PUSH_DISPATCH_SECRET  — Bearer token for incoming auth (set in CF Pages env)
 *   VAPID_PRIVATE_KEY     — base64url-encoded raw P-256 private key (32 bytes)
 *   VAPID_PUBLIC_KEY      — base64url-encoded uncompressed P-256 public key (65 bytes)
 *   VAPID_SUBJECT         — "mailto:noreply@justfit.cc" or your app URL
 *
 * Returns { ok, sent, failed, skipped }.
 */

// ── Utilities ─────────────────────────────────────────────────────────────────

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}

// ── VAPID JWT (RFC 8292) ──────────────────────────────────────────────────────

async function makeVapidJWT(vapidPrivateKeyB64, audience, subject) {
  const header  = { alg: 'ES256', typ: 'JWT' };
  const payload = { aud: audience, exp: Math.floor(Date.now() / 1000) + 43200, sub: subject };
  const unsigned =
    btoa(JSON.stringify(header)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'') + '.' +
    btoa(JSON.stringify(payload)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');

  const rawKey = fromB64url(vapidPrivateKeyB64);
  const key = await crypto.subtle.importKey(
    'pkcs8', toPkcs8(rawKey),
    { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned)
  );
  return unsigned + '.' + b64url(sig);
}

// Wrap a raw 32-byte P-256 private key in a minimal PKCS#8 DER envelope.
function toPkcs8(rawKey) {
  // PKCS#8 prefix for P-256: 30 41 02 01 00 30 13 06 07 2a 86 48 ce 3d 02 01 06 08 2a 86 48 ce 3d 03 01 07 04 27 30 25 02 01 01 04 20
  const prefix = new Uint8Array([
    0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06,
    0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03,
    0x01, 0x07, 0x04, 0x27, 0x30, 0x25, 0x02, 0x01,
    0x01, 0x04, 0x20,
  ]);
  const buf = new Uint8Array(prefix.length + rawKey.length);
  buf.set(prefix);
  buf.set(rawKey, prefix.length);
  return buf.buffer;
}

// ── Web Push encryption (RFC 8291 / aes128gcm) ───────────────────────────────

async function encryptPush(p256dhB64, authB64, plaintext) {
  const subscriberPublicKeyBytes = fromB64url(p256dhB64);
  const authSecret               = fromB64url(authB64);
  const salt                     = crypto.getRandomValues(new Uint8Array(16));

  // Import subscriber's public key
  const subscriberKey = await crypto.subtle.importKey(
    'raw', subscriberPublicKeyBytes,
    { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );

  // Generate ephemeral sender key pair
  const ephemeral = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const ephemeralPublicRaw = new Uint8Array(
    await crypto.subtle.exportKey('raw', ephemeral.publicKey)
  );

  // Derive ECDH shared secret (32 bytes)
  const ecdhBits = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: subscriberKey },
      ephemeral.privateKey, 256
    )
  );

  // PRK = HKDF-SHA-256(salt=authSecret, IKM=ecdhBits, info="WebPush: info\0"+subscriberPublicKey+ephemeralPublicKey)
  const hkdfKey = await crypto.subtle.importKey(
    'raw', ecdhBits, 'HKDF', false, ['deriveBits']
  );

  const infoLabel = new TextEncoder().encode('WebPush: info\0');
  const prk_info = concat(infoLabel, subscriberPublicKeyBytes, ephemeralPublicRaw);

  const ikm = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: authSecret, info: prk_info },
    hkdfKey, 256
  );

  // CEK = HKDF-SHA-256(salt=salt, IKM=ikm, info="Content-Encoding: aes128gcm\0", 16 bytes)
  const ikmKey = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);

  const cekInfo   = new TextEncoder().encode('Content-Encoding: aes128gcm\0');
  const nonceInfo = new TextEncoder().encode('Content-Encoding: nonce\0');

  const cekBits   = new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: cekInfo },   ikmKey, 128));
  const nonceBits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info: nonceInfo }, ikmKey, 96));

  const cek = await crypto.subtle.importKey('raw', cekBits, 'AES-GCM', false, ['encrypt']);

  // Pad plaintext to hide length (2-byte little-endian padding length header + content + 0x02 delimiter)
  const content = new TextEncoder().encode(plaintext);
  const padLen  = 0;
  const padded  = new Uint8Array(2 + padLen + 1 + content.length);
  padded[0] = padLen >> 8;
  padded[1] = padLen & 0xff;
  padded[2 + padLen] = 0x02; // delimiter
  padded.set(content, 2 + padLen + 1);

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonceBits }, cek, padded)
  );

  // Build aes128gcm content-encoding header + ciphertext
  // Header: salt(16) + record_size(4, big-endian) + key_id_len(1) + key_id(ephemeralPublicRaw)
  const recordSize = padded.length + 16 + 17; // padded + GCM tag + header
  const header = new Uint8Array(16 + 4 + 1 + ephemeralPublicRaw.length);
  header.set(salt, 0);
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8)  & 0xff;
  header[19] = recordSize & 0xff;
  header[20] = ephemeralPublicRaw.length;
  header.set(ephemeralPublicRaw, 21);

  return concat(header, ciphertext);
}

function concat(...arrays) {
  const total = arrays.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const a of arrays) { out.set(a, offset); offset += a.length; }
  return out;
}

// ── Send a single Web Push notification ──────────────────────────────────────

async function sendPush(subscription, payloadText, env) {
  const { endpoint, p256dh, auth } = subscription;
  const url  = new URL(endpoint);
  const aud  = `${url.protocol}//${url.host}`;

  const jwt = await makeVapidJWT(env.VAPID_PRIVATE_KEY, aud, env.VAPID_SUBJECT ?? 'mailto:noreply@justfit.cc');
  const body = await encryptPush(p256dh, auth, payloadText);

  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      'Content-Type':  'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
    },
    body,
  });

  return resp.status;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function onRequest({ request, env }) {
  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // Auth check — bearer token from env
  const secret = env.PUSH_DISPATCH_SECRET;
  if (!secret) {
    console.error('[push-dispatch] PUSH_DISPATCH_SECRET not configured');
    return new Response('Not configured', { status: 503 });
  }
  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (!env.VAPID_PRIVATE_KEY || !env.VAPID_PUBLIC_KEY) {
    return Response.json({ error: 'VAPID keys not configured' }, { status: 503 });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    // Fetch subscriptions for users who have NOT logged a workout today
    const rows = await env.DB.prepare(`
      SELECT DISTINCT ps.id, ps.user_id, ps.endpoint, ps.p256dh, ps.auth
      FROM push_subscriptions ps
      WHERE ps.user_id NOT IN (
        SELECT DISTINCT user_id FROM executions WHERE date = ? AND status != 'skipped'
      )
      LIMIT 500
    `).bind(today).all();

    const subscriptions = rows.results ?? [];
    if (subscriptions.length === 0) {
      return Response.json({ ok: true, sent: 0, failed: 0, skipped: 0 });
    }

    const payload = JSON.stringify({
      title: 'JustFit',
      body: 'Jouw training staat klaar. Tap om te beginnen.',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `jf-daily-${today}`,
    });

    let sent = 0, failed = 0, expired = 0;
    const toDelete = [];

    for (const sub of subscriptions) {
      try {
        const status = await sendPush(sub, payload, env);
        if (status === 201 || status === 200) {
          sent++;
        } else if (status === 404 || status === 410) {
          // Subscription expired or unregistered — clean up
          toDelete.push(sub.id);
          expired++;
        } else {
          console.warn(`[push-dispatch] unexpected status ${status} for sub ${sub.id}`);
          failed++;
        }
      } catch (e) {
        console.error(`[push-dispatch] error sending to ${sub.id}:`, e);
        failed++;
      }
    }

    // Remove expired subscriptions
    if (toDelete.length > 0) {
      for (const id of toDelete) {
        await env.DB.prepare('DELETE FROM push_subscriptions WHERE id = ?').bind(id).run().catch(() => {});
      }
    }

    return Response.json({ ok: true, sent, failed, skipped: expired });
  } catch (e) {
    console.error('[push-dispatch]', e);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
