// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const JWT_EXPIRY    = 60 * 60 * 24 * 7; // 7 days  (session tokens)
const RESET_EXPIRY  = 60 * 15;           // 15 min  (password reset + magic links)
const WEBAUTHN_EXPIRY = 120;             // 2 min   (WebAuthn challenge tokens)
const RP_ID         = 'justfit.cc';
const ALLOWED_ORIGINS = ['https://justfit.cc', 'https://justfit.pages.dev'];

// ─── BASE64URL HELPERS ────────────────────────────────────────────────────────
function b64url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

// ─── DER → RAW ECDSA SIGNATURE CONVERSION ────────────────────────────────────
// WebAuthn returns DER-encoded ECDSA sigs; crypto.subtle needs raw (r||s)
function derToRaw(sig) {
  let pos = 2; // skip 0x30 + totalLen
  const rLen = sig[pos + 1];
  const r = sig.slice(pos + 2, pos + 2 + rLen);
  pos += 2 + rLen;
  const sLen = sig[pos + 1];
  const s = sig.slice(pos + 2, pos + 2 + sLen);
  const out = new Uint8Array(64);
  // r and s may be 33 bytes (leading 0x00 padding for positive); trim to last 32
  out.set(r.slice(-32), 32 - Math.min(r.length, 32));
  out.set(s.slice(-32), 64 - Math.min(s.length, 32));
  return out;
}

// ─── JWT HELPERS ──────────────────────────────────────────────────────────────
async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64url(sig);
}

async function createJWT(payload, secret, expirySeconds = JWT_EXPIRY) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body   = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expirySeconds }));
  const sig    = await hmacSign(`${header}.${body}`, secret);
  return `${header}.${body}.${sig}`;
}

async function verifyJWT(token, secret) {
  try {
    const [header, body, sig] = token.split('.');
    const expected = await hmacSign(`${header}.${body}`, secret);
    if (sig !== expected) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ─── PASSWORD HASHING ─────────────────────────────────────────────────────────
async function hashPassword(password, salt, secret) {
  const data = new TextEncoder().encode(salt + password + secret);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

// ─── EMAIL SENDING ────────────────────────────────────────────────────────────
async function sendEmail(to, subject, html, apiKey) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'JustFit.cc <hello@justfit.cc>', to: [to], subject, html }),
  });
}

function emailWrap(content) {
  return `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#020617;color:#f8fafc;padding:40px 32px;border-radius:16px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
      <div style="width:36px;height:36px;background:#10b981;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#fff;">JF</div>
      <span style="font-weight:900;font-size:18px;">JustFit<span style="color:#10b981">.cc</span></span>
    </div>
    ${content}
    <p style="color:#334155;font-size:11px;margin-top:40px;">JustFit.cc — Privacy-first fitness. We never sell your data.</p>
  </div>`;
}

async function sendWelcomeEmail(email, apiKey) {
  await sendEmail(email, 'Welcome to JustFit.cc — Consistency starts today', emailWrap(`
    <h1 style="font-size:28px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;">You're in.</h1>
    <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Your first plan is ready. Check in daily — even 10 minutes counts. Consistency beats intensity every time.</p>
    <a href="https://justfit.cc" style="display:inline-block;background:#10b981;color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;letter-spacing:0.04em;">Open JustFit →</a>
  `), apiKey);
}

// ─── REQUEST HANDLERS ─────────────────────────────────────────────────────────
async function handleSignup({ email, password }, env, secret) {
  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
  if (password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const emailLower = email.toLowerCase().trim();
  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(emailLower).first();

  if (existing) return Response.json({ error: 'Email already registered' }, { status: 409 });

  const userId = crypto.randomUUID();
  const salt   = crypto.randomUUID();
  const hash   = await hashPassword(password, salt, secret);
  const now    = Date.now();

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id, status, primary_email, created_at_ms, updated_at_ms) VALUES (?, 'active', ?, ?, ?)`)
      .bind(userId, emailLower, now, now),
    env.DB.prepare(`INSERT INTO auth_users (id, user_id, provider, email, email_verified, password_hash, password_algo, created_at_ms, updated_at_ms) VALUES (?, ?, 'password', ?, 0, ?, 'sha256+salt', ?, ?)`)
      .bind(crypto.randomUUID(), userId, emailLower, `${salt}:${hash}`, now, now),
    env.DB.prepare(`INSERT INTO entitlements (id, user_id, product_code, source, status, starts_at_ms, created_at_ms, updated_at_ms) VALUES (?, ?, 'justfit_trial', 'manual', 'trialing', ?, ?, ?)`)
      .bind(crypto.randomUUID(), userId, now, now, now),
  ]);

  if (env.RESEND_API_KEY) sendWelcomeEmail(emailLower, env.RESEND_API_KEY).catch(() => {});

  const token = await createJWT({ userId, email: emailLower }, secret);
  return Response.json({ ok: true, token, userId });
}

async function handleLogin({ email, password }, env, secret) {
  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  const authUser = await env.DB.prepare(
    `SELECT a.id, a.user_id, a.password_hash FROM auth_users a WHERE a.email = ? AND a.provider = 'password' LIMIT 1`
  ).bind(emailLower).first();

  if (!authUser) return Response.json({ error: 'Invalid email or password' }, { status: 401 });

  const [salt, storedHash] = authUser.password_hash.split(':');
  const inputHash = await hashPassword(password, salt, secret);
  if (inputHash !== storedHash) return Response.json({ error: 'Invalid email or password' }, { status: 401 });

  await env.DB.prepare(`UPDATE auth_users SET last_login_at_ms = ? WHERE id = ?`)
    .bind(Date.now(), authUser.id).run();

  const token = await createJWT({ userId: authUser.user_id, email: emailLower }, secret);
  return Response.json({ ok: true, token, userId: authUser.user_id });
}

async function handleForgotPassword({ email }, env, secret) {
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  const user = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(emailLower).first();

  if (user && env.RESEND_API_KEY) {
    const resetToken = await createJWT({ type: 'pwd_reset', userId: user.id, email: emailLower }, secret, RESET_EXPIRY);
    const resetUrl = `https://justfit.cc/reset-password.html?token=${resetToken}`;
    sendEmail(emailLower, 'Reset your JustFit.cc password', emailWrap(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Reset your password</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Click the button below to set a new password. This link expires in 15 minutes.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#10b981;color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Reset Password →</a>
      <p style="color:#334155;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
    `), env.RESEND_API_KEY).catch(() => {});
  }

  // Always return success — don't reveal whether email is registered
  return Response.json({ ok: true, message: 'If this email is registered, a reset link has been sent.' });
}

async function handleResetPassword({ reset_token, new_password }, env, secret) {
  if (!reset_token || !new_password) return Response.json({ error: 'Token and new password required' }, { status: 400 });
  if (new_password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });

  const payload = await verifyJWT(reset_token, secret);
  if (!payload || payload.type !== 'pwd_reset') return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 });

  const salt = crypto.randomUUID();
  const hash = await hashPassword(new_password, salt, secret);
  await env.DB.prepare(
    `UPDATE auth_users SET password_hash = ?, updated_at_ms = ? WHERE user_id = ? AND provider = 'password'`
  ).bind(`${salt}:${hash}`, Date.now(), payload.userId).run();

  return Response.json({ ok: true });
}

async function handleMagicLink({ email }, env, secret) {
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  const user = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(emailLower).first();

  if (user && env.RESEND_API_KEY) {
    const magicToken = await createJWT({ type: 'magic', userId: user.id, email: emailLower }, secret, RESET_EXPIRY);
    const magicUrl = `https://justfit.cc/login.html?magic=${magicToken}`;
    sendEmail(emailLower, 'Your JustFit.cc login link', emailWrap(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Here's your login link</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Click the button below to log in instantly. This link expires in 15 minutes and can only be used once.</p>
      <a href="${magicUrl}" style="display:inline-block;background:#10b981;color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Log in to JustFit →</a>
      <p style="color:#334155;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
    `), env.RESEND_API_KEY).catch(() => {});
  }

  return Response.json({ ok: true, message: 'If this email is registered, a login link has been sent.' });
}

async function handleMagicVerify(token, env, secret) {
  const payload = await verifyJWT(token, secret);
  if (!payload || payload.type !== 'magic') {
    return Response.json({ valid: false, error: 'Invalid or expired magic link' }, { status: 401 });
  }
  const sessionToken = await createJWT({ userId: payload.userId, email: payload.email }, secret);
  return Response.json({ ok: true, token: sessionToken, userId: payload.userId });
}

// ─── PASSKEY: BEGIN REGISTRATION ─────────────────────────────────────────────
async function handlePasskeyBeginRegister(request, env, secret) {
  const authHeader = request.headers.get('Authorization') ?? '';
  const sessionToken = authHeader.replace('Bearer ', '');
  const user = await verifyJWT(sessionToken, secret);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challengeToken = await createJWT({ type: 'webauthn_challenge', nonce }, secret, WEBAUTHN_EXPIRY);

  return Response.json({
    challengeToken,
    challenge: nonce,
    // userId as base64url-encoded UTF-8 bytes of the UUID (userHandle for discoverable creds)
    userId: b64url(new TextEncoder().encode(user.userId)),
    rpId: RP_ID,
    rpName: 'JustFit.cc',
  });
}

// ─── PASSKEY: COMPLETE REGISTRATION ──────────────────────────────────────────
async function handlePasskeyCompleteRegister(request, { challengeToken, credentialId, publicKey, algorithm }, env, secret) {
  const authHeader = request.headers.get('Authorization') ?? '';
  const sessionToken = authHeader.replace('Bearer ', '');
  const user = await verifyJWT(sessionToken, secret);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const challenge = await verifyJWT(challengeToken, secret);
  if (!challenge || challenge.type !== 'webauthn_challenge') {
    return Response.json({ error: 'Invalid or expired challenge' }, { status: 400 });
  }

  if (!credentialId || !publicKey) return Response.json({ error: 'Missing credential data' }, { status: 400 });

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO passkey_credentials (id, user_id, credential_id, public_key, algorithm, created_at_ms, updated_at_ms) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(crypto.randomUUID(), user.userId, credentialId, publicKey, algorithm ?? -7, now, now).run();

  return Response.json({ ok: true });
}

// ─── PASSKEY: BEGIN AUTH ──────────────────────────────────────────────────────
async function handlePasskeyBeginAuth({ email }, env, secret) {
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challengeToken = await createJWT({ type: 'webauthn_challenge', nonce }, secret, WEBAUTHN_EXPIRY);

  let credentialIds = [];
  if (email) {
    const emailLower = email.toLowerCase().trim();
    const user = await env.DB.prepare(
      `SELECT u.id FROM users u WHERE u.primary_email = ? LIMIT 1`
    ).bind(emailLower).first();
    if (user) {
      const creds = await env.DB.prepare(
        `SELECT credential_id FROM passkey_credentials WHERE user_id = ?`
      ).bind(user.id).all();
      credentialIds = creds.results.map(c => c.credential_id);
    }
  }

  return Response.json({ challengeToken, challenge: nonce, credentialIds });
}

// ─── PASSKEY: COMPLETE AUTH ───────────────────────────────────────────────────
async function handlePasskeyCompleteAuth({ challengeToken, credentialId, clientDataJSON, authenticatorData, signature, userHandle }, env, secret) {
  // 1. Verify challenge token
  const challenge = await verifyJWT(challengeToken, secret);
  if (!challenge || challenge.type !== 'webauthn_challenge') {
    return Response.json({ error: 'Invalid or expired challenge' }, { status: 400 });
  }

  // 2. Decode and verify clientDataJSON
  const clientDataBytes = fromB64url(clientDataJSON);
  let clientData;
  try {
    clientData = JSON.parse(new TextDecoder().decode(clientDataBytes));
  } catch {
    return Response.json({ error: 'Invalid clientDataJSON' }, { status: 400 });
  }

  if (clientData.type !== 'webauthn.get') {
    return Response.json({ error: 'Invalid WebAuthn type' }, { status: 400 });
  }
  if (!ALLOWED_ORIGINS.includes(clientData.origin)) {
    return Response.json({ error: 'Invalid origin' }, { status: 400 });
  }
  // Challenge in clientDataJSON is base64url of the raw nonce bytes
  if (clientData.challenge !== challenge.nonce) {
    return Response.json({ error: 'Challenge mismatch' }, { status: 400 });
  }

  // 3. Decode authenticatorData and verify RP ID hash
  const authDataBytes = fromB64url(authenticatorData);
  const rpIdHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(RP_ID));
  const expectedHash = new Uint8Array(rpIdHash);
  const actualHash   = authDataBytes.slice(0, 32);
  if (!expectedHash.every((b, i) => b === actualHash[i])) {
    return Response.json({ error: 'RP ID mismatch' }, { status: 400 });
  }
  // Check User Present flag (bit 0 of flags byte at index 32)
  if (!(authDataBytes[32] & 0x01)) {
    return Response.json({ error: 'User presence not confirmed' }, { status: 400 });
  }

  // 4. Look up stored credential
  let cred = await env.DB.prepare(
    `SELECT pc.*, u.primary_email as email FROM passkey_credentials pc JOIN users u ON u.id = pc.user_id WHERE pc.credential_id = ? LIMIT 1`
  ).bind(credentialId).first();

  if (!cred && userHandle) {
    // Fallback: look up by userHandle (userId bytes)
    const userId = new TextDecoder().decode(fromB64url(userHandle));
    cred = await env.DB.prepare(
      `SELECT pc.*, u.primary_email as email FROM passkey_credentials pc JOIN users u ON u.id = pc.user_id WHERE pc.user_id = ? LIMIT 1`
    ).bind(userId).first();
  }

  if (!cred) return Response.json({ error: 'Credential not found' }, { status: 401 });

  // 5. Verify signature: sign(authenticatorData || SHA-256(clientDataJSON))
  const clientDataHash = await crypto.subtle.digest('SHA-256', clientDataBytes);
  const message = new Uint8Array(authDataBytes.length + 32);
  message.set(authDataBytes);
  message.set(new Uint8Array(clientDataHash), authDataBytes.length);

  const pubKeyBytes = Uint8Array.from(atob(cred.public_key), c => c.charCodeAt(0));
  const sigBytes    = fromB64url(signature);

  let cryptoKey;
  try {
    const algoParams = cred.algorithm === -7
      ? { name: 'ECDSA', namedCurve: 'P-256' }
      : { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' };
    cryptoKey = await crypto.subtle.importKey('spki', pubKeyBytes.buffer, algoParams, false, ['verify']);
  } catch (e) {
    return Response.json({ error: 'Failed to import public key' }, { status: 500 });
  }

  let valid = false;
  try {
    if (cred.algorithm === -7) {
      valid = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        cryptoKey,
        derToRaw(sigBytes),
        message
      );
    } else {
      valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, message);
    }
  } catch {
    return Response.json({ error: 'Signature verification error' }, { status: 401 });
  }

  if (!valid) return Response.json({ error: 'Invalid signature' }, { status: 401 });

  // 6. Update last used + return session token
  await env.DB.prepare(
    `UPDATE passkey_credentials SET last_used_at_ms = ?, updated_at_ms = ? WHERE credential_id = ?`
  ).bind(Date.now(), Date.now(), credentialId).run();

  const token = await createJWT({ userId: cred.user_id, email: cred.email }, secret);
  return Response.json({ ok: true, token, userId: cred.user_id });
}

// ─── EXPORTED HANDLERS ────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ error: 'Server misconfiguration' }, { status: 500 });

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'signup':                   return handleSignup(body, env, secret);
      case 'login':                    return handleLogin(body, env, secret);
      case 'forgot_password':          return handleForgotPassword(body, env, secret);
      case 'reset_password':           return handleResetPassword(body, env, secret);
      case 'magic_link':               return handleMagicLink(body, env, secret);
      case 'passkey_begin_register':   return handlePasskeyBeginRegister(request, env, secret);
      case 'passkey_complete_register':return handlePasskeyCompleteRegister(request, body, env, secret);
      case 'passkey_begin_auth':       return handlePasskeyBeginAuth(body, env, secret);
      case 'passkey_complete_auth':    return handlePasskeyCompleteAuth(body, env, secret);
      default: return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ valid: false }, { status: 500 });

    const url   = new URL(request.url);
    const magic = url.searchParams.get('magic');

    // Magic link verification
    if (magic) return handleMagicVerify(magic, env, secret);

    // Session token verification
    const auth  = request.headers.get('Authorization') ?? '';
    const token = auth.replace('Bearer ', '');
    if (!token) return Response.json({ valid: false }, { status: 401 });

    const payload = await verifyJWT(token, secret);
    if (!payload) return Response.json({ valid: false }, { status: 401 });

    return Response.json({ valid: true, userId: payload.userId, email: payload.email });
  } catch (e) {
    return Response.json({ valid: false }, { status: 401 });
  }
}
