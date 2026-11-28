import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// Login-only pages: a logged-out visitor is sent to /login and brought back afterwards; a session that ends while
// such a page is open does the same; a wrong current password (also a 401) stays on the form.
const en = (page) => page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
const loginFor = (path) => new RegExp(`/login\\?returnTo=${encodeURIComponent(path).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);

for (const path of ['/portal', '/portal/room-hunting', '/admin/families', '/verify/NPSI-FAM-000001', '/sagun/workspace']) {
  test(`logged out: ${path} opens the login page and remembers where to return`, async ({ page }) => {
    await en(page);
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto(path);
    await expect(page).toHaveURL(loginFor(path));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
}

test('public pages with member features stay open to visitors', async ({ page }) => {
  await en(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  for (const path of ['/sagun', '/travel-assistance', '/medical', '/room-hunting', '/join']) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
  }
});

test('a session that ends while a portal page is open goes to login and back (any API module)', async ({ page }) => {
  await en(page);
  let loggedIn = true;
  await mockApi(page, {
    'GET /room-hunting/options': { propertyTypes: [], areas: [] },
    'GET /room-hunting/me': { status: 401, body: { error: 'Authentication required.' } },
  });
  // The session is gone on the server: after the first refused call, the session check says "not logged in" too.
  await page.route('**/api/v1/auth/me', (route) => route.fulfill(loggedIn ? { json: MEMBER } : { status: 401, json: { error: 'Authentication required.' } }));
  await page.route('**/api/v1/room-hunting/me', (route) => { loggedIn = false; return route.fulfill({ status: 401, json: { error: 'Authentication required.' } }); });
  await page.goto('/portal/room-hunting');
  await expect(page).toHaveURL(loginFor('/portal/room-hunting'));
});

test('a wrong current password stays on the form with its message (not sent to login)', async ({ page }) => {
  await en(page);
  await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/family': { family: null, members: [] },
    'PUT /auth/password': { status: 401, body: { error: 'Current password is incorrect.' } },
  });
  await page.goto('/portal/settings?changePassword=1');
  const dialog = page.getByRole('dialog');
  await dialog.locator('#currentPassword').fill('Wrong#Pass2026');
  await dialog.locator('#newPassword').fill('Fresh#Pass2026');
  await dialog.locator('#confirmPassword').fill('Fresh#Pass2026');
  await dialog.locator('button[type=submit]').click();
  await expect(dialog.getByText(/Current password is incorrect|वर्तमान पासवर्ड/)).toBeVisible();
  await page.waitForTimeout(500);
  await expect(page).toHaveURL(/\/portal\/settings/);
});
