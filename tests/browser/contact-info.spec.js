import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api.js';

for (const { path, lang, viewport } of [
  { path: '/contact-info', lang: 'en', viewport: { width: 1280, height: 800 } },
  { path: '/contact-info/', lang: 'hi', viewport: { width: 390, height: 844 } },
]) {
  test(`removed public contact route shows Not Found (${lang})`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const calls = await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.addInitScript(language => localStorage.setItem('pss_lang', language), lang);
    await page.goto(path);
    await expect(page.getByRole('heading', { name: 'Page Not Found', exact: true })).toBeVisible();
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(calls.some(call => call.key.endsWith(' /contact-info'))).toBe(false);
  });
}
