// C-B33 — a guest accepts the same terms + privacy versions as an email signup, server-side,
// fail-closed, and the acceptance is stored on the users row (so no "Updated policies" gate on reload).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { onRequestPost } from '../../../functions/api/auth.js';
import { CURRENT_TERMS_VERSION, CURRENT_PRIVACY_VERSION } from '../../../functions/api/_shared/legalVersions.js';

function fakeEnv() {
  const calls = [];
  const stmt = (sql) => ({
    bind: (...args) => { const s = { sql, args, run: async () => { calls.push(s); return {}; }, first: async () => ({ count: 1 }) }; return s; },
  });
  return { calls, JWT_SECRET: 'test-secret', DB: { prepare: stmt, batch: async (stmts) => { calls.push(...stmts); return []; } } };
}
const post = (env, body) => onRequestPost({
  request: new Request('https://justfit.cc/api/auth', { method: 'POST', headers: { 'CF-Connecting-IP': '203.0.113.7' }, body: JSON.stringify(body) }),
  env,
});
const userInsert = (env) => env.calls.find((c) => /INSERT INTO users/.test(c.sql));

describe('guest_signup consent', () => {
  it('rejects a guest signup without versions (400, nothing written)', async () => {
    const env = fakeEnv();
    const res = await post(env, { action: 'guest_signup' });
    expect(res.status).toBe(400);
    expect(userInsert(env)).toBeUndefined();
  });
  it('rejects stale terms and stale privacy versions', async () => {
    for (const body of [
      { accepted_terms_version: '0.9', accepted_privacy_version: CURRENT_PRIVACY_VERSION },
      { accepted_terms_version: CURRENT_TERMS_VERSION, accepted_privacy_version: '0.1' },
      { accepted_terms_version: CURRENT_TERMS_VERSION },
    ]) {
      const env = fakeEnv();
      const res = await post(env, { action: 'guest_signup', ...body });
      expect(res.status).toBe(400);
      expect(userInsert(env)).toBeUndefined();
    }
  });
  it('accepts current versions and stores them on the users row', async () => {
    const env = fakeEnv();
    const res = await post(env, { action: 'guest_signup', accepted_terms_version: CURRENT_TERMS_VERSION, accepted_privacy_version: CURRENT_PRIVACY_VERSION });
    expect(res.status).toBe(200);
    expect((await res.json()).guest).toBe(true);
    const ins = userInsert(env);
    expect(ins.sql).toMatch(/accepted_terms_version.*accepted_terms_at_ms.*accepted_privacy_version.*accepted_privacy_at_ms/s);
    expect(ins.args).toContain(CURRENT_TERMS_VERSION);
    expect(ins.args).toContain(CURRENT_PRIVACY_VERSION);
  });
});

describe('guest_signup uses the same consent check as signup', () => {
  const src = readFileSync(new URL('../../../functions/api/auth.js', import.meta.url), 'utf8');
  const body = (name) => src.slice(src.indexOf(`async function ${name}(`)).split(/\n}\n/)[0];
  it('both handlers call legalConsentError', () => {
    expect(body('handleSignup')).toMatch(/legalConsentError\(/);
    expect(body('handleGuestSignup')).toMatch(/legalConsentError\(/);
  });
});
