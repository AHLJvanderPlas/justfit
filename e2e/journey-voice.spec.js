/**
 * Voice 1 — the recorded coach voice, in a real session.
 *
 * No real clip exists in the repo yet, so the journey serves a 20 s silent mp3
 * (e2e/fixtures/silence.mp3) from the built app at /exercise-audio/e2e-voice/<lang>.mp3 (copied into
 * dist for the run and removed after: Playwright's page.route does not intercept requests made by a
 * media element in Chromium, so the file has to be really served) and patches every /api/plan
 * response so each step carries `audio` (the way production steps will carry it once migration 0128
 * is applied).
 *  - a clip in the app language (English UI): Read aloud requests that clip and only that clip,
 *    the button toggles to Stop, the device voice (speechSynthesis.speak) is NOT used, finishing the
 *    set pauses the clip, and no Content-Security-Policy violation is logged;
 *  - steps without a clip for the app language (only a Dutch clip for an English UI) or without any
 *    audio: exactly today's behaviour — the device voice reads, no clip is requested.
 */
import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { signupFresh } from './helpers.js';

const MP3 = readFileSync(fileURLToPath(new URL('./fixtures/silence.mp3', import.meta.url)));
const DIST_CLIPS = fileURLToPath(new URL('../packages/client-app/dist/exercise-audio/e2e-voice', import.meta.url));

test.beforeAll(() => {
  mkdirSync(DIST_CLIPS, { recursive: true });
  for (const l of ['nl', 'en']) writeFileSync(`${DIST_CLIPS}/${l}.mp3`, MP3);
});
test.afterAll(() => rmSync(DIST_CLIPS, { recursive: true, force: true }));

function stubMedia() {
  const spoken = [];
  window.__spoken = spoken;
  class Utterance { constructor(text) { this.text = text; this.voice = null; this.onend = null; this.onerror = null; } }
  const synth = {
    speaking: false, pending: false, paused: false,
    speak(u) { spoken.push(u.text); if (u.text) setTimeout(() => u.onend?.(), 5); },
    cancel() {},
    getVoices() { return [{ name: 'Test English', lang: 'en-GB' }, { name: 'Test Nederlands', lang: 'nl-NL' }]; },
    addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => synth });
  window.SpeechSynthesisUtterance = Utterance;
  // Record, but still run, the real media element: the mp3 is really requested and decoded.
  const log = { plays: [], pauses: 0 };
  window.__audio = log;
  const play = HTMLMediaElement.prototype.play;
  const pause = HTMLMediaElement.prototype.pause;
  HTMLMediaElement.prototype.play = function () { log.plays.push({ src: this.getAttribute('src'), preload: this.preload }); return play.call(this); };
  HTMLMediaElement.prototype.pause = function () { log.pauses += 1; return pause.call(this); };
}

/** Every step of every /api/plan answer gets `audio` for the languages given. */
async function patchPlanAudio(page, langs) {
  const requested = [];   // what the media element really asked the server for (status and type included)
  page.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/exercise-audio/')) requested.push({ path: u.pathname, status: r.status(), type: r.headers()['content-type'] }); });
  if (langs.length) {
    await page.route('**/api/plan**', async (route) => {
      const res = await route.fetch();
      if (!(res.headers()['content-type'] ?? '').includes('json')) return route.fulfill({ response: res });
      const json = await res.json();
      const walk = (o) => {
        if (Array.isArray(o)) o.forEach(walk);
        else if (o && typeof o === 'object') {
          if (typeof o.exercise_slug === 'string') o.audio = Object.fromEntries(langs.map((l) => [l, `/exercise-audio/e2e-voice/${l}.mp3`]));
          for (const [k, v] of Object.entries(o)) {
            // GET /api/plan carries the plan as a JSON string (plan_json).
            if (typeof v === 'string' && v.includes('"exercise_slug"')) { try { const inner = JSON.parse(v); walk(inner); o[k] = JSON.stringify(inner); } catch { /* not JSON */ } }
            else walk(v);
          }
        }
      };
      walk(json);
      return route.fulfill({ response: res, json });
    });
  }
  return requested;
}

async function toFirstExercise(page) {
  await page.getByRole('button', { name: /START SESSION/ }).click();
  await page.getByRole('button', { name: 'Start Workout' }).click();
  await expect(page.getByRole('button', { name: /Ready/ })).toBeVisible({ timeout: 15_000 });
}

test('a recorded clip in the app language: requested, Stop toggles, no device voice, paused on set finish', async ({ page }) => {
  const csp = [];
  page.on('console', (m) => { if (/content security policy/i.test(m.text())) csp.push(m.text()); });
  page.on('pageerror', (e) => { if (/content security policy/i.test(String(e))) csp.push(String(e)); });
  await page.addInitScript(stubMedia);
  const requested = await patchPlanAudio(page, ['nl', 'en']);
  await signupFresh(page, '-voice');
  await toFirstExercise(page);

  const speak = page.getByTestId('read-aloud');
  await expect(speak).toBeVisible();
  await expect(speak).toHaveText('Read aloud');
  expect(requested, 'preload none: nothing is fetched before the tap').toEqual([]);

  await speak.click();
  await expect.poll(() => requested.length, { message: 'the clip is requested' }).toBeGreaterThan(0);
  expect(requested.every((r) => r.path === '/exercise-audio/e2e-voice/en.mp3' && r.status < 300 && r.type === 'audio/mpeg'), 'only the English clip for an English UI, served as audio/mpeg').toBe(true);
  await expect(speak).toHaveText('Stop');
  await expect(speak).toHaveAttribute('aria-pressed', 'true');
  const plays = await page.evaluate(() => window.__audio.plays);
  expect(plays).toHaveLength(1);
  expect(plays[0].src).toBe('/exercise-audio/e2e-voice/en.mp3');
  expect(plays[0].preload).toBe('none');
  expect(await page.evaluate(() => window.__spoken), 'the device voice stays silent for a clip').toEqual([]);

  // Stop, then play again, then finish the set while it plays.
  const p0 = await page.evaluate(() => window.__audio.pauses);
  await speak.click();
  await expect(speak).toHaveText('Read aloud');
  expect(await page.evaluate(() => window.__audio.pauses)).toBeGreaterThan(p0);
  await speak.click();
  await expect(speak).toHaveText('Stop');
  expect(await page.evaluate(() => window.__spoken)).toEqual([]);

  await page.getByRole('button', { name: /Ready/ }).click();
  const before = await page.evaluate(() => window.__audio.pauses);
  await page.locator('.jf-wo-bar .jf-primary').click();
  await expect.poll(() => page.evaluate(() => window.__audio.pauses), { message: 'the clip is paused when the set is finished' }).toBeGreaterThan(before);
  expect(await page.evaluate(() => window.__spoken)).toEqual([]);
  expect(csp, 'no Content-Security-Policy violation for same-origin audio').toEqual([]);
});

for (const [label, langs] of [['only a Dutch clip for an English UI', ['nl']], ['no audio at all', []]]) {
  test(`${label}: the device voice reads as before and no clip is requested`, async ({ page }) => {
    await page.addInitScript(stubMedia);
    const requested = await patchPlanAudio(page, langs);
    await signupFresh(page, '-voice2');
    await toFirstExercise(page);
    const speak = page.getByTestId('read-aloud');
    await expect(speak).toBeVisible();
    await speak.click();
    await expect.poll(() => page.evaluate(() => window.__spoken.length)).toBeGreaterThan(2);
    expect(requested).toEqual([]);
    expect(await page.evaluate(() => window.__audio.plays)).toEqual([]);
  });
}
