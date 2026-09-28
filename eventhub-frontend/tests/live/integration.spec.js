import { test, expect } from '@playwright/test';
const API = 'http://localhost:5001/api';
test('real API: login, dashboard, event lifecycle, participant and atomic cancellation', async ({
  page,
  request,
}) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/login/);
  await expect(page.getByText('Demo workspace', { exact: true })).toHaveCount(0);
  await page.getByLabel('Email address').fill('admin@eventhub.demo');
  await page.getByLabel('Password', { exact: true }).fill('EventHub2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome back, Alex/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Popular events' })).toBeVisible();
  const token = await page.evaluate(() => sessionStorage.getItem('eventhub.session'));
  expect(token.split('.')).toHaveLength(3);
  await page.screenshot({ path: 'artifacts/live-dashboard-desktop.png', fullPage: true });
  await page.getByRole('link', { name: 'Create event', exact: true }).click();
  await page.getByLabel('Event title').fill('Live API workshop');
  await page.getByLabel('Description (optional)').fill('Verified against real PostgreSQL.');
  await page.getByLabel('Location', { exact: true }).fill('Casablanca');
  await page.getByLabel('Event date & time').fill('2030-05-25T14:00');
  await page.getByLabel('Maximum participants').fill('2');
  await page.getByRole('button', { name: 'Save event' }).click();
  await expect(page.getByRole('heading', { name: 'Live API workshop' })).toBeVisible();
  const eventId = new URL(page.url()).pathname.split('/').pop();
  await page.getByRole('link', { name: 'Edit event' }).click();
  await page.getByLabel('Location', { exact: true }).fill('Rabat');
  await page.getByRole('button', { name: 'Save event' }).click();
  await expect(page.getByText('Rabat', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Publish event', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByText('published', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Participants', exact: true }).click();
  await page.getByRole('button', { name: 'Add participant', exact: true }).click();
  await page.getByLabel('Full name').fill('Live Guest');
  await page.getByLabel('Email address').fill('live.guest@example.com');
  await page.getByRole('button', { name: 'Save participant' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search participants' }).fill('live.guest@example.com');
  await expect(page.getByRole('row')).toHaveCount(2);
  await expect(page.getByRole('cell', { name: 'Live Guest', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Phone number (optional)').fill('+212600001234');
  await page.getByRole('button', { name: 'Save participant' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('cell', { name: '+212600001234', exact: true })).toBeVisible();
  await page.goto(`/events/${eventId}`);
  await page.getByRole('link', { name: 'Add participant' }).click();
  await page
    .getByLabel('Participant', { exact: true })
    .selectOption({ label: 'Live Guest · live.guest@example.com' });
  await page.getByRole('button', { name: 'Register participant' }).click();
  await expect(page.getByRole('cell', { name: 'pending', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'confirmed', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('cell', { name: 'confirmed', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel event', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'cancelled', exact: true })).toBeVisible();
  const response = await request.get(`${API}/registrations?eventId=${eventId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  expect(data.data).toHaveLength(1);
  expect(data.data[0].cancelledAt).toBeTruthy();
  await page.getByRole('link', { name: 'Registrations', exact: true }).click();
  await page.getByRole('combobox', { name: 'Filter by event' }).selectOption(eventId);
  await expect(page.getByRole('cell', { name: 'Live Guest', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/login/);
  expect(errors).toEqual([]);
});
test('staff can sign in on mobile using real credentials', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/login');
  await page.getByLabel('Email address').fill('staff@eventhub.demo');
  await page.getByLabel('Password', { exact: true }).fill('EventHub2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome back, Sam/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Popular events' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/live-dashboard-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Events', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Events', exact: true })).toBeVisible();
});
