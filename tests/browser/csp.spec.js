import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { ADMIN, mockApi, NOT_LOGGED_IN } from './mock-api.js';

// The Content-Security-Policy the live site sends (public/.htaccess), applied to the built app: no page may trip it.
// API calls in the tests go to the preview server itself ('self'), like *.npsindore.org on the live site.
const POLICY = /Header always set Content-Security-Policy "([^"]+)"/.exec(fs.readFileSync(new URL('../../public/.htaccess', import.meta.url), 'utf8'))?.[1];

const withPolicy = async (page) => {
  await page.route(
    (url) => !url.pathname.startsWith('/api/') && !/\.\w+$/.test(url.pathname),
    async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': POLICY.replace(' upgrade-insecure-requests', '') } });
    },
  );
  await page.addInitScript(() => {
    window.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (event) => window.__cspViolations.push(`${event.violatedDirective} ${event.blockedURI}`));
  });
};
const violations = (page) => page.evaluate(() => window.__cspViolations);

test('the policy is enforced (not report-only) and keeps scripts to this site and reCAPTCHA', () => {
  expect(POLICY).toBeTruthy();
  expect(POLICY).toContain("script-src 'self' https://www.google.com https://www.gstatic.com https://www.recaptcha.net;");
  expect(POLICY).toContain("object-src 'none'");
  expect(POLICY).toContain("frame-ancestors 'none'");
});

for (const path of ['/', '/about', '/events', '/news', '/room-hunting', '/medical', '/career-business', '/community-services', '/sagun', '/contact', '/login', '/register-account'])
  test(`public page ${path} runs under the policy`, async ({ page }) => {
    await withPolicy(page);
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto(path);
    await expect(page.locator('main, #root').first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
  });

for (const path of ['/admin', '/admin/families', '/admin/event-finance', '/admin/page-content'])
  test(`admin page ${path} runs under the policy`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await withPolicy(page);
    await mockApi(page, { 'GET /auth/me': ADMIN });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(await violations(page)).toEqual([]);
  });

test('the harness really applies the policy: an injected inline script is blocked and reported', async ({ page }) => {
  await withPolicy(page);
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/about');
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.textContent = 'window.__ran = true';
    document.body.append(script);
  });
  await expect.poll(() => violations(page)).toContainEqual(expect.stringMatching(/^script-src/));
  expect(await page.evaluate(() => window.__ran)).toBeUndefined();
});
