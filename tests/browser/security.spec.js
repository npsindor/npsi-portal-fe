import { expect, test } from '@playwright/test';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// What a visitor without a login, and a normal member, can reach in the app itself.
const MEMBER_PAGES = ['/portal', '/portal/family', '/portal/registration', '/portal/events', '/portal/event-kharcha', '/portal/notifications', '/portal/settings', '/portal/feedback', '/portal/room-hunting'];
const ADMIN_PAGES = ['/admin', '/admin/families', '/admin/applications', '/admin/students', '/admin/transactions', '/admin/registration-payments', '/admin/contact-info', '/admin/feedback', '/admin/settings', '/admin/room-hunting', '/admin/transportation', '/admin/news'];
// Admin-only API reads; the app must never even ask for them for a member.
const ADMIN_API = /^GET \/(families|family-members|applications|student-applications|students|transactions|registration-payments|contact-info|feedback|transfer-requests|samiti-members|room-hunting\/admin\/.*|safar-saathi\/admin\/.*)$/;

test('a family card link (/verify/:id) needs a login and never calls the lookup anonymously', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/verify/NPSI-FAM-000001');
  await expect(page).toHaveURL(/\/login\?returnTo=%2Fverify%2FNPSI-FAM-000001$/);
  expect(calls.filter((c) => c.key.startsWith('GET /family-verifications'))).toEqual([]);
});

for (const path of [...MEMBER_PAGES, ...ADMIN_PAGES])
  test(`anonymous ${path} → login`, async ({ page }) => {
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?returnTo=/);
  });

test('a member is sent away from admin pages and the app asks for no admin data', async ({ page }) => {
  const calls = await mockApi(page, { 'GET /auth/me': MEMBER, 'GET /me/family': { family: null, members: [] } });
  for (const path of ADMIN_PAGES) {
    await page.goto(path);
    await expect(page, path).toHaveURL(/\/portal$/);
  }
  await page.waitForLoadState('networkidle');
  expect(calls.map((c) => c.key).filter((key) => ADMIN_API.test(key))).toEqual([]);
});

test('the session token is never kept where page scripts can read it', async ({ page }) => {
  const token = 'f'.repeat(64);
  await mockApi(page, {
    'GET /auth/me': NOT_LOGGED_IN,
    'POST /auth/sessions': { user: MEMBER, accessToken: token },
  });
  await page.goto('/login');
  await page.locator('input').first().fill('ram@example.com');
  await page.locator('input[type="password"]').fill('Secret123');
  await page.getByRole('button', { name: /log ?in|sign in/i }).last().click();
  await page.waitForLoadState('networkidle');
  const stored = await page.evaluate(() => JSON.stringify({ local: { ...localStorage }, session: { ...sessionStorage }, cookie: document.cookie }));
  expect(stored).not.toContain(token);
});

test('links that open a new tab cannot control the portal tab (rel=noopener)', async ({ page }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /stats': { families: 1, members: 1 } });
  for (const path of ['/', '/about', '/help', '/sagun', '/medical']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const unsafe = await page.$$eval('a[target="_blank"]', (links) => links.filter((a) => !/noopener|noreferrer/.test(a.rel)).map((a) => a.href));
    expect(unsafe, path).toEqual([]);
  }
});

test('no secrets end up in the public JavaScript bundle', async ({ page, request }) => {
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  const scripts = [];
  page.on('response', (res) => { if (res.url().endsWith('.js')) scripts.push(res.url()); });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  for (const url of scripts) {
    const body = await (await request.get(url)).text();
    expect(body, url).not.toMatch(/MYSQL_PASSWORD|SMTP_PASS|RECAPTCHA_SECRET|WHATSAPP_ACCESS_TOKEN|MSG91_AUTH_KEY|EAAf[A-Za-z0-9]{20}|-----BEGIN [A-Z ]*PRIVATE KEY/);
  }
});
