import { test, expect } from '@playwright/test';

test('statement is displayed and dashboard filters sample jobs', async ({
  page,
}) => {
  await page.goto('/extension.html');
  await expect(page.locator('#statement-heading')).toBeVisible();
  await expect(page.locator('.booking-card')).toHaveCount(8);
  await page.getByLabel('Search bookings').fill('Aroha Apple');
  await expect(page.locator('.booking-card')).toHaveCount(1);
  await page.getByLabel('Search bookings').clear();
  await page
    .getByRole('combobox', { name: 'Customer type', exact: true })
    .selectOption('business');
  await expect(page.locator('.booking-card')).toHaveCount(3);
  await page.getByLabel('Sort by').selectOption('newest');
  await expect(page.locator('.booking-card').first()).toContainText('DEMO-7');
  await page.getByLabel('Booking data').selectOption('live');
  await expect(page.locator('.booking-card')).toHaveCount(0);
  await expect(page.getByLabel('Employee email')).toBeVisible();
});

test('calendar navigation and data-driven charts', async ({ page }) => {
  await page.goto('/extension.html');
  await page.getByRole('button', { name: /Demo 2/ }).click();
  await expect(page.locator('.calendar-day')).toHaveCount(42);
  await page
    .locator('.calendar-day')
    .filter({ hasText: '1 job' })
    .first()
    .click();
  await expect(page.locator('.calendar-agenda')).toContainText('DEMO-');
  await page.getByRole('button', { name: 'Next month' }).click();
  await expect(
    page.locator('.calendar-day:not(.outside-month) small'),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Today', exact: true }).click();
  await page.getByRole('button', { name: /Demo 3/ }).click();
  await expect(page.locator('.repair-chart svg rect')).toHaveCount(3);
  await page.getByLabel('Group chart by').selectOption('fault');
  await expect(page.locator('.repair-chart svg rect')).toHaveCount(4);
  await page.getByLabel('Group chart by').selectOption('customerType');
  await expect(page.locator('.statistics-table tbody tr')).toHaveCount(2);
});

test('native drag/drop, replacement and business exemption', async ({
  page,
}) => {
  await page.goto('/extension.html');
  await page.getByRole('button', { name: /Demo 4/ }).click();
  const zone = page.getByRole('region', {
    name: 'Courtesy selection drop zone',
  });
  await page
    .locator('.draggable-item')
    .filter({ hasText: 'iphone 10' })
    .dragTo(zone, {
      sourcePosition: { x: 20, y: 15 },
      targetPosition: { x: 30, y: 25 },
    });
  await expect(zone).toContainText('$275.00');
  await page
    .getByRole('button', { name: 'Add iphone 16 phone', exact: true })
    .click();
  await expect(zone).not.toContainText('iphone 10');
  await page
    .getByRole('button', { name: 'Add iphone charger charger', exact: true })
    .click();
  await expect(page.locator('.bond-total')).toContainText('$545.00');
  await page.getByLabel('Bond customer type').selectOption('business');
  await expect(page.locator('.bond-total')).toContainText('$0.00');
  await page
    .getByRole('button', { name: 'Remove iphone 16', exact: true })
    .click();
  await expect(zone.locator('.selected-courtesy')).toHaveCount(1);
  await page.getByRole('button', { name: 'Clear selection' }).click();
  await expect(zone.locator('.selected-courtesy')).toHaveCount(0);
});

test('Gemini chat displays answers and handles quota errors', async ({
  page,
}) => {
  const requests = [];
  await page.route('**/api/chat', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: requests.length === 1 ? 200 : 429,
      contentType: 'application/json',
      body: JSON.stringify(
        requests.length === 1
          ? { answer: 'An $85 service fee applies outside warranty.' }
          : { error: 'The Gemini free-tier quota is currently exhausted.' },
      ),
    });
  });
  await page.goto('/extension.html');
  await page.getByRole('button', { name: /Demo 5/ }).click();
  await page
    .getByRole('button', { name: 'Why do I pay a service fee?', exact: true })
    .click();
  await expect(page.getByRole('log')).toContainText('$85');
  await page.getByLabel('Ask a repair question').fill('weather forecast');
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('quota');
  expect(requests[1].messages).toHaveLength(3);
  await expect(page.getByLabel('Ask a repair question')).toHaveValue(
    'weather forecast',
  );
  await page.getByRole('button', { name: 'Clear conversation' }).click();
  await expect(page.locator('.chat-message')).toHaveCount(1);
});

test('all demos fit mobile and desktop without runtime errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/extension.html');
    for (let index = 1; index <= 5; index++) {
      await page
        .getByRole('button', { name: new RegExp(`Demo ${index}`) })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.getByRole('button', { name: /Demo 3/ }).click();
    await page.screenshot({
      path: `test-results/extension-${width}.png`,
      fullPage: true,
    });
  }
  expect(errors).toEqual([]);
});
