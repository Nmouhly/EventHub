import { test, expect } from '@playwright/test';
const API = 'http://localhost:5001/api';
test('visitor registers without login, duplicate is blocked and staff sees pending registration', async ({
  page,
  request,
}) => {
  const login = await request.post(`${API}/auth/login`, {
    data: { email: 'admin@eventhub.demo', password: 'EventHub2026!' },
  });
  const { token } = await login.json();
  const headers = { Authorization: `Bearer ${token}` };
  const created = await request.post(`${API}/events`, {
    headers,
    data: {
      title: 'Public signup test',
      location: 'Casablanca',
      eventDate: '2030-05-25T14:00:00Z',
      maxParticipants: 2,
    },
  });
  expect(created.status()).toBe(201);
  const event = await created.json();
  await request.patch(`${API}/events/${event.id}/status`, {
    headers,
    data: { status: 'published' },
  });
  await page.goto('/');
  await page.getByLabel('Rechercher un événement').fill('Public signup test');
  await page.getByRole('button', { name: 'Rechercher', exact: true }).click();
  await page.getByRole('link', { name: 'Voir l’événement' }).click();
  await page.getByLabel('Nom complet').fill('Public browser guest');
  await page.getByLabel('Adresse email').fill('public.browser@example.com');
  await page.getByRole('button', { name: 'S’inscrire', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Inscription reçue !' })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('eventhub.session'))).toBeNull();
  const registrations = await (
    await request.get(`${API}/registrations?eventId=${event.id}`, { headers })
  ).json();
  expect(registrations.data).toHaveLength(1);
  expect(registrations.data[0]).toMatchObject({
    status: 'pending',
    participant: { email: 'public.browser@example.com' },
  });
  await page.reload();
  await page.getByLabel('Nom complet').fill('Different name');
  await page.getByLabel('Adresse email').fill('public.browser@example.com');
  await page.getByRole('button', { name: 'S’inscrire', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('déjà inscrite');
  await page.screenshot({ path: 'artifacts/public-event-desktop.png', fullPage: true });
});
test('public catalogue fits mobile and links to organizer login', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Événements à découvrir' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'artifacts/public-events-mobile.png', fullPage: true });
  await page.getByRole('link', { name: 'Espace organisateur' }).click();
  await expect(page.getByLabel('Email address')).toBeVisible();
});
