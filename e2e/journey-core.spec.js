import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath, waitForStoredPlan } from './helpers.js';

// Journey 1 (docs/IMPROVEMENT_PLAN.md Phase 3.1):
// signup/login -> onboarding -> check-in -> plan -> complete workout -> history
test('signup, onboard, check in, complete a workout and see it in history', async ({ page }) => {
  // Force English strings so t() returns source keys verbatim (default lang is NL).
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  // UAT D2 — our own CSP blocked /sw.js (worker-src 'none') on every load. Any CSP
  // violation the browser reports during the journey fails it.
  const cspViolations = [];
  page.on('console', (msg) => { if (msg.text().includes('Content Security Policy')) cspViolations.push(msg.text()); });

  const email = `e2e-${Date.now()}@justfit.cc`;
  const password = 'e2e-test-pw';

  // ── Signup ──────────────────────────────────────────────────────────────
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();

  await page.waitForURL('/');
  // The service worker registers (wrangler pages dev on localhost allows it over http).
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !!r)),
    { timeout: 15_000, message: '/sw.js should be registered after load' }).toBe(true);

  // ── Onboarding (UAT R6): the goal step holds the path; skipping it keeps General ───────
  await page.getByRole('button', { name: /I Agree/ }).click();
  await expect(page.locator('[data-path="running"]')).toBeVisible();     // the sport paths sit in the goal step
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Skip this step' }).click();

  // ── Today first, no path modal, no check-in sheet: the mood row is the day's check-in ──
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.jf-pathmodal')).toHaveCount(0);
  await expect(page.getByTestId('checkin-sheet')).toHaveCount(0);
  const profile = await (await page.request.get('/api/profile')).json();
  expect(profile.preferences?.primary_intent, 'onboarding stores the path (general by default)').toBe('general');
  // A reload on the onboarding day still does not push the sheet in front of Today.
  await page.reload();
  const row = page.getByTestId('mood-row');
  await expect(row).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('checkin-sheet')).toHaveCount(0);
  await expect(page.locator('.jf-pathmodal')).toHaveCount(0);

  // ── Daily check-in: one tap. Stored (D4) and today's plan rebuilt with it (trial = Pro) ──
  const savedCheckin = page.waitForRequest((r) => r.url().includes('/api/checkin') && r.method() === 'POST');
  const replanned = page.waitForRequest((r) => r.url().includes('/api/plan') && r.method() === 'POST' && !!JSON.parse(r.postData() ?? '{}').checkin);
  await row.getByRole('button', { name: 'Not great' }).click();
  const stored = JSON.parse((await savedCheckin).postData());
  expect(stored.stress, 'the mood row sends the sheet\'s numbers ("Not great" → stress 8)').toBe(8);
  expect(JSON.parse((await replanned).postData()).checkin.stress).toBe(8);
  await expect(row).toHaveCount(0);

  // ── Today's plan ──────────────────────────────────────────────────────
  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await expect(startSession).toBeEnabled();
  await startSession.click();

  // ── Complete the workout (skip through each exercise) ──────────────────
  // Workout opens in overview phase → click "Start Workout" first.
  await page.getByRole('button', { name: 'Start Workout' }).click();

  const logSession = page.getByRole('button', { name: 'Log session →' });
  for (let i = 0; i < 15; i++) {
    if (await logSession.isVisible()) break;
    await page.getByRole('button', { name: /Ready/ }).click();
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
  }
  await expect(logSession).toBeVisible();
  await logSession.click();

  // ── History shows the completed session ─────────────────────────────────
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByText('RECENT SESSIONS')).toBeVisible({ timeout: 15_000 });
  expect(cspViolations, 'no Content Security Policy violation during the core journey').toEqual([]);
});

// UAT D4 — the check-in Apply branched on prefs.isPro (always false since F8), so every
// check-in took the free adapt path, which scales the stored session but cannot change its
// intensity or selection: "Taking it easy" never reached the session. A fresh signup is
// trialing (Pro), so its check-in must replan today. And a later regeneration that carries
// no check-in (here: changing the path) must keep it — the server reads today's stored row.
test('check-in "Taking it easy" → Today is a recovery session, kept through a path change (UAT D4)', async ({ page }) => {
  await signupFresh(page, '-easy');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const stored = async () => {
    const row = (await (await page.request.get(`/api/plan?date=${today}`)).json()).plan;
    return row?.plan_json ? { ...JSON.parse(row.plan_json), id: row.id } : row;   // id: stored, not in-memory
  };
  const r559 = (plan) => (plan?.rule_trace ?? []).some((t) => /R559/.test(t));
  // (a) UAT release 2 — "Why this plan?" is closed on the first view of Today (it used to
  //     open by itself with 10–15 bullets).
  const why = page.getByRole('button', { name: 'Why this plan?' });
  await expect(why).toBeVisible();
  await expect(why).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('why-panel')).toHaveCount(0);
  await waitForStoredPlan(page);
  expect(r559(await stored()), 'no recovery mode before the check-in says so').toBe(false);

  // (a) The check-in, on a day that already has a plan: the Pro branch replans it. The free
  //     adapt path would keep the stored session (its trace gains adapt:free_tier, never R559).
  await page.getByRole('button', { name: 'Check-in' }).click();
  const sheet = page.getByTestId('checkin-sheet');
  await sheet.getByRole('button', { name: 'Good' }).click();
  await sheet.getByRole('button', { name: 'Taking it easy' }).click();
  await sheet.getByRole('button', { name: 'Apply →' }).click();
  await expect.poll(async () => { const p = await stored(); return r559(p) && p.intensity; },
    { timeout: 30_000, message: 'the check-in should replan today as a recovery session (R559, low)' }).toBe('low');
  await expect(page.getByText('LOW', { exact: true }).first()).toBeVisible({ timeout: 20_000 });
  // (b) UAT release 2 — the coach sentence names the check-in rule, not the goal line, and
  //     the title follows the session ("EASY SESSION", not the goal-based name).
  const coach = page.getByTestId('coach-sentence');
  await expect(coach).toHaveText('Taking it easy today — mobility and recovery only.', { timeout: 20_000 });
  await expect(coach).not.toHaveText(/Today's session:/);
  await expect(page.getByText('EASY SESSION', { exact: true })).toBeVisible();
  await expect(why).toHaveAttribute('aria-expanded', 'false');
  await why.click();
  await expect(page.getByTestId('why-panel').getByText('Changed today')).toBeVisible();
  await expect(page.getByText('Recovery mode — low intensity, mobility and recovery exercises only.')).toBeVisible();

  // (b) Changing the path regenerates WITHOUT a check-in (path_change, UAT D3); the
  //     recovery day must survive it.
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Goal & coach/ }).click();
  await page.getByRole('button', { name: 'Change path →' }).click();
  const regen = page.waitForResponse((r) => r.url().includes('/api/plan') && r.request().method() === 'POST'
    && (r.request().postData() ?? '').includes('"path_change":true'), { timeout: 30_000 });
  await page.getByRole('button', { name: /^●\s*GENERAL/ }).click();   // the modal's tile (Settings has other "General" buttons)
  const res = await regen;
  expect(JSON.parse(res.request().postData()).checkin ?? null, 'the path regeneration carries no check-in').toBe(null);
  const body = await res.json();
  expect(body.plan?.intensity, 'the path regeneration keeps today\'s stored check-in').toBe('low');
  expect(r559(body.plan), 'R559 in the path regeneration\'s trace').toBe(true);
});
