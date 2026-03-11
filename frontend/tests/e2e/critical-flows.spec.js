const { test, expect } = require('@playwright/test');

test('settings profile tab allows editing form fields', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
});

test('inventory alerts render with item names when alerts exist', async ({ page }) => {
  await page.goto('/inventory');
  await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();

  const alertBanner = page.getByText(/item\(s\) need reordering/i);
  if (await alertBanner.count()) {
    await expect(alertBanner.first()).toBeVisible();
    await expect(page.locator('text=Available:').first()).toBeVisible();
  }
});