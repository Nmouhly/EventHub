import { test, expect } from '@playwright/test';
async function login(page) {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  await page.getByRole('button', { name: 'Use demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome back, Alex/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Popular events' })).toBeVisible();
}
test('event, participant and registration lifecycle', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page);
  await page.screenshot({ path: 'artifacts/dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Create event', exact: true }).click();
  await page.getByLabel('Event title').fill('Frontend launch workshop');
  await page
    .getByLabel('Description (optional)', { exact: true })
    .fill('A practical workshop with the EventHub community.');
  await page.getByLabel('Location', { exact: true }).fill('Casablanca');
  await page.getByLabel('Event date & time').fill('2030-05-25T14:00');
  await page.getByLabel('Maximum participants').fill('25');
  await page.getByRole('button', { name: 'Save event' }).click();
  await expect(page.getByRole('heading', { name: 'Frontend launch workshop' })).toBeVisible();
  await page.getByRole('link', { name: 'Edit event' }).click();
  await page.getByLabel('Location', { exact: true }).fill('Rabat');
  await page.getByRole('button', { name: 'Save event' }).click();
  await expect(page.getByText('Rabat', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish event', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('published', { exact: true })).toBeVisible();
  const eventUrl = page.url();
  await page.getByRole('link', { name: 'Participants', exact: true }).click();
  await page.getByRole('button', { name: 'Add participant', exact: true }).click();
  await page.getByLabel('Full name').fill('Test Guest');
  await page.getByLabel('Email address').fill('guest@eventhub.test');
  await page.getByLabel('Phone number (optional)').fill('+212600000000');
  await page.getByRole('button', { name: 'Save participant' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search participants' }).fill('guest@eventhub.test');
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('cell', { name: 'Test Guest', exact: true })).toBeVisible();
  await page
    .getByRole('row', { name: /Test Guest/ })
    .getByRole('button', { name: 'Edit', exact: true })
    .click();
  await page.getByLabel('Phone number (optional)').fill('+212611111111');
  await page.getByRole('button', { name: 'Save participant' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: '+212611111111', exact: true })).toBeVisible();
  await page.goto(eventUrl);
  await page.getByRole('link', { name: 'Add participant' }).click();
  await page
    .getByLabel('Participant', { exact: true })
    .selectOption({ label: 'Test Guest · guest@eventhub.test' });
  await page.getByRole('button', { name: 'Register participant' }).click();
  await expect(page.getByRole('cell', { name: 'Test Guest', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'confirmed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'cancelled', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Frontend launch workshop' })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
test('mobile navigation, filters, empty state and protected unknown route', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.screenshot({ path: 'artifacts/dashboard-mobile.png', fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Events', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search events' }).fill('nothing-matches-this-search');
  await expect(page.getByRole('heading', { name: 'No events found.' })).toBeVisible();
  await page.goto('/this-page-does-not-exist');
  await expect(page.getByRole('heading', { name: /404/ })).toBeVisible();
});

test('Axios sends authorization and clears the session on 401', async ({ page }) => {
  await login(page);
  let authorization;
  await page.route('http://localhost:5000/api/transport-check', async (route) => {
    authorization = route.request().headers().authorization;
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ stack: 'PRIVATE BACKEND STACK' }),
    });
  });
  const message = await page.evaluate(async () => {
    const { api, errorMessage } = await import('/src/api/axios.js');
    try {
      await api.get('/transport-check');
    } catch (error) {
      return errorMessage(error);
    }
  });
  expect(authorization).toBe('Bearer eventhub-demo-session');
  expect(message).toBe('Accès non autorisé');
  await page.unroute('http://localhost:5000/api/transport-check');
  await page.route('http://localhost:5000/api/transport-check', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  await page.evaluate(async () => {
    const { api } = await import('/src/api/axios.js');
    try {
      await api.get('/transport-check');
    } catch {
      /* Expected expired session. */
    }
  });
  await expect(page).toHaveURL(/login/);
  expect(await page.evaluate(() => sessionStorage.getItem('eventhub.session'))).toBeNull();
});
