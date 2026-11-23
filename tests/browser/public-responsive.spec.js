import { test, expect } from '@playwright/test';
import { mockApi, NOT_LOGGED_IN } from './mock-api';
import { navLink } from './nav-helpers.js';

for (const width of [320, 390, 768, 1440]) {
  test(`public pages and navigation fit ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'Join the Sangathan', exact: true }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const menu = page.getByRole('button', { name: 'Open navigation menu' });
    if (width < 1280) await menu.click();
    const nav = page.getByRole('navigation', { name: 'Main navigation' });
    await (await navLink(page, 'Blood Donor')).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Donate Blood, Save Lives' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Blood Donation', level: 2 })).toBeVisible();
    if (width < 1280) await expect(nav).toBeHidden();
    for (const path of ['/', '/community-services', '/career-business', '/sagun', '/contact', '/public-feedback']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
  });
}

test('mobile navigation closes on Escape and returns focus to the menu button', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  const button = page.getByRole('button', { name: 'Open navigation menu' });
  await button.click();
  await expect(page.locator('#public-navigation')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect(button).toBeFocused();
  await expect(page.locator('#public-navigation')).toBeHidden();
});
