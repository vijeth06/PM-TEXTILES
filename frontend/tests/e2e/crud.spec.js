const {
  test,
  expect,
  collectConsoleErrors,
  expectNoConsoleErrors,
} = require('./fixtures');

test('customers full lifecycle: create, edit, delete', async ({ page, testData }) => {
  const consoleErrors = await collectConsoleErrors(page);
  const createdName = testData.customerName;
  const updatedName = `${testData.customerName} Updated`;

  await page.goto('/customers');
  await expect(page.getByRole('heading', { name: /customer management/i })).toBeVisible();
  await page.getByRole('button', { name: /new customer/i }).click();

  await page.getByLabel('Company Name').fill(createdName);
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

  const createdRow = page.locator('tr', { hasText: createdName }).first();
  await expect(createdRow).toBeVisible();

  // Edit
  await createdRow.locator('button[title="Edit"]').click();
  await page.getByLabel('Company Name').fill(updatedName);
  await page.getByRole('button', { name: /^update$/i }).click();

  const updatedRow = page.locator('tr', { hasText: updatedName }).first();
  await expect(updatedRow).toBeVisible();

  // Delete
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await updatedRow.locator('button[title="Delete"]').click();
  await expect(page.locator('tr', { hasText: updatedName })).toHaveCount(0);

  await expectNoConsoleErrors(expect, consoleErrors, 'customers CRUD');
});

test('suppliers full lifecycle: create, edit, delete', async ({ page, testData }) => {
  const consoleErrors = await collectConsoleErrors(page);
  const createdName = testData.supplierName;
  const updatedName = `${testData.supplierName} Updated`;

  await page.goto('/suppliers');
  await expect(page.getByRole('heading', { name: /supplier management/i })).toBeVisible();
  await page.getByRole('button', { name: /new supplier/i }).click();

  await page.getByLabel('Company Name').fill(createdName);
  await page.getByLabel('Contact Person').fill(testData.personName);
  await page.getByLabel('Email').fill(`supplier.${testData.suffix}@example.com`);
  await page.getByLabel('Phone').fill(testData.phone);
  await page.getByLabel('Address Line 1').fill('Supplier Street 1');
  await page.getByLabel('City').fill('Mumbai');
  await page.getByLabel('State').fill('Maharashtra');
  await page.getByLabel('Pincode').fill('400001');
  await page.getByLabel('Payment Terms (Days)').fill('15');
  await page.getByRole('button', { name: /^create$/i }).click();

  const createdRow = page.locator('tr', { hasText: createdName }).first();
  await expect(createdRow).toBeVisible();

  // Edit
  await createdRow.locator('button[title="Edit"]').click();
  await page.getByLabel('Company Name').fill(updatedName);
  await page.getByRole('button', { name: /^update$/i }).click();

  const updatedRow = page.locator('tr', { hasText: updatedName }).first();
  await expect(updatedRow).toBeVisible();

  // Delete
  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await updatedRow.locator('button[title="Delete"]').click();
  await expect(page.locator('tr', { hasText: updatedName })).toHaveCount(0);

  await expectNoConsoleErrors(expect, consoleErrors, 'suppliers CRUD');
});

test('leads lifecycle: create and convert', async ({ page, testData }) => {
  const consoleErrors = await collectConsoleErrors(page);
  const leadName = testData.leadCompany;

  await page.goto('/leads');
  await expect(page.getByRole('heading', { name: /crm & lead management/i })).toBeVisible();
  await page.getByRole('button', { name: /add lead/i }).click();

  await page.locator('label:has-text("Company Name") + input').first().fill(leadName);
  await page.locator('label:has-text("Contact Person") + input').first().fill(testData.personName);
  await page.locator('label:has-text("Contact Number") + input').first().fill(testData.phone);
  await page.locator('label:has-text("Email") + input').first().fill(`lead.${testData.suffix}@example.com`);
  await page.locator('label:has-text("Estimated Value") + input').first().fill('25000');
  await page.getByRole('button', { name: /create lead/i }).click();

  const leadRow = page.locator('tr', { hasText: leadName }).first();
  await expect(leadRow).toBeVisible();

  page.once('dialog', async (dialog) => {
    await dialog.accept();
  });
  await leadRow.getByRole('button', { name: /convert/i }).click();

  await expect(page.locator('tr', { hasText: leadName }).locator('text=CONVERTED')).toBeVisible();
  await expectNoConsoleErrors(expect, consoleErrors, 'leads lifecycle');
});
