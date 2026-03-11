const {
  test,
  expect,
  collectConsoleErrors,
  expectNoConsoleErrors,
} = require('./fixtures');

test('create customer and verify it appears in list', async ({ page, testData }) => {
  const consoleErrors = await collectConsoleErrors(page);

  await page.goto('/customers');
  await expect(page.getByRole('heading', { name: /customer management/i })).toBeVisible();
  await page.getByRole('button', { name: /new customer/i }).click();

  await page.getByLabel('Company Name').fill(testData.customerName);
  await page.getByLabel('Contact Person').fill(testData.personName);
  await page.getByLabel('Email').fill(testData.email);
  await page.getByLabel('Phone').fill(testData.phone);
  await page.getByLabel('Address Line 1').fill('Test Street 1');
  await page.getByLabel('City').fill('Bengaluru');
  await page.getByLabel('State').fill('Karnataka');
  await page.getByLabel('Pincode').fill('560001');
  await page.getByLabel('Credit Limit (₹)').fill('10000');
  await page.getByLabel('Payment Terms (Days)').fill('30');
  await page.getByRole('button', { name: /^create$/i }).click();

  await expect(page.getByText(testData.customerName).first()).toBeVisible();
  await expectNoConsoleErrors(expect, consoleErrors, 'customers CRUD');
});

test('create supplier and verify it appears in list', async ({ page, testData }) => {
  const consoleErrors = await collectConsoleErrors(page);

  await page.goto('/suppliers');
  await expect(page.getByRole('heading', { name: /supplier management/i })).toBeVisible();
  await page.getByRole('button', { name: /new supplier/i }).click();

  await page.getByLabel('Company Name').fill(testData.supplierName);
  await page.getByLabel('Contact Person').fill(testData.personName);
  await page.getByLabel('Email').fill(`supplier.${testData.suffix}@example.com`);
  await page.getByLabel('Phone').fill(testData.phone);
  await page.getByLabel('Address Line 1').fill('Supplier Street 1');
  await page.getByLabel('City').fill('Mumbai');
  await page.getByLabel('State').fill('Maharashtra');
  await page.getByLabel('Pincode').fill('400001');
  await page.getByLabel('Payment Terms (Days)').fill('15');
  await page.getByRole('button', { name: /^create$/i }).click();

  await expect(page.getByText(testData.supplierName).first()).toBeVisible();
  await expectNoConsoleErrors(expect, consoleErrors, 'suppliers CRUD');
});

test('create lead and verify it appears in pipeline', async ({ page, testData }) => {
  const consoleErrors = await collectConsoleErrors(page);

  await page.goto('/leads');
  await expect(page.getByRole('heading', { name: /crm & lead management/i })).toBeVisible();
  await page.getByRole('button', { name: /add lead/i }).click();

  await page.locator('label:has-text("Company Name") + input').first().fill(testData.leadCompany);
  await page.locator('label:has-text("Contact Person") + input').first().fill(testData.personName);
  await page.locator('label:has-text("Contact Number") + input').first().fill(testData.phone);
  await page.locator('label:has-text("Email") + input').first().fill(`lead.${testData.suffix}@example.com`);
  await page.locator('label:has-text("Estimated Value") + input').first().fill('25000');
  await page.getByRole('button', { name: /create lead/i }).click();

  await expect(page.getByText(testData.leadCompany).first()).toBeVisible();
  await expectNoConsoleErrors(expect, consoleErrors, 'leads CRUD');
});
