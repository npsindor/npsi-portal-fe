import { expect, test } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api.js';

// The footer's "Back to top" arrow scrolls a long public page back to the top, in English and Hindi.
for (const [lang, name] of [['en', 'Back to top'], ['hi', 'ऊपर जाएँ']])
  for (const width of [1280, 390])
    test(`${lang} ${width}px: the footer arrow takes the page back to the top`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.addInitScript((l) => localStorage.setItem('pss_lang', l), lang);
      await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
      await page.goto('/');
      const arrow = page.locator('footer').getByRole('button', { name, exact: true });
      await arrow.scrollIntoViewIfNeeded();
      await expect(arrow).toBeVisible();
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
      await arrow.click();
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
