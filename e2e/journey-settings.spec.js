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
