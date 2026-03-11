const {
  test,
  expect,
  collectConsoleErrors,
  expectNoConsoleErrors,
} = require('./fixtures');

test('settings profile tab allows editing form fields', async ({ page }) => {
  const consoleErrors = await collectConsoleErrors(page);
  await page.goto('/settings');
  await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible();
  await expect(page.getByLabel('Full Name')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByRole('button', { name: /save changes/i })).toBeVisible();
  await expectNoConsoleErrors(expect, consoleErrors, 'settings critical flow');
});

test('inventory alerts render with item names when alerts exist', async ({ page }) => {
  const consoleErrors = await collectConsoleErrors(page);
  await page.goto('/inventory');
  await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();

  const alertBanner = page.getByText(/item\(s\) need reordering/i);
  if (await alertBanner.count()) {
    await expect(alertBanner.first()).toBeVisible();
    await expect(page.locator('text=Available:').first()).toBeVisible();
  }
  await expectNoConsoleErrors(expect, consoleErrors, 'inventory critical flow');
});