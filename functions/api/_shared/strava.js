/**
 * BYO Strava client_secret encryption helpers.
 *
 * Stored format: "enc:<base64(12-byte IV || AES-GCM ciphertext)>"
 * Legacy plaintext values (no "enc:" prefix) are returned as-is so existing
 * rows continue to work until re-saved.
 *
 * Key derivation: PBKDF2(JWT_SECRET, "strava_byo:<userId>", 100k, SHA-256) → AES-GCM-256
 */

async function deriveKey(jwtSecret, userId) {
  const raw = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(jwtSecret), 'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('strava_byo:' + userId), iterations: 100000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptByoSecret(plaintext, jwtSecret, userId) {
  const key = await deriveKey(jwtSecret, userId);
  const iv  = crypto.getRandomValues(new Uint8Array(12));
  const ct  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  const buf = new Uint8Array(12 + ct.byteLength);
  buf.set(iv);
  buf.set(new Uint8Array(ct), 12);
  return 'enc:' + btoa(String.fromCharCode(...buf));
}

export async function decryptByoSecret(stored, jwtSecret, userId) {
  if (!stored || !stored.startsWith('enc:')) return stored; // legacy plaintext — pass through
  const buf = Uint8Array.from(atob(stored.slice(4)), c => c.charCodeAt(0));
  const key = await deriveKey(jwtSecret, userId);
  const pt  = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: buf.slice(0, 12) }, key, buf.slice(12));
  return new TextDecoder().decode(pt);
}
