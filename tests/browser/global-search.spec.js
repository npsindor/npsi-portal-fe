import { expect, test } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api.js';

const RESULTS = { query: 'diwali', groups: [{ key: 'events', items: [{ id: 'e1', title: 'Diwali Milan', titleHi: 'दिवाली मिलन', subtitle: '2026-11-20 · Indore', link: '/events#event-e1' }] }, { key: 'rentals', items: [{ id: 'l1', title: '1 BHK · Vijay Nagar', subtitle: '₹9,000 / month', link: '/room-hunting?q=Vijay%20Nagar' }] }] };

test('header search suggests pages instantly and API results by category; Enter opens the full results page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /search': RESULTS });
  await page.goto('/');
  // Desktop: a round icon; clicking it opens the search bar over the menu, focused.
  await expect(page.getByRole('combobox', { name: 'Search the portal' }).filter({ visible: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open search' }).click();
  const box = page.getByRole('combobox', { name: 'Search the portal' }).filter({ visible: true });
  await expect(box).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(box).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open search' })).toBeFocused();
  await page.getByRole('button', { name: 'Open search' }).click();
  await box.fill('d');
  await expect(page.getByRole('listbox')).toHaveCount(0); // at least 2 characters
  await box.fill('diwali');
  await expect(page.getByRole('option', { name: /Diwali Milan/ })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Rental listings' })).toBeVisible();
  // Debounced: one API call for the whole word.
  expect(calls.filter((call) => call.key === 'GET /search')).toHaveLength(1);
  await box.press('ArrowDown');
  await box.press('Enter');
  await expect(page).toHaveURL(/\/events#event-e1$/);
  await page.goto('/search?q=diwali');
  await expect(page.getByRole('heading', { name: 'Events' })).toBeVisible();
  await expect(page.getByRole('link', { name: /1 BHK · Vijay Nagar/ })).toHaveAttribute('href', '/room-hunting?q=Vijay%20Nagar');
});

test('no results shows a helpful message; pages match by keyword in Hindi too', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'hi'));
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /search': { query: 'x', groups: [] } });
  await page.goto('/');
  await page.getByRole('button', { name: 'नेविगेशन मेनू खोलें' }).click();
  const box = page.getByRole('combobox', { name: 'पोर्टल में खोजें' }).filter({ visible: true });
  await box.fill('किराया');
  await expect(page.getByRole('option', { name: /आवास सहयोग/ })).toBeVisible();
  await box.fill('zzqq');
  await expect(page.getByText('"zzqq" के लिए कोई परिणाम नहीं मिला')).toBeVisible();
});
