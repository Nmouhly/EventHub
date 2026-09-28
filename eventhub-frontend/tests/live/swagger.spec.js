import { test, expect } from '@playwright/test';

test('Swagger allows login and an authenticated API request', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://localhost:5001/api/docs/');
  await expect(page.locator('.opblock')).toHaveCount(23);
  const login = page.locator('#operations-Auth-login');
  await login.locator('.opblock-summary').click();
  await login.getByRole('button', { name: 'Try it out' }).click();
  const responsePromise = page.waitForResponse(response => response.url().endsWith('/api/auth/login'));
  await login.getByRole('button', { name: 'Execute', exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  const { token } = await response.json();
  await page.locator('.scheme-container').getByRole('button', { name: 'Authorize' }).click();
  await page.locator('.dialog-ux input').fill(token);
  await page.locator('.dialog-ux').getByRole('button', { name: 'Apply credentials', exact: true }).click();
  await page.locator('.dialog-ux').getByRole('button', { name: 'Close', exact: true }).click();
  const me = page.locator('#operations-Auth-me');
  await me.locator('.opblock-summary').click();
  await me.getByRole('button', { name: 'Try it out' }).click();
  const profilePromise = page.waitForResponse(response => response.url().endsWith('/api/auth/me'));
  await me.getByRole('button', { name: 'Execute', exact: true }).click();
  const profile = await profilePromise;
  expect(profile.status()).toBe(200);
  expect((await profile.json()).email).toBe('admin@eventhub.demo');
  expect(errors).toEqual([]);
});
