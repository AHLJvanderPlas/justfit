// functions/lib/crypto.js
// Envelope encryption helpers using Web Crypto API only.
// Gym keys are AES-GCM 256-bit, wrapped by a master KEK from env.GYM_MASTER_KEK.
// PII fields are individually encrypted with the gym key.

const ENC_ALGO = { name: 'AES-GCM', length: 256 };
const WRAP_ALGO = { name: 'AES-GCM', length: 256 };
const IV_LEN = 12; // bytes

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function fromB64url(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

/** Derive a CryptoKey from a raw base64url-encoded 32-byte key material. */
async function importRawKey(raw, usages) {
  return crypto.subtle.importKey('raw', fromB64url(raw), ENC_ALGO, true, usages);
}

/**
 * Generate a fresh gym encryption key and wrap it with the master KEK.
 * @param {string} masterKekB64 - base64url master KEK (32 bytes from env.GYM_MASTER_KEK)
 * @returns {Promise<string>} encryption_key_enc — "iv:wrappedKey" base64url
 */
export async function generateGymKey(masterKekB64) {
  const gymKey = await crypto.subtle.generateKey(ENC_ALGO, true, ['encrypt', 'decrypt']);
  const gymKeyRaw = await crypto.subtle.exportKey('raw', gymKey);

  const kek = await importRawKey(masterKekB64, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, gymKeyRaw);

  return `${b64url(iv)}:${b64url(wrapped)}`;
}

/**
 * Unwrap a gym key using the master KEK.
 * @param {string} encKeyEnc — "iv:wrappedKey" base64url from gyms.encryption_key_enc
 * @param {string} masterKekB64 — env.GYM_MASTER_KEK
 * @returns {Promise<CryptoKey>}
 */
export async function unwrapGymKey(encKeyEnc, masterKekB64) {
  if (!encKeyEnc || encKeyEnc === 'PENDING_KEY_GENERATION') {
    throw new Error('Gym encryption key not yet generated');
  }
  const [ivB64, wrappedB64] = encKeyEnc.split(':');
  const iv = fromB64url(ivB64);
  const wrapped = fromB64url(wrappedB64);

  const kek = await importRawKey(masterKekB64, ['decrypt']);
  const keyRaw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, kek, wrapped);
  return crypto.subtle.importKey('raw', keyRaw, ENC_ALGO, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt a string field with the gym CryptoKey.
 * @returns {string} "iv:ciphertext" base64url, or null if value is null/undefined
 */
export async function encryptField(value, gymCryptoKey) {
  if (value == null) return null;
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const plain = new TextEncoder().encode(String(value));
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, gymCryptoKey, plain);
  return `${b64url(iv)}:${b64url(cipher)}`;
}

/**
 * Decrypt a field encrypted with encryptField.
 * @returns {string|null}
 */
export async function decryptField(blob, gymCryptoKey) {
  if (!blob) return null;
  const [ivB64, cipherB64] = blob.split(':');
  const iv = fromB64url(ivB64);
  const cipher = fromB64url(cipherB64);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, gymCryptoKey, cipher);
  return new TextDecoder().decode(plain);
}

/**
 * Per-request gym key cache (Map: gymId → CryptoKey).
 * Call this once per request; pass the returned cache into helpers that need the key.
 */
export function createKeyCache() {
  const cache = new Map();
  return {
    async get(gymId, encKeyEnc, masterKek) {
      if (cache.has(gymId)) return cache.get(gymId);
      const key = await unwrapGymKey(encKeyEnc, masterKek);
      cache.set(gymId, key);
      return key;
    },
  };
}

/**
 * Initialize a fresh gym: generate + store a real key if the gym still has the placeholder.
 * Call this from the gym-settings endpoint after a trainer logs in for the first time.
 */
export async function ensureGymKey(gym, env) {
  if (gym.encryption_key_enc && gym.encryption_key_enc !== 'PENDING_KEY_GENERATION') return;
  if (!env.GYM_MASTER_KEK) throw new Error('GYM_MASTER_KEK env var not set');
  const encKeyEnc = await generateGymKey(env.GYM_MASTER_KEK);
  await env.DB.prepare('UPDATE gyms SET encryption_key_enc = ?, updated_at_ms = ? WHERE id = ?')
    .bind(encKeyEnc, Date.now(), gym.id)
    .run();
}
