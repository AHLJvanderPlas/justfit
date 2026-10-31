/**
 * Journeys 11–12 (MANUAL_TRAINING_DESIGN.md phase 1): "Eigen training".
 * The gap the Oct 5 build left twice — both sheets driven for real, end to end.
 *
 *  (a) Samenstellen → add push-up → Starten → Als extra → WorkoutView, one set
 *      completed → the done card shows the extra and asks "Plan done?", and
 *      today's stored plan is exactly what it was (acceptance 2, end to end).
 *  (b) Registreren → log push-up 3×3 for today → Today shows it completed.
 *  (c) v1.2 — save a template, then Hergebruiken → ⋯ → Bewerken (rename) → Verwijderen.
 *  (d) v1.2 — Vastzetten from the chooser: a free user pins push-up, today's plan holds it.
 */

import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

async function todaysPlan(page) {
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const res = await page.request.get(`/api/plan?date=${today}`);
  expect(res.ok()).toBe(true);
  return (await res.json()).plan;
}

async function pickExercise(page, name) {
  await page.getByPlaceholder('Search exercises…').fill(name.toLowerCase());
  await page.locator('.jf-pick__item', { has: page.locator('.jf-pick__name', { hasText: new RegExp(`^${name}$`) }) }).click();
}

// v1.1 — an added exercise lands as the LAST card, fully above the sticky
// footer, and the search stays under the list. Smooth scrolling is async, so poll.
async function addAndCheckLanded(page, query, previous) {
  const input = page.getByPlaceholder('Search exercises…');
  await input.fill(query);
  const before = await page.locator('.jf-sb-step').count();
  await page.locator('.jf-pick__item').first().click();
  const card = page.locator('.jf-sb-step').nth(before);
  await expect(card).toHaveCount(1);
  const viewport = page.viewportSize();
  await expect.poll(async () => {
    const box = await card.boundingBox();
    const footer = await page.locator('.jf-sheet__footer').boundingBox();
    return !!box && !!footer && box.y >= 0 && box.y + box.height <= Math.min(viewport.height, footer.y) + 1;
  }, { timeout: 5_000, message: `the new "${query}" card should be fully visible above the footer` }).toBe(true);
  const box = await card.boundingBox();
  if (previous) expect(box.y, 'the new card sits below the previous one').toBeGreaterThan(previous.y);
  const search = await input.boundingBox();
  expect(search.y, 'the search sits under the last card').toBeGreaterThan(box.y);
  return box;
}

test('own training (a) — build, start as an extra, complete a set; plan stays open', async ({ page }) => {
  await signupFresh(page, '-own-a');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  // GET /api/plan generates an in-memory plan when nothing is stored yet, so a
  // GET fired the instant START SESSION renders can race the app's own storing
  // POST and come back without an id. Poll until the stored row exists.
  await expect.poll(async () => (await todaysPlan(page))?.id, { timeout: 15_000, message: 'the general path should have stored today\'s plan' }).toBeTruthy();
  const before = await todaysPlan(page);

  // The entry: one quiet line, two links (§2).
  await expect(page.getByRole('button', { name: "Can't do this?" })).toBeVisible();
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Build/ }).click();

  // Samenstellen on a phone: three adds, each landing in view below the last (v1.1).
  await page.setViewportSize({ width: 390, height: 844 });
  let box = await addAndCheckLanded(page, 'push-up', null);
  box = await addAndCheckLanded(page, 'plank', box);
  await addAndCheckLanded(page, 'squat', box);
  // The footer is the two-button row; the secondary one jumps to the search.
  await expect(page.getByRole('button', { name: '+ Add exercise' })).toBeVisible();
  // Keep push-up alone for the run: drop the other two.
  await page.getByRole('button', { name: 'Remove' }).last().click();
  await page.getByRole('button', { name: 'Remove' }).last().click();
  await expect(page.locator('.jf-sb-step')).toHaveCount(1);
  await page.getByRole('button', { name: 'Sets −' }).click();
  await page.getByRole('button', { name: 'Sets −' }).click();
  await page.getByRole('button', { name: 'Start now' }).click();

  // Run-mode sheet: als extra is the default (§4).
  await expect(page.getByText('How do you want to do this?')).toBeVisible();
  await page.getByRole('button', { name: /^As an extra/ }).click();

  // WorkoutView — the same timers and counters as any session.
  await page.getByRole('button', { name: 'Start Workout' }).click({ timeout: 15_000 });
  const sessionDone = page.getByText('Session done!');
  const tapZone = page.getByRole('button', { name: 'TAP TO COUNT REP' });
  let tapped = false;
  for (let i = 0; i < 40 && !(await sessionDone.isVisible()); i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const allDone = page.getByRole('button', { name: /All \d+ reps done/ });
    const skipRest = page.getByRole('button', { name: 'Skip rest →' });
    if (await ready.isVisible()) { await ready.click(); continue; }
    if (await allDone.isVisible()) {
      if (!tapped && (await tapZone.isVisible())) { await tapZone.click(); await tapZone.click(); tapped = true; }
      await allDone.click();
      continue;
    }
    if (await skipRest.isVisible()) { await skipRest.click(); continue; }
    await page.waitForTimeout(250);
  }
  expect(tapped, 'the push-up set should have been counted in WorkoutView').toBe(true);
  await expect(sessionDone).toBeVisible();
  await page.getByRole('button', { name: 'Log session →' }).click();

  // The done card of the extra: it shows the session and asks, default no (§6).
  await expect(page.getByText('Extra session done')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Today's plan is still open — mark it as done too?")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save as template' })).toBeVisible();
  // Today's plan is still there, unchanged, and still startable.
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible();
  const after = await todaysPlan(page);
  expect(after?.id).toBe(before.id);
  expect(after?.plan_json).toBe(before.plan_json);
  expect(after?.generated_by ?? 'engine').not.toBe('user');
});

test('own training (b) — record push-up 3×3 for today; Today shows it completed', async ({ page }) => {
  await signupFresh(page, '-own-b');
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });

  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Record/ }).click();

  // The log sheet, today: what, then how much.
  await pickExercise(page, 'Push-up');
  await page.getByRole('button', { name: 'Next →' }).click();
  await page.getByLabel('Sets 1', { exact: true }).fill('3');
  await page.getByLabel('Reps 1', { exact: true }).fill('3');
  await page.getByRole('button', { name: /^Save for/ }).click();

  await expect(page.getByText('Session Complete')).toBeVisible({ timeout: 15_000 });
  // "Eigen training" stays on the completed Today state (acceptance 1).
  await expect(page.getByRole('button', { name: 'Own training' })).toBeVisible();
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);
  const h = await (await page.request.get('/api/execution?limit=30')).json();
  const logged = (h.executions ?? []).find((e) => e.date === today && e.execution_type === 'logged');
  expect(logged, 'the logged session must be in history, dated today').toBeTruthy();
  expect(JSON.parse(logged.steps[0].actual_json).reps_per_set).toEqual([3, 3, 3]);
});

async function openPlanDay(page, suffix) {
  await signupFresh(page, suffix);
  await pickGeneralPath(page);
  await expect(page.getByRole('button', { name: /START SESSION/ })).toBeVisible({ timeout: 30_000 });
  await expect.poll(async () => (await todaysPlan(page))?.id, { timeout: 15_000, message: 'today\'s plan should be stored' }).toBeTruthy();
}

test('own training (c) — reuse: edit, rename, delete', async ({ page }) => {
  await openPlanDay(page, '-own-c');

  // Save a template through the builder (no run needed).
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Build/ }).click();
  await pickExercise(page, 'Push-up');
  await pickExercise(page, 'Plank');
  await page.getByRole('button', { name: 'Save as template' }).click();
  await page.getByLabel('Name of your training').fill('Hotel');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Saved in My trainings.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  // Hergebruiken: the row names its exercises; ⋯ → Bewerken opens the builder on THIS training.
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Reuse/ }).click();
  await expect(page.locator('.jf-tpl-pick__name', { hasText: /^Hotel$/ })).toBeVisible();
  await expect(page.locator('.jf-tpl-pick__names')).toHaveText('Push-up · Plank');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await expect(page.locator('.jf-sb-step')).toHaveCount(2);
  await page.getByRole('button', { name: 'Update template' }).click();
  const nameInput = page.getByLabel('Name of your training');
  await expect(nameInput).toHaveValue('Hotel');
  await nameInput.fill('Hotel 2');
  await page.getByRole('button', { name: 'Update template' }).click();
  await expect(page.getByText('Saved in My trainings.')).toBeVisible();
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Reuse/ }).click();
  await expect(page.locator('.jf-tpl-pick__name', { hasText: /^Hotel 2$/ })).toBeVisible();
  await expect(page.locator('.jf-tpl-pick__name', { hasText: /^Hotel$/ })).toHaveCount(0);
  await expect(page.locator('.jf-tpl-pick__names')).toHaveText('Push-up · Plank');
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.getByText('Delete this training?')).toBeVisible();
  await page.getByRole('button', { name: 'Yes, delete' }).click();
  await expect(page.getByText('No saved trainings yet — build one via Build.')).toBeVisible();
  const list = await (await page.request.get('/api/my-sessions')).json();
  expect(list.templates).toHaveLength(0);
});

test('own training (d) — pin from the chooser: free user, today\'s plan open', async ({ page }) => {
  await openPlanDay(page, '-own-d');
  await page.getByRole('button', { name: 'Own training' }).click();
  await page.getByRole('button', { name: /^Pin/ }).click();
  // The mode toggle is gone: this sheet only pins.
  await expect(page.getByRole('button', { name: 'Build it myself' })).toHaveCount(0);
  await expect(page.getByText('this replaces today\'s plan')).toBeVisible();
  await pickExercise(page, 'Push-up');
  await expect(page.locator('.jf-pick__item', { has: page.getByText('Pinned', { exact: true }) })).toHaveCount(1);
  await page.getByRole('button', { name: 'Let the coach fill in the rest' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 20_000 });

  // The Today card lists it, and the stored plan records the pin.
  await expect(page.getByText('Push-up', { exact: true }).first()).toBeVisible();
  const stored = await todaysPlan(page);
  const plan = JSON.parse(stored.plan_json);
  const pushUp = plan.steps.find((st) => st.name === 'Push-up');
  expect(pushUp, 'the pinned push-up is a step of today\'s plan').toBeTruthy();
  expect(plan.pinned).toContain(pushUp.exercise_id);
});
