/**
 * Journey 7 (C-E19a): WorkoutView state machine driven for real —
 * instruction → working (rep taps) → resting (skip) → … → session feedback → history.
 * Unlike journey-core (which skips every exercise), this taps the rep zone,
 * completes sets, and passes through the rest phase.
 */

import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

test('workout state machine — rep taps, set completion, rest skip, RPE, history', async ({ page }) => {
  await signupFresh(page, '-wk');
  await pickGeneralPath(page);

  const startSession = page.getByRole('button', { name: /START SESSION/ });
  await expect(startSession).toBeVisible({ timeout: 30_000 });
  await startSession.click();
  await page.getByRole('button', { name: 'Start Workout' }).click();

  const sessionDone = page.getByText('Session done!');
  const tapZone = page.getByRole('button', { name: 'TAP TO COUNT REP' });
  let repsTapped = false;

  // Drive whatever phase is on screen until the feedback screen appears.
  for (let i = 0; i < 60 && !(await sessionDone.isVisible()); i++) {
    const ready = page.getByRole('button', { name: /Ready/ });
    const allDone = page.getByRole('button', { name: /All \d+ reps done/ });
    const skipRest = page.getByRole('button', { name: 'Skip rest →' });
    const skipExercise = page.getByRole('button', { name: 'Skip', exact: true });

    if (await ready.isVisible()) { await ready.click(); continue; }
    if (await allDone.isVisible()) {
      if (!repsTapped && (await tapZone.isVisible())) {
        // Exercise the rep counter for real on the first rep-based exercise
        await tapZone.click();
        await tapZone.click();
        repsTapped = true;
      }
      await allDone.click();
      continue;
    }
    if (await skipRest.isVisible()) { await skipRest.click(); continue; }
    if (await skipExercise.isVisible()) { await skipExercise.click(); continue; }
    await page.waitForTimeout(250);
  }

  expect(repsTapped, 'at least one rep-based exercise should have been tapped').toBe(true);
  await expect(sessionDone).toBeVisible();

  // RPE feedback screen → log the session
  await page.getByRole('button', { name: 'Log session →' }).click();

  // Completed session shows up in Progress
  await page.getByRole('button', { name: 'Progress' }).click();
  await expect(page.getByText('RECENT SESSIONS')).toBeVisible({ timeout: 15_000 });
});
