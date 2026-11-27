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

// A visitor on a phone or tablet sees Member Login, Student Login and Join without opening the menu.
for (const width of [320, 390, 768]) {
  test(`member and student login are visible without the menu at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/about');
    await expect(page.locator('#public-navigation')).toBeHidden();
    const entry = page.getByTestId('mobile-entry');
    const member = entry.getByRole('link', { name: 'Member Login' });
    const student = entry.getByRole('link', { name: 'Student Login' });
    const join = entry.getByRole('link', { name: 'Join the Sangathan' });
    for (const link of [member, student, join]) await expect(link).toBeVisible();
    // One row, same height, nothing cut off.
    const boxes = await Promise.all([member, student, join].map((link) => link.boundingBox()));
    expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBe(1);
    expect(new Set(boxes.map((box) => Math.round(box.height))).size).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(member).toHaveAttribute('href', '/login?returnTo=%2Fabout');
    await student.click();
    await expect(page).toHaveURL(/\/login/);
  });
}

test('a logged-in member does not see the login row on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto('/');
  await expect(page.getByTestId('mobile-entry')).toHaveCount(0);
});

// Scrolling: sections and cards below the fold fade up once they come into view; nothing stays hidden.
test('sections and cards fade up on scroll, and none stay hidden', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  const waiting = page.locator('[data-reveal^="wait"]');
  await expect.poll(() => waiting.count()).toBeGreaterThan(0);
  // What is on screen at load is shown at once.
  await expect(page.getByTestId('mobile-entry')).toBeVisible();
  for (let i = 0; i < 30; i += 1) { await page.evaluate(() => window.scrollBy(0, 600)); await page.waitForTimeout(30); }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.locator('[data-reveal="in"]').count()).toBeGreaterThan(3);
  const hiddenOnScreen = () => page.evaluate(() => [...document.querySelectorAll('[data-reveal^="wait"]')]
    .filter((el) => { const box = el.getBoundingClientRect(); return box.top < innerHeight * 0.9 && box.bottom > 0; }).length);
  await expect.poll(hiddenOnScreen).toBe(0);
});

test('people who asked for less motion get no scroll animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('[data-reveal]')).toHaveCount(0);
});
