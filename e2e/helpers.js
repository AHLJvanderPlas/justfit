import { expect } from '@playwright/test';

/** Sign up a fresh user via UI and skip onboarding + check-in. Session lands in the HttpOnly cookie. */
export async function signupFresh(page, suffix = '') {
  await page.addInitScript(() => localStorage.setItem('jf_lang', 'en'));
  const email = `e2e-${Date.now()}${suffix}@justfit.cc`;
  const password = 'e2e-test-pw';
  await page.goto('/login.html');
  await page.locator('#tab-signup').click();
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.locator('#accept-check').check();
  await page.locator('#submit-btn').click();
  await page.waitForURL('/');
  await page.getByRole('button', { name: /I Agree/ }).click();
  for (let i = 0; i < 5; i++) await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByRole('button', { name: 'Good' }).click();
  await page.getByRole('button', { name: 'Apply →' }).click();
  return { email, password };
}

/** From a fresh signup: resolve the PathChoiceModal with the General path. */
export async function pickGeneralPath(page) {
  const general = page.getByRole('button', { name: /GENERAL/i });
  await expect(general).toBeVisible({ timeout: 10_000 });
  await general.click();
}
