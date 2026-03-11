const base = require('@playwright/test');

const ignoredConsolePatterns = [
  /favicon\.ico/i,
  /download the react devtools/i,
  /deprecationwarning/i,
  /socket\.io.*failed/i,
  /websocket connection to/i,
  /ResizeObserver loop limit exceeded/i,
];

const test = base.test.extend({
  testData: async ({}, use, testInfo) => {
    const timestamp = Date.now();
    const worker = testInfo.workerIndex;
    const suffix = `${timestamp}-${worker}`;
    await use({
      suffix,
      customerName: `PW Customer ${suffix}`,
      supplierName: `PW Supplier ${suffix}`,
      leadCompany: `PW Lead ${suffix}`,
      personName: `PW User ${suffix}`,
      email: `pw.${suffix}@example.com`,
      phone: `90000${String(timestamp).slice(-5)}`,
    });
  },
});

async function collectConsoleErrors(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = msg.text() || '';
    if (ignoredConsolePatterns.some((pattern) => pattern.test(text))) return;
    errors.push(text);
  });
  return errors;
}

async function expectNoConsoleErrors(expect, errors, scope) {
  expect(errors, `Console errors in ${scope}: ${errors.join('\n')}`).toEqual([]);
}

module.exports = {
  test,
  expect: base.expect,
  collectConsoleErrors,
  expectNoConsoleErrors,
};
