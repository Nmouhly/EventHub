import { test, expect } from '@playwright/test';
async function login(page, email = 'admin@eventhub.demo') {
  await page.goto('/login');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('EventHub2026!');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Popular events' })).toBeVisible();
}
test('admin manages an operator and staff is denied the screen', async ({ page }) => {
  await login(page);
  await page.getByRole('link', { name: 'Operators', exact: true }).click();
  await page.getByRole('button', { name: 'Add operator', exact: true }).click();
  await page.getByLabel('Full name').fill('UI Operator');
  await page.getByLabel('Email address').fill('ui.operator@example.com');
  await page.getByLabel('Password (12–72 characters)').fill('EventHub2026!');
  await page.getByRole('button', { name: 'Save operator' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search operators').fill('ui.operator@example.com');
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Account status').selectOption('false');
  await page.getByRole('button', { name: 'Save operator' }).click();
  await expect(page.getByRole('cell', { name: 'Inactive', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Full name').fill('Updated Operator');
  await page.getByLabel('Account status').selectOption('true');
  await page.getByRole('button', { name: 'Save operator' }).click();
  await expect(page.getByRole('cell', { name: 'Updated Operator', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await login(page, 'ui.operator@example.com');
  await expect(page.getByRole('link', { name: 'Operators', exact: true })).toHaveCount(0);
  await page.goto('/users');
  await expect(page).toHaveURL(/unauthorized/);
});
test('delete unregistered participant and display conflict for registered participant', async ({
  page,
}) => {
  await login(page);
  await page.getByRole('link', { name: 'Participants', exact: true }).click();
  await page.getByRole('button', { name: 'Add participant', exact: true }).click();
  await page.getByLabel('Full name').fill('Delete Me');
  await page.getByLabel('Email address').fill('delete.me@example.com');
  await page.getByRole('button', { name: 'Save participant' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByLabel('Search participants').fill('delete.me@example.com');
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'No participants found.' })).toBeVisible();
  await page.getByLabel('Search participants').fill('sofia.bennani@example.com');
  await expect(page.getByRole('row')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('has registrations');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Sofia Bennani', exact: true })).toBeVisible();
});
