/**
 * Media 1 — exercise photos and read aloud, in a real session.
 *
 * The e2e D1 carries migration 0127 (global-setup.js), so a fresh user's plan holds exercises
 * with photos. The journey walks the session until an exercise with photos is on screen, then:
 * the photo card renders both images (loaded, alt = name + position, captions, 3:2, tap pauses),
 * the working screen shows the compact card, and the read-aloud button exists (44 px,
 * aria-pressed). Speech cannot be heard headless: speechSynthesis is stubbed to record what is
 * queued, so the journey asserts the coach script went out (name, prescription, steps, the
 * English voice for an English UI) and that speech is cancelled when the set is finished.
 *
 * MEDIA1_SHOTS=1 also saves phone screenshots to .uat-out/media1/ (not part of the gate).
 */
import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { signupFresh } from './helpers.js';
import { patchPlanAudio } from './planAudio.js';

const SHOTS = process.env.MEDIA1_SHOTS ? '.uat-out/media1' : null;

function stubSpeech() {
  const log = { spoken: [], cancels: 0 };
  window.__speech = log;
  window.__speechHold = false;   // true: utterances never end (still speaking)
  class Utterance {
    constructor(text) { this.text = text; this.lang = ''; this.voice = null; this.rate = 1; this.onend = null; this.onerror = null; }
  }
  const synth = {
    speaking: false, pending: false, paused: false,
    speak(u) {
      log.spoken.push({ text: u.text, lang: u.lang, voice: u.voice?.name ?? null, rate: u.rate });
      if (!window.__speechHold && u.text) setTimeout(() => u.onend?.(), 5);
    },
    cancel() { log.cancels += 1; },
    getVoices() { return [{ name: 'Test Nederlands', lang: 'nl-NL' }, { name: 'Test English', lang: 'en-US' }, { name: 'Test English (Enhanced)', lang: 'en-GB' }]; },
    addEventListener() {}, removeEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, get: () => synth });
  window.SpeechSynthesisUtterance = Utterance;
}

async function shot(page, name, { width, height, scheme }) {
  if (!SHOTS) return;
  await page.setViewportSize({ width, height });
  await page.emulateMedia({ colorScheme: scheme });
  // The workout body scrolls inside its own container: start every shot at the top.
  await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (e.scrollTop) e.scrollTop = 0; });
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test('exercise photos on the exercise screens, read aloud queued and stopped on set finish', async ({ page }) => {
  if (SHOTS) mkdirSync(SHOTS, { recursive: true });
  await page.addInitScript(stubSpeech);
  await patchPlanAudio(page, []);   // this journey is about the device voice: no recorded clip on any step
  await signupFresh(page, '-media');

  if (SHOTS) {
    // Today's session preview (thumbnails in place of the stick figures where there are photos).
    const preview = page.getByRole('button', { name: /START SESSION/ });
    await preview.scrollIntoViewIfNeeded();
    for (const [w, h, s] of [[390, 844, 'dark'], [320, 568, 'dark']]) {
      await shot(page, `today-thumbs-${w}x${h}-${s}`, { width: w, height: h, scheme: s });
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  }

  await page.getByRole('button', { name: /START SESSION/ }).click();
  await expect(page.getByRole('button', { name: 'Start Workout' })).toBeVisible();
  if (SHOTS) {
    await shot(page, 'overview-thumbs-390x844-dark', { width: 390, height: 844, scheme: 'dark' });
    await page.setViewportSize({ width: 1280, height: 720 });
  }
  await page.getByRole('button', { name: 'Start Workout' }).click();

  // Walk to the first exercise that has photos: Ready → Skip moves on without logging sets.
  const photos = page.getByTestId('exercise-photos');
  const ready = page.getByRole('button', { name: /Ready/ });
  let found = false;
  for (let i = 0; i < 20; i++) {
    await expect(ready).toBeVisible({ timeout: 15_000 });
    if (await photos.count()) { found = true; break; }
    await ready.click();
    await page.locator('.jf-wo-bar').getByRole('button', { name: 'Skip', exact: true }).click();
    if (await page.getByText('Session done!').isVisible()) break;
  }
  expect(found, 'a fresh general-path session holds at least one exercise with photos (migration 0127)').toBe(true);
  const name = (await page.locator('h1').first().textContent()).trim();

  // ── The photo card ──
  const imgs = photos.locator('img');
  await expect(imgs).toHaveCount(2);
  await expect(imgs.nth(0)).toHaveAttribute('alt', `${name} — start position`);
  await expect(imgs.nth(1)).toHaveAttribute('alt', `${name} — end position`);
  await expect(imgs.nth(0)).toHaveAttribute('src', /^\/exercise-media\/[a-z0-9-]+\/0\.jpg$/);
  await expect(imgs.nth(0)).toHaveAttribute('loading', 'lazy');
  await photos.scrollIntoViewIfNeeded();
  await expect.poll(() => imgs.evaluateAll((els) => els.every((e) => e.complete && e.naturalWidth > 0)), { message: 'both photos load from /exercise-media' }).toBe(true);
  await expect(photos.locator('figcaption')).toHaveText(['Start', 'End']);
  const stage = await photos.locator('.jf-photos__stage').boundingBox();
  expect(Math.abs(stage.width / stage.height - 1.5), 'the stage is 3:2').toBeLessThan(0.03);
  const pause = photos.getByRole('button', { name: 'Pause the photos' });
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  await pause.click();
  await expect(photos.getByRole('button', { name: 'Play the photos' })).toHaveAttribute('aria-pressed', 'true');
  expect(await photos.locator('.jf-photos__frame--1').evaluate((e) => getComputedStyle(e).animationPlayState)).toBe('paused');

  // ── Read aloud: the whole script is queued, in the English voice for an English UI ──
  const speak = page.getByTestId('read-aloud');
  await expect(speak).toBeVisible();
  await expect(speak).toHaveAttribute('aria-pressed', 'false');
  await expect(speak).toHaveText('Read aloud');
  expect((await speak.boundingBox()).height, 'read-aloud hit area').toBeGreaterThanOrEqual(44);
  await speak.click();
  await expect.poll(() => page.evaluate(() => window.__speech.spoken.length)).toBeGreaterThan(2);
  await expect(speak).toHaveAttribute('aria-pressed', 'false');   // the stub ran the queue to the end
  const spoken = await page.evaluate(() => window.__speech.spoken);
  expect(spoken[0].text, 'the script starts with the exercise name').toBe(`${name}.`);
  expect(spoken.map((u) => u.text).join(' ')).toMatch(/\d+ sets? of \d+ (reps?|seconds?|minutes?)\./);
  expect(spoken.map((u) => u.text).join(' ')).not.toMatch(/step \d/i);
  expect(spoken.every((u) => u.lang === 'en-GB' && u.voice === 'Test English (Enhanced)' && u.rate === 0.95), 'best English voice, rate 0.95').toBe(true);

  // Still speaking when the set is finished → cancelled.
  await page.evaluate(() => { window.__speechHold = true; });
  await speak.click();
  await expect(speak).toHaveAttribute('aria-pressed', 'true');
  await expect(speak).toHaveText('Stop');
  if (SHOTS) {
    for (const [w, h, s] of [[390, 844, 'dark'], [320, 568, 'dark'], [390, 844, 'light']]) {
      await shot(page, `instruction-photos-${w}x${h}-${s}`, { width: w, height: h, scheme: s });
    }
    // The working screen mounts on a 320 x 568 phone: photos start folded (short screen), one tap shows them.
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ colorScheme: 'dark' });
    await ready.click();
    await shot(page, 'working-320x568-dark-default-folded', { width: 320, height: 568, scheme: 'dark' });
    await page.getByRole('button', { name: 'Show photos' }).click();
  } else {
    await ready.click();
  }

  // ── The working screen: the compact card, the primary button in reach ──
  const working = page.getByTestId('exercise-photos');
  await expect(working).toHaveClass(/jf-photos--compact/);
  await expect(working.getByRole('button', { name: 'Hide photos' })).toHaveAttribute('aria-expanded', 'true');
  if (SHOTS) {
    for (const [w, h, s] of [[390, 844, 'dark'], [320, 568, 'dark'], [390, 844, 'light']]) {
      await shot(page, `working-photos-${w}x${h}-${s}`, { width: w, height: h, scheme: s });
      const bar = await page.locator('.jf-wo-bar .jf-primary').boundingBox();
      expect(bar.y + bar.height, `"Finish set" is on screen at ${w}x${h}`).toBeLessThanOrEqual(h);
    }
  }
  await page.setViewportSize({ width: 320, height: 568 });
  const finish = page.locator('.jf-wo-bar .jf-primary');
  const fb = await finish.boundingBox();
  expect(fb.y + fb.height, '"Finish set" stays on a 320 x 568 screen').toBeLessThanOrEqual(568);

  const before = await page.evaluate(() => window.__speech.cancels);
  await finish.click();
  await expect.poll(() => page.evaluate(() => window.__speech.cancels), { message: 'speech is cancelled when the set is finished' }).toBeGreaterThan(before);
});

test('the read-aloud setting lives in Settings → You, off by default, per device', async ({ page }) => {
  await page.addInitScript(stubSpeech);
  await signupFresh(page, '-media-set', { checkin: false });
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^You/ }).click();
  const setting = page.getByTestId('read-aloud-setting');
  await expect(setting).toBeVisible();
  const sw = setting.getByRole('switch', { name: 'Read each exercise aloud' });
  await expect(sw).toHaveAttribute('aria-checked', 'false');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  expect(await page.evaluate(() => localStorage.getItem('jf_read_aloud_auto'))).toBe('1');
});
