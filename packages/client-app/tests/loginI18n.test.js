// UAT release 4 — the login page is static HTML (no React), so its two languages live in
// public/login-i18n.js. The dictionary must be complete in both, every data-i18n hook in
// login.html and every T('…') in login.js must resolve, and the language rule must hold.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// The file is a plain browser script that also exports under CommonJS; run it with a fake `module`.
const mod = { exports: {} };
new Function('module', readFileSync(new URL('../public/login-i18n.js', import.meta.url), 'utf8'))(mod);
const { EN, NL, pickLang } = mod.exports;
const html = readFileSync(new URL('../public/login.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../public/login.js', import.meta.url), 'utf8');

describe('login dictionary', () => {
  it('both languages have exactly the same keys', () => {
    expect(Object.keys(NL).sort()).toEqual(Object.keys(EN).sort());
  });
  it('no empty values, and Dutch differs from English for the interface keys', () => {
    for (const k of Object.keys(EN)) { expect(EN[k], k).toBeTruthy(); expect(NL[k], k).toBeTruthy(); }
    const same = Object.keys(EN).filter((k) => EN[k] === NL[k]);
    // The same word in both languages: only the icon-free labels that are one international word.
    expect(same).toEqual([]);
  });
  it('every data-i18n / data-i18n-ph hook in login.html has an entry', () => {
    const hooks = [...html.matchAll(/data-i18n(?:-ph)?="([^"]+)"/g)].map((m) => m[1]);
    expect(hooks.length).toBeGreaterThan(25);
    expect(hooks.filter((h) => !(h in EN))).toEqual([]);
  });
  it('every T(\'key\') in login.js has an entry', () => {
    const keys = [...js.matchAll(/\bT\('([^']+)'\)/g)].map((m) => m[1]);
    expect(keys.length).toBeGreaterThan(20);
    expect(keys.filter((k) => !(k in EN))).toEqual([]);
  });
  it('keeps the element ids the e2e helpers and the UAT runner use', () => {
    for (const id of ['tab-signup', 'tab-login', 'email', 'password', 'accept-check', 'submit-btn', 'magic-btn', 'guest-btn', 'guest-accept-check', 'mt-password', 'mt-magic', 'passkey-btn', 'forgot-link', 'main-alert']) {
      expect(html).toContain(`id="${id}"`);
    }
  });
  it('the English strings the e2e suite reads are unchanged where they stayed', () => {
    expect(EN.btn_create).toBe('Create account');
    expect(EN.guest).toBe('Continue without account');
    expect(NL.guest).toBe('Doorgaan zonder account');
    expect(NL.btn_continue).toBe('Ga verder met e-mail');
    expect(NL.guest_text).toBe('Je gegevens staan alleen op dit apparaat. Voeg later je e-mail toe.');
  });
});

// UX review E (finding 14): one path, no tabs inside tabs, no inline styles (CSP), emerald.
describe('login page structure', () => {
  const bare = html.replace(/<!--[\s\S]*?-->/g, '');
  it('has no style="" attribute and no inline script (CSP)', () => {
    expect(bare).not.toMatch(/\sstyle\s*=/i);
    expect(bare).not.toMatch(/<script(?![^>]*\bsrc=)/i);
    expect(js).not.toMatch(/\.style\./);
  });
  it('has no tablist / tab roles and no aria-pressed toggles pretending to be tabs', () => {
    expect(bare).not.toMatch(/role="(tablist|tab)"/);
    expect(bare).not.toMatch(/mode-tab|method-tab|aria-pressed/);
  });
  it('shows exactly one primary button in the first state (the others carry hidden)', () => {
    const buttons = [...bare.matchAll(/<button\b[^>]*>/g)].map((m) => m[0]).filter((b) => /btn-primary/.test(b));
    expect(buttons.length).toBe(3);                                   // magic, submit, forgot
    const shown = buttons.filter((b) => !/\bhidden\b/.test(b));
    expect(shown.length).toBe(2);                                     // magic-btn + forgot-btn (inside the hidden forgot view)
    expect(bare).toMatch(/<div id="forgot-view" hidden>/);
    expect(shown.some((b) => b.includes('id="magic-btn"'))).toBe(true);
  });
  it('fields: labelled, e-mail keyboard, the right autocomplete', () => {
    for (const id of ['email', 'password', 'forgot-email']) expect(bare).toMatch(new RegExp(`<label[^>]*for="${id}"`));
    expect(bare).toMatch(/id="email" inputmode="email"[^>]*autocomplete="email"/);
    expect(bare).toMatch(/id="password"[^>]*autocomplete="current-password"/);
    expect(js).toContain("'new-password'");
  });
  it('the guest consent and the signup consent both send the accepted versions; guest starts disabled', () => {
    expect(bare).toMatch(/id="guest-btn"[^>]*\bdisabled\b/);
    expect(js.match(/accepted_terms_version/g).length).toBe(2);
    expect(js.match(/accepted_privacy_version/g).length).toBe(2);
  });
  it('every login-family page and the wave use the app emerald, not coral', () => {
    for (const f of ['login.html', 'magic.html', 'reset-password.html', 'login-wave.js', 'login.js']) {
      const src = readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
      expect(src, f).not.toMatch(/#f43f5e|244,\s*63,\s*94|\bSR = 244/i);
    }
    expect(readFileSync(new URL('../public/login-wave.js', import.meta.url), 'utf8')).toMatch(/SR = 16, SG = 185, SB = 129/);
    expect(readFileSync(new URL('../public/login-wave.js', import.meta.url), 'utf8')).toMatch(/prefers-reduced-motion: reduce/);
  });
  it('an unknown address after a magic link goes to the sign-up form (magic.js and the legacy ?magic= path)', () => {
    const magic = readFileSync(new URL('../public/magic.js', import.meta.url), 'utf8');
    expect(magic).toMatch(/needsSignup[\s\S]*mode=signup/);
    expect(js).toMatch(/needsSignup[\s\S]*mode=signup/);
  });
});

describe('login language rule', () => {
  it('Dutch by default', () => {
    expect(pickLang(null, undefined)).toBe('nl');
    expect(pickLang(null, 'nl-NL')).toBe('nl');
    expect(pickLang(null, 'de-DE')).toBe('nl');
  });
  it('jf_lang wins over the browser language', () => {
    expect(pickLang('en', 'nl-NL')).toBe('en');
    expect(pickLang('nl', 'en-US')).toBe('nl');
  });
  it('English browser and no jf_lang gives English', () => {
    expect(pickLang(null, 'en-US')).toBe('en');
    expect(pickLang(null, 'en')).toBe('en');
    expect(pickLang('', 'en-GB')).toBe('en');
  });
});
