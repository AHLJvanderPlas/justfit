/**
 * UX review D — Today and chrome (findings 10, 11, 15, 17).
 *  - Today: ONE week card (one "THIS WEEK" title, one status line), no Training goal card, the goal is a
 *    quiet link to Goal & coach, no coach sentence that only restates the title.
 *  - The logo row + CHECK-IN belong to Today only: Progress, This Week, Settings (landing and sub-views)
 *    and the Trophy room start with their own title.
 *  - One back control (chevron + parent name, accessible name, real button); Sign out sits at the bottom
 *    of Settings → Account, asks first, and is not on the Settings landing.
 */
import { test, expect } from '@playwright/test';
import { signupFresh } from './helpers.js';

test('Today: one week card, no goal card; the header and CHECK-IN exist on Today only', async ({ page }) => {
  await signupFresh(page, '-chrome');

  // — Today —
  const header = page.getByTestId('today-header');
  await expect(header).toBeVisible();
  await expect(header.getByRole('button', { name: 'Check-in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^this week$/i })).toHaveCount(1);
  await expect(page.getByTestId('week-card')).toHaveCount(1);
  await expect(page.getByTestId('week-line')).toHaveText(/^\d+ of \d+ training days · (\d+ to go|week goal reached)/);
  await expect(page.getByText(/training goal/i)).toHaveCount(0);
  await expect(page.getByText(/Today's session:/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'START SESSION' })).toBeVisible();

  // The goal in the eyebrow is a quiet link to Goal & coach (one back control leads home).
  await page.getByTestId('goal-link').click();
  await expect(page.getByRole('heading', { name: 'GOAL & COACH' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Settings', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible();

  // — No header, no CHECK-IN anywhere else —
  const noChrome = async (what) => {
    await expect(page.getByTestId('today-header'), `${what}: no logo row`).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^check-in$/i }), `${what}: no CHECK-IN button`).toHaveCount(0);
  };
  await noChrome('Settings landing');
  await expect(page.getByRole('button', { name: 'Sign out' }), 'Settings landing has no sign-out').toHaveCount(0);

  await page.getByRole('button', { name: /^Account/ }).click();
  await noChrome('Account');
  await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Back to Settings', exact: true }).click();

  // The week card opens This Week
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await page.getByTestId('week-line').click();
  await expect(page.getByRole('heading', { name: 'This Week', level: 1 })).toBeVisible();
  await noChrome('This Week');

  await page.getByRole('button', { name: 'Progress', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'PROGRESS' }).first()).toBeVisible({ timeout: 20_000 });
  await noChrome('Progress');

  // Trophy room, from Settings: the back control names its parent
  await page.getByRole('button', { name: 'Settings', exact: true }).click();
  await page.getByRole('button', { name: /^Trophy room/ }).click();
  await expect(page.getByRole('heading', { name: 'Trophy Room', level: 1 })).toBeVisible();
  await noChrome('Trophy room');
  const back = page.getByRole('button', { name: 'Back to Settings', exact: true });
  await expect(back).toBeVisible();
  expect((await back.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await back.click();
  await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible();

  // — and back on Today both are there again —
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await expect(page.getByTestId('today-header')).toBeVisible();
});
