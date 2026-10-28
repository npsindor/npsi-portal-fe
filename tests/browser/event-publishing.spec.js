import { test, expect } from '@playwright/test';
import { mockApi, ADMIN, NOT_LOGGED_IN } from './mock-api';

test('admin creates Deepotsav through API; published event appears on public pages in both languages', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': ADMIN });
  let events = [];
  let createdPayload;
  await page.route('**/api/v1/events**', async route => {
    const request = route.request();
    if (request.method() === 'POST') {
      createdPayload = request.postDataJSON();
      const event = { ...createdPayload, id: 'deepotsav-2026', bannerUrl: '/test-poster.svg', createdAt: '2026-10-28T00:00:00Z' };
      events.push(event);
      return route.fulfill({ json: event });
    }
    return route.fulfill({ json: events });
  });
  await page.route('**/test-poster.svg', route => route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="navy"/></svg>' }));
  await page.goto('/admin/events');
  await page.getByRole('button', { name: 'Create Sneh Deepotsav 2026', exact: true }).click();
  await expect(page.getByLabel('Event Title (English)', { exact: false })).toHaveValue('Sneh Deepotsav 2026');
  await expect(page.getByLabel('Event Title (Hindi)', { exact: false })).toHaveValue('स्नेह दीपोत्सव 2026');
  // Dates/venues below are isolated test fixtures, never production records.
  await page.locator('#event-date').fill('2026-11-15');
  await page.locator('#event-venue').fill('Test venue only');
  await page.locator('#event-status').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Create Event', exact: true }).last().click();
  await expect.poll(() => events.length).toBe(1);
  expect(createdPayload).toMatchObject({ title: 'Sneh Deepotsav 2026', titleHi: 'स्नेह दीपोत्सव 2026', status: 'PUBLISHED', date: '2026-11-15', venue: 'Test venue only' });
  await page.goto('/events?category=cultural');
  await expect(page.getByRole('heading', { name: 'Sneh Deepotsav 2026', exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Sneh Deepotsav 2026', exact: true })).toHaveCSS('object-fit', 'contain');
  await page.locator('header').getByRole('button', { name: 'हिंदी में देखें', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'स्नेह दीपोत्सव 2026', exact: true })).toBeVisible();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'स्नेह दीपोत्सव 2026', exact: true })).toBeVisible();
  // Public UI also excludes drafts when an admin session receives all records.
  events = [{ ...events[0], status: 'DRAFT' }];
  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'स्नेह दीपोत्सव 2026', exact: true })).toHaveCount(0);
});

test('anonymous visitors see camelCase Hindi fields returned by the backend', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /events': [{ id: 'event', title: 'Sneh Deepotsav 2026', titleHi: 'स्नेह दीपोत्सव 2026', description: 'A community celebration.', descriptionHi: 'समाज के साथ दीपोत्सव मनाएँ।', status: 'PUBLISHED', date: '2026-11-15', venue: 'Test venue only' }],
  });
  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'स्नेह दीपोत्सव 2026', exact: true })).toBeVisible();
  await expect(page.getByText('समाज के साथ दीपोत्सव मनाएँ।', { exact: true })).toBeVisible();
});
