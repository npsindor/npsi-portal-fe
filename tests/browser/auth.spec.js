import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, NOT_LOGGED_IN } from './mock-api.js';

test('anonymous visitors stay on public pages (a 401 from /auth/me is not an error)', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /stats': { families: 54, members: 87 } });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  expect(new URL(page.url()).pathname).toBe('/');
  expect(calls.some((c) => c.key === 'GET /auth/me')).toBe(true);
  await page.goto('/events');
  await page.waitForLoadState('networkidle');
  expect(new URL(page.url()).pathname).toBe('/events');
});

test('protected pages send anonymous visitors to the login page', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/portal');
  await expect(page).toHaveURL(/\/login$/);
});

test('logging in relies on the session cookie: no token is kept in localStorage', async ({ page }) => {
  let loggedIn = false;
  const calls = await mockApi(page);
  await page.route('**/api/v1/auth/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith('/auth/sessions') && route.request().method() === 'POST') {
      loggedIn = true;
      return route.fulfill({ json: { user: ADMIN, accessToken: 'a'.repeat(64) }, headers: { 'Set-Cookie': 'npsi_session=x; Path=/; HttpOnly; SameSite=Strict' } });
    }
    if (path.endsWith('/auth/me')) return route.fulfill(loggedIn ? { json: ADMIN } : { status: 401, json: { error: 'Authentication required.' } });
    return route.fallback();
  });
  await page.goto('/login');
  await page.fill('#email', 'admin@example.com');
  await page.fill('#password', 'Secret@123');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/\/admin$/);
  expect(await page.evaluate(() => localStorage.getItem('base44_access_token'))).toBeNull();
  void calls;
});
