const { test, expect } = require('@playwright/test');

const pages = [
  { path: '/dashboard', heading: /dashboard/i },
  { path: '/textile-production', heading: /textile production/i },
  { path: '/production', heading: /production/i },
  { path: '/production-execution', heading: /production execution/i },
  { path: '/inventory', heading: /inventory/i },
  { path: '/orders', heading: /orders/i },
  { path: '/customers', heading: /customers/i },
  { path: '/suppliers', heading: /suppliers/i },
  { path: '/leads', heading: /leads|crm/i },
  { path: '/employees', heading: /employees/i },
  { path: '/documents', heading: /documents/i },
  { path: '/reports', heading: /reports/i },
  { path: '/analytics', heading: /analytics/i },
  { path: '/finance', heading: /finance/i },
  { path: '/audit', heading: /audit/i },
  { path: '/settings', heading: /settings/i },
];

for (const pageConfig of pages) {
  test(`loads ${pageConfig.path}`, async ({ page }) => {
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(pageConfig.path);
    await expect(page).toHaveURL(new RegExp(`${pageConfig.path.replace('/', '\\/')}`));
    await expect(page.getByRole('heading', { name: pageConfig.heading }).first()).toBeVisible();
    expect(consoleErrors, `Console errors on ${pageConfig.path}: ${consoleErrors.join('\n')}`).toEqual([]);
  });
}