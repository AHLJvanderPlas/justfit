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
  it('keeps the element ids the e2e helpers use', () => {
    for (const id of ['tab-signup', 'tab-login', 'email', 'password', 'accept-check', 'submit-btn', 'guest-btn', 'mt-password']) {
      expect(html).toContain(`id="${id}"`);
    }
  });
  it('the English strings the e2e suite reads are unchanged', () => {
    expect(EN.tab_signup).toBe('Create account');
    expect(EN.btn_create).toBe('Create Account');
    expect(EN.guest).toBe('Continue without account →');
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
