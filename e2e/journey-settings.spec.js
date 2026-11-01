/**
 * Journey 9 (C-E19c): Settings navigation —
 * landing rows → Account sub-view → back to landing → Privacy sub-view.
 */

import { test, expect } from '@playwright/test';
import { signupFresh, pickGeneralPath } from './helpers.js';

test('settings — navigate to Account sub-view and back', async ({ page }) => {
  await signupFresh(page, '-set');
  await pickGeneralPath(page);

  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible({ timeout: 10_000 });

  // UAT R5: the NL · EN control sits on the landing (the only place); switching is immediate.
  await page.getByRole('button', { name: 'NL', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'INSTELLINGEN' })).toBeVisible();
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible();

  // Landing → Account
  await page.getByRole('button', { name: /^Account/ }).click();
  await expect(page.getByText('Abonnement')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Sign out' }).last()).toBeVisible();

  // Back to landing
  await page.getByRole('button', { name: '‹' }).click();
  await expect(page.getByRole('heading', { name: 'SETTINGS' })).toBeVisible();

  // Landing → Privacy
  await page.getByRole('button', { name: /^Privacy/ }).click();
  await expect(page.getByText(/Data export|Download my data|PRIVACY/i).first()).toBeVisible({ timeout: 10_000 });
});

// UAT release 5 — chips show their stored value and save on tap (no separate save button).
test('settings — chips reflect the saved value after reload', async ({ page }) => {
  await signupFresh(page, '-chips');
  await pickGeneralPath(page);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Goal & coach/ }).click();

  const four = page.getByRole('button', { name: '4x', exact: true });
  await expect(four).toBeVisible({ timeout: 10_000 });
  await expect(four).toHaveAttribute('aria-pressed', 'false');
  await four.click();
  await expect(page.getByText('Saved', { exact: true })).toBeVisible({ timeout: 10_000 });
  // The old "Save · <goal>" button is gone; the goal chips save on tap too.
  await expect(page.getByRole('button', { name: /^Save · / })).toHaveCount(0);

  await page.reload();
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Goal & coach/ }).click();
  await expect(page.getByRole('button', { name: '4x', exact: true })).toHaveAttribute('aria-pressed', 'true', { timeout: 10_000 });
});

// UAT release 5 — Goal & coach → Advanced settings is closed by default and holds the planner rows.
test('settings — Advanced settings is collapsed by default and holds Daily check-in', async ({ page }) => {
  await signupFresh(page, '-adv');
  await pickGeneralPath(page);

  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: /^Goal & coach/ }).click();

  const head = page.getByRole('button', { name: /^Advanced settings/ });
  await expect(head).toBeVisible({ timeout: 10_000 });
  await expect(head).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('button', { name: /^Daily check-in/ })).toHaveCount(0);

  await head.click();
  await expect(head).toHaveAttribute('aria-expanded', 'true');
  // The row shows its CURRENT value ("Once a day" is the default).
  await expect(page.getByRole('button', { name: /^Daily check-in\s*Once a day/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Available equipment/ })).toBeVisible();
  // Jij no longer carries the planner block.
  await page.getByRole('button', { name: '‹' }).click();
  await page.getByRole('button', { name: /^You/ }).click();
  await expect(page.getByText('Daily Planning', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Known Injuries', { exact: true })).toBeVisible({ timeout: 10_000 });
});
