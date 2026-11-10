import { test, expect } from '@playwright/test';

async function fillBooking(page) {
  const date = (offset) => {
    const value = new Date();
    value.setDate(value.getDate() + offset);
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  };
  const fields = {
    'First name *': 'Test',
    'Last name *': 'Customer',
    'Street *': '24 Demo Lane',
    'Suburb *': 'Napier South',
    'City *': 'Napier',
    'Post code *': '4110',
    'Phone number *': '+64 (6) 555-0142',
    'Email *': 'customer@example.com',
    'Purchase date *': date(-30),
    'Repair date *': date(1),
    'Repair time *': '13:30',
    'IMEI number *': '123456789012345',
    'Description *': 'Test screen repair',
  };
  for (const [label, value] of Object.entries(fields))
    await page.getByLabel(label, { exact: true }).fill(value);
}

test('validation, courtesy replacement/removal, warranty and full reset', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByLabel('Total (+GST)', { exact: true })).toHaveValue(
    '$97.75',
  );
  await page.getByRole('button', { name: /Submit booking/ }).click();
  await expect(page.getByLabel('First name *', { exact: true })).toBeFocused();
  await fillBooking(page);
  await page.getByLabel('Under warranty').check();
  await expect(page.getByLabel('Service fee')).toHaveValue('$0.00');
  await page.getByRole('button', { name: /Add \/ change/ }).click();
  await page.getByLabel('Item type').selectOption('3');
  await page.getByRole('button', { name: /Add \/ change/ }).click();
  await page.getByLabel('Item type').selectOption('7');
  await page.getByRole('button', { name: /Add \/ change/ }).click();
  await expect(page.getByLabel('Bond', { exact: true })).toHaveValue('$545.00');
  await page.getByLabel('Business', { exact: true }).check();
  await expect(page.getByLabel('Bond', { exact: true })).toHaveValue('$0.00');
  await page.getByLabel('Consumer', { exact: true }).check();
  await page.getByRole('button', { name: 'Remove iphone 16 phone' }).click();
  await expect(page.getByLabel('Bond', { exact: true })).toHaveValue('$45.00');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Total (+GST)', { exact: true })).toHaveValue(
    '$97.75',
  );
  await expect(page.getByLabel('First name *', { exact: true })).toHaveValue(
    '',
  );
  await expect(page.getByLabel('Item type')).toHaveValue('1');
  await expect(page.getByLabel('Under warranty')).toBeDisabled();
  expect(errors).toEqual([]);
});

test('FAQ opens a separate window and searches JSON answers using keywords', async ({
  page,
}) => {
  await page.goto('/');
  const popupPromise = page.waitForEvent('popup');
  await page
    .locator('.form-actions')
    .getByRole('link', { name: /FAQs/ })
    .click();
  const popup = await popupPromise;
  await expect(
    popup.getByRole('heading', { name: 'Phone Fix Phone Booking FAQs' }),
  ).toBeVisible();
  await expect(popup.locator('.faq-item')).toHaveCount(8);
  await popup.getByRole('searchbox').fill('service 85');
  await popup.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(popup.locator('.faq-item')).toHaveCount(1);
  await expect(popup.getByRole('status')).toBeFocused();
  await popup.getByRole('searchbox').fill('unmatchedkeyword');
  await expect(popup.getByText(/No matching questions/)).toBeVisible();
  await popup.getByRole('searchbox').clear();
  await expect(popup.locator('.faq-item')).toHaveCount(8);
});

for (const width of [375, 768, 1280]) {
  test(`booking and FAQ pages fit ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/faq.html']) {
      await page.goto(path);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      if (path.includes('faq')) {
        await expect(page.locator('.faq-item')).toHaveCount(8);
        await page.screenshot({
          path: `test-results/faq-${width}.png`,
          fullPage: true,
        });
      }
    }
  });
}

test('employee UI saves and retrieves invoices with a mocked Supabase API', async ({
  page,
}) => {
  const jobs = [];
  const user = {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'employee@example.com',
    app_metadata: { role: 'employee' },
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const encode = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })}.testsignature`;
  await page.route('https://*.supabase.co/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    let body = {};
    if (url.pathname.endsWith('/token'))
      body = {
        access_token: token,
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        user,
      };
    else if (url.pathname.endsWith('/user')) body = user;
    else if (url.pathname.includes('/rest/v1/bookings')) {
      if (request.method() === 'POST') {
        const job = {
          ...request.postDataJSON(),
          job_number: 7001 + jobs.length,
          created_at: new Date(2026, 9, 16, 13, 30).toISOString(),
        };
        jobs.unshift(job);
        body = job;
      } else body = jobs;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  await page.goto('/');
  await page.getByLabel('Employee email').fill('employee@example.com');
  await page.getByLabel('Password', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await fillBooking(page);
  await page.getByRole('button', { name: /Submit booking/ }).click();
  await expect(
    page.getByText(/Booking saved successfully. Job number: 7001/),
  ).toBeVisible();
  await page.locator('.booking-card summary').click();
  await expect(page.locator('.booking-card')).toContainText('13:30');
  await expect(page.locator('.booking-card')).toContainText('1:30 PM');
  await expect(page.locator('.booking-card')).toContainText(
    'Phone Fix Napier (Demo)',
  );
  await expect(page.locator('.booking-card')).toContainText(
    'repairs@phonefix.example',
  );
  expect(jobs[0].repair.description).toBe('Test screen repair');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(page.locator('.booking-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.locator('.booking-card')).toHaveCount(0);
});
