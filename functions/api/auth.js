// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const JWT_EXPIRY      = 60 * 60 * 24 * 7; // 7 days  — session tokens
const RESET_EXPIRY_MS = 60 * 60 * 1000;   // 1 hour  — password reset (ms)
const MAGIC_EXPIRY_MS  = 15 * 60 * 1000;   // 15 min  — magic links (ms)
const VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 h — email verify / change tokens
const WEBAUTHN_EXPIRY = 120;              // 2 min   — challenge JWT (sec)
const FROM_ADDRESS    = 'JustFit.cc <noreply@justfit.cc>';

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

// ─── DER → RAW ECDSA CONVERSION ──────────────────────────────────────────────
// WebAuthn returns DER-encoded ECDSA signatures; crypto.subtle needs raw r||s
function derToRaw(sig) {
  let pos = 2;
  const rLen = sig[pos + 1];
  const r = sig.slice(pos + 2, pos + 2 + rLen);
  pos += 2 + rLen;
  const sLen = sig[pos + 1];
  const s = sig.slice(pos + 2, pos + 2 + sLen);
  const out = new Uint8Array(64);
  out.set(r.slice(-32), 32 - Math.min(r.length, 32));
  out.set(s.slice(-32), 64 - Math.min(s.length, 32));
  return out;
}

// ─── AUTHENTICATOR DATA HELPERS ───────────────────────────────────────────────
// Bytes 33-36 of authenticatorData = signCount (big-endian uint32)
function getSignCount(authDataBytes) {
  const view = new DataView(authDataBytes.buffer, authDataBytes.byteOffset + 33, 4);
  return view.getUint32(0, false);
}

// Flags byte at index 32: bit 0 = UP, bit 2 = UV, bit 3 = BE (backed up eligible), bit 4 = BS (backed up)
function getFlags(authDataBytes) {
  const f = authDataBytes[32];
  return {
    userPresent:  !!(f & 0x01),
    userVerified: !!(f & 0x04),
    backedUp:     !!(f & 0x10),
  };
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
    if (sig !== await hmacSign(`${header}.${body}`, secret)) return null;
    const payload = JSON.parse(atob(body));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch { return null; }
}

// ─── PASSWORD HASHING ─────────────────────────────────────────────────────────
function generateCode() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(100000 + (arr[0] % 900000));
}

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
    body: JSON.stringify({ from: FROM_ADDRESS, to: [to], subject, html }),
  });
}

function emailShell(content, accent = '#10b981') {
  return `<div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#020617;color:#f8fafc;padding:40px 32px;border-radius:16px;">
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:32px;">
    <div style="width:36px;height:36px;background:${accent};border-radius:10px;display:flex;align-items:center;justify-content:center;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 1L6 13H12L10 23L18 11H12L14 1Z" fill="white"/></svg>
    </div>
    <span style="font-weight:900;font-size:18px;">JustFit<span style="color:${accent}">.cc</span></span>
  </div>
  ${content}
  <p style="color:#334155;font-size:11px;margin-top:40px;">JustFit.cc — Privacy-first fitness. We never sell your data.</p>
</div>`;
}

async function getUserAccent(userId, env) {
  if (!userId) return '#10b981';
  try {
    const row = await env.DB.prepare(
      `SELECT preferences_json FROM user_preferences WHERE user_id = ? LIMIT 1`
    ).bind(userId).first();
    if (!row?.preferences_json) return '#10b981';
    const prefs = JSON.parse(row.preferences_json);
    return prefs.accent ?? '#10b981';
  } catch { return '#10b981'; }
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

async function handleSignup({ email, password }, env, secret) {
  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
  if (password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  const existing = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(emailLower).first();
  if (existing) return Response.json({ error: 'Email already registered' }, { status: 409 });

  const userId      = crypto.randomUUID();
  const salt        = crypto.randomUUID();
  const hash        = await hashPassword(password, salt, secret);
  const now         = Date.now();
  const verifyToken = crypto.randomUUID();
  const verifyCode  = generateCode();

  await env.DB.batch([
    env.DB.prepare(`INSERT INTO users (id, status, primary_email, created_at_ms, updated_at_ms) VALUES (?, 'active', ?, ?, ?)`)
      .bind(userId, emailLower, now, now),
    env.DB.prepare(`INSERT INTO auth_users (id, user_id, provider, email, email_verified, password_hash, password_algo, created_at_ms, updated_at_ms) VALUES (?, ?, 'password', ?, 0, ?, 'sha256+salt', ?, ?)`)
      .bind(crypto.randomUUID(), userId, emailLower, `${salt}:${hash}`, now, now),
    env.DB.prepare(`INSERT INTO entitlements (id, user_id, product_code, source, status, starts_at_ms, created_at_ms, updated_at_ms) VALUES (?, ?, 'justfit_trial', 'manual', 'trialing', ?, ?, ?)`)
      .bind(crypto.randomUUID(), userId, now, now, now),
    env.DB.prepare(`INSERT INTO magic_link_tokens (token, user_id, email, purpose, code, expires_at_ms, created_at_ms) VALUES (?, ?, ?, 'verify_email', ?, ?, ?)`)
      .bind(verifyToken, userId, emailLower, verifyCode, now + VERIFY_EXPIRY_MS, now),
  ]);

  if (env.RESEND_API_KEY) {
    const verifyUrl = `https://justfit.cc/api/auth?verify_email=${verifyToken}`;
    await sendEmail(emailLower, 'Welcome to JustFit.cc — verify your email', emailShell(`
      <h1 style="font-size:28px;font-weight:900;letter-spacing:-0.02em;margin:0 0 12px;">You're in.</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Your first plan is ready. Verify your email to secure your account — or just start training.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#10b981;color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Verify my email →</a>
      <div style="margin-top:28px;padding:20px;background:rgba(255,255,255,0.04);border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.08);">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">Or enter this code in the app (Settings → Email)</p>
        <p style="font-size:30px;font-weight:900;letter-spacing:0.14em;color:#f8fafc;margin:0;font-family:monospace;">${verifyCode}</p>
      </div>
      <p style="color:#334155;font-size:12px;margin-top:20px;">Link expires in 24 hours. You can also open the app and skip this — verification is optional.</p>
    `), env.RESEND_API_KEY).catch(() => {});
  }

  const token = await createJWT({ userId, email: emailLower }, secret);
  return Response.json({ ok: true, token, userId });
}

async function handleLogin({ email, password }, request, env, secret) {
  if (!email || !password) return Response.json({ error: 'Email and password required' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();
  const HOUR = 60 * 60 * 1000;

  if (await isRateLimited(`login:ip:${clientIp(request)}`, 20, HOUR, env) ||
      await isRateLimited(`login:email:${emailLower}`, 10, HOUR, env)) {
    return Response.json({ error: 'Too many login attempts — please try again later' }, { status: 429 });
  }

  const authUser = await env.DB.prepare(
    `SELECT a.id, a.user_id, a.password_hash FROM auth_users a WHERE a.email = ? AND a.provider = 'password' LIMIT 1`
  ).bind(emailLower).first();
  if (!authUser) return Response.json({ error: 'Invalid email or password' }, { status: 401 });

  const [salt, storedHash] = authUser.password_hash.split(':');
  if (await hashPassword(password, salt, secret) !== storedHash) {
    return Response.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await env.DB.prepare(`UPDATE auth_users SET last_login_at_ms = ? WHERE id = ?`)
    .bind(Date.now(), authUser.id).run();

  const token = await createJWT({ userId: authUser.user_id, email: emailLower }, secret);
  return Response.json({ ok: true, token, userId: authUser.user_id });
}

// ─── RATE LIMIT HELPERS ───────────────────────────────────────────────────────
// Sliding-window counter backed by auth_rate_limits table (migration 0022).
// Returns true if the bucket has exceeded maxCount within windowMs.
async function isRateLimited(bucket, maxCount, windowMs, env) {
  const now    = Date.now();
  const cutoff = now - windowMs;
  await env.DB.prepare(`
    INSERT INTO auth_rate_limits (bucket, count, window_start_ms)
    VALUES (?, 1, ?)
    ON CONFLICT(bucket) DO UPDATE SET
      count            = CASE WHEN window_start_ms <= ? THEN 1            ELSE count + 1    END,
      window_start_ms  = CASE WHEN window_start_ms <= ? THEN ?            ELSE window_start_ms END
  `).bind(bucket, now, cutoff, cutoff, now).run();
  const row = await env.DB.prepare(`SELECT count FROM auth_rate_limits WHERE bucket = ?`).bind(bucket).first();
  return (row?.count ?? 1) > maxCount;
}

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? 'unknown';
}

// Legacy helpers — count existing token rows (no extra migration needed).
async function rateLimitForgotPassword(emailLower, env) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM password_reset_tokens WHERE email = ? AND created_at_ms > ?`
  ).bind(emailLower, Date.now() - 60 * 60 * 1000).first();
  return (row?.n ?? 0) >= 3; // true = rate limited (3 per hour)
}

async function rateLimitMagicLink(emailLower, env) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM magic_link_tokens WHERE email = ? AND created_at_ms > ?`
  ).bind(emailLower, Date.now() - 60 * 60 * 1000).first();
  return (row?.n ?? 0) >= 5; // true = rate limited (5 per hour)
}

// ─── FORGOT PASSWORD ──────────────────────────────────────────────────────────
async function handleForgotPassword({ email }, env, _secret) {
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  // Rate limit: max 3 reset emails per hour per address (silent — same response as normal)
  if (await rateLimitForgotPassword(emailLower, env)) return Response.json({ ok: true });

  const user = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(emailLower).first();

  if (user && env.RESEND_API_KEY) {
    const token = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
      `INSERT INTO password_reset_tokens (token, user_id, email, expires_at_ms, created_at_ms) VALUES (?, ?, ?, ?, ?)`
    ).bind(token, user.id, emailLower, now + RESET_EXPIRY_MS, now).run();

    const resetUrl = `https://justfit.cc/reset-password.html?token=${token}`;
    const accent = await getUserAccent(user.id, env);
    await sendEmail(emailLower, 'Reset your JustFit password', emailShell(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Reset your password</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Click the button below to set a new password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;background:${accent};color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Reset password →</a>
      <p style="color:#334155;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
    `, accent), env.RESEND_API_KEY).catch(() => {});
  }

  // Always return 200 — never reveal whether the email exists
  return Response.json({ ok: true });
}

// ─── RESET PASSWORD ───────────────────────────────────────────────────────────
async function handleResetPassword({ reset_token, new_password }, request, env, secret) {
  if (!reset_token || !new_password) return Response.json({ error: 'Token and new password required' }, { status: 400 });
  if (new_password.length < 6) return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  if (await isRateLimited(`reset:ip:${clientIp(request)}`, 5, 60 * 60 * 1000, env)) {
    return Response.json({ error: 'Too many attempts — please try again later' }, { status: 429 });
  }

  const row = await env.DB.prepare(
    `SELECT token, user_id, expires_at_ms, used_at_ms FROM password_reset_tokens WHERE token = ? LIMIT 1`
  ).bind(reset_token).first();

  if (!row)                      return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 });
  if (row.used_at_ms)            return Response.json({ error: 'This reset link has already been used' }, { status: 400 });
  if (row.expires_at_ms < Date.now()) return Response.json({ error: 'This reset link has expired' }, { status: 400 });

  const salt = crypto.randomUUID();
  const hash = await hashPassword(new_password, salt, secret);
  const now  = Date.now();

  await env.DB.batch([
    // Update password
    env.DB.prepare(`UPDATE auth_users SET password_hash = ?, updated_at_ms = ? WHERE user_id = ? AND provider = 'password'`)
      .bind(`${salt}:${hash}`, now, row.user_id),
    // Mark this token as used
    env.DB.prepare(`UPDATE password_reset_tokens SET used_at_ms = ? WHERE token = ?`)
      .bind(now, reset_token),
    // Invalidate all other unused tokens for this user
    env.DB.prepare(`UPDATE password_reset_tokens SET used_at_ms = ? WHERE user_id = ? AND used_at_ms IS NULL AND token != ?`)
      .bind(now, row.user_id, reset_token),
  ]);

  return Response.json({ ok: true });
}

// ─── MAGIC LINK: SEND ─────────────────────────────────────────────────────────
async function handleMagicLink({ email }, env) {
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
  const emailLower = email.toLowerCase().trim();

  // Rate limit: max 5 magic links per hour per address (silent)
  if (await rateLimitMagicLink(emailLower, env)) return Response.json({ ok: true });

  const user = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(emailLower).first();

  if (env.RESEND_API_KEY) {
    const token = crypto.randomUUID();
    const now   = Date.now();
    await env.DB.prepare(
      `INSERT INTO magic_link_tokens (token, user_id, email, expires_at_ms, created_at_ms) VALUES (?, ?, ?, ?, ?)`
    ).bind(token, user?.id ?? null, emailLower, now + MAGIC_EXPIRY_MS, now).run();

    const magicUrl = `https://justfit.cc/magic.html?token=${token}`;
    const accent = await getUserAccent(user?.id ?? null, env);
    await sendEmail(emailLower, 'Your JustFit login link ⚡', emailShell(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Here's your login link</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Click the button below to log in instantly. This link expires in 15 minutes and can only be used once.</p>
      <a href="${magicUrl}" style="display:inline-block;background:${accent};color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Log in to JustFit →</a>
      <p style="color:#334155;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email.</p>
    `, accent), env.RESEND_API_KEY).catch(() => {});
  }

  return Response.json({ ok: true });
}

// ─── MAGIC LINK: VERIFY ───────────────────────────────────────────────────────
async function handleMagicVerify(token, env, secret) {
  if (!token) return Response.json({ valid: false, error: 'Token required' }, { status: 400 });

  const row = await env.DB.prepare(
    `SELECT token, user_id, email, purpose, expires_at_ms, used_at_ms FROM magic_link_tokens WHERE token = ? LIMIT 1`
  ).bind(token).first();

  if (!row)                           return Response.json({ valid: false, error: 'Invalid link' }, { status: 401 });
  if (row.purpose && row.purpose !== 'login') return Response.json({ valid: false, error: 'Invalid link' }, { status: 401 });
  if (row.used_at_ms)                 return Response.json({ valid: false, error: 'This link has already been used' }, { status: 401 });
  if (row.expires_at_ms < Date.now()) return Response.json({ valid: false, error: 'This link has expired' }, { status: 401 });

  const now = Date.now();
  // Mark as used immediately (single-use)
  await env.DB.prepare(`UPDATE magic_link_tokens SET used_at_ms = ? WHERE token = ?`)
    .bind(now, token).run();

  if (!row.user_id) {
    // Email not registered — prompt signup
    return Response.json({ ok: false, needsSignup: true, email: row.email });
  }

  // Magic link login proves inbox ownership — auto-mark email as verified
  await env.DB.prepare(`UPDATE auth_users SET email_verified = 1 WHERE user_id = ?`)
    .bind(row.user_id).run();

  const sessionToken = await createJWT({ userId: row.user_id, email: row.email }, secret);
  return Response.json({ ok: true, token: sessionToken, userId: row.user_id });
}

// ─── PASSKEY: BEGIN REGISTRATION ─────────────────────────────────────────────
async function handlePasskeyBeginRegister(request, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challengeToken = await createJWT({ type: 'webauthn_challenge', nonce }, secret, WEBAUTHN_EXPIRY);
  const rpId = env.WEBAUTHN_RP_ID ?? 'justfit.cc';

  return Response.json({
    challengeToken,
    challenge: nonce,
    userId: b64url(new TextEncoder().encode(user.userId)),
    rpId,
    rpName: 'JustFit.cc',
  });
}

// ─── PASSKEY: COMPLETE REGISTRATION ──────────────────────────────────────────
async function handlePasskeyCompleteRegister(request, { challengeToken, credentialId, publicKey, algorithm, transports }, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const challenge = await verifyJWT(challengeToken, secret);
  if (!challenge || challenge.type !== 'webauthn_challenge') {
    return Response.json({ error: 'Invalid or expired challenge' }, { status: 400 });
  }
  if (!credentialId || !publicKey) return Response.json({ error: 'Missing credential data' }, { status: 400 });

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO passkey_credentials (id, user_id, credential_id, public_key, algorithm, counter, backed_up, transports, created_at_ms, updated_at_ms)
     VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`
  ).bind(
    crypto.randomUUID(), user.userId, credentialId, publicKey, algorithm ?? -7,
    transports ? JSON.stringify(transports) : null, now, now
  ).run();

  return Response.json({ ok: true });
}

// ─── PASSKEY: BEGIN AUTH ──────────────────────────────────────────────────────
async function handlePasskeyBeginAuth({ email }, env, secret) {
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const challengeToken = await createJWT({ type: 'webauthn_challenge', nonce }, secret, WEBAUTHN_EXPIRY);
  const rpId = env.WEBAUTHN_RP_ID ?? 'justfit.cc';

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

  return Response.json({ challengeToken, challenge: nonce, credentialIds, rpId });
}

// ─── PASSKEY: COMPLETE AUTH ───────────────────────────────────────────────────
async function handlePasskeyCompleteAuth({ challengeToken, credentialId, clientDataJSON, authenticatorData, signature, userHandle }, env, secret) {
  const rpId = env.WEBAUTHN_RP_ID ?? 'justfit.cc';

  // 1. Verify challenge JWT
  const challenge = await verifyJWT(challengeToken, secret);
  if (!challenge || challenge.type !== 'webauthn_challenge') {
    return Response.json({ error: 'Invalid or expired challenge' }, { status: 400 });
  }

  // 2. Decode + verify clientDataJSON
  const clientDataBytes = fromB64url(clientDataJSON);
  let clientData;
  try { clientData = JSON.parse(new TextDecoder().decode(clientDataBytes)); }
  catch { return Response.json({ error: 'Invalid clientDataJSON' }, { status: 400 }); }

  if (clientData.type !== 'webauthn.get') {
    return Response.json({ error: 'Invalid WebAuthn type' }, { status: 400 });
  }

  const allowedOrigins = [`https://${rpId}`, 'https://justfit.pages.dev'];
  if (!allowedOrigins.includes(clientData.origin)) {
    return Response.json({ error: 'Invalid origin' }, { status: 400 });
  }
  if (clientData.challenge !== challenge.nonce) {
    return Response.json({ error: 'Challenge mismatch' }, { status: 400 });
  }

  // 3. Decode authenticatorData + verify RP ID hash
  const authDataBytes = fromB64url(authenticatorData);
  const rpIdHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId));
  if (!new Uint8Array(rpIdHash).every((b, i) => b === authDataBytes[i])) {
    return Response.json({ error: 'RP ID mismatch' }, { status: 400 });
  }

  const flags = getFlags(authDataBytes);
  if (!flags.userPresent) return Response.json({ error: 'User presence not confirmed' }, { status: 400 });

  const newCounter = getSignCount(authDataBytes);

  // 4. Look up stored credential
  let cred = await env.DB.prepare(
    `SELECT pc.*, u.primary_email as email
     FROM passkey_credentials pc JOIN users u ON u.id = pc.user_id
     WHERE pc.credential_id = ? LIMIT 1`
  ).bind(credentialId).first();

  if (!cred && userHandle) {
    const userId = new TextDecoder().decode(fromB64url(userHandle));
    cred = await env.DB.prepare(
      `SELECT pc.*, u.primary_email as email
       FROM passkey_credentials pc JOIN users u ON u.id = pc.user_id
       WHERE pc.user_id = ? LIMIT 1`
    ).bind(userId).first();
  }
  if (!cred) return Response.json({ error: 'Credential not found' }, { status: 401 });

  // 5. Counter check — replay attack protection
  // Allow counter=0 for synced/backed-up credentials (many platform authenticators)
  if (cred.counter > 0 && newCounter <= cred.counter) {
    return Response.json({ error: 'Counter invalid — possible cloned authenticator' }, { status: 401 });
  }

  // 6. Verify signature
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
  } catch {
    return Response.json({ error: 'Failed to import public key' }, { status: 500 });
  }

  let valid = false;
  try {
    valid = cred.algorithm === -7
      ? await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, derToRaw(sigBytes), message)
      : await crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, message);
  } catch {
    return Response.json({ error: 'Signature verification error' }, { status: 401 });
  }

  if (!valid) return Response.json({ error: 'Invalid signature' }, { status: 401 });

  // 7. Update counter + backed_up + last_used
  const now = Date.now();
  await env.DB.prepare(
    `UPDATE passkey_credentials SET counter = ?, backed_up = ?, last_used_at_ms = ?, updated_at_ms = ? WHERE credential_id = ?`
  ).bind(newCounter, flags.backedUp ? 1 : 0, now, now, credentialId).run();

  // 8. Issue session token
  const token = await createJWT({ userId: cred.user_id, email: cred.email }, secret);
  return Response.json({ ok: true, token, userId: cred.user_id });
}

// ─── DELETE ACCOUNT ───────────────────────────────────────────────────────────
async function handleDeleteAccount(request, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user?.userId) return Response.json({ error: 'unauthorized' }, { status: 401 });
  const uid = user.userId;

  // Delete in dependency order — execution_steps first (FK to executions), then everything else
  await env.DB.batch([
    env.DB.prepare('DELETE FROM execution_steps WHERE execution_id IN (SELECT id FROM executions WHERE user_id = ?)').bind(uid),
    env.DB.prepare('DELETE FROM executions WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM daily_checkins WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM day_plans WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_progression_events WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_progression WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM period_log WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM pregnancy_weekly_log WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM cycle_profile WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM context_overrides WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_awards WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM entitlements WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM passkey_credentials WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM magic_link_tokens WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM support_tokens WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM referral_codes WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM referrals WHERE referrer_user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_availability WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_contact WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_preferences WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM user_profile WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM auth_users WHERE user_id = ?').bind(uid),
    env.DB.prepare('DELETE FROM users WHERE id = ?').bind(uid),
  ]);

  return Response.json({ ok: true });
}

// ─── EMAIL VERIFICATION ───────────────────────────────────────────────────────

async function handleResendVerification(request, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });

  const authUser = await env.DB.prepare(
    `SELECT email, email_verified FROM auth_users WHERE user_id = ? LIMIT 1`
  ).bind(user.userId).first();
  if (!authUser) return Response.json({ error: 'User not found' }, { status: 404 });
  if (authUser.email_verified) return Response.json({ ok: true, already_verified: true });

  const now = Date.now();

  // 60s cooldown — prevent inbox spam
  const recent = await env.DB.prepare(
    `SELECT created_at_ms FROM magic_link_tokens WHERE user_id = ? AND purpose = 'verify_email' AND created_at_ms > ? LIMIT 1`
  ).bind(user.userId, now - 60_000).first();
  if (recent) return Response.json({ error: 'Please wait before requesting another verification email' }, { status: 429 });

  // Invalidate previous pending verify tokens for this user
  await env.DB.prepare(
    `UPDATE magic_link_tokens SET used_at_ms = ? WHERE user_id = ? AND purpose = 'verify_email' AND used_at_ms IS NULL`
  ).bind(now, user.userId).run();

  const token = crypto.randomUUID();
  const code  = generateCode();

  await env.DB.prepare(
    `INSERT INTO magic_link_tokens (token, user_id, email, purpose, code, expires_at_ms, created_at_ms) VALUES (?, ?, ?, 'verify_email', ?, ?, ?)`
  ).bind(token, user.userId, authUser.email, code, now + VERIFY_EXPIRY_MS, now).run();

  if (env.RESEND_API_KEY) {
    const verifyUrl = `https://justfit.cc/api/auth?verify_email=${token}`;
    const accent = await getUserAccent(user.userId, env);
    await sendEmail(authUser.email, 'Verify your JustFit email address', emailShell(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Verify your email</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Click the button or enter the code in the app (Settings → Email).</p>
      <a href="${verifyUrl}" style="display:inline-block;background:${accent};color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Verify email →</a>
      <div style="margin-top:28px;padding:20px;background:rgba(255,255,255,0.04);border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.08);">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">CODE</p>
        <p style="font-size:30px;font-weight:900;letter-spacing:0.14em;color:#f8fafc;margin:0;font-family:monospace;">${code}</p>
      </div>
      <p style="color:#334155;font-size:12px;margin-top:20px;">Expires in 24 hours.</p>
    `, accent), env.RESEND_API_KEY).catch(() => {});
  }

  return Response.json({ ok: true });
}

async function handleVerifyEmailCode({ code }, request, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!code) return Response.json({ error: 'Code required' }, { status: 400 });
  if (await isRateLimited(`verify_email:${user.userId}`, 5, 60 * 60 * 1000, env)) {
    return Response.json({ error: 'Too many attempts — please try again later' }, { status: 429 });
  }

  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT token FROM magic_link_tokens WHERE code = ? AND user_id = ? AND purpose = 'verify_email' AND used_at_ms IS NULL AND expires_at_ms > ? LIMIT 1`
  ).bind(String(code), user.userId, now).first();

  if (!row) return Response.json({ error: 'Invalid or expired code' }, { status: 400 });

  await env.DB.batch([
    env.DB.prepare(`UPDATE magic_link_tokens SET used_at_ms = ? WHERE token = ?`).bind(now, row.token),
    env.DB.prepare(`UPDATE auth_users SET email_verified = 1 WHERE user_id = ?`).bind(user.userId),
  ]);

  return Response.json({ ok: true });
}

async function handleRequestEmailChange({ new_email }, request, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!new_email) return Response.json({ error: 'new_email required' }, { status: 400 });

  const newEmailLower = new_email.toLowerCase().trim();

  const taken = await env.DB.prepare(
    `SELECT id FROM users WHERE primary_email = ? LIMIT 1`
  ).bind(newEmailLower).first();
  if (taken) return Response.json({ error: 'Email already in use' }, { status: 409 });

  const now = Date.now();

  // 60s cooldown — prevent third-party inbox spam
  const recent = await env.DB.prepare(
    `SELECT created_at_ms FROM magic_link_tokens WHERE user_id = ? AND purpose = 'email_change' AND created_at_ms > ? LIMIT 1`
  ).bind(user.userId, now - 60_000).first();
  if (recent) return Response.json({ error: 'Please wait before requesting another email change' }, { status: 429 });

  const token = crypto.randomUUID();
  const code  = generateCode();

  // Invalidate previous pending change tokens for this user
  await env.DB.prepare(
    `UPDATE magic_link_tokens SET used_at_ms = ? WHERE user_id = ? AND purpose = 'email_change' AND used_at_ms IS NULL`
  ).bind(now, user.userId).run();

  await env.DB.prepare(
    `INSERT INTO magic_link_tokens (token, user_id, email, purpose, new_email, code, expires_at_ms, created_at_ms) VALUES (?, ?, ?, 'email_change', ?, ?, ?, ?)`
  ).bind(token, user.userId, user.email, code, newEmailLower, now + VERIFY_EXPIRY_MS, now).run();

  if (env.RESEND_API_KEY) {
    const changeUrl = `https://justfit.cc/api/auth?change_email=${token}`;
    const accent = await getUserAccent(user.userId, env);
    await sendEmail(newEmailLower, 'Confirm your new JustFit email address', emailShell(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Confirm your new email</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 24px;">Click the button or enter the code in the app to confirm <strong style="color:#f8fafc;">${newEmailLower}</strong> as your JustFit email.</p>
      <a href="${changeUrl}" style="display:inline-block;background:${accent};color:#fff;font-weight:900;font-size:14px;padding:14px 28px;border-radius:12px;text-decoration:none;">Confirm new email →</a>
      <div style="margin-top:28px;padding:20px;background:rgba(255,255,255,0.04);border-radius:12px;text-align:center;border:1px solid rgba(255,255,255,0.08);">
        <p style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 10px;">CODE</p>
        <p style="font-size:30px;font-weight:900;letter-spacing:0.14em;color:#f8fafc;margin:0;font-family:monospace;">${code}</p>
      </div>
      <p style="color:#334155;font-size:12px;margin-top:20px;">Expires in 24 hours. If you didn't request this, ignore this email.</p>
    `, accent), env.RESEND_API_KEY).catch(() => {});
  }

  return Response.json({ ok: true });
}

async function handleVerifyChangeCode({ code }, request, env, secret) {
  const user = await getSessionUser(request, secret);
  if (!user) return Response.json({ error: 'unauthorized' }, { status: 401 });
  if (!code) return Response.json({ error: 'Code required' }, { status: 400 });
  if (await isRateLimited(`verify_change:${user.userId}`, 5, 60 * 60 * 1000, env)) {
    return Response.json({ error: 'Too many attempts — please try again later' }, { status: 429 });
  }

  const now = Date.now();
  const row = await env.DB.prepare(
    `SELECT token, new_email FROM magic_link_tokens WHERE code = ? AND user_id = ? AND purpose = 'email_change' AND used_at_ms IS NULL AND expires_at_ms > ? LIMIT 1`
  ).bind(String(code), user.userId, now).first();

  if (!row || !row.new_email) return Response.json({ error: 'Invalid or expired code' }, { status: 400 });

  const oldAuthUser = await env.DB.prepare(
    `SELECT email FROM auth_users WHERE user_id = ? LIMIT 1`
  ).bind(user.userId).first();

  await env.DB.batch([
    env.DB.prepare(`UPDATE magic_link_tokens SET used_at_ms = ? WHERE token = ?`).bind(now, row.token),
    env.DB.prepare(`UPDATE auth_users SET email = ?, email_verified = 1, updated_at_ms = ? WHERE user_id = ?`).bind(row.new_email, now, user.userId),
    env.DB.prepare(`UPDATE users SET primary_email = ?, updated_at_ms = ? WHERE id = ?`).bind(row.new_email, now, user.userId),
  ]);

  if (oldAuthUser?.email && env.RESEND_API_KEY) {
    const accent = await getUserAccent(user.userId, env);
    sendEmail(oldAuthUser.email, 'Your JustFit email address was changed', emailShell(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Email address changed</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 16px;">Your JustFit account email has been updated to <strong style="color:#f8fafc;">${row.new_email}</strong>.</p>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0;">If you didn't make this change, contact us immediately at support@justfit.cc.</p>
    `, accent), env.RESEND_API_KEY).catch(() => {});
  }

  const newSessionToken = await createJWT({ userId: user.userId, email: row.new_email }, secret);
  return Response.json({ ok: true, token: newSessionToken, new_email: row.new_email });
}

// ─── EMAIL VERIFY / CHANGE LINK HANDLERS (GET) ────────────────────────────────

async function handleVerifyEmailLink(token, env) {
  const row = await env.DB.prepare(
    `SELECT token, user_id, expires_at_ms, used_at_ms FROM magic_link_tokens WHERE token = ? AND purpose = 'verify_email' LIMIT 1`
  ).bind(token).first();

  if (!row || row.used_at_ms || row.expires_at_ms < Date.now()) {
    return Response.redirect('https://justfit.cc/?verify_error=1', 302);
  }

  const now = Date.now();
  await env.DB.batch([
    env.DB.prepare(`UPDATE magic_link_tokens SET used_at_ms = ? WHERE token = ?`).bind(now, token),
    env.DB.prepare(`UPDATE auth_users SET email_verified = 1 WHERE user_id = ?`).bind(row.user_id),
  ]);

  return Response.redirect('https://justfit.cc/?email_verified=1', 302);
}

async function handleChangeEmailLink(token, env) {
  const row = await env.DB.prepare(
    `SELECT token, user_id, new_email, expires_at_ms, used_at_ms FROM magic_link_tokens WHERE token = ? AND purpose = 'email_change' LIMIT 1`
  ).bind(token).first();

  if (!row || row.used_at_ms || row.expires_at_ms < Date.now() || !row.new_email) {
    return Response.redirect('https://justfit.cc/?verify_error=1', 302);
  }

  const now = Date.now();
  const oldAuthUser = await env.DB.prepare(
    `SELECT email FROM auth_users WHERE user_id = ? LIMIT 1`
  ).bind(row.user_id).first();

  await env.DB.batch([
    env.DB.prepare(`UPDATE magic_link_tokens SET used_at_ms = ? WHERE token = ?`).bind(now, token),
    env.DB.prepare(`UPDATE auth_users SET email = ?, email_verified = 1, updated_at_ms = ? WHERE user_id = ?`).bind(row.new_email, now, row.user_id),
    env.DB.prepare(`UPDATE users SET primary_email = ?, updated_at_ms = ? WHERE id = ?`).bind(row.new_email, now, row.user_id),
  ]);

  if (oldAuthUser?.email && env.RESEND_API_KEY) {
    const accent = await getUserAccent(row.user_id, env);
    sendEmail(oldAuthUser.email, 'Your JustFit email address was changed', emailShell(`
      <h1 style="font-size:24px;font-weight:900;margin:0 0 12px;">Email address changed</h1>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0 0 16px;">Your JustFit account email has been updated to <strong style="color:#f8fafc;">${row.new_email}</strong>.</p>
      <p style="color:#64748b;font-size:15px;line-height:1.7;margin:0;">If you didn't make this change, contact us immediately at support@justfit.cc.</p>
    `, accent), env.RESEND_API_KEY).catch(() => {});
  }

  // Link-based change: JWT is re-issued on next app login. Redirect with success flag.
  return Response.redirect('https://justfit.cc/?email_changed=1', 302);
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
async function getSessionUser(request, secret) {
  const auth  = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  return verifyJWT(token, secret);
}

// ─── EXPORTED HANDLERS ────────────────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ error: 'Server misconfiguration' }, { status: 500 });

    const body = await request.json();
    switch (body.action) {
      case 'signup':                    return handleSignup(body, env, secret);
      case 'login':                     return handleLogin(body, request, env, secret);
      case 'forgot_password':           return handleForgotPassword(body, env, secret);
      case 'reset_password':            return handleResetPassword(body, request, env, secret);
      case 'magic_link':                return handleMagicLink(body, env);
      case 'passkey_begin_register':    return handlePasskeyBeginRegister(request, env, secret);
      case 'passkey_complete_register': return handlePasskeyCompleteRegister(request, body, env, secret);
      case 'passkey_begin_auth':        return handlePasskeyBeginAuth(body, env, secret);
      case 'passkey_complete_auth':     return handlePasskeyCompleteAuth(body, env, secret);
      case 'delete_account':            return handleDeleteAccount(request, env, secret);
      case 'resend_verification':       return handleResendVerification(request, env, secret);
      case 'verify_email_code':         return handleVerifyEmailCode(body, request, env, secret);
      case 'request_email_change':      return handleRequestEmailChange(body, request, env, secret);
      case 'verify_change_code':        return handleVerifyChangeCode(body, request, env, secret);
      default: return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const secret = env.JWT_SECRET;
    if (!secret) return Response.json({ valid: false }, { status: 500 });

    const url   = new URL(request.url);
    const magic = url.searchParams.get('magic');

    // Email verification / change link clicks
    const verifyEmail = url.searchParams.get('verify_email');
    const changeEmail = url.searchParams.get('change_email');
    if (verifyEmail) return handleVerifyEmailLink(verifyEmail, env);
    if (changeEmail) return handleChangeEmailLink(changeEmail, env);

    // Magic link verification (DB-backed, single-use)
    if (magic) return handleMagicVerify(magic, env, secret);

    // Session token verification
    const user = await getSessionUser(request, secret);
    if (!user) return Response.json({ valid: false }, { status: 401 });
    return Response.json({ valid: true, userId: user.userId, email: user.email });
  } catch {
    return Response.json({ valid: false }, { status: 401 });
  }
}
