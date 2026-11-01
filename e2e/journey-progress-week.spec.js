import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

// UAT release 3 — Progress and the week, gated on data (docs/UAT_IMPROVEMENT_PLAN_2026-11.md).
// English suite (jf_lang=en): t() returns the keys.

test('day one: Progress shows the "after 3 sessions" line and no insight or axis blocks (UAT R3)', async ({ page }) => {
  await signupFresh(page, '-prog');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByRole('heading', { name: 'PROGRESS' })).toBeVisible();
  await expect(page.getByText('After 3 sessions you will see your strong and weak points here.')).toBeVisible({ timeout: 15_000 });
  // What is allowed on day one stays: the streak.
  await expect(page.getByText(/STREAK/)).toBeVisible();
  // What waits for three sessions does not render: key insights, axis analysis, goal fit, recovery, radar.
  for (const gone of ['Key Insights', 'AXIS BREAKDOWN', 'Goal Fit', 'How the Planner Adapts', 'TRAINING BALANCE', 'Recovery']) {
    await expect(page.getByText(gone, { exact: true }), `"${gone}" must not render before three sessions`).toHaveCount(0);
  }
  await expect(page.getByText('Strongest', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Weakest', { exact: true })).toHaveCount(0);
  // The week pill is neutral on day one: never the red verdict.
  await expect(page.getByText('Behind', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/^\d+ to go$/)).toBeVisible();
});

test('Deze week: one "Log a training" row, two upcoming days, "Whole week →" for the rest (UAT R3)', async ({ page }) => {
  await signupFresh(page, '-week');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'This Week' }).click();
  await expect(page.getByText('Your last 7 days at a glance')).toBeVisible();
  // Seven days in the strip, one row to log the selected one (it used to be seven rows).
  await expect(page.locator('.jf-weekstrip__day')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Log a training' })).toHaveCount(1);
  // Pick a past day: the row follows it, still one.
  await page.locator('.jf-weekstrip__day').nth(3).click();
  await expect(page.getByRole('button', { name: 'Log a training' })).toHaveCount(1);
  await expect(page.locator('.jf-weekstrip__day--sel')).toHaveCount(1);
  // Aankomend: at most two days until the whole week is asked for.
  const whole = page.getByRole('button', { name: 'Whole week →' });
  await expect(whole).toBeVisible({ timeout: 45_000 });
  await expect(page.locator('.jf-upday')).toHaveCount(2);
  await whole.click();
  await expect.poll(() => page.locator('.jf-upday').count()).toBeGreaterThan(2);
  // No completed session yet: no "Completed Sessions" header, no empty-state card.
  await expect(page.getByText('Completed Sessions')).toHaveCount(0);
  await expect(page.getByText('Your workout history will appear here.')).toHaveCount(0);
});

// UAT release 4 — Dutch sweep 3. The rest of this file is the English suite; this one test reads the
// same app in Dutch: Settings → Jij has no English section titles, and Voortgang's weekly sentence,
// share link and dates are Dutch. A self-logged-style activity gives Voortgang its first session.
test('Dutch sweep 3: Instellingen → Jij says "Je profiel", Voortgang has no "Fresh start" (UAT R4)', async ({ page }) => {
  await signupFresh(page, '-nl4');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  expect((await page.request.post('/api/execution', { data: { date: today, session_type: 'run', duration_sec: 1800 } })).ok()).toBe(true);
  // Dutch from here (signupFresh pinned jf_lang = en; a later init script runs after it).
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'nl'));
  await page.reload();

  // Voortgang: the weekly outcome, the share link and the awards entry in Dutch.
  await page.getByRole('button', { name: 'Voortgang', exact: true }).click();
  await expect(page.getByText('Frisse start — we bouwen vanaf hier.')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(/Fresh start/)).toHaveCount(0);
  await expect(page.getByText('↑ Deel je voortgang')).toBeVisible();
  await expect(page.getByText(/Share progress/)).toHaveCount(0);

  // Instellingen → Jij: Dutch section titles, no English ones.
  await page.getByRole('button', { name: 'Instellingen', exact: true }).click();
  await page.getByRole('button', { name: /^Jij/ }).click();
  await expect(page.getByText('Je profiel', { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Dagelijkse planning', { exact: true })).toBeVisible();
  await expect(page.getByText('Beschikbare tijd per sessie', { exact: true })).toBeVisible();
  for (const gone of ['Your profile', 'Daily Planning', 'Available time per session', 'Known Injuries', 'Re-do onboarding']) {
    await expect(page.getByText(gone, { exact: true }), `"${gone}" must not render in Dutch`).toHaveCount(0);
  }
  // No FTP number before one was entered: the cycling coach is not set up, nothing to print here.
  await expect(page.getByText(/FTP 200/)).toHaveCount(0);
});
