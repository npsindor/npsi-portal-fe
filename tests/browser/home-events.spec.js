import { expect, test } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api.js';

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
const event = (id, title, date, status = 'PUBLISHED') => ({ id, title, titleHi: null, description: `${title} details`, descriptionHi: null, venue: 'Indore', venueHi: null, date, bannerUrl: null, status });
const EVENTS = [
  event('past-old', 'Holi Milan 2025', day(-200)),
  event('later', 'Diwali Milan', day(40)),
  event('past-recent', 'Maa Na Garba', day(-10)),
  event('soon', 'Sneh Sammelan', day(5)),
  event('draft', 'Draft Meeting', day(3), 'DRAFT'),
];

const titles = (page) => page.locator('#events h3').allTextContents();

test('home events: admin-set heading, upcoming first, then completed events with a label', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'GET /events': EVENTS,
    'GET /page-blocks': [{ id: 'ev-intro', page: 'home', section: 'events', role: 'INTRO', title: 'Sangathan Programmes', titleHi: 'संगठन के कार्यक्रम', body: 'Coming up and recently held.', bodyHi: null, sortOrder: 0, active: true }],
  });
  await page.goto('/');
  const section = page.locator('#events');
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Sangathan Programmes');
  await expect(section.getByText('Coming up and recently held.')).toBeVisible();
  await expect.poll(() => titles(page)).toEqual(['Sneh Sammelan', 'Diwali Milan', 'Maa Na Garba', 'Holi Milan 2025']);
  const completed = section.locator('article').filter({ hasText: 'Completed' });
  await expect(completed).toHaveCount(2);
  await expect(completed.first()).toContainText('Maa Na Garba');
});

test('home events: built-in heading when the admin has not set one', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /events': EVENTS, 'GET /page-blocks': [] });
  await page.goto('/');
  const section = page.locator('#events');
  await section.scrollIntoViewIfNeeded();
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Upcoming Events');
  await expect(section.getByText('Join the next Sangathan gathering.')).toBeVisible();
});
