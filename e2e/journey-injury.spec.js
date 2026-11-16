/**
 * Finding 0 (docs/UI_UX_REVIEW_2026-11-16.md): a user with a chronic shoulder complaint who
 * reported shoulder pain was given explosive push-ups, and "Show alternatives" dead-ended in
 * "No alternatives found".
 *
 *  1. Chronic shoulder + a shoulder-pain check-in → today's plan has no step that loads the
 *     shoulder, by the library's own load_areas (GET /api/exercises — the planner's model).
 *     The local D1 is built from the baseline WITHOUT migration 0125, so this is the code
 *     safety net working on untagged rows.
 *  2. A session of push-ups, every alternative of which loads the shoulder → the sheet shows
 *     the reassurance line and "Skip this exercise" (and still "Keep original"); skipping
 *     ends the one-exercise session.
 */
import { test, expect } from '@playwright/test';
import { signupFresh, waitForStoredPlan } from './helpers.js';

test('finding 0 — shoulder injury: no shoulder-loading step; no safe alternative → skip, never a dead end', async ({ page }) => {
  await signupFresh(page, '-injury');
  await waitForStoredPlan(page);
  const today = await page.evaluate(() => new Date().toISOString().split('T')[0]);

  const prof = await (await page.request.get('/api/profile')).json();
  expect((await page.request.post('/api/profile', {
    data: { preferences: { ...prof.preferences, chronic_injury_areas: ['shoulder'] } },
  })).ok()).toBe(true);

  // 1. Today's plan with the shoulder-pain check-in (a day-1 trial user re-plans fully).
  const checkin = { pain_level: 2, checkin_json: { pain_level: 2, pain_scope: 'specific', pain_areas: ['shoulder'], feeling: 2 } };
  const res = await page.request.post('/api/plan', { data: { date: today, checkin } });
  expect(res.ok()).toBe(true);
  const plan = (await res.json()).plan;
  const lib = (await (await page.request.get('/api/exercises')).json()).exercises;
  const byId = new Map(lib.map((e) => [e.id, e]));
  expect(plan.slot_type).not.toBe('rest');
  expect(plan.steps.length, 'an injury never empties the session').toBeGreaterThan(0);
  expect(plan.injury_areas).toContain('shoulder');
  const loading = plan.steps.filter((st) => (byId.get(st.exercise_id)?.load_areas ?? []).includes('shoulder')).map((st) => st.exercise_slug);
  expect(loading, 'no step of today\'s plan may load the shoulder').toEqual([]);
  expect(byId.get(lib.find((e) => e.slug === 'plyo-push-up')?.id)?.load_areas, 'plyo-push-up (untagged in the baseline) loads the shoulder').toContain('shoulder');

  // 2. A user-built session of push-ups: every listed alternative loads the shoulder.
  const pushUp = lib.find((e) => e.slug === 'push-up');
  const subs = JSON.parse(pushUp.alternatives_json).substitutions;
  expect(subs.length).toBeGreaterThan(0);
  for (const s of subs) expect(lib.find((e) => e.slug === s)?.load_areas ?? ['shoulder']).toContain('shoulder');
  const built = await page.request.post('/api/plan', {
    data: { date: today, custom_steps: [{ exercise_id: pushUp.id, sets: 1, target_reps: 5 }], safety_ack: true },
  });
  expect(built.ok(), `the push-up session should save: ${built.status()}`).toBe(true);

  await page.reload();
  await page.getByRole('button', { name: /START SESSION/ }).click();
  await page.getByRole('button', { name: 'Start Workout' }).click();
  await page.getByRole('button', { name: /Ready/ }).click();
  await page.getByRole('button', { name: 'Show alternatives' }).click();

  const empty = page.getByTestId('alt-empty');
  await expect(empty).toBeVisible({ timeout: 15_000 });
  await expect(empty.getByText(/no suitable alternative right now/)).toBeVisible();
  await expect(page.getByText('No alternatives found for this exercise.')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Keep original' })).toBeVisible();
  await empty.getByRole('button', { name: 'Skip this exercise' }).click();
  await expect(page.getByText('Session done!')).toBeVisible({ timeout: 15_000 });
});
