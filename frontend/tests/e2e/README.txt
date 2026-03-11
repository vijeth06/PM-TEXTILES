Playwright E2E usage:

1. Start the frontend app and backend app separately.
2. From frontend/, install dependencies: npm install
3. Install browser once: npx playwright install chromium
4. Run tests: npm run test:e2e

Optional environment variables:
- PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000
- PLAYWRIGHT_USERNAME=admin
- PLAYWRIGHT_PASSWORD=Admin@123