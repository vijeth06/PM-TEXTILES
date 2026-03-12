const { test, expect } = require('@playwright/test');

const username = process.env.PLAYWRIGHT_USERNAME || 'admin';
const password = process.env.PLAYWRIGHT_PASSWORD || 'Admin@123';

test('authenticate admin user', async ({ request, page }) => {
  const response = await request.post('/api/auth/login', {
    data: {
      username,
      password,
    },
  });

  let body = {};
  try {
    body = await response.json();
  } catch (_) {
    body = {};
  }

  expect(
    response.ok(),
    `API login failed with status ${response.status()}. Response: ${JSON.stringify(body)}`
  ).toBeTruthy();

  const token = body?.data?.token;
  const refreshToken = body?.data?.refreshToken;
  const user = body?.data?.user;

  expect(token, 'Missing token in /api/auth/login response').toBeTruthy();

  await page.goto('/login');
  await page.evaluate(
    ({ token, refreshToken, user }) => {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
    },
    { token, refreshToken, user }
  );

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText(/PM Textiles/i).first()).toBeVisible();

  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});