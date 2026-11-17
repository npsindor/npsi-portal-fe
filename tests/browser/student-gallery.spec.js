import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import { MEMBER, mockApi, NOT_LOGGED_IN } from './mock-api.js';

const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=', 'base64');

for (const width of [1440, 390]) {
  test(`${width}px: Student Login sits beside Member Login and opens the student login`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/');
    if (width < 640) await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const student = page.getByRole('link', { name: 'Student Login', exact: true }).filter({ visible: true });
    await expect(page.getByRole('link', { name: 'Member Login', exact: true }).filter({ visible: true })).toBeVisible();
    await expect(student).toHaveCount(1);
    await student.click();
    await expect(page).toHaveURL(/\/login\?portal=student&returnTo=%2Fportal%2Fregistration%3Ftype%3Dstudent$/);
    await expect(page.getByRole('heading', { name: 'Student Login' })).toBeVisible();
    await expect(page.getByText('student registration (₹100 fee)')).toBeVisible();
    // New students create an account with the same OTP flow and come back to the student registration.
    const create = page.getByRole('link', { name: /create/i }).first();
    await expect(create).toHaveAttribute('href', '/register-account?returnTo=%2Fportal%2Fregistration%3Ftype%3Dstudent');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('student registration follows the member steps with the ₹100 fee and submits type STUDENT', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  const calls = await mockApi(page, {
    'GET /auth/me': MEMBER,
    'GET /me/registrations': { registrations: [{ id: 'fam', type: 'FAMILY', status: 'APPROVED', applicationId: 'NPSI-APP-1' }], completion: null },
    'POST /me/payment-screenshots': { fileId: 'shot-1' },
    'POST /me/registrations': { applicationId: 'NPSI-STU-APP-TEST-1' },
  });
  await page.goto('/portal/registration?type=student');
  await expect(page.getByRole('heading', { name: 'Student registration', level: 1 })).toBeVisible();
  await page.locator('#reg-first').fill('Test');
  await page.locator('#reg-last').fill('Student');
  await page.locator('#reg-gender').selectOption('Male');
  await page.locator('#reg-dob').fill('2005-06-01');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.locator('#reg-area').fill('Vijay Nagar');
  await page.locator('#reg-address').fill('100 Test Road');
  await page.locator('#reg-pincode').fill('452010');
  await page.locator('#reg-village').fill('Test Village');
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('heading', { name: /Student registration.*₹100/ })).toBeVisible();
  await page.locator('#reg-screenshot').setInputFiles({ name: 'payment.png', mimeType: 'image/png', buffer: PNG });
  await expect.poll(() => calls.some((call) => call.key === 'POST /me/payment-screenshots')).toBe(true);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByRole('status')).toContainText('NPSI-STU-APP-TEST-1');
  expect(calls.find((call) => call.key === 'POST /me/registrations').body).toMatchObject({ type: 'STUDENT', firstName: 'Test', lastName: 'Student', screenshotFileId: 'shot-1' });
});

for (const width of [1440, 390]) {
  test(`${width}px: the landing page photo gallery shows the default photos below the participation section`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
    await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN });
    await page.goto('/');
    const gallery = page.locator('#gallery');
    await gallery.scrollIntoViewIfNeeded();
    await expect(gallery.getByRole('heading', { name: 'Moments from our community' })).toBeVisible();
    const order = await page.evaluate(() => {
      const participation = [...document.querySelectorAll('h2')].find((h) => h.textContent.includes('Your Participation Makes Our Community Stronger.'));
      return participation.compareDocumentPosition(document.querySelector('#gallery')) & Node.DOCUMENT_POSITION_FOLLOWING;
    });
    expect(order).toBeTruthy();
    const slides = gallery.locator('[aria-roledescription="slide"]');
    // Every photo in public/gallery is in the slider, each once.
    const files = fs.readdirSync(new URL('../../public/gallery/', import.meta.url)).filter((name) => /\.jpe?g$/i.test(name));
    await expect(slides).toHaveCount(files.length);
    const shown = await slides.locator('img').evaluateAll((imgs) => imgs.map((img) => img.getAttribute('src').replace('/gallery/', '')));
    expect([...shown].sort()).toEqual([...files].sort());
    // Only the slider: no thumbnail strip under it.
    await expect(gallery.getByRole('button', { name: /Go to photo/ })).toHaveCount(0);
    await gallery.getByRole('button', { name: 'Next photo' }).first().click();
    await expect(gallery.locator('[aria-label="2 of 65"]').getByRole('button', { name: /View full size/ })).toHaveAttribute('tabindex', '0');
    await gallery.locator('[aria-label="2 of 65"]').getByRole('button', { name: /View full size/ }).click();
    await expect(page.getByRole('dialog').locator('img')).toHaveAttribute('src', /maa-na-garba-2\.jpg$/);
    await page.keyboard.press('Escape');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (process.env.SHOTS) await gallery.screenshot({ path: `${process.env.SHOTS}/gallery-${width}.png` });
  });
}

test('admin photos replace the default gallery', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('pss_lang', 'en'));
  await page.route('**/admin-photo-*.png', (route) => route.fulfill({ contentType: 'image/png', body: PNG }));
  const photo = (n) => ({ id: `p${n}`, page: 'home', section: 'gallery', role: 'ITEM', title: `Sammelan ${n}`, titleHi: null, subtitle: null, subtitleHi: null, body: null, bodyHi: null, mediaType: 'IMAGE', mediaUrl: `/admin-photo-${n}.png`, linkUrl: null, ctaLabel: null, ctaLabelHi: null, sortOrder: n, active: true });
  await mockApi(page, { 'GET /auth/me': NOT_LOGGED_IN, 'GET /page-blocks': [photo(1), photo(2), { ...photo(3), role: 'INTRO', title: 'Our gallery', mediaType: 'NONE', mediaUrl: null }] });
  await page.goto('/');
  const gallery = page.locator('#gallery');
  await expect(gallery.getByRole('heading', { name: 'Our gallery' })).toBeVisible();
  await expect(gallery.locator('[aria-roledescription="slide"]')).toHaveCount(2);
  await expect(gallery.getByRole('img', { name: 'Sammelan 1' })).toHaveAttribute('src', '/admin-photo-1.png');
});
